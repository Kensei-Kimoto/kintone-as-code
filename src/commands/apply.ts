import { loadConfig } from '../core/config.js';
import { loadSchema } from '../core/loader.js';
import path from 'path';
import chalk from 'chalk';
import type { AnyFieldProperties, FieldType } from 'kintone-effect-schema';
import { getKintoneClient, isKintoneApiError, updateFormFieldsPartial, addFormFieldsLoose } from '../core/kintone-client.js';
import type { FieldUpdatePayload } from '../types.js';

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
// type definitions moved to src/types.ts

interface ApplyOptions {
  appId?: string;
  schema: string;
  env: string | undefined;
  // Experimental flag: attempt to add missing subtable child fields automatically
  addSubtableChild: boolean | undefined;
}

export const applyCommand = async (options: ApplyOptions) => {
  try {
    // Load schema file first to get appId if not provided
    console.log(chalk.blue(`Loading schema from ${options.schema}...`));
    const schemaPath = path.resolve(process.cwd(), options.schema);
    const schema = await loadSchema(schemaPath);

    // Determine the app ID to use
    let appId: string;
    if (options.appId) {
      // Use the explicitly provided app ID
      appId = options.appId;
      console.log(chalk.blue(`Using app ID from command line: ${appId}`));
    } else if (schema.appId) {
      // Use the app ID from the schema
      appId = String(schema.appId);
      console.log(chalk.blue(`Using app ID from schema: ${appId}`));
    } else {
      // No app ID available
      console.error(chalk.red('Error: No app ID specified.'));
      console.error(chalk.yellow('Please either:'));
      console.error(chalk.yellow('  1. Provide --app-id parameter'));
      console.error(chalk.yellow('  2. Ensure your schema has an appId field'));
      console.error(chalk.yellow('  3. If using an older schema, check that APP_IDS is properly imported from utils/app-ids.ts'));
      process.exit(1);
    }

    // Validate app ID
    if (!appId || appId === '0' || appId === 'undefined') {
      console.error(chalk.red(`Error: Invalid app ID: ${appId}`));
      console.error(chalk.yellow('The schema may be referencing a missing APP_IDS constant.'));
      console.error(chalk.yellow('Check that utils/app-ids.ts exists and contains the correct app ID.'));
      process.exit(1);
    }

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

    // Get current form fields
    console.log(chalk.blue('Fetching current app configuration...'));
    const currentForm = await client.app.getFormFields({
      app: appId,
    });

    // Prepare the update payload
    console.log(chalk.blue('Preparing field updates...'));
    const updatePayload: {
      app: string;
      properties: Record<string, FieldUpdatePayload>;
    } = {
      app: appId,
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
      const newFieldsForAPI: Record<string, AnyFieldProperties> = {};
      for (const [code, field] of Object.entries(newFields)) {
        newFieldsForAPI[code] = { ...field };
      }
      
      try {
        await addFormFieldsLoose(client, {
          app: appId,
          properties: newFieldsForAPI,
        });
        console.log(chalk.green(`✓ Successfully added ${Object.keys(newFields).length} new field(s)`));
      } catch (error) {
        console.error(chalk.red('Failed to add new fields:'));
        if (isKintoneApiError(error)) {
          const errors = error.errors;
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
      

      // Check label
      if ('label' in config && config.label && currentField.label !== config.label) {
        updates.label = config.label;
        hasChanges = true;
        console.log(chalk.gray(`  ${fieldCode}: label "${currentField.label}" → "${config.label}"`));
      }

      // Check noLabel
      if ('noLabel' in config && config.noLabel !== undefined && 'noLabel' in currentField && currentField.noLabel !== config.noLabel) {
        updates.noLabel = config.noLabel;
        hasChanges = true;
        console.log(chalk.gray(`  ${fieldCode}: noLabel ${currentField.noLabel} → ${config.noLabel}`));
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
        if ('unique' in config && config.unique !== undefined && 'unique' in currentField && currentField.unique !== config.unique) {
          updates.unique = config.unique;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: unique ${currentField.unique} → ${config.unique}`));
        }
      }

      // For NUMBER fields
      if (config.type === 'NUMBER' && currentField.type === 'NUMBER') {
        if ('minValue' in config && 'minValue' in currentField && currentField.minValue !== config.minValue) {
          updates.minValue = config.minValue;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: minValue "${currentField.minValue}" → "${config.minValue}"`));
        }
        if ('maxValue' in config && 'maxValue' in currentField && currentField.maxValue !== config.maxValue) {
          updates.maxValue = config.maxValue;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: maxValue "${currentField.maxValue}" → "${config.maxValue}"`));
        }
        if ('digit' in config && config.digit !== undefined && 'digit' in currentField && currentField.digit !== config.digit) {
          updates.digit = config.digit;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: digit ${currentField.digit} → ${config.digit}`));
        }
        if ('displayScale' in config && 'displayScale' in currentField && currentField.displayScale !== config.displayScale) {
          updates.displayScale = config.displayScale;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: displayScale "${currentField.displayScale}" → "${config.displayScale}"`));
        }
        if ('unit' in config && 'unit' in currentField && currentField.unit !== config.unit) {
          updates.unit = config.unit;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: unit "${currentField.unit}" → "${config.unit}"`));
        }
        if ('unitPosition' in config && config.unitPosition !== undefined && 'unitPosition' in currentField && currentField.unitPosition !== config.unitPosition) {
          updates.unitPosition = config.unitPosition;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: unitPosition "${currentField.unitPosition}" → "${config.unitPosition}"`));
        }
        if ('unique' in config && config.unique !== undefined && 'unique' in currentField && currentField.unique !== config.unique) {
          updates.unique = config.unique;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: unique ${currentField.unique} → ${config.unique}`));
        }
      }

      // For DATETIME fields
      if (config.type === 'DATETIME' && currentField.type === 'DATETIME') {
        if ('defaultNowValue' in config && config.defaultNowValue !== undefined && 'defaultNowValue' in currentField && currentField.defaultNowValue !== config.defaultNowValue) {
          updates.defaultNowValue = config.defaultNowValue;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: defaultNowValue ${currentField.defaultNowValue} → ${config.defaultNowValue}`));
        }
        if ('unique' in config && config.unique !== undefined && 'unique' in currentField && currentField.unique !== config.unique) {
          updates.unique = config.unique;
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: unique ${currentField.unique} → ${config.unique}`));
        }
      }

      // For USER_SELECT fields
      if (config.type === 'USER_SELECT' && currentField.type === 'USER_SELECT') {
        if ('entities' in config && config.entities && 'entities' in currentField && JSON.stringify(currentField.entities) !== JSON.stringify(config.entities)) {
          // Convert readonly array to mutable array
          updates.entities = [...config.entities].map(e => ({ code: e.code, type: e.type }));
          hasChanges = true;
          console.log(chalk.gray(`  ${fieldCode}: entities changed`));
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

      // For SUBTABLE fields
      if (config.type === 'SUBTABLE' && currentField.type === 'SUBTABLE') {
        // Check subtable fields
        if ('fields' in config && config.fields && 'fields' in currentField && currentField.fields) {
          const currentSubfields = currentField.fields as Record<string, any>;
          const configSubfields = config.fields as Record<string, any>;
          const updatedSubfields: Record<string, any> = {};
          let subfieldsChanged = false;

          // Check each subfield for changes
          for (const [subfieldCode, configSubfield] of Object.entries(configSubfields)) {
            const currentSubfield = currentSubfields[subfieldCode];
            
            if (!currentSubfield) {
              console.log(chalk.yellow(`  ${fieldCode}.${subfieldCode}: New subfield detected (requires manual addition)`));
              continue;
            }

            const subfieldUpdates: any = {
              type: currentSubfield.type,
              code: subfieldCode
            };
            let subfieldHasChanges = false;

            // Check subfield properties
            if ('label' in configSubfield && configSubfield.label && currentSubfield.label !== configSubfield.label) {
              subfieldUpdates.label = configSubfield.label;
              subfieldHasChanges = true;
              console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: label "${currentSubfield.label}" → "${configSubfield.label}"`));
            }

            if ('noLabel' in configSubfield && configSubfield.noLabel !== undefined && 'noLabel' in currentSubfield && currentSubfield.noLabel !== configSubfield.noLabel) {
              subfieldUpdates.noLabel = configSubfield.noLabel;
              subfieldHasChanges = true;
              console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: noLabel ${currentSubfield.noLabel} → ${configSubfield.noLabel}`));
            }

            if ('required' in configSubfield && configSubfield.required !== undefined && 'required' in currentSubfield && currentSubfield.required !== configSubfield.required) {
              subfieldUpdates.required = configSubfield.required;
              subfieldHasChanges = true;
              console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: required ${currentSubfield.required} → ${configSubfield.required}`));
            }

            if ('defaultValue' in configSubfield && configSubfield.defaultValue !== undefined && 'defaultValue' in currentSubfield && JSON.stringify(currentSubfield.defaultValue) !== JSON.stringify(configSubfield.defaultValue)) {
              subfieldUpdates.defaultValue = configSubfield.defaultValue;
              subfieldHasChanges = true;
              console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: defaultValue changed`));
            }

            // Handle specific field types within subtable
            if (configSubfield.type === 'SINGLE_LINE_TEXT' && currentSubfield.type === 'SINGLE_LINE_TEXT') {
              if ('minLength' in configSubfield && 'minLength' in currentSubfield && currentSubfield.minLength !== configSubfield.minLength) {
                subfieldUpdates.minLength = configSubfield.minLength;
                subfieldHasChanges = true;
                console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: minLength "${currentSubfield.minLength}" → "${configSubfield.minLength}"`));
              }
              if ('maxLength' in configSubfield && 'maxLength' in currentSubfield && currentSubfield.maxLength !== configSubfield.maxLength) {
                subfieldUpdates.maxLength = configSubfield.maxLength;
                subfieldHasChanges = true;
                console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: maxLength "${currentSubfield.maxLength}" → "${configSubfield.maxLength}"`));
              }
            }

            if (configSubfield.type === 'RADIO_BUTTON' && currentSubfield.type === 'RADIO_BUTTON') {
              if ('align' in configSubfield && configSubfield.align !== undefined && 'align' in currentSubfield && currentSubfield.align !== configSubfield.align) {
                subfieldUpdates.align = configSubfield.align;
                subfieldHasChanges = true;
                console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: align ${currentSubfield.align} → ${configSubfield.align}`));
              }

              // Check radio button options in subfield
              if (configSubfield.options && 'options' in currentSubfield) {
                const currentSubOptions = currentSubfield.options || {};
                const configSubOptions = configSubfield.options;
                
                let subOptionsChanged = false;
                
                for (const [optionKey, optionValue] of Object.entries(configSubOptions)) {
                  const currentOption = currentSubOptions[optionKey];
                  if (currentOption && optionValue && typeof optionValue === 'object' && 'label' in optionValue && currentOption.label !== optionValue.label) {
                    subOptionsChanged = true;
                    console.log(chalk.gray(`    ${fieldCode}.${subfieldCode}: option "${optionKey}" label changed`));
                  }
                }
                
                if (subOptionsChanged) {
                  subfieldUpdates.options = {};
                  
                  for (const [key, value] of Object.entries(currentSubOptions)) {
                    subfieldUpdates.options[key] = value;
                  }
                  
                  for (const [key, value] of Object.entries(configSubOptions)) {
                    if (subfieldUpdates.options[key] && typeof value === 'object') {
                      subfieldUpdates.options[key] = {
                        ...subfieldUpdates.options[key],
                        ...value
                      };
                    }
                  }
                  
                  subfieldHasChanges = true;
                }
              }
            }

            if (subfieldHasChanges) {
              updatedSubfields[subfieldCode] = subfieldUpdates;
              subfieldsChanged = true;
            } else {
              // Include unchanged subfields as-is to preserve them
              updatedSubfields[subfieldCode] = currentSubfield;
            }
          }

          // Include all current subfields that weren't in config to preserve them
          for (const [subfieldCode, currentSubfield] of Object.entries(currentSubfields)) {
            if (!(subfieldCode in configSubfields)) {
              updatedSubfields[subfieldCode] = currentSubfield;
            }
          }

          if (subfieldsChanged) {
            updates.fields = updatedSubfields;
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
        // updateFormFieldsはプロパティの部分的な更新を受け付ける（型穴はラッパーで集約）
        await updateFormFieldsPartial(client, updatePayload);
        console.log(chalk.green(`✓ Successfully updated ${changesCount} field(s)`));
      } catch (error) {
        console.error(chalk.red('Failed to update fields:'));
        
        if (isKintoneApiError(error)) {
          console.error(chalk.red('Detailed errors:'));
          const errors = error.errors;
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
        await client.app.deployApp({ apps: [{ app: appId }] });
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
