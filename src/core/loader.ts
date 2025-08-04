import { pathToFileURL } from 'url';
import type { AnyFieldProperties } from 'kintone-effect-schema';

// アプリスキーマの型定義
export interface AppSchemaConfig {
  appId: string;
  name: string;
  description?: string;
  fieldsConfig: Record<string, AnyFieldProperties> | {
    properties: Record<string, AnyFieldProperties>;
  };
}

export async function loadSchema(schemaPath: string): Promise<AppSchemaConfig> {
  try {
    // Convert path to file URL for dynamic import
    const fileUrl = pathToFileURL(schemaPath).href;
    const module = await import(fileUrl);
    
    if (!module.default) {
      throw new Error('Schema file must export a default schema configuration');
    }
    
    return module.default as AppSchemaConfig;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}