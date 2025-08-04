import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const cliPath = path.join(projectRoot, 'dist', 'cli.js');

describe('CLI Integration Tests', () => {
  const testDir = path.join(projectRoot, 'test-workspace');

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('init command', () => {
    it('should initialize project with required files', async () => {
      execSync(`node ${cliPath} init`, { encoding: 'utf-8', cwd: testDir });

      // Check if files were created
      const configExists = await fs.access(path.join(testDir, 'kintone-as-code.config.js'))
        .then(() => true)
        .catch(() => false);
      const envExampleExists = await fs.access(path.join(testDir, '.env.example'))
        .then(() => true)
        .catch(() => false);
      const appsExists = await fs.access(path.join(testDir, 'apps'))
        .then(() => true)
        .catch(() => false);

      expect(configExists).toBe(true);
      expect(envExampleExists).toBe(true);
      expect(appsExists).toBe(true);
    });

    it('should not overwrite existing files without --force', async () => {
      // Create config file first
      await fs.writeFile(
        path.join(testDir, 'kintone-as-code.config.js'),
        'export default { test: true };'
      );

      execSync(`node ${cliPath} init`, { encoding: 'utf-8', cwd: testDir });

      // Check that original content is preserved
      const content = await fs.readFile(
        path.join(testDir, 'kintone-as-code.config.js'),
        'utf-8'
      );
      expect(content).toBe('export default { test: true };');
    });

    it('should overwrite files with --force flag', async () => {
      // Create config file first
      await fs.writeFile(
        path.join(testDir, 'kintone-as-code.config.js'),
        'export default { test: true };'
      );

      execSync(`node ${cliPath} init --force`, { encoding: 'utf-8', cwd: testDir });

      // Check that file was overwritten
      const content = await fs.readFile(
        path.join(testDir, 'kintone-as-code.config.js'),
        'utf-8'
      );
      expect(content).toContain('export default {');
      expect(content).toContain('environments:');
      expect(content).not.toBe('export default { test: true };');
    });
  });

  describe('help command', () => {
    it('should display help information', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });
      
      expect(output).toContain('kintone-as-code');
      expect(output).toContain('init');
      expect(output).toContain('export');
      expect(output).toContain('apply');
      expect(output).toContain('create');
    });
  });

  describe('version display', () => {
    it('should display version', async () => {
      const output = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' });
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      
      expect(output.trim()).toBe(packageJson.version);
    });
  });
});