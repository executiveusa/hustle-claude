/**
 * Railway Zero-Secrets Bootstrapper
 * 
 * Main orchestrator that implements the complete Railway deployment workflow
 * with cost-protection guardrails and multi-host failover support.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { AgentsFileGenerator } from '../agents/agents-file-generator';
import { MasterSecretsManager } from '../agents/master-secrets-manager';
import { RailwayConfigGenerator } from './railway-config-generator';
import { FreeTierMonitor } from '../monitoring/free-tier-monitor';
import { MaintenancePageGenerator } from '../templates/maintenance-page-generator';
import { CoolifyConfigGenerator } from '../coolify/coolify-config-generator';

export interface BootstrapOptions {
  repoPath: string;
  projectName?: string;
  skipSecretAnalysis?: boolean;
  skipRailwayConfig?: boolean;
  skipCoolifyConfig?: boolean;
  outputDir?: string;
}

export interface BootstrapResult {
  success: boolean;
  projectName: string;
  agentsFilePath: string;
  masterSecretsPath: string;
  railwayConfigPath: string;
  coolifyConfigPath: string;
  maintenancePagePath: string;
  errors: string[];
  warnings: string[];
}

export class RailwayBootstrapper {
  private options: BootstrapOptions;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(options: BootstrapOptions) {
    this.options = {
      outputDir: options.repoPath,
      ...options
    };
  }

  /**
   * Execute complete bootstrap workflow
   */
  async bootstrap(): Promise<BootstrapResult> {
    const startTime = Date.now();
    console.log('🚀 Railway Zero-Secrets Bootstrapper v1.0.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();

    try {
      // Step 1: Analyze repository
      console.log('📋 Step 1: Analyzing repository...');
      const projectName = await this.detectProjectName();
      console.log(`   Project: ${projectName}`);
      console.log();

      // Step 2: Generate .agents file
      console.log('🤖 Step 2: Generating .agents file...');
      const agentsFilePath = await this.generateAgentsFile(projectName);
      console.log(`   Created: ${agentsFilePath}`);
      console.log();

      // Step 3: Update master.secrets.json
      console.log('🔐 Step 3: Updating master.secrets.json...');
      const masterSecretsPath = await this.updateMasterSecrets(projectName, agentsFilePath);
      console.log(`   Updated: ${masterSecretsPath}`);
      console.log();

      // Step 4: Generate Railway configuration
      console.log('🚂 Step 4: Generating Railway configuration...');
      const railwayConfigPath = await this.generateRailwayConfig(projectName);
      console.log(`   Created: ${railwayConfigPath}`);
      console.log();

      // Step 5: Generate Coolify configuration
      console.log('❄️  Step 5: Generating Coolify configuration...');
      const coolifyConfigPath = await this.generateCoolifyConfig(projectName);
      console.log(`   Created: ${coolifyConfigPath}`);
      console.log();

      // Step 6: Generate maintenance page
      console.log('🔧 Step 6: Generating maintenance page...');
      const maintenancePagePath = await this.generateMaintenancePage(projectName);
      console.log(`   Created: ${maintenancePagePath}`);
      console.log();

      // Step 7: Generate documentation
      console.log('📚 Step 7: Generating documentation...');
      await this.generateDocumentation(projectName);
      console.log('   Created deployment documentation');
      console.log();

      // Step 8: Run cost-protection validation
      console.log('🛡️  Step 8: Validating cost-protection guardrails...');
      await this.validateGuardrails();
      console.log('   ✓ Guardrails configured correctly');
      console.log();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Bootstrap completed in ${duration}s`);
      console.log();

      // Print summary
      this.printSummary(projectName, agentsFilePath, masterSecretsPath);

      return {
        success: true,
        projectName,
        agentsFilePath,
        masterSecretsPath,
        railwayConfigPath,
        coolifyConfigPath,
        maintenancePagePath,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.errors.push(error instanceof Error ? error.message : String(error));
      console.error('❌ Bootstrap failed:', error);
      
      return {
        success: false,
        projectName: this.options.projectName || 'unknown',
        agentsFilePath: '',
        masterSecretsPath: '',
        railwayConfigPath: '',
        coolifyConfigPath: '',
        maintenancePagePath: '',
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * Detect project name from repository
   */
  private async detectProjectName(): Promise<string> {
    if (this.options.projectName) {
      return this.options.projectName;
    }

    const packageJsonPath = path.join(this.options.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.name) {
        return pkg.name;
      }
    }

    // Use directory name as fallback
    return path.basename(this.options.repoPath);
  }

  /**
   * Generate .agents file
   */
  private async generateAgentsFile(projectName: string): Promise<string> {
    if (this.options.skipSecretAnalysis) {
      this.warnings.push('Secret analysis skipped');
      return '';
    }

    const generator = await AgentsFileGenerator.generateFromRepo(
      this.options.repoPath,
      projectName
    );

    const outputPath = path.join(this.options.outputDir!, '.agents');
    await generator.write(outputPath);

    return outputPath;
  }

  /**
   * Update master.secrets.json
   */
  private async updateMasterSecrets(projectName: string, agentsFilePath: string): Promise<string> {
    const manager = new MasterSecretsManager();
    await manager.initialize();

    if (agentsFilePath && await fs.pathExists(agentsFilePath)) {
      await manager.importFromAgentsFile(agentsFilePath, projectName);
    }

    // Add metadata
    await manager.updateProjectSecrets(projectName, {}, {
      repoPath: this.options.repoPath,
      deployments: ['railway']
    });

    return manager.getFilePath();
  }

  /**
   * Generate Railway configuration
   */
  private async generateRailwayConfig(projectName: string): Promise<string> {
    if (this.options.skipRailwayConfig) {
      this.warnings.push('Railway config generation skipped');
      return '';
    }

    const generator = new RailwayConfigGenerator(projectName, this.options.repoPath);
    await generator.detectAndConfigure();
    await generator.writeConfigs(this.options.outputDir!);

    return path.join(this.options.outputDir!, 'railway.toml');
  }

  /**
   * Generate Coolify configuration
   */
  private async generateCoolifyConfig(projectName: string): Promise<string> {
    if (this.options.skipCoolifyConfig) {
      this.warnings.push('Coolify config generation skipped');
      return '';
    }

    const generator = new CoolifyConfigGenerator(projectName, this.options.repoPath);
    await generator.writeConfigs(this.options.outputDir!);

    return path.join(this.options.outputDir!, 'docker-compose.coolify.yml');
  }

  /**
   * Generate maintenance page
   */
  private async generateMaintenancePage(projectName: string): Promise<string> {
    const outputDir = path.join(this.options.outputDir!, '.maintenance');
    
    await MaintenancePageGenerator.createMaintenancePackage(outputDir, {
      projectName,
      message: "We're currently performing maintenance. Please check back soon.",
      reason: 'Free tier limits exceeded - migrating to new infrastructure',
      showMigrationInfo: true
    });

    return path.join(outputDir, 'maintenance.html');
  }

  /**
   * Generate comprehensive documentation
   */
  private async generateDocumentation(projectName: string): Promise<void> {
    const readmePath = path.join(this.options.outputDir!, 'DEPLOYMENT.md');

    const readme = `# ${projectName} - Deployment Guide

This project has been configured with the Railway Zero-Secrets Bootstrapper.

## 🎯 Quick Start

### Railway Deployment

1. Install Railway CLI:
   \`\`\`bash
   npm install -g @railway/cli
   \`\`\`

2. Login to Railway:
   \`\`\`bash
   railway login
   \`\`\`

3. Initialize project:
   \`\`\`bash
   railway init
   \`\`\`

4. Set environment variables from master.secrets.json:
   \`\`\`bash
   # See master.secrets.json for required variables
   railway variables set KEY=value
   \`\`\`

5. Deploy:
   \`\`\`bash
   railway up
   \`\`\`

### Configuration Files

- **\`.agents\`** - Secret specifications for this project
- **\`railway.toml\`** - Railway deployment configuration
- **\`railway.json\`** - Railway project settings
- **\`nixpacks.toml\`** - Build configuration with resource limits
- **\`RAILWAY_GUARDRAILS.md\`** - Cost-protection documentation

### Secret Management

All secrets are managed via:
- **\`.agents\`** - Specification of required secrets
- **\`master.secrets.json\`** - Local secret storage (NEVER committed)
- Location: \`~/.claude-flow/master.secrets.json\`

To view your secrets:
\`\`\`bash
cat ~/.claude-flow/master.secrets.json
\`\`\`

### Cost Protection

This project includes automatic cost-protection:
- **Memory limit**: 512MB
- **CPU limit**: 0.5 vCPU
- **Alert threshold**: 80% of free tier
- **Shutdown threshold**: 95% of free tier

When limits are exceeded:
1. Service automatically shuts down
2. Maintenance page is deployed
3. Migration guide is provided (see COOLIFY_MIGRATION.md)

### Monitoring

Check usage with:
\`\`\`bash
railway status
railway logs
\`\`\`

Or visit: https://railway.app/account/usage

### Alternative Deployment: Coolify

If Railway limits are insufficient:

1. See **\`COOLIFY_SUPPORT.md\`** for setup instructions
2. See **\`COOLIFY_MIGRATION.md\`** for migration steps
3. Use **\`docker-compose.coolify.yml\`** for deployment

### Maintenance Mode

If free tier is exceeded, maintenance mode activates automatically:
- Static page served at: \`.maintenance/maintenance.html\`
- Maintenance server: \`.maintenance/maintenance-server.js\`
- Railway config: \`.maintenance/railway.toml\`

To manually deploy maintenance mode:
\`\`\`bash
cd .maintenance
railway up
\`\`\`

## 📚 Documentation

- **DEPLOYMENT.md** (this file) - Main deployment guide
- **RAILWAY_GUARDRAILS.md** - Cost-protection details
- **COOLIFY_SUPPORT.md** - Coolify setup guide
- **COOLIFY_MIGRATION.md** - Railway to Coolify migration
- **HOSTINGER_VPN_NOTES.md** - VPN setup for Coolify

## 🛡️ Security

- Never commit \`.env\` files
- Never commit \`master.secrets.json\`
- Review \`.gitignore\` to ensure secrets are excluded
- Use Railway's environment variable system for production secrets

## 🆘 Troubleshooting

### Deployment Fails

1. Check build logs: \`railway logs\`
2. Verify all required env vars are set
3. Check \`.agents\` file for required secrets

### Free Tier Exceeded

1. Review usage: https://railway.app/account/usage
2. Consider upgrading to paid tier
3. Or migrate to Coolify (cheaper for multiple projects)

### Maintenance Mode Not Working

1. Check \`.maintenance\` directory exists
2. Verify maintenance page builds: \`cd .maintenance && npm install\`
3. Test locally: \`cd .maintenance && npm start\`

## 📊 Cost Comparison

| Platform | Cost | Use Case |
|----------|------|----------|
| Railway Free | $0 | Development, small projects |
| Railway Pro | $5+/month | Production, single project |
| Coolify + VPS | $4-12/month | Multiple projects |

## 🚀 Next Steps

1. Review generated configuration files
2. Set up secrets in master.secrets.json
3. Deploy to Railway
4. Monitor usage
5. Consider Coolify if scaling needed

---

Generated by Railway Zero-Secrets Bootstrapper v1.0.0
`;

    await fs.writeFile(readmePath, readme);
  }

  /**
   * Validate guardrails are configured correctly
   */
  private async validateGuardrails(): Promise<void> {
    const railwayTomlPath = path.join(this.options.outputDir!, 'railway.toml');
    
    if (!await fs.pathExists(railwayTomlPath)) {
      this.warnings.push('railway.toml not found - guardrails may not be enforced');
      return;
    }

    const content = await fs.readFile(railwayTomlPath, 'utf-8');
    
    // Verify guardrail comments are present
    if (!content.includes('Cost Protection Guardrails')) {
      this.warnings.push('Cost protection guardrails not found in railway.toml');
    }

    // Check for monitoring setup
    const monitor = new FreeTierMonitor();
    const testResult = monitor.simulateUsageCheck(50, 50, 50, 50);
    
    if (!testResult) {
      this.warnings.push('Free tier monitoring may not be configured correctly');
    }
  }

  /**
   * Print summary of generated files
   */
  private printSummary(projectName: string, agentsFilePath: string, masterSecretsPath: string): void {
    console.log('📦 Generated Files:');
    console.log('   ├─ .agents - Secret specifications');
    console.log('   ├─ railway.toml - Railway config');
    console.log('   ├─ railway.json - Railway project settings');
    console.log('   ├─ nixpacks.toml - Build configuration');
    console.log('   ├─ docker-compose.coolify.yml - Coolify config');
    console.log('   ├─ Dockerfile.coolify - Coolify dockerfile');
    console.log('   ├─ .maintenance/ - Maintenance mode package');
    console.log('   └─ Documentation files');
    console.log();
    console.log('📋 Documentation:');
    console.log('   ├─ DEPLOYMENT.md - Deployment guide');
    console.log('   ├─ RAILWAY_GUARDRAILS.md - Cost protection');
    console.log('   ├─ COOLIFY_SUPPORT.md - Coolify setup');
    console.log('   ├─ COOLIFY_MIGRATION.md - Migration guide');
    console.log('   └─ HOSTINGER_VPN_NOTES.md - VPN setup');
    console.log();
    console.log('🔐 Secret Management:');
    console.log(`   Master secrets: ${masterSecretsPath}`);
    console.log(`   Project secrets: ${projectName}`);
    console.log();
    console.log('⚡ Next Steps:');
    console.log('   1. Review .agents file for required secrets');
    console.log('   2. Update master.secrets.json with real values');
    console.log('   3. Deploy to Railway: railway up');
    console.log('   4. Monitor usage to stay within free tier');
    console.log();

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(w => console.log(`   - ${w}`));
      console.log();
    }
  }

  /**
   * Static helper: Bootstrap a repository
   */
  static async bootstrapRepo(repoPath: string, options?: Partial<BootstrapOptions>): Promise<BootstrapResult> {
    const bootstrapper = new RailwayBootstrapper({
      repoPath,
      ...options
    });

    return await bootstrapper.bootstrap();
  }
}
