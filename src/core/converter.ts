import { Schema } from 'effect';
import { GetFormFieldsResponseSchema as FormFieldsSchema } from 'kintone-effect-schema';

function hasErrorsProperty(e: unknown): e is { errors: unknown } {
  return typeof e === 'object' && e !== null && 'errors' in e;
}

export const convertKintoneFieldsToSchema = (
  rawFields: unknown,
  appConstantName?: string,
  appName?: string
): string => {
  try {
    const parsed = Schema.decodeUnknownSync(FormFieldsSchema)(rawFields);
    // READMEスタイル: 個別フィールド定義 + appFieldsConfig（固定）
    const classicCode = generateFieldsConfigCode(parsed.properties as any);
    // 安全な式生成（コードインジェクション回避）
    const safeNameExpr = JSON.stringify(appName ?? 'Exported App');
    const appIdExpr = appConstantName
      ? /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(appConstantName)
        ? `.${appConstantName}`
        : `[${JSON.stringify(appConstantName)}]`
      : `.MY_APP`;
    return `${classicCode}

import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS${appIdExpr},
  name: ${safeNameExpr},
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig
});`;
  } catch (error) {
    // バリデーションに失敗した場合でも、最低限の `properties` があれば寛容にフォールバック
    console.error('Failed to parse kintone fields (will try fallback):', error);
    try {
      if (
        typeof rawFields === 'object' &&
        rawFields !== null &&
        'properties' in (rawFields as Record<string, unknown>) &&
        typeof (rawFields as any).properties === 'object'
      ) {
        const props = (rawFields as any).properties as Record<string, unknown>;
        // プロパティの最低限バリデーション: 各フィールドが type:string を持つこと
        const allFieldsHaveType = Object.values(props).every(
          (v) =>
            typeof v === 'object' &&
            v !== null &&
            typeof (v as any).type === 'string'
        );
        if (!allFieldsHaveType) {
          throw new Error('Schema validation failed during export.');
        }
        const classicCode = generateFieldsConfigCode(props);
        const safeNameExpr = JSON.stringify(appName ?? 'Exported App');
        const appIdExpr = appConstantName
          ? /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(appConstantName)
            ? `.${appConstantName}`
            : `[${JSON.stringify(appConstantName)}]`
          : `.MY_APP`;
        return `${classicCode}

import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS${appIdExpr},
  name: ${safeNameExpr},
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig
});`;
      }
    } catch {
      // フォールバックも失敗した場合は従来どおりエラー
    }
    if (hasErrorsProperty(error)) {
      console.error(
        'Validation errors:',
        JSON.stringify(error.errors, null, 2)
      );
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

// Generate record schema from form field definitions (README style)
const recordSchemas = convertFormFieldsToRecordSchema(appFieldsConfig.properties as any);

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
export const CustomRecordSchema = createRecordSchemaFromForm(appFieldsConfig.properties as any, {
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

// Generate a static record schema (no runtime converters in the output)
export function generateStaticRecordSchemaCode(
  _schemaName: string,
  properties: Record<string, any>
): string {
  const FIELD_TYPE_TO_RECORD_SCHEMA: Record<string, string> = {
    SINGLE_LINE_TEXT: 'SingleLineTextFieldSchema',
    MULTI_LINE_TEXT: 'MultiLineTextFieldSchema',
    RICH_TEXT: 'RichTextFieldSchema',
    NUMBER: 'NumberFieldSchema',
    CALC: 'CalcFieldSchema',
    RADIO_BUTTON: 'RadioButtonFieldSchema',
    CHECK_BOX: 'CheckBoxFieldSchema',
    MULTI_SELECT: 'MultiSelectFieldSchema',
    DROP_DOWN: 'DropDownFieldSchema',
    DATE: 'DateFieldSchema',
    TIME: 'TimeFieldSchema',
    DATETIME: 'DateTimeFieldSchema',
    LINK: 'LinkFieldSchema',
    USER_SELECT: 'UserSelectFieldSchema',
    ORGANIZATION_SELECT: 'OrganizationSelectFieldSchema',
    GROUP_SELECT: 'GroupSelectFieldSchema',
    FILE: 'FileFieldSchema',
    RECORD_NUMBER: 'RecordNumberFieldSchema',
    CREATOR: 'CreatorFieldSchema',
    CREATED_TIME: 'CreatedTimeFieldSchema',
    MODIFIER: 'ModifierFieldSchema',
    UPDATED_TIME: 'UpdatedTimeFieldSchema',
    STATUS: 'StatusFieldSchema',
    STATUS_ASSIGNEE: 'StatusAssigneeFieldSchema',
    CATEGORY: 'CategoryFieldSchema',
    RECORD_ID: 'RecordIdFieldSchema',
    REVISION: 'RevisionFieldSchema',
  };

  const importSet = new Set<string>(['decodeKintoneRecord']);
  const entries: string[] = [];

  for (const [code, field] of Object.entries(properties)) {
    const f = field as { type: string; fields?: Record<string, any> };
    if (
      f.type === 'REFERENCE_TABLE' ||
      f.type === 'GROUP' ||
      f.type === 'SPACER' ||
      f.type === 'LABEL'
    ) {
      continue;
    }
    if (f.type === 'SUBTABLE' && f.fields) {
      const innerTypes = new Set<string>();
      for (const sub of Object.values(f.fields)) {
        const schemaConst =
          FIELD_TYPE_TO_RECORD_SCHEMA[(sub as any).type as string];
        if (schemaConst) innerTypes.add(schemaConst);
      }
      for (const t of innerTypes) importSet.add(t);
      const unionExpr =
        innerTypes.size > 0
          ? `Schema.Union(${Array.from(innerTypes).join(', ')})`
          : 'Schema.Unknown';
      entries.push(`  ${JSON.stringify(code)}: Schema.Struct({
    type: Schema.Literal('SUBTABLE'),
    value: Schema.Array(Schema.Struct({
      id: Schema.String,
      value: Schema.Record({ key: Schema.String, value: ${unionExpr} })
    }))
  })`);
      continue;
    }
    const schemaConst = FIELD_TYPE_TO_RECORD_SCHEMA[f.type];
    if (!schemaConst) continue;
    importSet.add(schemaConst);
    const needsQuotes =
      code.startsWith('$') || !/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(code);
    const key = needsQuotes ? JSON.stringify(code) : code;
    entries.push(`  ${key}: ${schemaConst}`);
  }

  const importList = Array.from(importSet).sort((a, b) => a.localeCompare(b));
  const imports = `import { ${importList.join(', ')} } from 'kintone-effect-schema';`;

  return `import { Schema } from 'effect';
${imports}

// Static record schema generated from form definition
export const RecordSchema = Schema.Struct({
${entries.join(',\n')}
});

export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;
export type AppRecordEncoded = Schema.Schema.Encoded<typeof RecordSchema>;

export const validateRecord = (record: Record<string, unknown>): AppRecord => {
  const normalizedRecord = decodeKintoneRecord(record);
  return Schema.decodeUnknownSync(RecordSchema)(normalizedRecord);
};
`;
}
// --- Local generator removed in favor of official implementation ---
function generateFieldsConfigCode(properties: Record<string, unknown>): string {
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
  const fieldVariables: Array<{ code: string; varName: string }> = [];

  // helper: convert field code to variable name
  function toVariableName(code: string): string {
    if (code.startsWith('$')) return code + 'Field';
    if (/^[0-9]/.test(code)) return '_' + code + 'Field';
    if (/^[\p{L}\p{Nl}$_][\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$]*$/u.test(code))
      return code + 'Field';
    let varName = code.replace(
      /[^\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$_]/gu,
      '_'
    );
    varName = varName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (!varName || /^[0-9]/.test(varName))
      varName = 'field_' + (varName || 'generated');
    return varName + 'Field';
  }

  function isReservedWord(word: string): boolean {
    const reserved = new Set([
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'export',
      'extends',
      'finally',
      'for',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'new',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
      'enum',
      'implements',
      'interface',
      'let',
      'package',
      'private',
      'protected',
      'public',
      'static',
      'await',
      'abstract',
      'boolean',
      'byte',
      'char',
      'double',
      'final',
      'float',
      'goto',
      'int',
      'long',
      'native',
      'short',
      'synchronized',
      'throws',
      'transient',
      'volatile',
    ]);
    return reserved.has(word);
  }

  function valueToCode(value: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map((v) => valueToCode(v, indent + 1));
      if (items.every((i) => i.length < 40) && items.join(', ').length < 60)
        return `[${items.join(', ')}]`;
      return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
    }
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, unknown>).filter(
        ([, v]) => v !== undefined
      );
      if (entries.length === 0) return '{}';
      const props = entries.map(([key, val]) => {
        const needsQuotes =
          !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || isReservedWord(key);
        const keyStr = needsQuotes ? JSON.stringify(key) : key;
        const valStr = valueToCode(val, indent + 1);
        return `${spaces}  ${keyStr}: ${valStr}`;
      });
      return `{\n${props.join(',\n')}\n${spaces}}`;
    }
    return JSON.stringify(value);
  }

  function isSubtable(f: AllField): boolean {
    return f.type === 'SUBTABLE' && 'fields' in f;
  }

  for (const [code, cfg] of Object.entries(properties)) {
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
    const toSerialize: unknown = field;
    const defCode = valueToCode(toSerialize, 0);
    fieldDefinitions.push(`export const ${varName}: ${tsType} = ${defCode};`);
    fieldVariables.push({ code, varName });
  }

  const sortedTypes = Array.from(typeNames).sort();
  const imports = `import type {\n  ${sortedTypes.join(',\n  ')}\n} from 'kintone-effect-schema';`;
  const configEntries = fieldVariables.map(({ code, varName }) => {
    const needsQuotes =
      code.startsWith('$') ||
      !/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(code) ||
      isReservedWord(code);
    const key = needsQuotes ? JSON.stringify(code) : code;
    return `    ${key}: ${varName}`;
  });
  const appConfig = `export const appFieldsConfig = {\n  properties: {\n${configEntries.join(',\n')}\n  }\n};`;
  return [imports, '', ...fieldDefinitions, '', appConfig].join('\n');
}
// Temporary: keep function referenced to satisfy noUnusedLocals
export const __keep = generateFieldsConfigCode;
