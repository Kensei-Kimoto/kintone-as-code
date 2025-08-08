import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import dotenv from 'dotenv';
import { type AuthConfig, type FieldUpdatePayload } from '../types.js';

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

// Wrapper to allow partial updates while keeping call sites type-safe
export async function updateFormFieldsPartial(client: KintoneRestAPIClient, payload: {
  app: string;
  properties: Record<string, FieldUpdatePayload>;
}) {
  // The official client types may require full properties; cast in one place.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await client.app.updateFormFields(payload as unknown as { app: string; properties: Record<string, any> });
}

export function isKintoneApiError(e: unknown): e is { errors: Record<string, unknown> } {
  return typeof e === 'object' && e !== null && 'errors' in e;
}

export async function addFormFieldsLoose(client: KintoneRestAPIClient, payload: {
  app: string;
  properties: Record<string, unknown>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await client.app.addFormFields(payload as unknown as { app: string; properties: Record<string, any> });
}
