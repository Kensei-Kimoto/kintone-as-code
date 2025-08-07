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

export const generateRecordSchemaCode = (schemaName: string): string => {
  // Generate TypeScript code for record schema that imports from the field schema
  const baseName = schemaName.replace(/\.schema$/, '');
  
  return `import { Schema } from 'effect';
import { convertFormFieldsToRecordSchema, createRecordSchemaFromForm } from 'kintone-effect-schema';
import { appFieldsConfig } from './${baseName}.schema.js';

// Generate record schema from form field definitions
const recordSchemas = convertFormFieldsToRecordSchema(appFieldsConfig);

// Export the record schema for type-safe record validation
export const RecordSchema = Schema.Struct(recordSchemas);

// Helper function for record validation
export const validateRecord = Schema.decodeUnknownSync(RecordSchema);

// Optional: Export with custom validations
// You can customize this by adding validation rules
export const CustomRecordSchema = createRecordSchemaFromForm(appFieldsConfig, {
  // Example: Add custom validation for specific fields
  // price: (schema) => Schema.filter(
  //   schema,
  //   (field) => field.value !== null && Number(field.value) > 0,
  //   { message: () => "Price must be positive" }
  // )
});

// Helper function for custom validation
export const validateRecordWithCustomRules = Schema.decodeUnknownSync(CustomRecordSchema);

// Type inference helpers
export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;
export type AppRecordEncoded = Schema.Schema.Encoded<typeof RecordSchema>;
`;
};