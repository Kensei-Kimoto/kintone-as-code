import { Schema } from 'effect';
import { GetFormFieldsResponseSchema as FormFieldsSchema, fieldsConfigToTypeScriptCode } from 'kintone-effect-schema';

function hasErrorsProperty(e: unknown): e is { errors: unknown } {
  return typeof e === 'object' && e !== null && 'errors' in e;
}

export const convertKintoneFieldsToSchema = (rawFields: unknown, appConstantName?: string, appName?: string): string => {
  try {
    const parsed = Schema.decodeUnknownSync(FormFieldsSchema)(rawFields);

    // Generate TypeScript code using official generator (0.7.1+ preserves SUBTABLE labels)
    const schemaCode = fieldsConfigToTypeScriptCode(parsed.properties as any);

    // Import helper functions and app IDs from local utils
    return `import { defineAppSchema } from '../utils/helpers.js';
import { APP_IDS } from '../utils/app-ids.js';
${schemaCode}

// Export app schema configuration
export default defineAppSchema({
  appId: APP_IDS.${appConstantName || 'MY_APP'},
  name: '${appName || 'Exported App'}',
  description: 'This schema was exported from kintone.',
  
  // Use the generated fields configuration
  fieldsConfig: appFieldsConfig
});`;
  } catch (error) {
    console.error('Failed to parse kintone fields:', error);
    if (hasErrorsProperty(error)) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    throw new Error('Schema validation failed during export.');
  }
};

export const generateRecordSchemaCode = (schemaName: string): string => {
  // Generate TypeScript code for record schema that imports from the field schema
  const baseName = schemaName.replace(/\.schema$/, '');

  return `import { Schema } from 'effect';
import { 
  convertFormFieldsToRecordSchema, 
  createRecordSchemaFromForm,
  decodeKintoneRecord 
} from 'kintone-effect-schema';
import { appFieldsConfig } from './${baseName}.schema.js';

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
`;
};

// --- Local generator removed in favor of official implementation ---
function generateFieldsConfigCode(_: Record<string, unknown>): string {
  type AllField = Record<string, unknown> & { type: string; code?: string };

  const FIELD_TYPE_TO_TS_TYPE: Record<string, string> = {
    SINGLE_LINE_TEXT: 'SingleLineTextFieldProperties',
    MULTI_LINE_TEXT: 'MultiLineTextFieldProperties',
    RICH_TEXT: 'RichTextFieldProperties',
    NUMBER: 'NumberFieldProperties',
    CALC: 'CalcFieldProperties',
    RADIO_BUTTON: 'RadioButtonFieldProperties',
    CHECK_BOX: 'CheckBoxFieldProperties',
    MULTI_SELECT: 'MultiSelectFieldProperties',
    DROP_DOWN: 'DropDownFieldProperties',
    DATE: 'DateFieldProperties',
    TIME: 'TimeFieldProperties',
    DATETIME: 'DateTimeFieldProperties',
    LINK: 'LinkFieldProperties',
    USER_SELECT: 'UserSelectFieldProperties',
    ORGANIZATION_SELECT: 'OrganizationSelectFieldProperties',
    GROUP_SELECT: 'GroupSelectFieldProperties',
    FILE: 'FileFieldProperties',
    REFERENCE_TABLE: 'ReferenceTableFieldProperties',
    RECORD_NUMBER: 'RecordNumberFieldProperties',
    CREATOR: 'CreatorFieldProperties',
    CREATED_TIME: 'CreatedTimeFieldProperties',
    MODIFIER: 'ModifierFieldProperties',
    UPDATED_TIME: 'UpdatedTimeFieldProperties',
    STATUS: 'StatusFieldProperties',
    STATUS_ASSIGNEE: 'StatusAssigneeFieldProperties',
    CATEGORY: 'CategoryFieldProperties',
    SUBTABLE: 'SubtableFieldProperties',
    GROUP: 'GroupFieldProperties',
    RECORD_ID: 'RecordIdFieldProperties',
    REVISION: 'RevisionFieldProperties',
    __ID__: 'SystemIdFieldProperties',
    __REVISION__: 'SystemRevisionFieldProperties',
    SPACER: 'SpacerFieldProperties',
    LABEL: 'LabelFieldProperties',
  };

  const typeNames = new Set<string>();
  const fieldDefinitions: string[] = [];
  const fieldVariables: Array<{ code: string; varName: string } > = [];

  // helper: convert field code to variable name
  function toVariableName(code: string): string {
    if (code.startsWith('$')) return code + 'Field';
    if (/^[0-9]/.test(code)) return '_' + code + 'Field';
    if (/^[\p{L}\p{Nl}$_][\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$]*$/u.test(code)) return code + 'Field';
    let varName = code.replace(/[^\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$_]/gu, '_');
    varName = varName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (!varName || /^[0-9]/.test(varName)) varName = 'field_' + (varName || 'generated');
    return varName + 'Field';
  }

  function isReservedWord(word: string): boolean {
    const reserved = new Set([
      'break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','function','if','import','in','instanceof','new','return','super','switch','this','throw','try','typeof','var','void','while','with','yield','enum','implements','interface','let','package','private','protected','public','static','await','abstract','boolean','byte','char','double','final','float','goto','int','long','native','short','synchronized','throws','transient','volatile'
    ]);
    return reserved.has(word);
  }

  function valueToCode(value: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map(v => valueToCode(v, indent + 1));
      if (items.every(i => i.length < 40) && items.join(', ').length < 60) return `[${items.join(', ')}]`;
      return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
    }
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, unknown>).filter(([,v]) => v !== undefined);
      if (entries.length === 0) return '{}';
      const props = entries.map(([key, val]) => {
        const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || isReservedWord(key);
        const keyStr = needsQuotes ? JSON.stringify(key) : key;
        const valStr = valueToCode(val, indent + 1);
        return `${spaces}  ${keyStr}: ${valStr}`;
      });
      return `{\n${props.join(',\n')}\n${spaces}}`;
    }
    return JSON.stringify(value);
  }

  function isSubtable(f: AllField): boolean { return f.type === 'SUBTABLE' && 'fields' in f; }

  for (const [code, cfg] of Object.entries({} as Record<string, unknown>)) {
    const field = cfg as AllField;
    const tsType = FIELD_TYPE_TO_TS_TYPE[field.type];
    if (!tsType) continue;
    typeNames.add(tsType);
    if (isSubtable(field)) {
      const sub = (field.fields ?? {}) as Record<string, AllField>;
      for (const child of Object.values(sub)) {
        const childTs = FIELD_TYPE_TO_TS_TYPE[child.type];
        if (childTs) typeNames.add(childTs);
      }
    }
    const varName = toVariableName(code);
    // For subtable, ensure label/noLabel are kept if provided by source
    let toSerialize: unknown = field;
    const defCode = valueToCode(toSerialize, 0);
    fieldDefinitions.push(`export const ${varName}: ${tsType} = ${defCode};`);
    fieldVariables.push({ code, varName });
  }

  const sortedTypes = Array.from(typeNames).sort();
  const imports = `import type {\n  ${sortedTypes.join(',\n  ')}\n} from 'kintone-effect-schema';`;
  const configEntries = fieldVariables.map(({ code, varName }) => {
    const needsQuotes = code.startsWith('$') || !/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(code) || isReservedWord(code);
    const key = needsQuotes ? JSON.stringify(code) : code;
    return `    ${key}: ${varName}`;
  });
  const appConfig = `export const appFieldsConfig = {\n  properties: {\n${configEntries.join(',\n')}\n  }\n};`;
  return [imports, '', ...fieldDefinitions, '', appConfig].join('\n');
}
// Temporary: keep function referenced to satisfy noUnusedLocals
export const __keep = generateFieldsConfigCode;
