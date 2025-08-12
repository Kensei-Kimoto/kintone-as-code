import fs from 'fs/promises';
import path from 'path';
import { getKintoneClient } from '../core/kintone-client.js';
import {
  convertKintoneFieldsToSchema,
  generateStaticRecordSchemaCode,
} from '../core/converter.js';
import { loadConfig } from '../core/config.js';
import { generateQueryBuilder } from '../core/query-generator.js';

interface ExportOptions {
  appId: string;
  name: string;
  env?: string | undefined;
  output?: string | undefined;
  withRecordSchema?: boolean;
  withQuery?: boolean;
}

// Convert name to constant format (e.g., "my-app" -> "MY_APP")
const toConstantName = (name: string): string => {
  // Convert to CONSTANT_CASE with enhanced handling
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
};

// Update or create app-ids.ts file
const updateAppIds = async (appName: string, appId: string) => {
  const utilsDir = path.join(process.cwd(), 'utils');
  const appIdsPath = path.join(utilsDir, 'app-ids.ts');

  await fs.mkdir(utilsDir, { recursive: true });

  let content = '';
  try {
    content = await fs.readFile(appIdsPath, 'utf-8');
  } catch {
    // File doesn't exist, create new content
    content = `// App IDs for kintone applications
// This file is gitignored by default
export const APP_IDS = {
} as const;
`;
  }

  const constantName = toConstantName(appName);
  const appIdNum = parseInt(appId, 10);

  // Check if APP_IDS already contains this app
  const appIdPattern = new RegExp(`^\\s*${constantName}:\\s*\\d+,?$`, 'm');
  if (appIdPattern.test(content)) {
    // Update existing entry
    content = content.replace(appIdPattern, `  ${constantName}: ${appIdNum},`);
  } else {
    // Add new entry
    const insertPos = content.lastIndexOf('} as const;');
    if (insertPos !== -1) {
      const before = content.substring(0, insertPos);
      const after = content.substring(insertPos);

      // Check if we need a comma
      const needsComma = before.trim().endsWith('}')
        ? ''
        : before.match(/\d+\s*$/m)
          ? ','
          : '';
      content = `${before}${needsComma}
  ${constantName}: ${appIdNum},
${after}`;
    }
  }

  await fs.writeFile(appIdsPath, content);
  return constantName;
};

// Export command main function - handles schema export from kintone apps
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

    // Update app-ids.ts
    const appConstantName = await updateAppIds(options.name, options.appId);

    const schemaContent = convertKintoneFieldsToSchema(
      formFields,
      appConstantName,
      options.name
    );

    const outputDir = options.output || 'apps';
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${options.name}.schema.ts`);
    await fs.writeFile(outputPath, schemaContent);

    console.log(`Successfully exported schema to ${outputPath}`);

    // Generate record schema if requested (default: true)
    if (options.withRecordSchema !== false) {
      // Prefer static record schema generation using the properties from parsed form
      const recordSchemaContent = generateStaticRecordSchemaCode(
        options.name,
        formFields.properties as any
      );
      const recordSchemaPath = path.join(
        outputDir,
        `${options.name}.record-schema.ts`
      );
      await fs.writeFile(recordSchemaPath, recordSchemaContent);
      console.log(`Successfully exported record schema to ${recordSchemaPath}`);
    }

    // Generate query builder if requested
    if (options.withQuery) {
      const queryContent = generateQueryBuilder(formFields, options.name);
      const queryPath = path.join(outputDir, `${options.name}.query.ts`);
      await fs.writeFile(queryPath, queryContent, 'utf-8');
      console.log(`Successfully exported query builder to ${queryPath}`);
    }

    // Note: Form schema (Effect-TS) generation is not performed here
  } catch (error) {
    console.error(
      `Error during export: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
