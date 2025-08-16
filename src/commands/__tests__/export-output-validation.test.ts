import { describe, it, expect } from 'vitest';
import path from 'path';
import { validateOutputDirectory } from '../export.js';

describe('PAR-98: Output directory validation and project root restriction', () => {
  describe('validateOutputDirectory', () => {
    const projectRoot = process.cwd();

    describe('should reject dangerous output paths', () => {
      it('should reject absolute paths', async () => {
        await expect(() => validateOutputDirectory('/etc/passwd')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('/tmp/evil')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('/usr/local/bin')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('C:\\Windows\\System32')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('C:\\temp')).rejects.toThrow('Invalid output directory');
      });

      it('should reject parent directory traversal', async () => {
        await expect(() => validateOutputDirectory('../')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('../../')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('../../../evil')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('apps/../../../evil')).rejects.toThrow('Invalid output directory');
      });

      it('should reject paths that escape project root', async () => {
        await expect(() => validateOutputDirectory('apps/../../..')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('./../../..')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('subfolder/../..')).rejects.toThrow('Invalid output directory');
      });

      it('should reject paths with multiple consecutive dots', async () => {
        await expect(() => validateOutputDirectory('apps/..../evil')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('...../evil')).rejects.toThrow('Invalid output directory');
      });

      it('should reject UNC paths on Windows', async () => {
        await expect(() => validateOutputDirectory('\\\\server\\share')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('//server/share')).rejects.toThrow('Invalid output directory');
      });

      it('should reject paths with null bytes', async () => {
        await expect(() => validateOutputDirectory('apps\x00')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('apps/sub\x00dir')).rejects.toThrow('Invalid output directory');
      });

      it('should reject empty paths', async () => {
        await expect(() => validateOutputDirectory('')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('   ')).rejects.toThrow('Invalid output directory');
      });

      it('should reject paths that would create files outside project', async () => {
        await expect(() => validateOutputDirectory('apps/../../etc')).rejects.toThrow('Invalid output directory');
        await expect(() => validateOutputDirectory('./../../tmp')).rejects.toThrow('Invalid output directory');
      });
    });

    describe('should accept valid output paths', () => {
      it('should accept relative paths within project', async () => {
        await expect(validateOutputDirectory('apps')).resolves.toBe(path.resolve(projectRoot, 'apps'));
        await expect(validateOutputDirectory('output')).resolves.toBe(path.resolve(projectRoot, 'output'));
        await expect(validateOutputDirectory('schemas')).resolves.toBe(path.resolve(projectRoot, 'schemas'));
      });

      it('should accept nested relative paths', async () => {
        await expect(validateOutputDirectory('apps/generated')).resolves.toBe(path.resolve(projectRoot, 'apps/generated'));
        await expect(validateOutputDirectory('output/schemas')).resolves.toBe(path.resolve(projectRoot, 'output/schemas'));
      });

      it('should accept current directory', async () => {
        await expect(validateOutputDirectory('.')).resolves.toBe(projectRoot);
        await expect(validateOutputDirectory('./')).resolves.toBe(projectRoot);
      });

      it('should accept paths with safe naming patterns', async () => {
        await expect(validateOutputDirectory('my-app')).resolves.not.toThrow();
        await expect(validateOutputDirectory('my_app')).resolves.not.toThrow();
        await expect(validateOutputDirectory('apps/my-schema_v1')).resolves.not.toThrow();
      });

      it('should accept paths with dot segments but reject parent directory segments', async () => {
        await expect(validateOutputDirectory('apps/./schemas')).resolves.not.toThrow();
        // Parent directory segments are now strictly forbidden
        await expect(() => validateOutputDirectory('apps/subfolder/../schemas')).rejects.toThrow('Parent directory segments (..) are not allowed');
      });
    });

    describe('should return normalized paths', () => {
      it('should return normalized paths for valid inputs', async () => {
        await expect(validateOutputDirectory('apps')).resolves.toBe(path.resolve(projectRoot, 'apps'));
        await expect(validateOutputDirectory('output/schemas')).resolves.toBe(path.resolve(projectRoot, 'output/schemas'));
        await expect(validateOutputDirectory('./apps')).resolves.toBe(path.resolve(projectRoot, 'apps'));
        await expect(validateOutputDirectory('.')).resolves.toBe(projectRoot);
      });

      it('should handle dot segment normalization correctly', async () => {
        await expect(validateOutputDirectory('apps/./schemas')).resolves.toBe(path.resolve(projectRoot, 'apps/schemas'));
        // Parent directory segments are now rejected before normalization
        await expect(() => validateOutputDirectory('apps/subfolder/../schemas')).rejects.toThrow('Parent directory segments (..) are not allowed');
      });
    });

    describe('should handle edge cases', () => {
      it('should handle paths with trailing separators', async () => {
        await expect(validateOutputDirectory('apps/')).resolves.toBe(path.resolve(projectRoot, 'apps'));
        await expect(validateOutputDirectory('output/schemas/')).resolves.toBe(path.resolve(projectRoot, 'output/schemas'));
      });

      it('should handle mixed separators', async () => {
        // Note: On Unix-like systems, backslashes are treated as regular characters
        await expect(validateOutputDirectory('apps\\schemas')).resolves.toBe(path.resolve(projectRoot, 'apps\\schemas'));
        await expect(validateOutputDirectory('apps/subdir')).resolves.toBe(path.resolve(projectRoot, 'apps/subdir'));
      });

      it('should preserve case sensitivity', async () => {
        await expect(validateOutputDirectory('Apps')).resolves.toBe(path.resolve(projectRoot, 'Apps'));
        await expect(validateOutputDirectory('SCHEMAS')).resolves.toBe(path.resolve(projectRoot, 'SCHEMAS'));
      });
    });
  });
});