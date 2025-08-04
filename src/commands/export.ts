
import fs from 'fs/promises';
import path from 'path';
import { getKintoneClient } from '../core/kintone-client.js';
import { convertKintoneFieldsToSchema } from '../core/converter.js';
import { loadConfig } from '../core/config.js';

interface ExportOptions {
  appId: string;
  name: string;
  env?: string | undefined;
  output?: string | undefined;
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
  } catch (error) {
    console.error(`Error during export: ${error instanceof Error ? error.message : String(error)}`);
  }
};
