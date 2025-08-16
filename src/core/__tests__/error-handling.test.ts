import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleKintoneApiError, isAuthenticationError, isAuthorizationError, formatAuthErrorMessage, maskSensitiveInfo } from '../error-utils.js';

describe('PAR-101: Authentication and Authorization Error Handling', () => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    // Mock console.error and process.exit
    console.error = vi.fn();
    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    // Restore original functions
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    vi.clearAllMocks();
  });

  describe('isAuthenticationError', () => {
    it('should identify 401 status as authentication error', () => {
      const error401 = {
        response: { status: 401 },
        message: 'Unauthorized'
      };

      expect(isAuthenticationError(error401)).toBe(true);
    });

    it('should identify authentication-related error codes', () => {
      const authErrors = [
        { code: 'CB_UA01', message: 'Authentication failed' },
        { code: 'CB_WA01', message: 'Invalid user credentials' },
        { code: 'CB_AU01', message: 'API token invalid' },
      ];

      for (const error of authErrors) {
        expect(isAuthenticationError(error), `Error code: ${error.code}`).toBe(true);
      }
    });

    it('should identify authentication-related error messages', () => {
      const authMessages = [
        { message: 'Authentication failed' },
        { message: 'Invalid username or password' },
        { message: 'API token is invalid' },
        { message: 'Login required' },
        { message: 'Unauthorized access' },
      ];

      for (const error of authMessages) {
        expect(isAuthenticationError(error), `Message: ${error.message}`).toBe(true);
      }
    });

    it('should not identify non-authentication errors', () => {
      const nonAuthErrors = [
        { response: { status: 200 }, message: 'Success' },
        { response: { status: 404 }, message: 'Not found' },
        { response: { status: 500 }, message: 'Internal server error' },
        { code: 'CB_VA01', message: 'Validation error' },
        { message: 'Network timeout' },
        { message: 'Invalid request format' },
      ];

      for (const error of nonAuthErrors) {
        expect(isAuthenticationError(error)).toBe(false);
      }
    });

    it('should handle edge cases', () => {
      expect(isAuthenticationError(null)).toBe(false);
      expect(isAuthenticationError(undefined)).toBe(false);
      expect(isAuthenticationError({})).toBe(false);
      expect(isAuthenticationError('')).toBe(false);
      expect(isAuthenticationError('not an object')).toBe(false);
    });
  });

  describe('isAuthorizationError', () => {
    it('should identify 403 status as authorization error', () => {
      const error403 = {
        response: { status: 403 },
        message: 'Forbidden'
      };

      expect(isAuthorizationError(error403)).toBe(true);
    });

    it('should identify authorization-related error codes', () => {
      const authzErrors = [
        { code: 'CB_NO02', message: 'Permission denied' },
        { code: 'CB_VA02', message: 'Access forbidden' },
        { code: 'GAIA_AC01', message: 'Access control violation' },
      ];

      for (const error of authzErrors) {
        expect(isAuthorizationError(error), `Error code: ${error.code}`).toBe(true);
      }
    });

    it('should identify authorization-related error messages', () => {
      const authzMessages = [
        { message: 'Permission denied' },
        { message: 'Access forbidden' },
        { message: 'Insufficient privileges' },
        { message: 'You do not have permission' },
        { message: 'Operation not allowed' },
        { message: 'Forbidden access' },
      ];

      for (const error of authzMessages) {
        expect(isAuthorizationError(error), `Message: ${error.message}`).toBe(true);
      }
    });

    it('should not identify non-authorization errors', () => {
      const nonAuthzErrors = [
        { response: { status: 200 }, message: 'Success' },
        { response: { status: 401 }, message: 'Unauthorized' },
        { response: { status: 404 }, message: 'Not found' },
        { response: { status: 500 }, message: 'Internal server error' },
        { code: 'CB_VA01', message: 'Validation error' },
        { message: 'Network timeout' },
        { message: 'Invalid request format' },
      ];

      for (const error of nonAuthzErrors) {
        expect(isAuthorizationError(error)).toBe(false);
      }
    });

    it('should handle edge cases', () => {
      expect(isAuthorizationError(null)).toBe(false);
      expect(isAuthorizationError(undefined)).toBe(false);
      expect(isAuthorizationError({})).toBe(false);
      expect(isAuthorizationError('')).toBe(false);
      expect(isAuthorizationError('not an object')).toBe(false);
    });
  });

  describe('formatAuthErrorMessage', () => {
    it('should format authentication error messages', () => {
      const authError = {
        response: { status: 401 },
        message: 'Invalid credentials'
      };

      const formatted = formatAuthErrorMessage(authError);
      
      expect(formatted).toContain('Authentication failed');
      expect(formatted).toContain('401');
      expect(formatted).toContain('credentials');
      expect(formatted).toContain('Username and password');
      expect(formatted).toContain('API token');
    });

    it('should format authorization error messages', () => {
      const authzError = {
        response: { status: 403 },
        message: 'Permission denied'
      };

      const formatted = formatAuthErrorMessage(authzError);
      
      expect(formatted).toContain('Authorization failed');
      expect(formatted).toContain('403');
      expect(formatted).toContain('Permission denied');
      expect(formatted).toContain('administrator');
      expect(formatted).toContain('permissions');
    });

    it('should handle authentication errors without status code', () => {
      const authError = {
        code: 'CB_UA01',
        message: 'Authentication failed'
      };

      const formatted = formatAuthErrorMessage(authError);
      
      expect(formatted).toContain('Authentication failed');
      expect(formatted).toContain('CB_UA01');
    });

    it('should handle authorization errors without status code', () => {
      const authzError = {
        code: 'CB_NO02',
        message: 'Access denied'
      };

      const formatted = formatAuthErrorMessage(authzError);
      
      expect(formatted).toContain('Authorization failed');
      expect(formatted).toContain('CB_NO02');
      expect(formatted).toContain('Access denied');
    });

    it('should provide fallback for unknown auth errors', () => {
      const unknownError = {
        message: 'Some auth-related error'
      };

      const formatted = formatAuthErrorMessage(unknownError);
      
      expect(formatted).toContain('Authentication or authorization failed');
      expect(formatted).toContain('Some auth-related error');
    });
  });

  describe('handleKintoneApiError', () => {
    it('should handle authentication errors without retry', () => {
      const authError = {
        response: { status: 401 },
        message: 'Invalid credentials'
      };

      const shouldRetry = handleKintoneApiError(authError);

      expect(shouldRetry).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle authorization errors without retry', () => {
      const authzError = {
        response: { status: 403 },
        message: 'Permission denied'
      };

      const shouldRetry = handleKintoneApiError(authzError);

      expect(shouldRetry).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Authorization failed')
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle network errors with retry option', () => {
      const networkError = {
        code: 'ECONNRESET',
        message: 'Connection reset'
      };

      const shouldRetry = handleKintoneApiError(networkError);

      expect(shouldRetry).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should handle timeout errors with retry option', () => {
      const timeoutError = {
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      };

      const shouldRetry = handleKintoneApiError(timeoutError);

      expect(shouldRetry).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('timeout')
      );
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should handle 429 (rate limit) errors with retry option', () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Too many requests'
      };

      const shouldRetry = handleKintoneApiError(rateLimitError);

      expect(shouldRetry).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Rate limited')
      );
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should handle 5xx server errors with retry option', () => {
      const serverErrors = [
        { response: { status: 500 }, message: 'Internal server error' },
        { response: { status: 502 }, message: 'Bad gateway' },
        { response: { status: 503 }, message: 'Service unavailable' },
        { response: { status: 504 }, message: 'Gateway timeout' },
      ];

      for (const error of serverErrors) {
        const shouldRetry = handleKintoneApiError(error);
        expect(shouldRetry, `Status: ${error.response.status}`).toBe(true);
        expect(process.exit).not.toHaveBeenCalled();
      }
    });

    it('should handle 4xx client errors (except 401/403/429) without retry', () => {
      const clientErrors = [
        { response: { status: 400 }, message: 'Bad request' },
        { response: { status: 404 }, message: 'Not found' },
        { response: { status: 409 }, message: 'Conflict' },
        { response: { status: 422 }, message: 'Unprocessable entity' },
      ];

      for (const error of clientErrors) {
        vi.clearAllMocks();
        const shouldRetry = handleKintoneApiError(error);
        expect(shouldRetry, `Status: ${error.response.status}`).toBe(false);
        expect(process.exit).toHaveBeenCalledWith(1);
      }
    });

    it('should provide context about retry behavior', () => {
      const networkError = {
        code: 'ECONNRESET',
        message: 'Connection reset'
      };

      handleKintoneApiError(networkError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('retrying')
      );
    });

    it('should provide context about no-retry behavior for auth errors', () => {
      const authError = {
        response: { status: 401 },
        message: 'Invalid credentials'
      };

      handleKintoneApiError(authError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('not retrying')
      );
    });

    it('should handle edge cases', () => {
      const edgeCases = [null, undefined, {}, '', 'string error'];

      for (const error of edgeCases) {
        vi.clearAllMocks();
        const shouldRetry = handleKintoneApiError(error);
        expect(shouldRetry).toBe(false);
        expect(process.exit).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('error logging format', () => {
    it('should log structured error information', () => {
      const error = {
        response: { status: 401 },
        code: 'CB_UA01',
        message: 'Authentication failed',
        config: { url: 'https://test.cybozu.com/k/v1/records.json' }
      };

      handleKintoneApiError(error);

      // The structured error info should be in one of the console.error calls
      const errorCalls = (console.error as any).mock.calls.map((call: any) => call[0]).join('\n');
      expect(errorCalls).toContain('Status: 401');
      expect(errorCalls).toContain('Code: CB_UA01');
    });

    it('should mask sensitive information in logs', () => {
      const error = {
        response: { status: 401 },
        message: 'Invalid API token: abc123def456ghi789jkl012mno345pqr678stu',
        config: { 
          headers: { 
            'X-Cybozu-API-Token': 'very-long-secret-token-12345678901234567890',
            'Authorization': 'Bearer very-long-secret-bearer-token-12345678901234567890'
          }
        }
      };

      handleKintoneApiError(error);

      // Check all console.error calls for sensitive information
      const allErrorOutput = (console.error as any).mock.calls.map((call: any) => call[0]).join('\n');
      expect(allErrorOutput).not.toContain('very-long-secret-token-12345678901234567890');
      expect(allErrorOutput).not.toContain('very-long-secret-bearer-token-12345678901234567890');
      expect(allErrorOutput).not.toContain('abc123def456ghi789jkl012mno345pqr678stu');
      expect(allErrorOutput).toContain('[REDACTED]');
    });
  });

  describe('maskSensitiveInfo function', () => {

    describe('should mask various token patterns', () => {
      it('should mask API tokens with context', () => {
        const examples = [
          'API token: abc123def456ghi789jkl012mno345',
          'api_token: xyz789uvw456rst123opq890lmn567',
          'API-TOKEN: token123456789012345678901234567890',
          'api key: key123456789012345678901234567890',
          'API_KEY: anotherkey123456789012345678901234',
          'access token: access123456789012345678901234567890',
          'secret key: secret123456789012345678901234567890'
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
          expect(masked).not.toMatch(/[a-zA-Z0-9]{20,}/);
        }
      });

      it('should mask Bearer tokens', () => {
        const examples = [
          'Bearer abc123def456ghi789',
          'Authorization: Bearer xyz789uvw456rst123opq890',
          'bearer token123456789012345'
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
          expect(masked).not.toMatch(/Bearer\s+[a-zA-Z0-9]+/);
        }
      });

      it('should mask JWT-like tokens', () => {
        const examples = [
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'realJWT.header.actualPayload.validSignature'
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
        }
      });

      it('should mask Base64-like strings', () => {
        const examples = [
          'VGhpc0lzQVZlcnlMb25nQmFzZTY0U3RyaW5nVGhhdExvb2tzTGlrZUFUb2tlbg==',
          'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw',
          'ThisIsAVeryLongBase64StringThatLooksLikeAToken1234567890+/='
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
        }
      });

      it('should mask UUID-like patterns', () => {
        const examples = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          'F47AC10B-58CC-4372-A567-0E02B2C3D479'
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
        }
      });

      it('should mask password patterns', () => {
        const examples = [
          'password: secretpassword',
          'password=mypassword123',
          'password secretpass'
        ];

        for (const example of examples) {
          const masked = maskSensitiveInfo(example);
          expect(masked).toContain('[REDACTED]');
          expect(masked).toContain('password');
          expect(masked).not.toContain('secretpassword');
          expect(masked).not.toContain('mypassword123');
          expect(masked).not.toContain('secretpass');
        }
      });
    });

    describe('should NOT mask safe strings', () => {
      it('should preserve normal words and phrases', () => {
        const safeStrings = [
          'credentials',
          'authentication',
          'Permission denied',
          'Invalid request',
          'Error processing',
          'database connection',
          'user authentication failed',
          'This is a normal sentence with words',
          'file123.txt',
          'version1.2.3',
          'app-name-v2',
          'short-string'
        ];

        for (const safeString of safeStrings) {
          const masked = maskSensitiveInfo(safeString);
          expect(masked).toBe(safeString);
        }
      });

      it('should preserve URLs and paths', () => {
        const safeStrings = [
          'https://example.com/path',
          '/path/to/file.txt',
          'C:\\Users\\username\\file.txt',
          'application-name',
          'database-connection-string'
        ];

        for (const safeString of safeStrings) {
          const masked = maskSensitiveInfo(safeString);
          expect(masked).toBe(safeString);
        }
      });

      it('should preserve version numbers and identifiers', () => {
        const safeStrings = [
          'v1.2.3',
          'build-123',
          'release-2023.1',
          'commit-abc123d',
          'issue-456'
        ];

        for (const safeString of safeStrings) {
          const masked = maskSensitiveInfo(safeString);
          expect(masked).toBe(safeString);
        }
      });
    });

    describe('should handle edge cases', () => {
      it('should handle empty and null inputs', () => {
        expect(maskSensitiveInfo('')).toBe('');
        expect(maskSensitiveInfo(null as any)).toBe(null);
        expect(maskSensitiveInfo(undefined as any)).toBe(undefined);
      });

      it('should handle mixed content', () => {
        const mixed = 'Error: API token abc123def456ghi789jkl012mno345 is invalid for user credentials';
        const masked = maskSensitiveInfo(mixed);
        
        expect(masked).toContain('[REDACTED]');
        expect(masked).toContain('credentials');
        expect(masked).not.toContain('abc123def456ghi789jkl012mno345');
      });
    });
  });
});