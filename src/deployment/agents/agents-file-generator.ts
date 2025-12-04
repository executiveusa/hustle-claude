/**
 * Agents File Generator
 * 
 * Generates .agents file containing structured secret specifications
 * for downstream secret-provisioning agents.
 */

export interface SecretVariable {
  name: string;
  format: string;
  placeholder: string;
  description: string;
  required: boolean;
  module?: string;
}

export interface AgentsFileSchema {
  project: string;
  version: string;
  generated: string;
  core: SecretVariable[];
  optional: SecretVariable[];
  required_secrets: string[];
  schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  modules: Record<string, SecretVariable[]>;
}

export class AgentsFileGenerator {
  private projectName: string;
  private coreSecrets: SecretVariable[] = [];
  private optionalSecrets: SecretVariable[] = [];

  constructor(projectName: string) {
    this.projectName = projectName;
  }

  /**
   * Add a core secret (required for basic functionality)
   */
  addCoreSecret(secret: SecretVariable): void {
    this.coreSecrets.push(secret);
  }

  /**
   * Add an optional secret (for integrations)
   */
  addOptionalSecret(secret: SecretVariable): void {
    this.optionalSecrets.push(secret);
  }

  /**
   * Analyze package.json and detect potential secrets
   */
  async analyzePackageJson(packageJsonPath: string): Promise<void> {
    const fs = await import('fs-extra');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return;
    }

    const pkg = await fs.readJson(packageJsonPath);
    const dependencies = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies
    };

    // Common patterns for secret detection
    const secretPatterns = [
      { pattern: /stripe/i, secrets: ['STRIPE_API_KEY', 'STRIPE_SECRET_KEY'] },
      { pattern: /sendgrid/i, secrets: ['SENDGRID_API_KEY'] },
      { pattern: /twilio/i, secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] },
      { pattern: /firebase/i, secrets: ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID'] },
      { pattern: /mongo|mongoose/i, secrets: ['MONGODB_URI'] },
      { pattern: /postgres|pg/i, secrets: ['DATABASE_URL', 'POSTGRES_PASSWORD'] },
      { pattern: /redis/i, secrets: ['REDIS_URL'] },
      { pattern: /aws-sdk/i, secrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] },
      { pattern: /google-cloud/i, secrets: ['GOOGLE_APPLICATION_CREDENTIALS'] },
      { pattern: /openai/i, secrets: ['OPENAI_API_KEY'] },
      { pattern: /anthropic/i, secrets: ['ANTHROPIC_API_KEY'] },
      { pattern: /jwt|jsonwebtoken/i, secrets: ['JWT_SECRET', 'JWT_PRIVATE_KEY'] },
      { pattern: /oauth/i, secrets: ['OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET'] },
    ];

    for (const dep of Object.keys(dependencies)) {
      for (const { pattern, secrets } of secretPatterns) {
        if (pattern.test(dep)) {
          for (const secretName of secrets) {
            this.addOptionalSecret({
              name: secretName,
              format: 'string',
              placeholder: `<${secretName.toLowerCase()}>`,
              description: `API key/credential for ${dep}`,
              required: false,
              module: dep
            });
          }
        }
      }
    }
  }

  /**
   * Analyze .env.example file and extract secrets
   */
  async analyzeEnvExample(envExamplePath: string): Promise<void> {
    const fs = await import('fs-extra');
    
    if (!await fs.pathExists(envExamplePath)) {
      return;
    }

    const content = await fs.readFile(envExamplePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, name, value] = match;
        
        // Determine if it's a secret based on name patterns
        const secretKeywords = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL', 'API', 'AUTH'];
        const isSecret = secretKeywords.some(keyword => name.includes(keyword));

        if (isSecret) {
          this.addOptionalSecret({
            name,
            format: this.inferFormat(name),
            placeholder: value || `<${name.toLowerCase()}>`,
            description: this.generateDescription(name),
            required: false
          });
        }
      }
    }
  }

  /**
   * Infer the format of a secret based on its name
   */
  private inferFormat(name: string): string {
    if (name.includes('URL') || name.includes('URI')) return 'url';
    if (name.includes('PORT')) return 'number';
    if (name.includes('ENABLE') || name.includes('DISABLE')) return 'boolean';
    if (name.includes('EMAIL')) return 'email';
    return 'string';
  }

  /**
   * Generate a human-readable description from variable name
   */
  private generateDescription(name: string): string {
    const words = name.toLowerCase().split('_');
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /**
   * Generate the .agents file schema
   */
  generate(): AgentsFileSchema {
    const allSecrets = [...this.coreSecrets, ...this.optionalSecrets];
    const requiredSecretNames = this.coreSecrets.map(s => s.name);

    // Group secrets by module
    const modules: Record<string, SecretVariable[]> = {};
    for (const secret of allSecrets) {
      if (secret.module) {
        if (!modules[secret.module]) {
          modules[secret.module] = [];
        }
        modules[secret.module].push(secret);
      }
    }

    // Generate JSON Schema
    const properties: Record<string, any> = {};
    for (const secret of allSecrets) {
      properties[secret.name] = {
        type: secret.format === 'number' ? 'number' : 
              secret.format === 'boolean' ? 'boolean' : 'string',
        description: secret.description,
        default: secret.placeholder
      };

      if (secret.format === 'url') {
        properties[secret.name].format = 'uri';
      } else if (secret.format === 'email') {
        properties[secret.name].format = 'email';
      }
    }

    return {
      project: this.projectName,
      version: '1.0.0',
      generated: new Date().toISOString(),
      core: this.coreSecrets,
      optional: this.optionalSecrets,
      required_secrets: requiredSecretNames,
      schema: {
        type: 'object',
        properties,
        required: requiredSecretNames
      },
      modules
    };
  }

  /**
   * Write .agents file to disk
   */
  async write(outputPath: string): Promise<void> {
    const fs = await import('fs-extra');
    const schema = this.generate();
    await fs.writeJson(outputPath, schema, { spaces: 2 });
  }

  /**
   * Generate from repository analysis
   */
  static async generateFromRepo(repoPath: string, projectName?: string): Promise<AgentsFileGenerator> {
    const fs = await import('fs-extra');
    const path = await import('path');

    // Detect project name from package.json
    const packageJsonPath = path.join(repoPath, 'package.json');
    if (!projectName && await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      projectName = pkg.name || 'unknown-project';
    }

    const generator = new AgentsFileGenerator(projectName || 'unknown-project');

    // Analyze package.json
    await generator.analyzePackageJson(packageJsonPath);

    // Analyze .env.example
    const envExamplePath = path.join(repoPath, '.env.example');
    await generator.analyzeEnvExample(envExamplePath);

    // Add common core secrets for web applications
    generator.addCoreSecret({
      name: 'PORT',
      format: 'number',
      placeholder: '3000',
      description: 'Port number for the application',
      required: true
    });

    generator.addCoreSecret({
      name: 'NODE_ENV',
      format: 'string',
      placeholder: 'production',
      description: 'Node environment (development, production, test)',
      required: true
    });

    return generator;
  }
}
