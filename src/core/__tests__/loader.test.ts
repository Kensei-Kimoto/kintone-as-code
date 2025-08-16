import { describe, it, expect } from 'vitest';
import { loadSchema } from '../loader.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('loadSchema', () => {
  describe('error handling', () => {
    it('should preserve original error stack trace when wrapping errors', async () => {
      // RED: This test should fail initially because Error.cause is not used
      const nonExistentPath = '/path/that/does/not/exist.ts';
      
      try {
        await loadSchema(nonExistentPath);
        expect.fail('Expected loadSchema to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(`Failed to load schema from ${nonExistentPath}`);
        
        // Check that the original error is preserved via cause
        expect(error.cause).toBeDefined();
        expect(error.cause).toBeInstanceOf(Error);
      }
    });

    it('should handle esbuild errors with proper error chaining', async () => {
      // Create a temporary TS file with syntax error
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'loader-test-'));
      const invalidTsFile = path.join(tempDir, 'invalid.ts');
      
      try {
        await fs.writeFile(invalidTsFile, 'invalid typescript syntax {{{');
        
        await expect(loadSchema(invalidTsFile)).rejects.toThrow();
        
        try {
          await loadSchema(invalidTsFile);
        } catch (error) {
          expect(error.cause).toBeDefined();
          expect(error.cause).toBeInstanceOf(Error);
        }
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});