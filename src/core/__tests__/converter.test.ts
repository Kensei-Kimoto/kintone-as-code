import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertKintoneFieldsToSchema } from '../converter.js';
import { mockFormFieldsResponse } from '../../test/fixtures.js';

describe('convertKintoneFieldsToSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert kintone fields to schema code successfully (new API)', () => {
    const schemaCode = convertKintoneFieldsToSchema(mockFormFieldsResponse);

    // 新APIのコード生成を確認（値と型の明確な分離）
    expect(schemaCode).toContain("from 'kintone-effect-schema'");
    expect(schemaCode).toContain('export const formProperties');
    expect(schemaCode).toContain('export const FormPropertiesSchema');
    expect(schemaCode).toContain('defineAppSchema');
    expect(schemaCode).toContain('fieldsConfig: formProperties');
    // フィールドコードが含まれていること（日本語/英数字）
    expect(schemaCode).toContain('レコード番号');
    expect(schemaCode).toContain('testField');
  });

  it('should handle fields with various types', () => {
    const fieldsWithTypes = {
      properties: {
        text: {
          type: 'SINGLE_LINE_TEXT',
          code: 'text',
          label: 'Text Field',
          noLabel: false,
          required: true,
          defaultValue: '',
          unique: false,
          minLength: '0',
          maxLength: '100',
          expression: '',
          hideExpression: false,
        },
        number: {
          type: 'NUMBER',
          code: 'number',
          label: 'Number Field',
          noLabel: false,
          required: false,
          defaultValue: '0',
          unique: false,
          minValue: '0',
          maxValue: '1000',
          digit: false,
          displayScale: '0',
          unit: '円',
          unitPosition: 'AFTER',
        },
        radio: {
          type: 'RADIO_BUTTON',
          code: 'radio',
          label: 'Radio Field',
          noLabel: false,
          required: true,
          options: {
            option1: { label: 'Option 1', index: '0' },
            option2: { label: 'Option 2', index: '1' },
          },
          defaultValue: 'option1',
          align: 'HORIZONTAL',
        },
      },
      revision: '1',
    };

    const schemaCode = convertKintoneFieldsToSchema(fieldsWithTypes);
    
    // 新APIでは個々の Field 定数は生成しないため、
    // formProperties（値）にフィールドコードが含まれることを確認
    expect(schemaCode).toContain('formProperties');
    expect(schemaCode).toContain('text');
    expect(schemaCode).toContain('number');
    expect(schemaCode).toContain('radio');
  });

  it('should handle subtable fields', () => {
    const fieldsWithSubtable = {
      properties: {
        subtable: {
          type: 'SUBTABLE',
          code: 'subtable',
          label: 'Subtable',
          noLabel: false,
          fields: {
            subfield1: {
              type: 'SINGLE_LINE_TEXT',
              code: 'subfield1',
              label: 'Sub Field 1',
              noLabel: false,
              required: true,
              defaultValue: '',
              unique: false,
              minLength: '',
              maxLength: '',
              expression: '',
              hideExpression: false,
            },
          },
        },
      },
      revision: '1',
    };

    const schemaCode = convertKintoneFieldsToSchema(fieldsWithSubtable);
    
    // サブテーブルの存在を formProperties 側で確認
    expect(schemaCode).toContain('formProperties');
    expect(schemaCode).toContain('SUBTABLE');
    expect(schemaCode).toContain('subfield1');
  });

  it('should throw error for invalid field data', () => {
    const invalidData = {
      properties: {
        invalid: {
          // Missing required type field
          code: 'invalid',
          label: 'Invalid Field',
        },
      },
      revision: '1',
    };

    expect(() => convertKintoneFieldsToSchema(invalidData)).toThrow('Schema validation failed');
  });

  it('should handle empty properties', () => {
    const emptyFields = {
      properties: {},
      revision: '1',
    };

    const schemaCode = convertKintoneFieldsToSchema(emptyFields);
    // 新APIでは値・型のモジュールと defineAppSchema の構成
    expect(schemaCode).toContain('export const formProperties');
    expect(schemaCode).toContain('export const FormPropertiesSchema');
    expect(schemaCode).toContain('defineAppSchema');
    expect(schemaCode).toContain('fieldsConfig: formProperties');
  });

  it('should preserve field names with special characters', () => {
    const fieldsWithSpecialNames = {
      properties: {
        'field_with_underscore': {
          type: 'SINGLE_LINE_TEXT',
          code: 'field_with_underscore',
          label: 'Field with underscore',
          noLabel: false,
          required: true,
          defaultValue: '',
          unique: false,
          minLength: '',
          maxLength: '',
          expression: '',
          hideExpression: false,
        },
      },
      revision: '1',
    };

    const schemaCode = convertKintoneFieldsToSchema(fieldsWithSpecialNames);
    
    // 変数名ではなく、プロパティ名として含まれること
    expect(schemaCode).toContain('field_with_underscore');
  });
});
