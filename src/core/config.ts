import path from 'path';
import dotenv from 'dotenv';
import { Schema as S } from 'effect';
import type { Config as AppConfig } from '../types.js';

dotenv.config();

// Runtime validation schema for configuration
const PasswordAuthSchema = S.Struct({
  baseUrl: S.String,
  username: S.String,
  password: S.String,
});

// APIトークンは非対応化したため、パスワード認証のみ
const AuthConfigSchema = PasswordAuthSchema;
const EnvironmentConfigSchema = S.Struct({ auth: AuthConfigSchema });
const ConfigSchema = S.Struct({
  default: S.String,
  environments: S.Record({ key: S.String, value: EnvironmentConfigSchema }),
});

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
