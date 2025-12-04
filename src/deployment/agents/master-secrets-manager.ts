/**
 * Master Secrets Manager
 * 
 * Manages master.secrets.json file for local secret storage across all projects.
 * NEVER commits secrets to the repository.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface ProjectSecrets {
  [key: string]: string;
}

export interface MasterSecretsFile {
  version: string;
  lastUpdated: string;
  projects: {
    [projectName: string]: {
      secrets: ProjectSecrets;
      metadata: {
        created: string;
        updated: string;
        repoPath?: string;
        deployments?: string[];
      };
    };
  };
}

export class MasterSecretsManager {
  private masterFilePath: string;

  constructor(customPath?: string) {
    // Store master secrets in user's home directory by default
    this.masterFilePath = customPath || path.join(os.homedir(), '.claude-flow', 'master.secrets.json');
  }

  /**
   * Initialize master secrets file if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (await fs.pathExists(this.masterFilePath)) {
      return;
    }

    await fs.ensureDir(path.dirname(this.masterFilePath));

    const initialData: MasterSecretsFile = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      projects: {}
    };

    await fs.writeJson(this.masterFilePath, initialData, { spaces: 2 });

    // Ensure file is not readable by others (Unix-like systems)
    if (process.platform !== 'win32') {
      await fs.chmod(this.masterFilePath, 0o600);
    }
  }

  /**
   * Read master secrets file
   */
  async read(): Promise<MasterSecretsFile> {
    await this.initialize();
    return await fs.readJson(this.masterFilePath);
  }

  /**
   * Write master secrets file
   */
  private async write(data: MasterSecretsFile): Promise<void> {
    data.lastUpdated = new Date().toISOString();
    await fs.writeJson(this.masterFilePath, data, { spaces: 2 });

    // Ensure file is not readable by others (Unix-like systems)
    if (process.platform !== 'win32') {
      await fs.chmod(this.masterFilePath, 0o600);
    }
  }

  /**
   * Add or update secrets for a project
   */
  async updateProjectSecrets(
    projectName: string,
    secrets: ProjectSecrets,
    metadata?: { repoPath?: string; deployments?: string[] }
  ): Promise<void> {
    const data = await this.read();

    if (!data.projects[projectName]) {
      data.projects[projectName] = {
        secrets: {},
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };
    }

    // Merge secrets (don't overwrite existing non-placeholder values)
    for (const [key, value] of Object.entries(secrets)) {
      // Only update if new value is not a placeholder
      if (!this.isPlaceholder(value)) {
        data.projects[projectName].secrets[key] = value;
      } else if (!data.projects[projectName].secrets[key]) {
        // Add placeholder if key doesn't exist
        data.projects[projectName].secrets[key] = value;
      }
    }

    // Update metadata
    data.projects[projectName].metadata.updated = new Date().toISOString();
    if (metadata?.repoPath) {
      data.projects[projectName].metadata.repoPath = metadata.repoPath;
    }
    if (metadata?.deployments) {
      data.projects[projectName].metadata.deployments = metadata.deployments;
    }

    await this.write(data);
  }

  /**
   * Get secrets for a specific project
   */
  async getProjectSecrets(projectName: string): Promise<ProjectSecrets | null> {
    const data = await this.read();
    return data.projects[projectName]?.secrets || null;
  }

  /**
   * Check if a value is a placeholder
   */
  private isPlaceholder(value: string): boolean {
    if (typeof value !== 'string') return false;
    return /^<.*>$/.test(value) || 
           value === '' || 
           value === 'your_*' ||
           value === 'REPLACE_*' ||
           value.startsWith('CHANGE_');
  }

  /**
   * Import secrets from .agents file
   */
  async importFromAgentsFile(agentsFilePath: string, projectName?: string): Promise<void> {
    const agentsData = await fs.readJson(agentsFilePath);
    
    const name = projectName || agentsData.project;
    const secrets: ProjectSecrets = {};

    // Extract all secrets with placeholders
    const allSecrets = [...(agentsData.core || []), ...(agentsData.optional || [])];
    for (const secret of allSecrets) {
      secrets[secret.name] = secret.placeholder || `<${secret.name.toLowerCase()}>`;
    }

    await this.updateProjectSecrets(name, secrets);
  }

  /**
   * Export secrets to environment format
   */
  async exportToEnvFormat(projectName: string): Promise<string> {
    const secrets = await this.getProjectSecrets(projectName);
    if (!secrets) {
      return '';
    }

    const lines: string[] = [];
    lines.push(`# Environment variables for ${projectName}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const [key, value] of Object.entries(secrets)) {
      if (this.isPlaceholder(value)) {
        lines.push(`# ${key}=${value} # PLACEHOLDER - REPLACE WITH ACTUAL VALUE`);
      } else {
        lines.push(`${key}=${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<string[]> {
    const data = await this.read();
    return Object.keys(data.projects);
  }

  /**
   * Get file path for reference
   */
  getFilePath(): string {
    return this.masterFilePath;
  }

  /**
   * Validate that all required secrets are set (not placeholders)
   */
  async validateSecrets(projectName: string, requiredSecrets: string[]): Promise<{
    valid: boolean;
    missing: string[];
    placeholders: string[];
  }> {
    const secrets = await this.getProjectSecrets(projectName);
    
    if (!secrets) {
      return {
        valid: false,
        missing: requiredSecrets,
        placeholders: []
      };
    }

    const missing: string[] = [];
    const placeholders: string[] = [];

    for (const required of requiredSecrets) {
      if (!secrets[required]) {
        missing.push(required);
      } else if (this.isPlaceholder(secrets[required])) {
        placeholders.push(required);
      }
    }

    return {
      valid: missing.length === 0 && placeholders.length === 0,
      missing,
      placeholders
    };
  }

  /**
   * Generate a summary report
   */
  async generateReport(): Promise<string> {
    const data = await this.read();
    const projects = Object.keys(data.projects);

    const lines: string[] = [];
    lines.push('# Master Secrets Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`File: ${this.masterFilePath}`);
    lines.push('');
    lines.push(`Total Projects: ${projects.length}`);
    lines.push('');

    for (const projectName of projects) {
      const project = data.projects[projectName];
      const secretCount = Object.keys(project.secrets).length;
      const placeholderCount = Object.values(project.secrets)
        .filter(v => this.isPlaceholder(v as string)).length;

      lines.push(`## ${projectName}`);
      lines.push(`- Secrets: ${secretCount}`);
      lines.push(`- Placeholders: ${placeholderCount}`);
      lines.push(`- Real Secrets: ${secretCount - placeholderCount}`);
      lines.push(`- Created: ${project.metadata.created}`);
      lines.push(`- Updated: ${project.metadata.updated}`);
      if (project.metadata.repoPath) {
        lines.push(`- Repository: ${project.metadata.repoPath}`);
      }
      if (project.metadata.deployments) {
        lines.push(`- Deployments: ${project.metadata.deployments.join(', ')}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
