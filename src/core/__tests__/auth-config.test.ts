import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthConfigSchema, parseAuthConfig } from '../config.js';
import { getKintoneClient } from '../kintone-client.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { Schema as S } from 'effect';

describe('PAR-100: API Token Authentication Support', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    delete process.env.KINTONE_BASE_URL;
    delete process.env.KINTONE_USERNAME;
    delete process.env.KINTONE_PASSWORD;
    delete process.env.KINTONE_API_TOKEN;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('AuthConfigSchema validation', () => {
    describe('should accept password authentication', () => {
      it('should validate password auth with all required fields', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: 'testpass'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).not.toThrow();
      });

      it('should reject password auth with missing username', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          password: 'testpass'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should reject password auth with missing password', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should reject password auth with empty username', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: '',
          password: 'testpass'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should reject password auth with empty password', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: ''
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });
    });

    describe('should accept API token authentication', () => {
      it('should validate API token auth with all required fields', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).not.toThrow();
      });

      it('should reject API token auth with empty token', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          apiToken: ''
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should accept API token with various formats', () => {
        const validTokens = [
          'abcdef123456789',
          'ABC123XYZ789',
          'token_with_underscores',
          'token-with-hyphens',
          'a'.repeat(32), // 32 characters
          'a'.repeat(64), // 64 characters
        ];

        for (const token of validTokens) {
          const config = {
            baseUrl: 'https://test.cybozu.com',
            apiToken: token
          };

          expect(() => S.decodeUnknownSync(AuthConfigSchema)(config), `Token: ${token}`).not.toThrow();
        }
      });
    });

    describe('should handle mixed authentication methods', () => {
      it('should accept config with both username/password and apiToken (password auth takes precedence)', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: 'testpass',
          apiToken: 'abc123xyz789'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).not.toThrow();
        const result = S.decodeUnknownSync(AuthConfigSchema)(config);
        expect(result).toEqual({
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: 'testpass'
        });
      });

      it('should accept config with username but no password when apiToken present (apiToken auth takes precedence)', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          apiToken: 'abc123xyz789'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).not.toThrow();
        const result = S.decodeUnknownSync(AuthConfigSchema)(config);
        expect(result).toEqual({
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        });
      });

      it('should accept config with password but no username when apiToken present (apiToken auth takes precedence)', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          password: 'testpass',
          apiToken: 'abc123xyz789'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).not.toThrow();
        const result = S.decodeUnknownSync(AuthConfigSchema)(config);
        expect(result).toEqual({
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        });
      });
    });

    describe('should require baseUrl for all auth methods', () => {
      it('should reject password auth without baseUrl', () => {
        const config = {
          username: 'testuser',
          password: 'testpass'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should reject API token auth without baseUrl', () => {
        const config = {
          apiToken: 'abc123xyz789'
        };

        expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
      });

      it('should reject config with empty baseUrl', () => {
        const configs = [
          {
            baseUrl: '',
            username: 'testuser',
            password: 'testpass'
          },
          {
            baseUrl: '',
            apiToken: 'abc123xyz789'
          }
        ];

        for (const config of configs) {
          expect(() => S.decodeUnknownSync(AuthConfigSchema)(config)).toThrow();
        }
      });
    });

    describe('should validate baseUrl format', () => {
      it('should accept valid HTTPS URLs', () => {
        const validUrls = [
          'https://test.cybozu.com',
          'https://subdomain.cybozu.com',
          'https://company.cybozu-dev.com',
          'https://test.kintone.com',
          'https://custom-domain.com'
        ];

        for (const baseUrl of validUrls) {
          const config = {
            baseUrl,
            apiToken: 'abc123xyz789'
          };

          expect(() => S.decodeUnknownSync(AuthConfigSchema)(config), `URL: ${baseUrl}`).not.toThrow();
        }
      });

      it('should reject non-HTTPS URLs', () => {
        const invalidUrls = [
          'http://test.cybozu.com',
          'ftp://test.cybozu.com',
          'test.cybozu.com',
          'mailto:test@cybozu.com'
        ];

        for (const baseUrl of invalidUrls) {
          const config = {
            baseUrl,
            apiToken: 'abc123xyz789'
          };

          expect(() => S.decodeUnknownSync(AuthConfigSchema)(config), `URL: ${baseUrl}`).toThrow();
        }
      });
    });
  });

  describe('parseAuthConfig from environment variables', () => {
    describe('should parse password authentication from env vars', () => {
      it('should parse complete password auth config', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_USERNAME = 'testuser';
        process.env.KINTONE_PASSWORD = 'testpass';

        const config = parseAuthConfig();

        expect(config).toEqual({
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: 'testpass'
        });
      });

      it('should handle password auth with special characters', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_USERNAME = 'user@company.com';
        process.env.KINTONE_PASSWORD = 'p@ssw0rd!#$%';

        const config = parseAuthConfig();

        expect(config.username).toBe('user@company.com');
        expect(config.password).toBe('p@ssw0rd!#$%');
      });
    });

    describe('should parse API token authentication from env vars', () => {
      it('should parse complete API token auth config', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_API_TOKEN = 'abc123xyz789';

        const config = parseAuthConfig();

        expect(config).toEqual({
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        });
      });

      it('should prioritize API token over username/password when both present', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_USERNAME = 'testuser';
        process.env.KINTONE_PASSWORD = 'testpass';
        process.env.KINTONE_API_TOKEN = 'abc123xyz789';

        const config = parseAuthConfig();

        expect(config).toEqual({
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        });
        expect(config).not.toHaveProperty('username');
        expect(config).not.toHaveProperty('password');
      });
    });

    describe('should handle missing environment variables', () => {
      it('should throw when no auth method is provided', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';

        expect(() => parseAuthConfig()).toThrow();
      });

      it('should throw when baseUrl is missing', () => {
        process.env.KINTONE_USERNAME = 'testuser';
        process.env.KINTONE_PASSWORD = 'testpass';

        expect(() => parseAuthConfig()).toThrow();
      });

      it('should throw when username provided without password', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_USERNAME = 'testuser';

        expect(() => parseAuthConfig()).toThrow();
      });

      it('should throw when password provided without username', () => {
        process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
        process.env.KINTONE_PASSWORD = 'testpass';

        expect(() => parseAuthConfig()).toThrow();
      });
    });
  });

  describe('getKintoneClient integration', () => {
    describe('should create client with password authentication', () => {
      it('should create client with valid password config', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          username: 'testuser',
          password: 'testpass'
        };

        const client = getKintoneClient(config);

        expect(client).toBeInstanceOf(KintoneRestAPIClient);
        // Note: We can't easily test internal client configuration without mocking,
        // but we can verify the client was created successfully
      });
    });

    describe('should create client with API token authentication', () => {
      it('should create client with valid API token config', () => {
        const config = {
          baseUrl: 'https://test.cybozu.com',
          apiToken: 'abc123xyz789'
        };

        const client = getKintoneClient(config);

        expect(client).toBeInstanceOf(KintoneRestAPIClient);
      });
    });

    describe('should handle invalid configurations', () => {
      it('should throw with invalid auth config structure', () => {
        const invalidConfigs = [
          null,
          undefined,
          {},
          { baseUrl: 'https://test.cybozu.com' }, // No auth method
          { username: 'user', password: 'pass' }, // No baseUrl
        ];

        for (const config of invalidConfigs) {
          expect(() => getKintoneClient(config as any), `Config: ${JSON.stringify(config)}`).toThrow();
        }
      });
    });
  });

  describe('backwards compatibility', () => {
    it('should maintain compatibility with existing password-only configurations', () => {
      // Existing config files should continue to work
      const legacyConfig = {
        baseUrl: 'https://test.cybozu.com',
        username: 'testuser',
        password: 'testpass'
      };

      expect(() => S.decodeUnknownSync(AuthConfigSchema)(legacyConfig)).not.toThrow();
      expect(() => getKintoneClient(legacyConfig)).not.toThrow();
    });

    it('should work with existing environment variable setups', () => {
      process.env.KINTONE_BASE_URL = 'https://test.cybozu.com';
      process.env.KINTONE_USERNAME = 'testuser';
      process.env.KINTONE_PASSWORD = 'testpass';

      expect(() => parseAuthConfig()).not.toThrow();
      
      const config = parseAuthConfig();
      expect(() => getKintoneClient(config)).not.toThrow();
    });
  });
});