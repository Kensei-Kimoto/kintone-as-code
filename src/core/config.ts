import path from 'path';
import dotenv from 'dotenv';
import { Schema as S } from 'effect';
import type { Config as AppConfig } from '../types.js';

dotenv.config();

// Runtime validation schema for configuration
const PasswordAuthSchema = S.Struct({
  baseUrl: S.String.pipe(S.startsWith('https://')),
  username: S.String.pipe(S.minLength(1)),
  password: S.String.pipe(S.minLength(1)),
});

const ApiTokenAuthSchema = S.Struct({
  baseUrl: S.String.pipe(S.startsWith('https://')),
  apiToken: S.String.pipe(S.minLength(1)),
});

// Union schema for auth config - either password or API token
export const AuthConfigSchema = S.Union(PasswordAuthSchema, ApiTokenAuthSchema);
const EnvironmentConfigSchema = S.Struct({ auth: AuthConfigSchema });
const ConfigSchema = S.Struct({
  default: S.String,
  environments: S.Record({ key: S.String, value: EnvironmentConfigSchema }),
});

/**
 * Parse authentication configuration from environment variables
 * @returns AuthConfig object with either password or API token authentication
 */
export function parseAuthConfig(): any {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const username = process.env.KINTONE_USERNAME;
  const password = process.env.KINTONE_PASSWORD;
  const apiToken = process.env.KINTONE_API_TOKEN;

  if (!baseUrl) {
    throw new Error('KINTONE_BASE_URL environment variable is required');
  }

  // Prefer API token if available
  if (apiToken) {
    const config = { baseUrl, apiToken };
    return S.decodeUnknownSync(AuthConfigSchema)(config);
  }

  // Fall back to username/password
  if (username && password) {
    const config = { baseUrl, username, password };
    return S.decodeUnknownSync(AuthConfigSchema)(config);
  }

  // No valid auth method found
  if (username && !password) {
    throw new Error('KINTONE_PASSWORD is required when KINTONE_USERNAME is provided');
  }
  if (password && !username) {
    throw new Error('KINTONE_USERNAME is required when KINTONE_PASSWORD is provided');
  }

  throw new Error('Either KINTONE_API_TOKEN or both KINTONE_USERNAME and KINTONE_PASSWORD must be provided');
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const configPath = path.join(process.cwd(), 'kintone-as-code.config.js');
    const configModule = await import(configPath);
    const cfg = S.decodeUnknownSync(ConfigSchema)(configModule.default);
    if (!(cfg.default in cfg.environments)) {
      throw new Error(`Default environment '${cfg.default}' is not defined in environments`);
    }
    return cfg as AppConfig;
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}
