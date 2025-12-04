/**
 * Tests for FreeTierMonitor
 */

import { FreeTierMonitor } from '../../../deployment/monitoring/free-tier-monitor';

describe('FreeTierMonitor', () => {
  let monitor: FreeTierMonitor;

  beforeEach(() => {
    monitor = new FreeTierMonitor(80, 95);
  });

  describe('constructor', () => {
    it('should create monitor with default thresholds', () => {
      const defaultMonitor = new FreeTierMonitor();
      expect(defaultMonitor).toBeDefined();
    });

    it('should create monitor with custom thresholds', () => {
      const customMonitor = new FreeTierMonitor(70, 90);
      expect(customMonitor).toBeDefined();
    });
  });

  describe('simulateUsageCheck', () => {
    it('should return normal status for low usage', () => {
      const result = monitor.simulateUsageCheck(50, 50, 50, 50);

      expect(result.shouldTriggerMaintenance).toBe(false);
      expect(result.shouldAlert).toBe(false);
      expect(result.usageData.memory.percentage).toBe(50);
    });

    it('should alert when usage exceeds alert threshold', () => {
      const result = monitor.simulateUsageCheck(85, 50, 50, 50);

      expect(result.shouldAlert).toBe(true);
      expect(result.shouldTriggerMaintenance).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should trigger maintenance when usage exceeds shutdown threshold', () => {
      const result = monitor.simulateUsageCheck(96, 50, 50, 50);

      expect(result.shouldTriggerMaintenance).toBe(true);
      expect(result.shouldAlert).toBe(true);
      expect(result.recommendations).toContain(expect.stringContaining('IMMEDIATE ACTION'));
    });

    it('should provide recommendations for high memory usage', () => {
      const result = monitor.simulateUsageCheck(90, 50, 50, 50);

      expect(result.recommendations).toContain(expect.stringContaining('Memory usage'));
    });

    it('should provide recommendations for high CPU usage', () => {
      const result = monitor.simulateUsageCheck(50, 90, 50, 50);

      expect(result.recommendations).toContain(expect.stringContaining('CPU usage'));
    });

    it('should provide recommendations for high execution time', () => {
      const result = monitor.simulateUsageCheck(50, 50, 90, 50);

      expect(result.recommendations).toContain(expect.stringContaining('Execution time'));
    });

    it('should provide recommendations for high credit usage', () => {
      const result = monitor.simulateUsageCheck(50, 50, 50, 90);

      expect(result.recommendations).toContain(expect.stringContaining('Credit usage'));
    });
  });

  describe('checkUsage', () => {
    it('should check usage from provided data', () => {
      const usageData = {
        memory: {
          currentUsage: 256,
          limit: 512,
          percentage: 50,
          timestamp: new Date().toISOString()
        },
        cpu: {
          currentUsage: 0.25,
          limit: 0.5,
          percentage: 50,
          timestamp: new Date().toISOString()
        },
        execution: {
          currentUsage: 250,
          limit: 500,
          percentage: 50,
          timestamp: new Date().toISOString()
        },
        credits: {
          currentUsage: 2.5,
          limit: 5,
          percentage: 50,
          timestamp: new Date().toISOString()
        }
      };

      const result = monitor.checkUsage(usageData);

      expect(result.shouldTriggerMaintenance).toBe(false);
      expect(result.shouldAlert).toBe(false);
    });
  });

  describe('generateReport', () => {
    it('should generate readable report', () => {
      const result = monitor.simulateUsageCheck(50, 50, 50, 50);
      const report = monitor.generateReport(result);

      expect(report).toContain('Railway Free Tier Usage Report');
      expect(report).toContain('Current Usage');
      expect(report).toContain('Memory');
      expect(report).toContain('CPU');
      expect(report).toContain('Execution');
      expect(report).toContain('Credits');
      expect(report).toContain('Status');
    });

    it('should show normal status in report', () => {
      const result = monitor.simulateUsageCheck(50, 50, 50, 50);
      const report = monitor.generateReport(result);

      expect(report).toContain('Normal Operation');
    });

    it('should show warning status in report', () => {
      const result = monitor.simulateUsageCheck(85, 50, 50, 50);
      const report = monitor.generateReport(result);

      expect(report).toContain('WARNING: Approaching Limits');
    });

    it('should show maintenance mode status in report', () => {
      const result = monitor.simulateUsageCheck(96, 50, 50, 50);
      const report = monitor.generateReport(result);

      expect(report).toContain('MAINTENANCE MODE TRIGGERED');
    });
  });

  describe('generateDashboardData', () => {
    it('should generate dashboard data object', () => {
      const result = monitor.simulateUsageCheck(50, 50, 50, 50);
      const dashboard = monitor.generateDashboardData(result);

      expect(dashboard).toHaveProperty('status');
      expect(dashboard).toHaveProperty('timestamp');
      expect(dashboard).toHaveProperty('metrics');
      expect(dashboard).toHaveProperty('thresholds');
      expect(dashboard.metrics.memory).toBe(50);
    });

    it('should show correct status in dashboard', () => {
      const normalResult = monitor.simulateUsageCheck(50, 50, 50, 50);
      const normalDashboard = monitor.generateDashboardData(normalResult);
      expect(normalDashboard.status).toBe('normal');

      const warningResult = monitor.simulateUsageCheck(85, 50, 50, 50);
      const warningDashboard = monitor.generateDashboardData(warningResult);
      expect(warningDashboard.status).toBe('warning');

      const maintenanceResult = monitor.simulateUsageCheck(96, 50, 50, 50);
      const maintenanceDashboard = monitor.generateDashboardData(maintenanceResult);
      expect(maintenanceDashboard.status).toBe('maintenance');
    });
  });
});
