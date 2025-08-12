import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { exportCommand } from '../export.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { loadConfig } from '../../core/config.js';
import { generateQueryBuilder } from '../../core/query-generator.js';

// モック
vi.mock('@kintone/rest-api-client');
vi.mock('fs/promises');
vi.mock('../../core/config.js');
vi.mock('../../core/converter.js', () => ({
  convertKintoneFieldsToSchema: vi.fn().mockReturnValue('// Schema content'),
  generateStaticRecordSchemaCode: vi.fn().mockReturnValue('// Record schema content'),
}));

describe('export command with --with-query option', () => {
  const mockClient = {
    app: {
      getFormFields: vi.fn(),
    },
  };

  const mockFormFields = {
    properties: {
      '会社名': {
        type: 'SINGLE_LINE_TEXT',
        code: '会社名',
        label: '会社名',
        noLabel: false,
        required: true,
      },
      '売上高': {
        type: 'NUMBER',
        code: '売上高',
        label: '売上高',
        noLabel: false,
        required: false,
      },
      'ステータス': {
        type: 'DROP_DOWN',
        code: 'ステータス',
        label: 'ステータス',
        options: {
          '商談中': { label: '商談中', index: '0' },
          '受注': { label: '受注', index: '1' },
          '失注': { label: '失注', index: '2' },
        },
      },
      '契約日': {
        type: 'DATE',
        code: '契約日',
        label: '契約日',
      },
      '担当者': {
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
    loadConfig.mockResolvedValue({
      default: 'test',
      environments: {
        test: {
          auth: {
            baseUrl: 'https://test.cybozu.com',
            apiToken: 'test-token',
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
      });

      // クエリビルダーファイルが生成されないことを確認
      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCalls = calls.filter(call => 
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
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find(call => 
        call[0].toString().includes('.query.ts')
      );
      
      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;
      
      // QueryFieldsオブジェクトが含まれることを確認
      expect(content).toContain('export const QueryFields = {');
      expect(content).toContain('会社名: createStringField(\'会社名\')');
      expect(content).toContain('売上高: createNumberField(\'売上高\')');
      expect(content).toContain('ステータス: createDropdownField(\'ステータス\'');
      expect(content).toContain('契約日: createDateField(\'契約日\')');
      expect(content).toContain('担当者: createUserField(\'担当者\')');
    });

    it('生成されるクエリビルダーにcreateQuery関数が含まれる', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find(call => 
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
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find(call => 
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
      expect(content).toContain('from \'kintone-as-code\'');
    });

    it('ドロップダウンフィールドのオプションが正しく生成される', async () => {
      await exportCommand({
        appId: '123',
        name: 'test-app',
        output: 'apps',
        withRecordSchema: true,
        withQuery: true,
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find(call => 
        call[0].toString().includes('.query.ts')
      );
      
      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;
      
      // ドロップダウンのオプションが含まれることを確認
      expect(content).toContain('[\'商談中\', \'受注\', \'失注\'] as const');
    });

    it('サブテーブル内のフィールドは除外される', async () => {
      const mockFieldsWithSubtable = {
        properties: {
          ...mockFormFields.properties,
          'サブテーブル': {
            type: 'SUBTABLE',
            code: 'サブテーブル',
            fields: {
              '商品名': {
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
      });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      const queryFileCall = calls.find(call => 
        call[0].toString().includes('.query.ts')
      );
      
      expect(queryFileCall).toBeDefined();
      const content = queryFileCall?.[1] as string;
      
      // サブテーブル自体とその中のフィールドが含まれないことを確認
      expect(content).not.toContain('サブテーブル');
      expect(content).not.toContain('商品名');
    });
  });
});