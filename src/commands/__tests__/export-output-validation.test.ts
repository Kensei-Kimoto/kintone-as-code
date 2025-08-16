import { describe, it, expect } from 'vitest';
import { validateOutputDirectory } from '../export.js';
import path from 'path';

describe('PAR-98: Output directory validation and project root restriction', () => {
  describe('validateOutputDirectory', () => {
    const projectRoot = process.cwd();

    describe('should reject dangerous output paths', () => {
      it('should reject absolute paths', () => {
        expect(() => validateOutputDirectory('/etc/passwd')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('/tmp/evil')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('/usr/local/bin')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('C:\\Windows\\System32')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('C:\\temp')).toThrow('Invalid output directory');
      });

      it('should reject parent directory traversal', () => {
        expect(() => validateOutputDirectory('../')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('../../')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('../../../evil')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('apps/../../../evil')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('valid/../../../evil')).toThrow('Invalid output directory');
      });

      it('should reject paths that escape project root', () => {
        expect(() => validateOutputDirectory('apps/../../..')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('./../../..')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('subfolder/../..')).toThrow('Invalid output directory');
      });

      it('should reject paths with multiple consecutive dots', () => {
        expect(() => validateOutputDirectory('apps/..../evil')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('...../evil')).toThrow('Invalid output directory');
      });

      it('should reject UNC paths on Windows', () => {
        expect(() => validateOutputDirectory('\\\\server\\share')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('//server/share')).toThrow('Invalid output directory');
      });

      it('should reject paths with null bytes', () => {
        expect(() => validateOutputDirectory('apps\x00')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('apps/sub\x00dir')).toThrow('Invalid output directory');
      });

      it('should reject empty paths', () => {
        expect(() => validateOutputDirectory('')).toThrow('Invalid output directory');
        expect(() => validateOutputDirectory('   ')).toThrow('Invalid output directory');
      });

      it('should reject paths that would create files outside project', () => {
        // These paths might resolve to locations outside the project root
        const parentDir = path.dirname(projectRoot);
        const grandParentDir = path.dirname(parentDir);
        
        // Construct relative paths that would escape
        const escapeAttempt1 = path.relative(projectRoot, parentDir);
        const escapeAttempt2 = path.relative(projectRoot, grandParentDir);
        
        if (escapeAttempt1.includes('..')) {
          expect(() => validateOutputDirectory(escapeAttempt1)).toThrow('Invalid output directory');
        }
        if (escapeAttempt2.includes('..')) {
          expect(() => validateOutputDirectory(escapeAttempt2)).toThrow('Invalid output directory');
        }
      });
    });

    describe('should accept valid output paths', () => {
      it('should accept relative paths within project', () => {
        expect(() => validateOutputDirectory('apps')).not.toThrow();
        expect(() => validateOutputDirectory('output')).not.toThrow();
        expect(() => validateOutputDirectory('generated/schemas')).not.toThrow();
        expect(() => validateOutputDirectory('src/generated')).not.toThrow();
      });

      it('should accept current directory', () => {
        expect(() => validateOutputDirectory('.')).not.toThrow();
        expect(() => validateOutputDirectory('./')).not.toThrow();
      });

      it('should accept subdirectories', () => {
        expect(() => validateOutputDirectory('apps/schemas')).not.toThrow();
        expect(() => validateOutputDirectory('output/generated/v1')).not.toThrow();
        expect(() => validateOutputDirectory('deeply/nested/folder/structure')).not.toThrow();
      });

      it('should accept paths with safe navigation', () => {
        expect(() => validateOutputDirectory('apps/subfolder')).not.toThrow();
        expect(() => validateOutputDirectory('./apps')).not.toThrow();
        expect(() => validateOutputDirectory('./apps/schemas')).not.toThrow();
      });

      it('should accept paths with hyphens and underscores', () => {
        expect(() => validateOutputDirectory('my-app')).not.toThrow();
        expect(() => validateOutputDirectory('my_app')).not.toThrow();
        expect(() => validateOutputDirectory('apps/my-schema_v1')).not.toThrow();
      });

      it('should normalize and accept equivalent paths', () => {
        expect(() => validateOutputDirectory('apps/./schemas')).not.toThrow();
        expect(() => validateOutputDirectory('apps/subfolder/../schemas')).not.toThrow();
      });
    });

    describe('should return normalized paths', () => {
      it('should return normalized paths for valid inputs', () => {
        expect(validateOutputDirectory('apps')).toBe(path.resolve(projectRoot, 'apps'));
        expect(validateOutputDirectory('output/schemas')).toBe(path.resolve(projectRoot, 'output/schemas'));
        expect(validateOutputDirectory('./apps')).toBe(path.resolve(projectRoot, 'apps'));
        expect(validateOutputDirectory('.')).toBe(projectRoot);
      });

      it('should handle path normalization correctly', () => {
        expect(validateOutputDirectory('apps/./schemas')).toBe(path.resolve(projectRoot, 'apps/schemas'));
        expect(validateOutputDirectory('apps/subfolder/../schemas')).toBe(path.resolve(projectRoot, 'apps/schemas'));
      });
    });

    describe('should handle edge cases', () => {
      it('should handle paths with trailing separators', () => {
        expect(() => validateOutputDirectory('apps/')).not.toThrow();
        expect(() => validateOutputDirectory('apps\\')).not.toThrow();
        expect(validateOutputDirectory('apps/')).toBe(path.resolve(projectRoot, 'apps'));
      });

      it('should handle mixed path separators', () => {
        // On Windows, both forward and backward slashes are valid
        expect(() => validateOutputDirectory('apps\\schemas')).not.toThrow();
        expect(() => validateOutputDirectory('apps/schemas\\subfolder')).not.toThrow();
      });
    });
  });
});