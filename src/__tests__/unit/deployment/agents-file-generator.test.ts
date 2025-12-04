/**
 * Tests for AgentsFileGenerator
 */

import { AgentsFileGenerator } from '../../../deployment/agents/agents-file-generator';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('AgentsFileGenerator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agents-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('constructor', () => {
    it('should create generator with project name', () => {
      const generator = new AgentsFileGenerator('test-project');
      expect(generator).toBeDefined();
    });
  });

  describe('addCoreSecret', () => {
    it('should add a core secret', () => {
      const generator = new AgentsFileGenerator('test-project');
      generator.addCoreSecret({
        name: 'DATABASE_URL',
        format: 'url',
        placeholder: '<database-url>',
        description: 'Database connection URL',
        required: true
      });

      const schema = generator.generate();
      expect(schema.core).toHaveLength(1);
      expect(schema.core[0].name).toBe('DATABASE_URL');
    });
  });

  describe('addOptionalSecret', () => {
    it('should add an optional secret', () => {
      const generator = new AgentsFileGenerator('test-project');
      generator.addOptionalSecret({
        name: 'STRIPE_API_KEY',
        format: 'string',
        placeholder: '<stripe-api-key>',
        description: 'Stripe API key',
        required: false
      });

      const schema = generator.generate();
      expect(schema.optional).toHaveLength(1);
      expect(schema.optional[0].name).toBe('STRIPE_API_KEY');
    });
  });

  describe('generate', () => {
    it('should generate complete schema', () => {
      const generator = new AgentsFileGenerator('test-project');
      
      generator.addCoreSecret({
        name: 'PORT',
        format: 'number',
        placeholder: '3000',
        description: 'Port number',
        required: true
      });

      generator.addOptionalSecret({
        name: 'API_KEY',
        format: 'string',
        placeholder: '<api-key>',
        description: 'API key',
        required: false
      });

      const schema = generator.generate();

      expect(schema.project).toBe('test-project');
      expect(schema.version).toBe('1.0.0');
      expect(schema.core).toHaveLength(1);
      expect(schema.optional).toHaveLength(1);
      expect(schema.required_secrets).toContain('PORT');
      expect(schema.schema.properties).toHaveProperty('PORT');
      expect(schema.schema.properties).toHaveProperty('API_KEY');
    });
  });

  describe('write', () => {
    it('should write .agents file to disk', async () => {
      const generator = new AgentsFileGenerator('test-project');
      generator.addCoreSecret({
        name: 'PORT',
        format: 'number',
        placeholder: '3000',
        description: 'Port number',
        required: true
      });

      const filePath = path.join(testDir, '.agents');
      await generator.write(filePath);

      expect(await fs.pathExists(filePath)).toBe(true);
      
      const content = await fs.readJson(filePath);
      expect(content.project).toBe('test-project');
      expect(content.core).toHaveLength(1);
    });
  });
});
