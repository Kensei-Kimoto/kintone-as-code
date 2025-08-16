import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleKintoneApiError, isAuthenticationError, isAuthorizationError, formatAuthErrorMessage } from '../error-utils.js';

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
      expect(formatted).toContain('username/password');
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

      const errorCall = (console.error as any).mock.calls[0][0];
      expect(errorCall).toContain('Status: 401');
      expect(errorCall).toContain('Code: CB_UA01');
      expect(errorCall).toContain('Authentication failed');
    });

    it('should mask sensitive information in logs', () => {
      const error = {
        response: { status: 401 },
        message: 'Invalid API token: abc123secret',
        config: { 
          headers: { 
            'X-Cybozu-API-Token': 'secret-token',
            'Authorization': 'Bearer secret-bearer'
          }
        }
      };

      handleKintoneApiError(error);

      const errorCall = (console.error as any).mock.calls[0][0];
      expect(errorCall).not.toContain('secret-token');
      expect(errorCall).not.toContain('secret-bearer');
      expect(errorCall).not.toContain('abc123secret');
      expect(errorCall).toContain('[REDACTED]');
    });
  });
});