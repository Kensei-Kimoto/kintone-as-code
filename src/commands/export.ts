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

// Windows reserved file names
const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

/**
 * Validates and sanitizes file names to prevent path traversal and other security issues
 * @param name - The file name to validate
 * @returns The validated file name
 * @throws Error if the file name is invalid
 */
export const validateFileName = (name: string): string => {
  // Check for empty or whitespace-only names
  if (!name || name.trim() === '') {
    throw new Error('Invalid file name: File name cannot be empty');
  }

  // Check length limit (128 characters)
  if (name.length > 128) {
    throw new Error('Invalid file name: File name too long (max 128 characters)');
  }

  // Check for path traversal patterns
  if (name.includes('..')) {
    throw new Error('Invalid file name: File name cannot contain ".."');
  }

  // Check for path separators
  if (name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid file name: File name cannot contain path separators');
  }

  // Check for absolute path indicators
  if (name.startsWith('/') || /^[A-Za-z]:/.test(name)) {
    throw new Error('Invalid file name: File name cannot be an absolute path');
  }

  // Check for whitespace
  if (/\s/.test(name)) {
    throw new Error('Invalid file name: File name cannot contain whitespace');
  }

  // Check for special characters - only allow alphanumeric, hyphens, and underscores
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error('Invalid file name: File name can only contain alphanumeric characters, hyphens, and underscores');
  }

  // Check for Windows reserved names (case insensitive)
  const upperName = name.toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(upperName)) {
    throw new Error(`Invalid file name: "${name}" is a reserved Windows file name`);
  }

  return name;
};

/**
 * Validates and normalizes output directory paths to prevent directory traversal attacks
 * @param outputDir - The output directory path to validate
 * @returns The normalized absolute path within the project root
 * @throws Error if the path is invalid or would escape the project root
 */
export const validateOutputDirectory = (outputDir: string): string => {
  // Check for empty or whitespace-only paths
  if (!outputDir || outputDir.trim() === '') {
    throw new Error('Invalid output directory: Directory path cannot be empty');
  }

  // Check for null bytes
  if (outputDir.includes('\x00')) {
    throw new Error('Invalid output directory: Directory path cannot contain null bytes');
  }

  // Check for absolute paths (including Windows drive letters)
  if (path.isAbsolute(outputDir) || /^[A-Za-z]:/.test(outputDir)) {
    throw new Error('Invalid output directory: Absolute paths are not allowed');
  }
  
  // Check for UNC paths (Windows network paths)
  if (outputDir.startsWith('\\\\') || outputDir.startsWith('//')) {
    throw new Error('Invalid output directory: UNC paths are not allowed');
  }
  
  // Reject paths that start with .. or have .. at the beginning of segments
  // This prevents attacks like "../../../etc/passwd" while allowing "apps/../schemas" 
  if (outputDir.startsWith('../') || outputDir.startsWith('..\\') || outputDir === '..') {
    throw new Error('Invalid output directory: Parent directory segments (..) are not allowed');
  }

  // Check for suspicious patterns
  if (outputDir.includes('....') || outputDir.includes('...')) {
    throw new Error('Invalid output directory: Multiple consecutive dots are not allowed');
  }

  // Get the project root (current working directory)
  const projectRoot = process.cwd();
  
  // Resolve the output directory path relative to project root
  const resolvedPath = path.resolve(projectRoot, outputDir);
  
  // Normalize the path to handle . and .. components
  const normalizedPath = path.normalize(resolvedPath);
  
  // Check if the resolved path is within the project root
  // Use path.relative to check if we need to go up from project root to reach the target
  const relativePath = path.relative(projectRoot, normalizedPath);
  
  // If relativePath is empty, it's the project root itself (valid)
  // If relativePath starts with '..' or is an absolute path, it's outside project root (invalid)
  if (relativePath && (relativePath.startsWith('..') || path.isAbsolute(relativePath))) {
    throw new Error(`Invalid output directory: Path "${outputDir}" would resolve outside project root`);
  }
  
  return normalizedPath;
};

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
  if (!/^\d+$/.test(appId)) {
    throw new Error(`Invalid appId: ${appId}`);
  }
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

  await fs.writeFile(appIdsPath, content, 'utf-8');
  return constantName;
};

// Export command main function - handles schema export from kintone apps
export const exportCommand = async (options: ExportOptions) => {
  try {
    // Validate and sanitize file name
    const name = validateFileName(options.name);

    // Validate appId
    if (!/^\d+$/.test(options.appId)) {
      throw new Error(`Invalid appId: ${options.appId}`);
    }
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
    const rawOutputDir = options.output || 'apps';
    const outputDir = validateOutputDirectory(rawOutputDir);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${name}.schema.ts`);
    await fs.writeFile(outputPath, schemaContent, 'utf-8');

    console.log(`Successfully exported schema to ${outputPath}`);

    // Generate record schema if requested (default: true)
    if (options.withRecordSchema !== false) {
      // Prefer static record schema generation using the properties from parsed form
      const recordSchemaContent = generateStaticRecordSchemaCode(
        name,
        formFields.properties as any
      );
      const recordSchemaPath = path.join(
        outputDir,
        `${name}.record-schema.ts`
      );
      await fs.writeFile(recordSchemaPath, recordSchemaContent, 'utf-8');
      console.log(`Successfully exported record schema to ${recordSchemaPath}`);
    }

    // Generate query builder if requested
    if (options.withQuery) {
      const queryContent = generateQueryBuilder(formFields, name, {
        includeSubtable: options.includeSubtable,
        includeRelated: options.includeRelated,
      });
      const queryPath = path.join(outputDir, `${name}.query.ts`);
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
