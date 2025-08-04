import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { loadConfig } from '../core/config.js';
import { loadSchema } from '../core/loader.js';
import path from 'path';
import chalk from 'chalk';
import type { AnyFieldProperties, FieldType } from 'kintone-effect-schema';

// 更新不可能なシステムフィールドタイプ
const NON_UPDATABLE_FIELD_TYPES = [
  'RECORD_NUMBER',
  'CREATOR',
  'CREATED_TIME',
  'MODIFIER',
  'UPDATED_TIME',
  'STATUS',
  'STATUS_ASSIGNEE',
  'CATEGORY'
] as const;

type NonUpdatableFieldType = typeof NON_UPDATABLE_FIELD_TYPES[number];

// フィールド更新ペイロード - kintone REST APIが受け付ける形式
// 注意: APIドキュメントによると、更新時はtypeとcodeが必須で、その他は更新したいプロパティのみを含める
type DefaultValueType = string | readonly string[] | readonly {code: string; type: string}[];

interface FieldUpdatePayload {
  type: FieldType;
  code: string;
  label?: string;
  noLabel?: boolean;
  required?: boolean;
  defaultValue?: DefaultValueType;
  minLength?: string;
  maxLength?: string;
  align?: 'HORIZONTAL' | 'VERTICAL';
  options?: Record<string, { label: string; index: string }>;
  unique?: boolean;
  expression?: string;
  hideExpression?: boolean;
  digit?: boolean;
  displayScale?: string;
  unit?: string;
  unitPosition?: 'BEFORE' | 'AFTER';
  entities?: Array<{code: string; type: string}>;
  defaultNowValue?: boolean;
  protocol?: 'WEB' | 'CALL' | 'MAIL';
  thumbnailSize?: '50' | '150' | '250' | '500';
  openGroup?: boolean;
}

interface ApplyOptions {
  appId: string;
  schema: string;
  env: string | undefined;
}

export const applyCommand = async (options: ApplyOptions) => {
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
    const client = new KintoneRestAPIClient({
      baseUrl: envConfig.auth.baseUrl,
      auth: {
        username: envConfig.auth.username,
        password: envConfig.auth.password,
      },
    });

    // Load schema file
    console.log(chalk.blue(`Loading schema from ${options.schema}...`));
    const schemaPath = path.resolve(process.cwd(), options.schema);
    const schema = await loadSchema(schemaPath);

    // Get current form fields
    console.log(chalk.blue('Fetching current app configuration...'));
    const currentForm = await client.app.getFormFields({ 
      app: options.appId 
    });

    // Prepare the update payload
    console.log(chalk.blue('Preparing field updates...'));
    const updatePayload: {
      app: string;
      properties: Record<string, FieldUpdatePayload>;
    } = {
      app: options.appId,
      properties: {}
    };

    // Compare and prepare updates
    let changesCount = 0;
    const fieldsConfig = 'properties' in schema.fieldsConfig 
      ? schema.fieldsConfig.properties 
      : schema.fieldsConfig;
    
    // Separate new fields and existing fields
    const newFields: Record<string, AnyFieldProperties> = {};
    const existingFieldsToUpdate: Array<[string, AnyFieldProperties]> = [];
    
    for (const [fieldCode, fieldConfig] of Object.entries(fieldsConfig)) {
      const currentField = currentForm.properties[fieldCode];
      
      if (!currentField) {
        // New field - will be added with addFormFields
        newFields[fieldCode] = fieldConfig as AnyFieldProperties;
        console.log(chalk.yellow(`Field "${fieldCode}" does not exist in app. Will be created.`));
        continue;
      } else {
        existingFieldsToUpdate.push([fieldCode, fieldConfig as AnyFieldProperties]);
      }
    }
    
    // Add new fields if any
    if (Object.keys(newFields).length > 0) {
      console.log(chalk.blue(`\nAdding ${Object.keys(newFields).length} new field(s)...`));
      
      // Convert readonly properties to mutable for kintone API
      const newFieldsForAPI: Record<string, any> = {};
      for (const [code, field] of Object.entries(newFields)) {
        newFieldsForAPI[code] = { ...field };
      }
      
      try {
        await client.app.addFormFields({
          app: options.appId,
          properties: newFieldsForAPI
        });
        console.log(chalk.green(`✓ Successfully added ${Object.keys(newFields).length} new field(s)`));
      } catch (error) {
        console.error(chalk.red('Failed to add new fields:'));
        if (error && typeof error === 'object' && 'errors' in error) {
          const errors = error.errors as Record<string, unknown>;
          for (const [field, fieldError] of Object.entries(errors)) {
            console.error(chalk.red(`  ${field}:`), fieldError);
          }
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('Full error:'), errorMessage);
        process.exit(1);
      }
    }
    
    // Process existing fields for updates
    for (const [fieldCode, fieldConfig] of existingFieldsToUpdate) {
      const currentField = currentForm.properties[fieldCode];
      if (!currentField) continue; // Type guard - should not happen as we already checked
      const config = fieldConfig;

      // Skip system fields that cannot be updated
      if (NON_UPDATABLE_FIELD_TYPES.includes(currentField.type as NonUpdatableFieldType)) {
        console.log(chalk.gray(`  ${fieldCode}: System field, skipping...`));
        continue;
      }

      // Check for changes
      const updates: FieldUpdatePayload = {
        type: currentField.type as FieldType,  // type is required
        code: fieldCode                         // code is required
      };
      let hasChanges = false;
      

      // Check label (SUBTABLE fields don't have label property)
      if (config.type !== 'SUBTABLE' && 'label' in config && config.label && currentField.label !== config.label) {
        updates.label = config.label;
        hasChanges = true;
        console.log(chalk.gray(`  ${fieldCode}: label "${currentField.label}" → "${config.label}"`));
      }

      // Check required (for fields that support it)
      if ('required' in config && config.required !== undefined && 'required' in currentField && currentField.required !== config.required) {
        updates.required = config.required;
        hasChanges = true;
        console.log(chalk.gray(`  ${fieldCode}: required ${currentField.required} → ${config.required}`));
      }

      // Check defaultValue (for fields that support it)
      if ('defaultValue' in config && config.defaultValue !== undefined && 'defaultValue' in currentField && JSON.stringify(currentField.defaultValue) !== JSON.stringify(config.defaultValue)) {
        updates.defaultValue = config.defaultValue;
        hasChanges = true;
        console.log(chalk.gray(`  ${fieldCode}: defaultValue changed`));
      }

      // For SINGLE_LINE_TEXT fields
      if (config.type === 'SINGLE_LINE_TEXT' && currentField.type === 'SINGLE_LINE_TEXT') {
        if ('minLength' in config && 'minLength' in currentField && currentField.minLength !== config.minLength) {
          updates.minLength = config.minLength;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: minLength "${currentField.minLength}" → "${config.minLength}"`));
        }
        if ('maxLength' in config && 'maxLength' in currentField && currentField.maxLength !== config.maxLength) {
          updates.maxLength = config.maxLength;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: maxLength "${currentField.maxLength}" → "${config.maxLength}"`));
        }
      }

      // For RADIO_BUTTON fields
      if (config.type === 'RADIO_BUTTON' && currentField.type === 'RADIO_BUTTON') {
        if ('align' in config && config.align !== undefined && 'align' in currentField && currentField.align !== config.align) {
          updates.align = config.align;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: align ${currentField.align} → ${config.align}`));
        }
        
        // Check options - need to include all options as they are completely replaced
        if (config.options && 'options' in currentField) {
          const currentOptions = currentField.options || {};
          const configOptions = config.options;
          
          let optionsChanged = false;
          
          // Check if any option labels have changed
          for (const [optionKey, optionValue] of Object.entries(configOptions)) {
            const currentOption = currentOptions[optionKey];
            if (currentOption && currentOption.label !== optionValue.label) {
              optionsChanged = true;
              console.log(chalk.gray(`  ${fieldCode}: option "${optionKey}" label changed`));
            }
          }
          
          // If any options changed, we need to include ALL options in the update
          if (optionsChanged) {
            updates.options = {};
            
            // First, add all existing options (to preserve any that aren't being changed)
            for (const [key, value] of Object.entries(currentOptions)) {
              updates.options[key] = value;
            }
            
            // Then override with config options (this updates the labels)
            for (const [key, value] of Object.entries(configOptions)) {
              if (updates.options[key]) {
                updates.options[key] = {
                  ...updates.options[key],
                  ...value
                };
              }
            }
            
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        // Do not include 'type' in updates
        updatePayload.properties[fieldCode] = updates;
        changesCount++;
      }
    }

    // Check if we need to deploy
    const needsDeploy = Object.keys(newFields).length > 0 || changesCount > 0;
    
    if (changesCount === 0 && Object.keys(newFields).length === 0) {
      console.log(chalk.green('No changes detected. App is up to date!'));
      return;
    }

    // Apply updates if any
    if (changesCount > 0) {
      console.log(chalk.blue(`\nApplying ${changesCount} field update(s)...`));
      
      try {
        // updateFormFieldsはプロパティの部分的な更新を受け付ける
        // @ts-expect-error kintone REST API clientの型定義が部分的な更新を正しく反映していない
        await client.app.updateFormFields(updatePayload);
        console.log(chalk.green(`✓ Successfully updated ${changesCount} field(s)`));
      } catch (error) {
        console.error(chalk.red('Failed to update fields:'));
        
        if (error && typeof error === 'object' && 'errors' in error) {
          console.error(chalk.red('Detailed errors:'));
          const errors = error.errors as Record<string, unknown>;
          for (const [field, fieldError] of Object.entries(errors)) {
            console.error(chalk.red(`  ${field}:`), fieldError);
          }
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('Full error:'), errorMessage);
        process.exit(1);
      }
    }
    
    // Deploy the app if any changes were made
    if (needsDeploy) {
      console.log(chalk.blue('\nDeploying app...'));
      try {
        await client.app.deployApp({ apps: [{ app: options.appId }] });
        console.log(chalk.green('✓ App deployed successfully!'));
      } catch (error) {
        console.error(chalk.red('Failed to deploy app:'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('Full error:'), errorMessage);
        process.exit(1);
      }
    }

  } catch (error) {
    console.error(chalk.red('Error during apply:'), error);
    process.exit(1);
  }
};