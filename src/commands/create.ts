import { loadConfig } from '../core/config.js';
import { loadSchema } from '../core/loader.js';
import path from 'path';
import chalk from 'chalk';
import type { AnyFieldProperties } from 'kintone-effect-schema';
import { getKintoneClient, isKintoneApiError, addFormFieldsLoose } from '../core/kintone-client.js';
import type { Mutable } from '../types.js';

interface CreateOptions {
  schema: string;
  env: string | undefined;
  name: string | undefined;
  space: string | undefined;
  thread: string | undefined;
}

export const createCommand = async (options: CreateOptions) => {
  try {
    console.log(chalk.blue('Loading configuration...'));
    const config = await loadConfig();
    const envName = options.env || config.default;
    const envConfig = config.environments[envName];

    if (!envConfig) {
      console.error(chalk.red(`Environment "${envName}" not found.`));
      process.exit(1);
    }

    // Initialize kintone client
    const client = getKintoneClient(envConfig.auth);

    // Load schema file
    console.log(chalk.blue(`Loading schema from ${options.schema}...`));
    const schemaPath = path.resolve(process.cwd(), options.schema);
    const schema = await loadSchema(schemaPath);

    // Prepare app creation payload
    const appName = options.name || schema.name || 'New App from Schema';
    interface CreateAppPayload { name: string; space?: string; thread?: string }
    const createAppPayload: CreateAppPayload = { name: appName };

    // Add space and thread if provided
    if (options.space) {
      createAppPayload.space = options.space;
      if (options.thread) {
        createAppPayload.thread = options.thread;
      }
    }

    // Create the app
    console.log(chalk.blue(`Creating new app "${appName}"...`));
    let newAppId: string;
    
    try {
      const createResult = await client.app.addApp(createAppPayload);
      newAppId = createResult.app;
      console.log(chalk.green(`✓ App created with ID: ${newAppId}`));
    } catch (error) {
      console.error(chalk.red('Failed to create app:'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      process.exit(1);
    }

    // Prepare fields for the new app
    const fieldsConfig = 'properties' in schema.fieldsConfig 
      ? schema.fieldsConfig.properties 
      : schema.fieldsConfig;

    // Convert readonly properties to mutable for kintone API
    type MutableAnyFieldProperties = Mutable<AnyFieldProperties>;
    const fieldsForAPI: Record<string, MutableAnyFieldProperties> = {};
    for (const [code, field] of Object.entries(fieldsConfig)) {
      const fieldConfig = field as AnyFieldProperties;
      
      // Skip system fields that cannot be added
      const systemFields = [
        'RECORD_NUMBER', 'CREATOR', 'CREATED_TIME', 'MODIFIER', 'UPDATED_TIME',
        'STATUS', 'STATUS_ASSIGNEE', 'CATEGORY'
      ];
      if (systemFields.includes(fieldConfig.type)) {
        console.log(chalk.gray(`  ${code}: System field, skipping...`));
        continue;
      }
      
      fieldsForAPI[code] = { ...fieldConfig } as MutableAnyFieldProperties;
    }

    // Add fields to the new app
    if (Object.keys(fieldsForAPI).length > 0) {
      console.log(chalk.blue(`\nAdding ${Object.keys(fieldsForAPI).length} field(s) to the app...`));
      
      try {
        await addFormFieldsLoose(client, {
          app: newAppId,
          properties: fieldsForAPI,
        });
        console.log(chalk.green(`✓ Successfully added ${Object.keys(fieldsForAPI).length} field(s)`));
      } catch (error) {
        console.error(chalk.red('Failed to add fields:'));
        if (isKintoneApiError(error)) {
          const errors = error.errors;
          for (const [field, fieldError] of Object.entries(errors)) {
            console.error(chalk.red(`  ${field}:`), fieldError);
          }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('Full error:'), errorMessage);
        
        // Note: We don't exit here as the app is already created
        console.log(chalk.yellow('\nThe app was created but some fields could not be added.'));
        console.log(chalk.yellow(`You can manually fix the issues and run apply command with app ID: ${newAppId}`));
      }
    }

    // Deploy the app
    console.log(chalk.blue('\nDeploying app...'));
    try {
      await client.app.deployApp({ apps: [{ app: newAppId }] });
      console.log(chalk.green('✓ App deployed successfully!'));
    } catch (error) {
      console.error(chalk.red('Failed to deploy app:'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      
      // Note: We don't exit here as the app is already created
      console.log(chalk.yellow('\nThe app was created but could not be deployed.'));
      console.log(chalk.yellow(`You can manually deploy it or run apply command with app ID: ${newAppId}`));
    }

    // Success message
    console.log(chalk.green(`\n✨ App created successfully!`));
    console.log(chalk.cyan(`App ID: ${newAppId}`));
    console.log(chalk.cyan(`App URL: ${envConfig.auth.baseUrl}/k/${newAppId}/`));
    
    // Suggest next steps
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray(`1. Update your schema file with the app ID (APP_IDS):`));
    console.log(chalk.gray(`   import { APP_IDS } from './utils/app-ids'; // ensure updated by export`));
    console.log(chalk.gray(`   // e.g., appId: APP_IDS.${'NEW_APP'} // replace with your constant`));
    console.log(chalk.gray(`2. Use apply command to update the app:`));
    console.log(chalk.gray(`   kintone-as-code apply --app-id ${newAppId} --schema ${options.schema}`));

  } catch (error) {
    console.error(chalk.red('Error during create:'), error);
    process.exit(1);
  }
};
