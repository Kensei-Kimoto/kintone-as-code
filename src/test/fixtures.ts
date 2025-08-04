import type { AnyFieldProperties } from 'kintone-effect-schema';

// Mock configuration
export const mockConfig = {
  default: 'development',
  environments: {
    development: {
      auth: {
        baseUrl: 'https://test.cybozu.com',
        username: 'test-user',
        password: 'test-password',
      },
    },
    production: {
      auth: {
        baseUrl: 'https://prod.cybozu.com',
        username: 'prod-user',
        password: 'prod-password',
      },
    },
  },
};

// Mock field properties
export const mockSingleLineTextField: AnyFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'testField',
  label: 'Test Field',
  noLabel: false,
  required: true,
  defaultValue: '',
  unique: false,
  minLength: '0',
  maxLength: '100',
  expression: '',
  hideExpression: false,
};

export const mockNumberField: AnyFieldProperties = {
  type: 'NUMBER',
  code: 'numberField',
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
};

// Mock schema
export const mockSchema = {
  appId: '123',
  name: 'Test App',
  description: 'Test app description',
  fieldsConfig: {
    properties: {
      testField: mockSingleLineTextField,
      numberField: mockNumberField,
    },
  },
};

// Mock kintone API responses
export const mockFormFieldsResponse = {
  properties: {
    レコード番号: {
      type: 'RECORD_NUMBER',
      code: 'レコード番号',
      label: 'レコード番号',
      noLabel: false,
    },
    testField: {
      type: 'SINGLE_LINE_TEXT',
      code: 'testField',
      label: 'Test Field',
      noLabel: false,
      required: true,
      defaultValue: '',
      unique: false,
      minLength: '0',
      maxLength: '100',
      expression: '',
      hideExpression: false,
    },
  },
  revision: '1',
};