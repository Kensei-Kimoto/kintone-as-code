import { describe, it, expect } from 'vitest';
import { generateQueryBuilder } from '../query-generator.js';

describe('generateQueryBuilder deterministic output', () => {
  const mockFormFields = {
    properties: {
      会社名: {
        type: 'SINGLE_LINE_TEXT',
        code: '会社名',
        label: '会社名',
      },
      ステータス: {
        type: 'DROP_DOWN',
        code: 'ステータス',
        label: 'ステータス',
        options: {
          商談中: { label: '商談中', index: '0' },
          受注: { label: '受注', index: '1' },
          失注: { label: '失注', index: '2' },
        },
      },
      契約日: {
        type: 'DATE',
        code: '契約日',
        label: '契約日',
      },
      売上高: {
        type: 'NUMBER',
        code: '売上高',
        label: '売上高',
      },
      担当者: {
        type: 'USER_SELECT',
        code: '担当者',
        label: '担当者',
      },
    },
  };

  it('should generate identical output for multiple calls with same input', () => {
    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: false };

    // Generate multiple times
    const result1 = generateQueryBuilder(mockFormFields, appName, options);
    const result2 = generateQueryBuilder(mockFormFields, appName, options);
    const result3 = generateQueryBuilder(mockFormFields, appName, options);

    // All results should be identical
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it('should not contain timestamp in generated content', () => {
    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: false };

    const result = generateQueryBuilder(mockFormFields, appName, options);

    // Should not contain @generated with timestamp
    expect(result).not.toMatch(/@generated\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result).not.toMatch(/new Date\(\)\.toISOString\(\)/);
  });

  it('should have consistent field order for same input', () => {
    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: false };

    const result1 = generateQueryBuilder(mockFormFields, appName, options);
    const result2 = generateQueryBuilder(mockFormFields, appName, options);

    // Extract QueryFields section
    const queryFieldsRegex = /export const QueryFields = \{([\s\S]*?)\} as const;/;
    const match1 = result1.match(queryFieldsRegex);
    const match2 = result2.match(queryFieldsRegex);

    expect(match1).toBeTruthy();
    expect(match2).toBeTruthy();
    expect(match1![1]).toBe(match2![1]);
  });

  it('should have consistent import order for same input', () => {
    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: false };

    const result1 = generateQueryBuilder(mockFormFields, appName, options);
    const result2 = generateQueryBuilder(mockFormFields, appName, options);

    // Extract import section
    const importRegex = /import \{([\s\S]*?)\} from 'kintone-as-code';/;
    const match1 = result1.match(importRegex);
    const match2 = result2.match(importRegex);

    expect(match1).toBeTruthy();
    expect(match2).toBeTruthy();
    expect(match1![1]).toBe(match2![1]);
  });

  it('should generate same content with subtable options', () => {
    const formFieldsWithSubtable = {
      properties: {
        ...mockFormFields.properties,
        サブテーブル: {
          type: 'SUBTABLE',
          code: 'サブテーブル',
          fields: {
            商品名: {
              type: 'SINGLE_LINE_TEXT',
              code: '商品名',
            },
            価格: {
              type: 'NUMBER',
              code: '価格',
            },
          },
        },
      },
    };

    const appName = 'test-app';
    const options = { includeSubtable: true, includeRelated: false };

    const result1 = generateQueryBuilder(formFieldsWithSubtable, appName, options);
    const result2 = generateQueryBuilder(formFieldsWithSubtable, appName, options);

    expect(result1).toBe(result2);
  });

  it('should generate same content with related fields options', () => {
    const formFieldsWithRelated = {
      properties: {
        ...mockFormFields.properties,
        関連一覧: {
          type: 'REFERENCE_TABLE',
          code: '関連一覧',
          referenceTable: {
            displayFields: ['会社名', '担当者'],
          },
        },
      },
    };

    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: true };

    const result1 = generateQueryBuilder(formFieldsWithRelated, appName, options);
    const result2 = generateQueryBuilder(formFieldsWithRelated, appName, options);

    expect(result1).toBe(result2);
  });

  it('should generate consistent warnings for unsupported fields', () => {
    const formFieldsWithUnsupported = {
      properties: {
        ...mockFormFields.properties,
        添付ファイル: {
          type: 'FILE',
          code: '添付ファイル',
        },
        カテゴリ: {
          type: 'CATEGORY',
          code: 'カテゴリ',
        },
      },
    };

    const appName = 'test-app';
    const options = { includeSubtable: false, includeRelated: false };

    const result1 = generateQueryBuilder(formFieldsWithUnsupported, appName, options);
    const result2 = generateQueryBuilder(formFieldsWithUnsupported, appName, options);

    expect(result1).toBe(result2);

    // Should contain warning comments in consistent order
    expect(result1).toContain('// 添付ファイル: FILE type is not supported');
    expect(result1).toContain('// カテゴリ: CATEGORY type is not supported');
  });
});