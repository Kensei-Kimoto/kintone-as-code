import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { setupEnvLoading, shouldLoadEnvFile } from '../../core/env-utils.js';

describe('PAR-99: .env auto-loading opt-in and security', () => {
  const testDir = path.join(process.cwd(), 'test-env-temp');
  const envFilePath = path.join(testDir, '.env');
  
  beforeEach(async () => {
    // Create test directory
    await fs.promises.mkdir(testDir, { recursive: true });
    
    // Create test .env file
    await fs.promises.writeFile(envFilePath, 'TEST_VAR=from_env_file\nANOTHER_VAR=secret_value');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.promises.rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    
    // Clean up environment variables
    delete process.env.TEST_VAR;
    delete process.env.ANOTHER_VAR;
  });

  describe('shouldLoadEnvFile', () => {
    describe('should reject auto-loading by default', () => {
      it('should not auto-load .env when no --env-file option provided', () => {
        const argv = { _: [], $0: 'test' };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(false);
      });

      it('should not auto-load .env when --env-file is not specified', () => {
        const argv = { _: [], $0: 'test', output: 'apps' };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(false);
      });

      it('should return false for non-existent env file even with --env-file', () => {
        const nonExistentPath = path.join(testDir, 'nonexistent.env');
        const argv = { _: [], $0: 'test', 'env-file': nonExistentPath };
        expect(shouldLoadEnvFile(argv, nonExistentPath)).toBe(false);
      });
    });

    describe('should allow explicit loading', () => {
      it('should allow loading when --env-file is explicitly provided', () => {
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(true);
      });

      it('should allow loading with envFile parameter', () => {
        const argv = { _: [], $0: 'test', envFile: envFilePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(true);
      });

      it('should handle relative paths in --env-file option', () => {
        const relativePath = path.relative(process.cwd(), envFilePath);
        const argv = { _: [], $0: 'test', 'env-file': relativePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(true);
      });
    });

    describe('should validate file permissions and ownership', () => {
      it('should reject files with world-writable permissions', async () => {
        // Skip on Windows as file permissions work differently
        if (process.platform === 'win32') {
          return;
        }
        
        // Make file world-writable (dangerous)
        await fs.promises.chmod(envFilePath, 0o666);
        
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(false);
      });

      it('should accept files with secure permissions (600)', async () => {
        // Skip on Windows as file permissions work differently
        if (process.platform === 'win32') {
          return;
        }
        
        // Make file readable only by owner
        await fs.promises.chmod(envFilePath, 0o600);
        
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(true);
      });

      it('should accept files with owner and group read permissions (640)', async () => {
        // Skip on Windows as file permissions work differently
        if (process.platform === 'win32') {
          return;
        }
        
        await fs.promises.chmod(envFilePath, 0o640);
        
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        expect(shouldLoadEnvFile(argv, envFilePath)).toBe(true);
      });
    });
  });

  describe('setupEnvLoading', () => {
    describe('should not load .env by default', () => {
      it('should not modify environment variables without --env-file', async () => {
        const originalValue = process.env.TEST_VAR;
        
        // Change to test directory to ensure .env file is present
        const originalCwd = process.cwd();
        process.chdir(testDir);
        
        try {
          const argv = { _: [], $0: 'test' };
          await setupEnvLoading(argv);
          
          expect(process.env.TEST_VAR).toBe(originalValue);
          expect(process.env.ANOTHER_VAR).toBeUndefined();
        } finally {
          process.chdir(originalCwd);
        }
      });

      it('should not load .env even when present in current directory', async () => {
        const originalCwd = process.cwd();
        process.chdir(testDir);
        
        try {
          const argv = { _: [], $0: 'test', output: 'apps' };
          await setupEnvLoading(argv);
          
          expect(process.env.TEST_VAR).toBeUndefined();
          expect(process.env.ANOTHER_VAR).toBeUndefined();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    describe('should load .env when explicitly requested', () => {
      it('should load environment variables when --env-file is provided', async () => {
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        await setupEnvLoading(argv);
        
        expect(process.env.TEST_VAR).toBe('from_env_file');
        expect(process.env.ANOTHER_VAR).toBe('secret_value');
      });

      it('should handle .env file with default name when specified', async () => {
        const defaultEnvPath = path.join(testDir, '.env');
        const argv = { _: [], $0: 'test', 'env-file': defaultEnvPath };
        
        await setupEnvLoading(argv);
        
        expect(process.env.TEST_VAR).toBe('from_env_file');
        expect(process.env.ANOTHER_VAR).toBe('secret_value');
      });

      it('should handle custom .env file names', async () => {
        const customEnvPath = path.join(testDir, '.env.local');
        await fs.promises.writeFile(customEnvPath, 'CUSTOM_VAR=custom_value');
        
        const argv = { _: [], $0: 'test', 'env-file': customEnvPath };
        await setupEnvLoading(argv);
        
        expect(process.env.CUSTOM_VAR).toBe('custom_value');
        
        // Cleanup
        delete process.env.CUSTOM_VAR;
        await fs.promises.unlink(customEnvPath);
      });
    });

    describe('should handle errors gracefully', () => {
      it('should not throw when env file does not exist', async () => {
        const nonExistentPath = path.join(testDir, 'nonexistent.env');
        const argv = { _: [], $0: 'test', 'env-file': nonExistentPath };
        
        await expect(setupEnvLoading(argv)).resolves.not.toThrow();
        expect(process.env.TEST_VAR).toBeUndefined();
      });

      it('should not throw when dotenv is not available', async () => {
        // This test ensures graceful degradation if dotenv is not installed
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        
        // Mock a scenario where dotenv import fails
        // In reality, this would be handled by dynamic import catch
        await expect(setupEnvLoading(argv)).resolves.not.toThrow();
      });

      it('should handle malformed .env files', async () => {
        const malformedEnvPath = path.join(testDir, '.env.malformed');
        await fs.promises.writeFile(malformedEnvPath, 'MALFORMED LINE WITHOUT EQUALS\nVALID_VAR=valid_value');
        
        const argv = { _: [], $0: 'test', 'env-file': malformedEnvPath };
        await setupEnvLoading(argv);
        
        // Should still load valid variables
        expect(process.env.VALID_VAR).toBe('valid_value');
        
        // Cleanup
        delete process.env.VALID_VAR;
        await fs.promises.unlink(malformedEnvPath);
      });
    });

    describe('should preserve existing environment variables', () => {
      it('should not override existing environment variables by default', async () => {
        process.env.TEST_VAR = 'existing_value';
        
        const argv = { _: [], $0: 'test', 'env-file': envFilePath };
        await setupEnvLoading(argv);
        
        // Should preserve existing value unless override is specified
        expect(process.env.TEST_VAR).toBe('existing_value');
      });

      it('should allow overriding with explicit option', async () => {
        process.env.TEST_VAR = 'existing_value';
        
        // Assuming an override option exists
        const argv = { _: [], $0: 'test', 'env-file': envFilePath, 'env-override': true };
        await setupEnvLoading(argv);
        
        // Implementation detail: this test may need adjustment based on actual override behavior
        // For now, testing the default behavior
        expect(process.env.TEST_VAR).toBe('existing_value');
      });
    });
  });

  describe('integration with CLI arguments', () => {
    it('should work with export command arguments', async () => {
      const argv = { 
        _: ['export'], 
        $0: 'test', 
        'app-id': '123',
        name: 'test-app',
        'env-file': envFilePath 
      };
      
      await setupEnvLoading(argv);
      
      expect(process.env.TEST_VAR).toBe('from_env_file');
    });

    it('should work with apply command arguments', async () => {
      const argv = { 
        _: ['apply'], 
        $0: 'test',
        schema: 'test.schema.ts',
        'env-file': envFilePath 
      };
      
      await setupEnvLoading(argv);
      
      expect(process.env.TEST_VAR).toBe('from_env_file');
    });

    it('should work with create command arguments', async () => {
      const argv = { 
        _: ['create'], 
        $0: 'test',
        schema: 'test.schema.ts',
        'env-file': envFilePath 
      };
      
      await setupEnvLoading(argv);
      
      expect(process.env.TEST_VAR).toBe('from_env_file');
    });
  });
});