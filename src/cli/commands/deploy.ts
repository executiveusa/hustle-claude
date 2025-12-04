/**
 * Deployment CLI Commands
 * 
 * Commands for Railway Zero-Secrets Bootstrapper deployment system
 */

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import {
  RailwayBootstrapper,
  MasterSecretsManager,
  FreeTierMonitor,
  MaintenancePageGenerator
} from '../../deployment';

/**
 * Create deployment commands
 */
export function createDeployCommand(): Command {
  const deploy = new Command('deploy')
    .description('Railway Zero-Secrets Bootstrapper deployment tools')
    .addHelpText('after', `
Examples:
  $ claude-flow deploy bootstrap ./my-project
  $ claude-flow deploy secrets list
  $ claude-flow deploy monitor --simulate
  $ claude-flow deploy maintenance --project my-app
    `);

  // Bootstrap command
  deploy
    .command('bootstrap')
    .description('Bootstrap a repository for Railway deployment with zero-secrets architecture')
    .argument('[repo-path]', 'Path to repository', process.cwd())
    .option('-n, --name <name>', 'Project name (auto-detected if not provided)')
    .option('--skip-secrets', 'Skip secret analysis')
    .option('--skip-railway', 'Skip Railway config generation')
    .option('--skip-coolify', 'Skip Coolify config generation')
    .option('-o, --output <dir>', 'Output directory (defaults to repo path)')
    .action(async (repoPath: string, options: any) => {
      try {
        console.log(chalk.blue('🚀 Railway Zero-Secrets Bootstrapper\n'));

        const result = await RailwayBootstrapper.bootstrapRepo(repoPath, {
          projectName: options.name,
          skipSecretAnalysis: options.skipSecrets,
          skipRailwayConfig: options.skipRailway,
          skipCoolifyConfig: options.skipCoolify,
          outputDir: options.output
        });

        if (result.success) {
          console.log(chalk.green('✅ Bootstrap completed successfully!\n'));
          console.log(chalk.bold('Next steps:'));
          console.log('  1. Review generated .agents file');
          console.log('  2. Update master.secrets.json with real values');
          console.log('  3. Deploy: railway up');
          console.log('  4. Monitor usage to stay within free tier\n');
        } else {
          console.log(chalk.red('❌ Bootstrap failed\n'));
          if (result.errors.length > 0) {
            console.log(chalk.red('Errors:'));
            result.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
          }
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Secrets management commands
  const secrets = deploy
    .command('secrets')
    .description('Manage master secrets across projects');

  secrets
    .command('list')
    .description('List all projects in master.secrets.json')
    .action(async () => {
      try {
        const manager = new MasterSecretsManager();
        const projects = await manager.listProjects();

        if (projects.length === 0) {
          console.log(chalk.yellow('No projects found in master.secrets.json'));
          return;
        }

        console.log(chalk.blue('Projects in master.secrets.json:\n'));
        for (const project of projects) {
          console.log(chalk.green(`  ✓ ${project}`));
        }
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  secrets
    .command('show')
    .description('Show secrets for a project')
    .argument('<project>', 'Project name')
    .option('--show-values', 'Show actual secret values (use with caution)')
    .action(async (project: string, options: any) => {
      try {
        const manager = new MasterSecretsManager();
        const projectSecrets = await manager.getProjectSecrets(project);

        if (!projectSecrets) {
          console.log(chalk.yellow(`Project "${project}" not found`));
          return;
        }

        console.log(chalk.blue(`Secrets for ${project}:\n`));
        
        for (const [key, value] of Object.entries(projectSecrets)) {
          if (options.showValues) {
            console.log(`  ${chalk.cyan(key)}: ${value}`);
          } else {
            const masked = value.replace(/./g, '*');
            console.log(`  ${chalk.cyan(key)}: ${masked}`);
          }
        }
        console.log();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  secrets
    .command('export')
    .description('Export secrets to .env format')
    .argument('<project>', 'Project name')
    .option('-o, --output <file>', 'Output file (prints to stdout if not provided)')
    .action(async (project: string, options: any) => {
      try {
        const manager = new MasterSecretsManager();
        const envContent = await manager.exportToEnvFormat(project);

        if (!envContent) {
          console.log(chalk.yellow(`Project "${project}" not found`));
          return;
        }

        if (options.output) {
          const fs = await import('fs-extra');
          await fs.writeFile(options.output, envContent);
          console.log(chalk.green(`✓ Exported to ${options.output}`));
        } else {
          console.log(envContent);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  secrets
    .command('report')
    .description('Generate master secrets report')
    .action(async () => {
      try {
        const manager = new MasterSecretsManager();
        const report = await manager.generateReport();
        console.log(report);
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  secrets
    .command('path')
    .description('Show path to master.secrets.json')
    .action(async () => {
      try {
        const manager = new MasterSecretsManager();
        console.log(manager.getFilePath());
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Monitoring commands
  const monitor = deploy
    .command('monitor')
    .description('Monitor Railway free tier usage');

  monitor
    .command('check')
    .description('Check current usage')
    .option('--simulate', 'Use simulated data')
    .option('--memory <percent>', 'Simulated memory usage percentage', '50')
    .option('--cpu <percent>', 'Simulated CPU usage percentage', '50')
    .option('--execution <percent>', 'Simulated execution usage percentage', '50')
    .option('--credits <percent>', 'Simulated credits usage percentage', '50')
    .action(async (options: any) => {
      try {
        const monitor = new FreeTierMonitor();
        
        let result;
        if (options.simulate) {
          result = monitor.simulateUsageCheck(
            parseFloat(options.memory),
            parseFloat(options.cpu),
            parseFloat(options.execution),
            parseFloat(options.credits)
          );
        } else {
          console.log(chalk.yellow('Note: Railway API integration not yet implemented. Using simulation.'));
          result = monitor.simulateUsageCheck(50, 50, 50, 50);
        }

        console.log(monitor.generateReport(result));

        if (result.shouldTriggerMaintenance) {
          console.log(chalk.red('\n⚠️  MAINTENANCE MODE SHOULD BE ACTIVATED'));
          process.exit(1);
        } else if (result.shouldAlert) {
          console.log(chalk.yellow('\n⚠️  WARNING: Approaching limits'));
        } else {
          console.log(chalk.green('\n✅ All systems normal'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Maintenance commands
  const maintenance = deploy
    .command('maintenance')
    .description('Maintenance mode management');

  maintenance
    .command('generate')
    .description('Generate maintenance page')
    .option('-p, --project <name>', 'Project name', 'My Project')
    .option('-m, --message <text>', 'Maintenance message')
    .option('-o, --output <dir>', 'Output directory', './.maintenance')
    .option('--show-migration', 'Show migration information')
    .action(async (options: any) => {
      try {
        const outputDir = path.resolve(options.output);
        
        await MaintenancePageGenerator.createMaintenancePackage(outputDir, {
          projectName: options.project,
          message: options.message,
          showMigrationInfo: options.showMigration
        });

        console.log(chalk.green(`✓ Maintenance package created at: ${outputDir}`));
        console.log(chalk.blue('\nTo deploy:'));
        console.log(`  cd ${outputDir}`);
        console.log('  npm install');
        console.log('  railway up');
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Info command
  deploy
    .command('info')
    .description('Show deployment system information')
    .action(() => {
      console.log(chalk.blue('Railway Zero-Secrets Bootstrapper v1.0.0\n'));
      console.log(chalk.bold('Features:'));
      console.log('  ✓ Automatic secret detection and management');
      console.log('  ✓ Railway deployment with cost-protection guardrails');
      console.log('  ✓ Coolify migration support');
      console.log('  ✓ Hostinger VPN configuration');
      console.log('  ✓ Automatic maintenance mode on free-tier breach');
      console.log('  ✓ Master secrets architecture\n');
      
      console.log(chalk.bold('Components:'));
      console.log('  • .agents file - Secret specifications');
      console.log('  • master.secrets.json - Local secret storage');
      console.log('  • railway.toml - Railway configuration');
      console.log('  • docker-compose.coolify.yml - Coolify config');
      console.log('  • Maintenance mode package\n');

      console.log(chalk.bold('Documentation:'));
      console.log('  • DEPLOYMENT.md - Main deployment guide');
      console.log('  • RAILWAY_GUARDRAILS.md - Cost protection');
      console.log('  • COOLIFY_SUPPORT.md - Coolify setup');
      console.log('  • COOLIFY_MIGRATION.md - Migration guide');
      console.log('  • HOSTINGER_VPN_NOTES.md - VPN setup\n');
    });

  return deploy;
}
