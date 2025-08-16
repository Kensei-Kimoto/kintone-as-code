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
  includeRelated: boolean;
  includeSubtable: boolean;
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
  const appIdNum = Number.parseInt(appId, 10);
  if (!Number.isFinite(appIdNum)) {
    throw new Error(`Invalid appId: ${appId}`);
  }

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

      // 直前トークンに基づく安全なカンマ付与
      const beforeNoTrailingWS = before.replace(/\s+$/, '');
      const lastChar = beforeNoTrailingWS.slice(-1);
      const needsComma = lastChar && lastChar !== '{' && lastChar !== ',' ? ',' : '';
      content = `${beforeNoTrailingWS}${needsComma}
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
    // Validate name (sanitize)
    const name = options.name.trim();
    const NAME_RE = /^[A-Za-z0-9_-]+$/;
    if (!NAME_RE.test(name)) {
      throw new Error(
        `Invalid name: ${options.name}. Allowed characters are A-Z, a-z, 0-9, '_' and '-'.`
      );
    }

    // Validate appId
    const appIdNum = Number.parseInt(options.appId, 10);
    if (!Number.isFinite(appIdNum)) {
      throw new Error(`Invalid appId: ${options.appId}`);
    }

    const config = await loadConfig();
    const envName = options.env || config.default;
    const envConfig = config.environments[envName];

    if (!envConfig) {
      throw new Error(`Environment '${envName}' not found in config file.`);
    }

    const client = getKintoneClient(envConfig.auth);

    const formFields = await client.app.getFormFields({ app: options.appId });

    // Update app-ids.ts
    const appConstantName = await updateAppIds(name, options.appId);

    const schemaContent = convertKintoneFieldsToSchema(
      formFields,
      appConstantName,
      name
    );

    // Validate and resolve output directory within project root
    const cwd = process.cwd();
    const rawOutputDir = options.output || 'apps';
    const resolvedOutputDir = path.resolve(cwd, rawOutputDir);
    if (
      resolvedOutputDir !== cwd &&
      !resolvedOutputDir.startsWith(cwd + path.sep)
    ) {
      throw new Error(
        `Invalid output directory: ${rawOutputDir}. Must be within project root.`
      );
    }
    await fs.mkdir(resolvedOutputDir, { recursive: true });

    const outputPath = path.join(resolvedOutputDir, `${name}.schema.ts`);
    await fs.writeFile(outputPath, schemaContent);

    console.log(`Successfully exported schema to ${outputPath}`);

    // Generate record schema if requested (default: true)
    if (options.withRecordSchema !== false) {
      // Prefer static record schema generation using the properties from parsed form
      const recordSchemaContent = generateStaticRecordSchemaCode(
        name,
        formFields.properties as any
      );
      const recordSchemaPath = path.join(
        resolvedOutputDir,
        `${name}.record-schema.ts`
      );
      await fs.writeFile(recordSchemaPath, recordSchemaContent);
      console.log(`Successfully exported record schema to ${recordSchemaPath}`);
    }

    // Generate query builder if requested
    if (options.withQuery) {
      const queryContent = generateQueryBuilder(formFields, name, {
        includeSubtable: options.includeSubtable,
        includeRelated: options.includeRelated,
      });
      const queryPath = path.join(resolvedOutputDir, `${name}.query.ts`);
      await fs.writeFile(queryPath, queryContent, 'utf-8');
      console.log(`Successfully exported query builder to ${queryPath}`);
    }

    // Note: Form schema (Effect-TS) generation is not performed here
  } catch (error) {
    console.error(
      `Error during export: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};
