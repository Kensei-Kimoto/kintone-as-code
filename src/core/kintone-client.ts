import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import dotenv from 'dotenv';
import { type AuthConfig } from '../types.js';

dotenv.config();

export const getKintoneClient = (authConfig: AuthConfig) => {
  // Password authentication
  if ('username' in authConfig) {
    return new KintoneRestAPIClient({
      baseUrl: authConfig.baseUrl,
      auth: {
        username: authConfig.username,
        password: authConfig.password,
      },
    });
  }
  
  // API token authentication
  return new KintoneRestAPIClient({
    baseUrl: authConfig.baseUrl,
    auth: {
      apiToken: authConfig.apiToken,
    },
  });
};