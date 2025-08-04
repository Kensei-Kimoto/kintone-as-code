import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertKintoneFieldsToSchema } from '../converter.js';
import { mockFormFieldsResponse } from '../../test/fixtures.js';

describe('convertKintoneFieldsToSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert kintone fields to schema code successfully', () => {
    const schemaCode = convertKintoneFieldsToSchema(mockFormFieldsResponse);
    
    expect(schemaCode).toContain('import type {');
    expect(schemaCode).toContain('from \'kintone-effect-schema\'');
    expect(schemaCode).toContain('export const レコード番号Field');
    expect(schemaCode).toContain('export const testFieldField');
    expect(schemaCode).toContain('export const appFieldsConfig');
    expect(schemaCode).toContain('defineAppSchema');
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
    
    expect(schemaCode).toContain('SingleLineTextFieldProperties');
    expect(schemaCode).toContain('NumberFieldProperties');
    expect(schemaCode).toContain('RadioButtonFieldProperties');
    expect(schemaCode).toContain('export const textField');
    expect(schemaCode).toContain('export const numberField');
    expect(schemaCode).toContain('export const radioField');
  });

  it('should handle subtable fields', () => {
    const fieldsWithSubtable = {
      properties: {
        subtable: {
          type: 'SUBTABLE',
          code: 'subtable',
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
    
    expect(schemaCode).toContain('SubtableFieldProperties');
    expect(schemaCode).toContain('export const subtableField');
    expect(schemaCode).toContain('fields: {');
    expect(schemaCode).toContain('subfield1:');
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
    
    expect(schemaCode).toContain('// No fields to generate');
    expect(schemaCode).toContain('defineAppSchema');
    expect(schemaCode).toContain('fieldsConfig: appFieldsConfig');
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
    
    expect(schemaCode).toContain('export const field_with_underscoreField');
    expect(schemaCode).toContain('field_with_underscore:');
  });
});