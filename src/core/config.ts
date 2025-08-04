import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  default: string;
  environments: {
    [key: string]: {
      auth: {
        baseUrl: string;
        username: string;
        password: string;
      };
    };
  };
}

export async function loadConfig(): Promise<Config> {
  try {
    const configPath = path.join(process.cwd(), 'kintone-as-code.config.js');
    const configModule = await import(configPath);
    return configModule.default;
  } catch (error) {
    throw new Error(`Failed to load config file: ${error}`);
  }
}