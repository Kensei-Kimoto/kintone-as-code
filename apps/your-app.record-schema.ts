import { Schema } from 'effect';
import { 
  convertFormFieldsToRecordSchema, 
  createRecordSchemaFromForm,
  decodeKintoneRecord 
} from 'kintone-effect-schema';
import { appFieldsConfig } from './your-app.schema.js';

// Generate record schema from form field definitions
const recordSchemas = convertFormFieldsToRecordSchema(appFieldsConfig);

// Export the record schema for type-safe record validation
export const RecordSchema = Schema.Struct(recordSchemas);

// Helper function for record validation with normalization
// Normalizes empty values for both REST API and JavaScript API
export const validateRecord = (record: unknown) => {
  // First normalize the record (handle undefined, empty strings, etc.)
  const normalizedRecord = decodeKintoneRecord(record);
  // Then validate with schema
  return Schema.decodeUnknownSync(RecordSchema)(normalizedRecord);
};

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

// Helper function for custom validation with normalization
export const validateRecordWithCustomRules = (record: unknown) => {
  const normalizedRecord = decodeKintoneRecord(record);
  return Schema.decodeUnknownSync(CustomRecordSchema)(normalizedRecord);
};

// Type inference helpers
export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;
export type AppRecordEncoded = Schema.Schema.Encoded<typeof RecordSchema>;
