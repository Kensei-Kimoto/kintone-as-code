import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { exportCommand } from '../export.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { loadConfig } from '../../core/config.js';

// モック
vi.mock('@kintone/rest-api-client');
vi.mock('fs/promises');
vi.mock('../../core/config.js');

// process.exit をモック
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});
vi.mock('../../core/converter.js', () => ({
  convertKintoneFieldsToSchema: vi.fn().mockReturnValue('// Schema content'),
  generateStaticRecordSchemaCode: vi
    .fn()
    .mockReturnValue('// Record schema content'),
}));

describe('export command appId validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error for invalid appId (NaN)', async () => {
    // RED: This test should fail initially because appId validation is not implemented
    await expect(
      exportCommand({
        appId: 'invalid-app-id',
        name: 'test-app',
        includeRelated: false,
        includeSubtable: false,
      })
    ).rejects.toThrow('process.exit called');
    
    // Verify that process.exit was called due to validation error
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should throw error for empty appId', async () => {
    mockExit.mockClear();
    await expect(
      exportCommand({
        appId: '',
        name: 'test-app',
        includeRelated: false,
        includeSubtable: false,
      })
    ).rejects.toThrow('process.exit called');
    
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should throw error for appId with mixed characters (123abc)', async () => {
    mockExit.mockClear();
    await expect(
      exportCommand({
        appId: '123abc',
        name: 'test-app',
        includeRelated: false,
        includeSubtable: false,
      })
    ).rejects.toThrow('process.exit called');
    
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should throw error for appId starting with letters (abc123)', async () => {
    mockExit.mockClear();
    await expect(
      exportCommand({
        appId: 'abc123',
        name: 'test-app',
        includeRelated: false,
        includeSubtable: false,
      })
    ).rejects.toThrow('process.exit called');
    
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should accept valid numeric appId', async () => {
    mockExit.mockClear();
    const mockClient = {
      app: { getFormFields: vi.fn().mockResolvedValue({ properties: {} }) },
    };
    
    vi.mocked(KintoneRestAPIClient).mockReturnValue(mockClient as any);
    vi.mocked(loadConfig).mockResolvedValue({
      default: 'test',
      environments: {
        test: {
          auth: {
            baseUrl: 'https://test.cybozu.com',
            username: 'test',
            password: 'test',
          },
        },
      },
    });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.realpath).mockResolvedValue('/Users/kimotokensei/Desktop/kintone-oss/kintone-as-code');
    vi.mocked(fs.rename).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    // This should not call process.exit for valid appId
    await expect(
      exportCommand({
        appId: '123',
        name: 'test-app',
        includeRelated: false,
        includeSubtable: false,
      })
    ).resolves.toBeUndefined();
    
    // Verify that process.exit was not called
    expect(mockExit).not.toHaveBeenCalled();
  });
});

describe('export command with --with-query option', () => {
  const mockClient = {
    app: {
      getFormFields: vi.fn(),
    },
  };

  const mockFormFields = {
    properties: {
      会社名: {
        type: 'SINGLE_LINE_TEXT',
        code: '会社名',
        label: '会社名',
        noLabel: false,
        required: true,
      },
      売上高: {
        type: 'NUMBER',
        code: '売上高',
        label: '売上高',
        noLabel: false,
        required: false,
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
      担当者: {
        type: 'USER_SELECT',
        code: '担当者',
        label: '担当者',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    KintoneRestAPIClient.mockImplementation(() => mockClient);
    mockClient.app.getFormFields.mockResolvedValue(mockFormFields);
    // @ts-ignore
    fs.mkdir.mockResolvedValue(undefined);
    // @ts-ignore
    fs.writeFile.mockResolvedValue(undefined);
    // @ts-ignore
    fs.readFile.mockRejectedValue(new Error('File not found'));
    // @ts-ignore
    fs.realpath.mockResolvedValue('/Users/kimotokensei/Desktop/kintone-oss/kintone-as-code');
    // @ts-ignore
    fs.rename.mockResolvedValue(undefined);
    // @ts-ignore
    fs.unlink.mockResolvedValue(undefined);
    // @ts-ignore
    loadConfig.mockResolvedValue({
      default: 'test',
      environments: {
        test: {
          auth: {
            baseUrl: 'https://test.cybozu.com',
            username: 'user',
            password: 'pass',
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('--with-query オプション', () => {
    it('--with-queryオプションでクエリビルダーファイルが生成される', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      // クエリビルダーファイルが生成されたことを確認
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-app.query.ts'),
        expect.any(String),
        'utf-8'
      );
    });

    it('デフォルトではクエリビルダーは生成されない', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: false,
        includeRelated: false,
        includeSubtable: false,
      });

      // クエリビルダーファイルが生成されないことを確認
      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCalls = calls.filter((call) =>
        call[0].toString().includes('.query.ts')
      );
      expect(queryFileCalls).toHaveLength(0);
    });

    it('生成されるクエリビルダーにQueryFieldsが含まれる', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );

      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      // QueryFieldsオブジェクトが含まれることを確認
      expect(content).toContain('export const QueryFields = {');
      expect(content).toContain("会社名: createStringField('会社名')");
      expect(content).toContain("売上高: createNumberField('売上高')");
      expect(content).toContain("ステータス: createDropdownField('ステータス'");
      expect(content).toContain("契約日: createDateField('契約日')");
      expect(content).toContain("担当者: createUserField('担当者')");
    });

    it('生成されるクエリビルダーにcreateQuery関数が含まれる', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );

      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      // createQuery関数が含まれることを確認
      expect(content).toContain('export const createQuery = ()');
    });

    it('必要なインポートが含まれる', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );

      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      // 必要なインポートが含まれることを確認
      expect(content).toContain('import {');
      expect(content).toContain('createStringField');
      expect(content).toContain('createNumberField');
      expect(content).toContain('createDropdownField');
      expect(content).toContain('createDateField');
      expect(content).toContain('createUserField');
      expect(content).toContain("from 'kintone-as-code'");
    });

    it('ドロップダウンフィールドのオプションが正しく生成される', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );

      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      // ドロップダウンのオプションが含まれることを確認
      expect(content).toContain("['商談中', '受注', '失注'] as const");
    });

    it('サブテーブル内のフィールドは除外される', async () => {
      const mockFieldsWithSubtable = {
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
            },
          },
        },
      };

      mockClient.app.getFormFields.mockResolvedValue(mockFieldsWithSubtable);

      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: false,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );

      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      // サブテーブル自体とその中のフィールドが含まれないことを確認
      expect(content).not.toContain('サブテーブル');
      expect(content).not.toContain('商品名');
    });

    it('include-subtable オプションでサブテーブル子フィールドを出力できる', async () => {
      const mockFieldsWithSubtable = {
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
            },
          },
        },
      };

      mockClient.app.getFormFields.mockResolvedValue(mockFieldsWithSubtable);

      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeSubtable: true,
        includeRelated: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );
      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      expect(content).toContain('createTableSubField');
      expect(content).toContain(
        "サブテーブル: {\n    商品名: createTableSubField('サブテーブル.商品名')\n  }"
      );
    });

    it('include-related オプションで関連レコードの表示フィールドを出力できる', async () => {
      const mockFieldsWithRelated = {
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

      mockClient.app.getFormFields.mockResolvedValue(mockFieldsWithRelated);

      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
        includeRelated: true,
        includeSubtable: false,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find((call) =>
        call[0].toString().includes('.query.ts')
      );
      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;

      expect(content).toContain('createTableSubField');
      expect(content).toContain(
        "関連一覧: {\n    会社名: createTableSubField('関連一覧.会社名'),\n    担当者: createTableSubField('関連一覧.担当者')\n  }"
      );
    });
  });
});
