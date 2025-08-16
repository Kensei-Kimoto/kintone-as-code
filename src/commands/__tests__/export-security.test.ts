import { describe, it, expect } from 'vitest';
import { validateFileName } from '../export.js';

describe('PAR-97: File name sanitization and path traversal prevention', () => {
  describe('validateFileName', () => {
    describe('should reject dangerous file names', () => {
      it('should reject path traversal attempts', () => {
        expect(() => validateFileName('../../evil')).toThrow('Invalid file name');
        expect(() => validateFileName('../evil')).toThrow('Invalid file name');
        expect(() => validateFileName('subdir/../evil')).toThrow('Invalid file name');
      });

      it('should reject absolute paths', () => {
        expect(() => validateFileName('/etc/passwd')).toThrow('Invalid file name');
        expect(() => validateFileName('/tmp/evil')).toThrow('Invalid file name');
        expect(() => validateFileName('C:\\Windows\\evil')).toThrow('Invalid file name');
      });

      it('should reject file names with path separators', () => {
        expect(() => validateFileName('file/path')).toThrow('Invalid file name');
        expect(() => validateFileName('file\\path')).toThrow('Invalid file name');
        expect(() => validateFileName('dir/file')).toThrow('Invalid file name');
      });

      it('should reject file names with double dots', () => {
        expect(() => validateFileName('file..name')).toThrow('Invalid file name');
        expect(() => validateFileName('..file')).toThrow('Invalid file name');
        expect(() => validateFileName('file..')).toThrow('Invalid file name');
      });

      it('should reject file names with whitespace', () => {
        expect(() => validateFileName('my file')).toThrow('Invalid file name');
        expect(() => validateFileName(' file')).toThrow('Invalid file name');
        expect(() => validateFileName('file ')).toThrow('Invalid file name');
        expect(() => validateFileName('file\tname')).toThrow('Invalid file name');
        expect(() => validateFileName('file\nname')).toThrow('Invalid file name');
      });

      it('should reject file names with special characters', () => {
        expect(() => validateFileName('file!name')).toThrow('Invalid file name');
        expect(() => validateFileName('file@name')).toThrow('Invalid file name');
        expect(() => validateFileName('file#name')).toThrow('Invalid file name');
        expect(() => validateFileName('file$name')).toThrow('Invalid file name');
        expect(() => validateFileName('file%name')).toThrow('Invalid file name');
        expect(() => validateFileName('file^name')).toThrow('Invalid file name');
        expect(() => validateFileName('file&name')).toThrow('Invalid file name');
        expect(() => validateFileName('file*name')).toThrow('Invalid file name');
        expect(() => validateFileName('file(name')).toThrow('Invalid file name');
        expect(() => validateFileName('file)name')).toThrow('Invalid file name');
        expect(() => validateFileName('file+name')).toThrow('Invalid file name');
        expect(() => validateFileName('file=name')).toThrow('Invalid file name');
        expect(() => validateFileName('file[name')).toThrow('Invalid file name');
        expect(() => validateFileName('file]name')).toThrow('Invalid file name');
        expect(() => validateFileName('file{name')).toThrow('Invalid file name');
        expect(() => validateFileName('file}name')).toThrow('Invalid file name');
        expect(() => validateFileName('file|name')).toThrow('Invalid file name');
        expect(() => validateFileName('file;name')).toThrow('Invalid file name');
        expect(() => validateFileName('file:name')).toThrow('Invalid file name');
        expect(() => validateFileName('file\'name')).toThrow('Invalid file name');
        expect(() => validateFileName('file"name')).toThrow('Invalid file name');
        expect(() => validateFileName('file<name')).toThrow('Invalid file name');
        expect(() => validateFileName('file>name')).toThrow('Invalid file name');
        expect(() => validateFileName('file,name')).toThrow('Invalid file name');
        expect(() => validateFileName('file.name')).toThrow('Invalid file name');
        expect(() => validateFileName('file?name')).toThrow('Invalid file name');
      });

      it('should reject file names with non-ASCII characters', () => {
        expect(() => validateFileName('ファイル名')).toThrow('Invalid file name');
        expect(() => validateFileName('файл')).toThrow('Invalid file name');
        expect(() => validateFileName('file名前')).toThrow('Invalid file name');
        expect(() => validateFileName('café')).toThrow('Invalid file name'); // é is non-ASCII
      });

      it('should reject empty or whitespace-only file names', () => {
        expect(() => validateFileName('')).toThrow('Invalid file name');
        expect(() => validateFileName(' ')).toThrow('Invalid file name');
        expect(() => validateFileName('\t')).toThrow('Invalid file name');
        expect(() => validateFileName('\n')).toThrow('Invalid file name');
      });

      it('should reject file names that are too long', () => {
        const longName = 'a'.repeat(129); // 129 characters > 128 limit
        expect(() => validateFileName(longName)).toThrow('Invalid file name');
      });

      it('should reject reserved Windows file names', () => {
        expect(() => validateFileName('CON')).toThrow('Invalid file name');
        expect(() => validateFileName('PRN')).toThrow('Invalid file name');
        expect(() => validateFileName('AUX')).toThrow('Invalid file name');
        expect(() => validateFileName('NUL')).toThrow('Invalid file name');
        expect(() => validateFileName('COM1')).toThrow('Invalid file name');
        expect(() => validateFileName('COM2')).toThrow('Invalid file name');
        expect(() => validateFileName('LPT1')).toThrow('Invalid file name');
        expect(() => validateFileName('LPT2')).toThrow('Invalid file name');
        // Case insensitive
        expect(() => validateFileName('con')).toThrow('Invalid file name');
        expect(() => validateFileName('prn')).toThrow('Invalid file name');
      });
    });

    describe('should accept valid file names', () => {
      it('should accept alphanumeric names', () => {
        expect(() => validateFileName('validname')).not.toThrow();
        expect(() => validateFileName('ValidName')).not.toThrow();
        expect(() => validateFileName('valid123')).not.toThrow();
        expect(() => validateFileName('123valid')).not.toThrow();
        expect(() => validateFileName('VALIDNAME')).not.toThrow();
      });

      it('should accept names with hyphens and underscores', () => {
        expect(() => validateFileName('valid-name')).not.toThrow();
        expect(() => validateFileName('valid_name')).not.toThrow();
        expect(() => validateFileName('valid-name_123')).not.toThrow();
        expect(() => validateFileName('_validname')).not.toThrow();
        expect(() => validateFileName('validname_')).not.toThrow();
        expect(() => validateFileName('-validname')).not.toThrow();
        expect(() => validateFileName('validname-')).not.toThrow();
      });

      it('should accept names at the length limit', () => {
        const maxLengthName = 'a'.repeat(128); // Exactly 128 characters
        expect(() => validateFileName(maxLengthName)).not.toThrow();
      });

      it('should accept single character names', () => {
        expect(() => validateFileName('a')).not.toThrow();
        expect(() => validateFileName('1')).not.toThrow();
        expect(() => validateFileName('_')).not.toThrow();
        expect(() => validateFileName('-')).not.toThrow();
      });
    });

    describe('should return sanitized file name', () => {
      it('should return the same name for valid inputs', () => {
        expect(validateFileName('validname')).toBe('validname');
        expect(validateFileName('valid-name_123')).toBe('valid-name_123');
      });

      it('should trim whitespace if trimming makes it valid', () => {
        // Note: This test may fail initially since trimming whitespace
        // still leaves an invalid name, but including for completeness
        // The implementation should decide whether to trim and validate
        // or reject whitespace outright
      });
    });
  });
});