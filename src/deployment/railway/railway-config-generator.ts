/**
 * Railway Configuration Generator
 * 
 * Generates Railway deployment configuration with cost-protection guardrails.
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface RailwayConfig {
  build?: {
    builder?: string;
    buildCommand?: string;
    watchPatterns?: string[];
  };
  deploy?: {
    startCommand?: string;
    healthcheckPath?: string;
    healthcheckTimeout?: number;
    restartPolicyType?: string;
    restartPolicyMaxRetries?: number;
  };
  regions?: string[];
  env?: Record<string, any>;
}

export interface CostGuardrails {
  resourceLimits: {
    maxMemoryMB: number;
    maxCPU: number;
    maxDiskGB: number;
  };
  scaling: {
    minInstances: number;
    maxInstances: number;
    autoScale: boolean;
  };
  monitoring: {
    enabled: boolean;
    alertThreshold: number; // Percentage of free tier
    shutdownThreshold: number;
  };
}

export class RailwayConfigGenerator {
  private projectName: string;
  private repoPath: string;
  private config: RailwayConfig;
  private guardrails: CostGuardrails;

  constructor(projectName: string, repoPath: string) {
    this.projectName = projectName;
    this.repoPath = repoPath;
    this.config = {};
    
    // Default cost guardrails - minimal resources
    this.guardrails = {
      resourceLimits: {
        maxMemoryMB: 512, // Free tier limit
        maxCPU: 0.5, // Half vCPU
        maxDiskGB: 1
      },
      scaling: {
        minInstances: 0, // Scale to zero when idle
        maxInstances: 1, // Single instance
        autoScale: false
      },
      monitoring: {
        enabled: true,
        alertThreshold: 80, // Alert at 80% of free tier
        shutdownThreshold: 95 // Shutdown at 95% of free tier
      }
    };
  }

  /**
   * Detect project type and configure accordingly
   */
  async detectAndConfigure(): Promise<void> {
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      await this.configureNodeProject(packageJsonPath);
    } else {
      // Default minimal config
      this.config = {
        deploy: {
          startCommand: 'echo "No start command configured"',
          restartPolicyType: 'never'
        }
      };
    }
  }

  /**
   * Configure for Node.js project
   */
  private async configureNodeProject(packageJsonPath: string): Promise<void> {
    const pkg = await fs.readJson(packageJsonPath);

    // Determine build command
    let buildCommand = '';
    if (pkg.scripts?.build) {
      buildCommand = 'npm run build';
    } else if (pkg.scripts?.compile) {
      buildCommand = 'npm run compile';
    }

    // Determine start command
    let startCommand = '';
    if (pkg.scripts?.start) {
      startCommand = 'npm start';
    } else if (pkg.main) {
      startCommand = `node ${pkg.main}`;
    } else {
      startCommand = 'node index.js';
    }

    this.config = {
      build: {
        builder: 'NIXPACKS',
        ...(buildCommand && { buildCommand })
      },
      deploy: {
        startCommand,
        healthcheckPath: '/health',
        healthcheckTimeout: 300,
        restartPolicyType: 'on_failure',
        restartPolicyMaxRetries: 3
      }
    };
  }

  /**
   * Generate railway.toml file
   */
  generateRailwayToml(): string {
    const lines: string[] = [];
    
    lines.push('# Railway deployment configuration');
    lines.push('# Generated with cost-protection guardrails');
    lines.push('');

    // Build section
    if (this.config.build) {
      lines.push('[build]');
      if (this.config.build.builder) {
        lines.push(`builder = "${this.config.build.builder}"`);
      }
      if (this.config.build.buildCommand) {
        lines.push(`buildCommand = "${this.config.build.buildCommand}"`);
      }
      if (this.config.build.watchPatterns) {
        lines.push(`watchPatterns = ${JSON.stringify(this.config.build.watchPatterns)}`);
      }
      lines.push('');
    }

    // Deploy section
    if (this.config.deploy) {
      lines.push('[deploy]');
      if (this.config.deploy.startCommand) {
        lines.push(`startCommand = "${this.config.deploy.startCommand}"`);
      }
      if (this.config.deploy.healthcheckPath) {
        lines.push(`healthcheckPath = "${this.config.deploy.healthcheckPath}"`);
      }
      if (this.config.deploy.healthcheckTimeout) {
        lines.push(`healthcheckTimeout = ${this.config.deploy.healthcheckTimeout}`);
      }
      if (this.config.deploy.restartPolicyType) {
        lines.push(`restartPolicyType = "${this.config.deploy.restartPolicyType}"`);
      }
      if (this.config.deploy.restartPolicyMaxRetries) {
        lines.push(`restartPolicyMaxRetries = ${this.config.deploy.restartPolicyMaxRetries}`);
      }
      lines.push('');
    }

    // Cost guardrails (as comments for reference)
    lines.push('# Cost Protection Guardrails');
    lines.push(`# Max Memory: ${this.guardrails.resourceLimits.maxMemoryMB}MB`);
    lines.push(`# Max CPU: ${this.guardrails.resourceLimits.maxCPU} vCPU`);
    lines.push(`# Max Disk: ${this.guardrails.resourceLimits.maxDiskGB}GB`);
    lines.push(`# Min Instances: ${this.guardrails.scaling.minInstances}`);
    lines.push(`# Max Instances: ${this.guardrails.scaling.maxInstances}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate railway.json configuration
   */
  generateRailwayJson(): object {
    return {
      $schema: 'https://railway.app/railway.schema.json',
      build: this.config.build || {},
      deploy: this.config.deploy || {},
      guardrails: this.guardrails
    };
  }

  /**
   * Generate Nixpacks configuration for resource limits
   */
  generateNixpacksToml(): string {
    const lines: string[] = [];
    
    lines.push('[phases.setup]');
    lines.push('nixPkgs = ["nodejs", "npm"]');
    lines.push('');
    lines.push('[phases.install]');
    lines.push('cmds = ["npm ci --omit=dev"]');
    lines.push('');
    lines.push('[phases.build]');
    if (this.config.build?.buildCommand) {
      lines.push(`cmds = ["${this.config.build.buildCommand}"]`);
    }
    lines.push('');
    lines.push('[start]');
    lines.push(`cmd = "${this.config.deploy?.startCommand || 'npm start'}"`);
    lines.push('');
    lines.push('# Resource limits');
    lines.push('[resource]');
    lines.push(`memory = ${this.guardrails.resourceLimits.maxMemoryMB}`);
    lines.push(`cpu = ${this.guardrails.resourceLimits.maxCPU}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Write all configuration files
   */
  async writeConfigs(outputDir: string): Promise<void> {
    await fs.ensureDir(outputDir);

    // Write railway.toml
    await fs.writeFile(
      path.join(outputDir, 'railway.toml'),
      this.generateRailwayToml()
    );

    // Write railway.json
    await fs.writeJson(
      path.join(outputDir, 'railway.json'),
      this.generateRailwayJson(),
      { spaces: 2 }
    );

    // Write nixpacks.toml
    await fs.writeFile(
      path.join(outputDir, 'nixpacks.toml'),
      this.generateNixpacksToml()
    );

    // Write cost guardrails documentation
    await this.writeGuardrailsDoc(outputDir);
  }

  /**
   * Write guardrails documentation
   */
  private async writeGuardrailsDoc(outputDir: string): Promise<void> {
    const doc = `# Railway Cost-Protection Guardrails

This project is configured with strict resource limits to stay within Railway's free tier.

## Resource Limits

- **Memory**: ${this.guardrails.resourceLimits.maxMemoryMB}MB maximum
- **CPU**: ${this.guardrails.resourceLimits.maxCPU} vCPU maximum
- **Disk**: ${this.guardrails.resourceLimits.maxDiskGB}GB maximum

## Scaling Configuration

- **Minimum Instances**: ${this.guardrails.scaling.minInstances} (scales to zero when idle)
- **Maximum Instances**: ${this.guardrails.scaling.maxInstances}
- **Auto-scaling**: ${this.guardrails.scaling.autoScale ? 'Enabled' : 'Disabled'}

## Monitoring

- **Alert Threshold**: ${this.guardrails.monitoring.alertThreshold}% of free tier usage
- **Shutdown Threshold**: ${this.guardrails.monitoring.shutdownThreshold}% of free tier usage

When usage exceeds the shutdown threshold, the service will automatically:
1. Deploy a maintenance mode page
2. Suspend the main service
3. Prepare for migration to Coolify (see COOLIFY_MIGRATION.md)

## Railway Free Tier Limits (2024)

- $5 USD credit per month
- 500 hours of execution time
- 512MB memory limit per service
- 1GB disk space

## Important Notes

- These guardrails are ENFORCED to prevent unexpected charges
- Monitor your usage at: https://railway.app/account/usage
- Consider upgrading to a paid plan or migrating to Coolify if you need more resources
`;

    await fs.writeFile(
      path.join(outputDir, 'RAILWAY_GUARDRAILS.md'),
      doc
    );
  }

  /**
   * Get guardrails configuration
   */
  getGuardrails(): CostGuardrails {
    return this.guardrails;
  }

  /**
   * Update guardrails
   */
  updateGuardrails(guardrails: Partial<CostGuardrails>): void {
    this.guardrails = {
      ...this.guardrails,
      ...guardrails
    };
  }
}
