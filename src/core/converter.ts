import { Schema } from 'effect';
import {
  GetFormFieldsResponseSchema as FormFieldsSchema,
  fieldsConfigToTypeScriptCode,
} from 'kintone-effect-schema';

export const convertKintoneFieldsToSchema = (rawFields: unknown): string => {
  try {
    const parsed = Schema.decodeUnknownSync(FormFieldsSchema)(rawFields);
    
    // Use kintone-effect-schema's utility to generate TypeScript code
    const schemaCode = fieldsConfigToTypeScriptCode(parsed.properties);
    
    // Wrap with defineAppSchema for kintone-as-code integration
    return `import { defineAppSchema, getAppId } from 'kintone-as-code';
${schemaCode}

// Export app schema configuration
export default defineAppSchema({
  appId: getAppId('KINTONE_APP_ID'), // Please replace with your env variable
  name: 'Exported App',
  description: 'This schema was exported from kintone.',
  
  // Use the generated fields configuration
  fieldsConfig: appFieldsConfig
});`;
  } catch (error) {
    console.error('Failed to parse kintone fields:', error);
    if (error instanceof Error && 'errors' in error) {
      console.error('Validation errors:', JSON.stringify((error as any).errors, null, 2));
    }
    throw new Error('Schema validation failed during export.');
  }
};