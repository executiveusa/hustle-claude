/**
 * Railway Zero-Secrets Deployment System
 * 
 * Export all deployment-related modules for use in claude-flow CLI
 */

export { AgentsFileGenerator } from './agents/agents-file-generator';
export { MasterSecretsManager } from './agents/master-secrets-manager';
export { RailwayConfigGenerator } from './railway/railway-config-generator';
export { RailwayBootstrapper } from './railway/railway-bootstrapper';
export { FreeTierMonitor } from './monitoring/free-tier-monitor';
export { MaintenancePageGenerator } from './templates/maintenance-page-generator';
export { CoolifyConfigGenerator } from './coolify/coolify-config-generator';

export type {
  SecretVariable,
  AgentsFileSchema
} from './agents/agents-file-generator';

export type {
  ProjectSecrets,
  MasterSecretsFile
} from './agents/master-secrets-manager';

export type {
  RailwayConfig,
  CostGuardrails
} from './railway/railway-config-generator';

export type {
  BootstrapOptions,
  BootstrapResult
} from './railway/railway-bootstrapper';

export type {
  UsageMetrics,
  UsageData,
  MonitoringResult
} from './monitoring/free-tier-monitor';

export type {
  MaintenancePageOptions
} from './templates/maintenance-page-generator';

export type {
  CoolifyConfig
} from './coolify/coolify-config-generator';
