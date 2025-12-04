/**
 * Free Tier Monitor
 * 
 * Monitors Railway usage and triggers maintenance mode when approaching limits.
 */

export interface UsageMetrics {
  currentUsage: number;
  limit: number;
  percentage: number;
  timestamp: string;
}

export interface UsageData {
  memory: UsageMetrics;
  cpu: UsageMetrics;
  execution: UsageMetrics;
  credits: UsageMetrics;
}

export interface MonitoringResult {
  shouldTriggerMaintenance: boolean;
  shouldAlert: boolean;
  usageData: UsageData;
  recommendations: string[];
}

export class FreeTierMonitor {
  private alertThreshold: number;
  private shutdownThreshold: number;

  constructor(alertThreshold = 80, shutdownThreshold = 95) {
    this.alertThreshold = alertThreshold;
    this.shutdownThreshold = shutdownThreshold;
  }

  /**
   * Check if we should trigger maintenance mode
   */
  checkUsage(usageData: UsageData): MonitoringResult {
    const metrics = [
      usageData.memory,
      usageData.cpu,
      usageData.execution,
      usageData.credits
    ];

    // Find highest usage percentage
    const maxPercentage = Math.max(...metrics.map(m => m.percentage));
    
    const shouldTriggerMaintenance = maxPercentage >= this.shutdownThreshold;
    const shouldAlert = maxPercentage >= this.alertThreshold;

    const recommendations: string[] = [];

    if (usageData.memory.percentage > this.alertThreshold) {
      recommendations.push('Memory usage is high. Consider optimizing memory usage or upgrading.');
    }

    if (usageData.cpu.percentage > this.alertThreshold) {
      recommendations.push('CPU usage is high. Consider optimizing CPU-intensive operations.');
    }

    if (usageData.execution.percentage > this.alertThreshold) {
      recommendations.push('Execution time is high. Consider implementing caching or background jobs.');
    }

    if (usageData.credits.percentage > this.alertThreshold) {
      recommendations.push('Credit usage is high. Monitor closely or consider upgrading to paid tier.');
    }

    if (shouldTriggerMaintenance) {
      recommendations.push('⚠️  IMMEDIATE ACTION REQUIRED: Usage exceeded shutdown threshold.');
      recommendations.push('Maintenance mode will be activated automatically.');
      recommendations.push('Consider migrating to Coolify or upgrading Railway plan.');
    }

    return {
      shouldTriggerMaintenance,
      shouldAlert,
      usageData,
      recommendations
    };
  }

  /**
   * Simulate usage check (for testing without actual Railway API)
   */
  simulateUsageCheck(memoryPercentage = 50, cpuPercentage = 50, executionPercentage = 50, creditsPercentage = 50): MonitoringResult {
    const now = new Date().toISOString();

    const usageData: UsageData = {
      memory: {
        currentUsage: (memoryPercentage / 100) * 512,
        limit: 512,
        percentage: memoryPercentage,
        timestamp: now
      },
      cpu: {
        currentUsage: (cpuPercentage / 100) * 0.5,
        limit: 0.5,
        percentage: cpuPercentage,
        timestamp: now
      },
      execution: {
        currentUsage: (executionPercentage / 100) * 500,
        limit: 500,
        percentage: executionPercentage,
        timestamp: now
      },
      credits: {
        currentUsage: (creditsPercentage / 100) * 5,
        limit: 5,
        percentage: creditsPercentage,
        timestamp: now
      }
    };

    return this.checkUsage(usageData);
  }

  /**
   * Generate usage report
   */
  generateReport(result: MonitoringResult): string {
    const lines: string[] = [];
    
    lines.push('# Railway Free Tier Usage Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Current Usage');
    lines.push('');

    const formatMetric = (name: string, metric: UsageMetrics): string => {
      const bar = this.generateProgressBar(metric.percentage);
      return `${name}: ${bar} ${metric.percentage.toFixed(1)}% (${metric.currentUsage.toFixed(2)} / ${metric.limit})`;
    };

    lines.push(formatMetric('Memory (MB)', result.usageData.memory));
    lines.push(formatMetric('CPU (vCPU)', result.usageData.cpu));
    lines.push(formatMetric('Execution (hours)', result.usageData.execution));
    lines.push(formatMetric('Credits (USD)', result.usageData.credits));
    lines.push('');

    // Status
    lines.push('## Status');
    if (result.shouldTriggerMaintenance) {
      lines.push('🚨 **MAINTENANCE MODE TRIGGERED**');
    } else if (result.shouldAlert) {
      lines.push('⚠️  **WARNING: Approaching Limits**');
    } else {
      lines.push('✅ **Normal Operation**');
    }
    lines.push('');

    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of result.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    // Thresholds
    lines.push('## Configured Thresholds');
    lines.push(`- Alert Threshold: ${this.alertThreshold}%`);
    lines.push(`- Shutdown Threshold: ${this.shutdownThreshold}%`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate a simple progress bar
   */
  private generateProgressBar(percentage: number, width = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    let bar = '[';
    bar += '█'.repeat(filled);
    bar += '░'.repeat(empty);
    bar += ']';
    
    return bar;
  }

  /**
   * Check if Railway API is available (stub for future implementation)
   */
  async checkRailwayAPI(): Promise<boolean> {
    // TODO: Implement actual Railway API check
    // For now, return false to indicate we should use simulation
    return false;
  }

  /**
   * Fetch actual usage from Railway API (stub for future implementation)
   * 
   * @remarks
   * This method is currently not implemented and will return null.
   * Railway does not provide a public API for programmatic usage queries.
   * Use simulateUsageCheck() for testing or manual checks via Railway dashboard.
   * 
   * Future implementation would require:
   * - Railway GraphQL API token
   * - Project/service ID
   * - Usage metrics parsing from Railway's private API
   * 
   * @param projectId - Railway project ID (unused)
   * @param token - Railway API token (unused)
   * @returns null (not implemented)
   */
  async fetchRailwayUsage(projectId?: string, token?: string): Promise<UsageData | null> {
    // Railway API integration not available
    // Use Railway dashboard for actual usage: https://railway.app/account/usage
    
    if (!projectId || !token) {
      return null;
    }

    console.log('Railway API integration not yet implemented. Use simulateUsageCheck() instead.');
    return null;
  }

  /**
   * Log usage to file
   */
  async logUsage(result: MonitoringResult, logPath: string): Promise<void> {
    const fs = await import('fs-extra');
    const path = await import('path');

    await fs.ensureDir(path.dirname(logPath));

    const logEntry = {
      timestamp: new Date().toISOString(),
      shouldTriggerMaintenance: result.shouldTriggerMaintenance,
      shouldAlert: result.shouldAlert,
      usage: result.usageData,
      recommendations: result.recommendations
    };

    // Append to log file
    await fs.appendFile(
      logPath,
      JSON.stringify(logEntry) + '\n'
    );
  }

  /**
   * Create monitoring dashboard data
   */
  generateDashboardData(result: MonitoringResult): object {
    return {
      status: result.shouldTriggerMaintenance ? 'maintenance' :
              result.shouldAlert ? 'warning' : 'normal',
      timestamp: new Date().toISOString(),
      metrics: {
        memory: result.usageData.memory.percentage,
        cpu: result.usageData.cpu.percentage,
        execution: result.usageData.execution.percentage,
        credits: result.usageData.credits.percentage
      },
      thresholds: {
        alert: this.alertThreshold,
        shutdown: this.shutdownThreshold
      }
    };
  }
}
