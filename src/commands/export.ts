
import fs from 'fs/promises';
import path from 'path';
import { getKintoneClient } from '../core/kintone-client.js';
import { convertKintoneFieldsToSchema, generateRecordSchemaCode } from '../core/converter.js';
import { loadConfig } from '../core/config.js';

interface ExportOptions {
  appId: string;
  name: string;
  env?: string | undefined;
  output?: string | undefined;
  withRecordSchema?: boolean;
}

export const exportCommand = async (options: ExportOptions) => {
  try {
    const config = await loadConfig();
    const envName = options.env || config.default;
    const envConfig = config.environments[envName];

    if (!envConfig) {
      throw new Error(`Environment '${envName}' not found in config file.`);
    }

    const client = getKintoneClient(envConfig.auth);

    const formFields = await client.app.getFormFields({ app: options.appId });

    const schemaContent = convertKintoneFieldsToSchema(formFields);

    const outputDir = options.output || 'apps';
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${options.name}.schema.ts`);
    await fs.writeFile(outputPath, schemaContent);

    console.log(`Successfully exported schema to ${outputPath}`);

    // Generate record schema if requested (default: true)
    if (options.withRecordSchema !== false) {
      const recordSchemaContent = generateRecordSchemaCode(options.name);
      const recordSchemaPath = path.join(outputDir, `${options.name}.record-schema.ts`);
      await fs.writeFile(recordSchemaPath, recordSchemaContent);
      console.log(`Successfully exported record schema to ${recordSchemaPath}`);
    }
  } catch (error) {
    console.error(`Error during export: ${error instanceof Error ? error.message : String(error)}`);
  }
};
