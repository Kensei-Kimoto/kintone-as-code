import { describe, it, expect, beforeAll, vi } from 'vitest';
import { exportCommand } from '../commands/export.js';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import fs from 'fs/promises';
import path from 'path';
import { loadConfig } from '../core/config.js';
import {
  TODAY,
  THIS_MONTH,
  FROM_TODAY,
  LOGINUSER,
} from '../query/functions.js';
import { and, or, not } from '../query/expression.js';

// モック設定
vi.mock('@kintone/rest-api-client');
vi.mock('../core/config.js');
// E2Eで実際のクライアントを使わず、生成物作成を安定化させる
const mockClient = {
  app: {
    getFormFields: vi.fn(),
  },
  record: {
    getRecords: vi.fn(),
  },
};
vi.mock('../core/kintone-client.js', () => ({
  getKintoneClient: () => mockClient,
}));

describe('営業管理アプリのE2Eクエリビルダーテスト', () => {
  const SALES_APP_ID = '123';

  const mockFormFields = {
    properties: {
      会社名: {
        type: 'SINGLE_LINE_TEXT',
        code: '会社名',
        label: '会社名',
        required: true,
      },
      ステータス: {
        type: 'DROP_DOWN',
        code: 'ステータス',
        label: 'ステータス',
        options: {
          商談中: { label: '商談中', index: '0' },
          見積提出: { label: '見積提出', index: '1' },
          受注: { label: '受注', index: '2' },
          失注: { label: '失注', index: '3' },
          完了: { label: '完了', index: '4' },
          キャンセル: { label: 'キャンセル', index: '5' },
        },
      },
      商談開始日: {
        type: 'DATE',
        code: '商談開始日',
        label: '商談開始日',
      },
      売上見込額: {
        type: 'NUMBER',
        code: '売上見込額',
        label: '売上見込額',
      },
      担当者: {
        type: 'USER_SELECT',
        code: '担当者',
        label: '担当者',
      },
      期限日: {
        type: 'DATE',
        code: '期限日',
        label: '期限日',
      },
      売上高: {
        type: 'NUMBER',
        code: '売上高',
        label: '売上高',
      },
      契約数: {
        type: 'NUMBER',
        code: '契約数',
        label: '契約数',
      },
      継続年数: {
        type: 'NUMBER',
        code: '継続年数',
        label: '継続年数',
      },
      登録日: {
        type: 'DATETIME',
        code: '登録日',
        label: '登録日',
      },
      初回契約額: {
        type: 'NUMBER',
        code: '初回契約額',
        label: '初回契約額',
      },
      優先度: {
        type: 'RADIO_BUTTON',
        code: '優先度',
        label: '優先度',
        options: {
          最高: { label: '最高' },
          高: { label: '高' },
          中: { label: '中' },
          低: { label: '低' },
        },
      },
    },
  };

  beforeAll(async () => {
    // @ts-ignore
    KintoneRestAPIClient.mockImplementation(() => mockClient);
    mockClient.app.getFormFields.mockResolvedValue(mockFormFields);
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

    // ディレクトリ作成
    await fs.mkdir('apps', { recursive: true });

    // exportコマンド実行
    await exportCommand({
      appId: SALES_APP_ID,
      name: 'sales-app',
      withQuery: true,
      withRecordSchema: true,
    });
  });

  it('今月の商談中案件を抽出するクエリが生成できる', async () => {
    // 生成されたクエリビルダーファイルを動的インポート
    const queryModule = await import(
      path.resolve(process.cwd(), 'apps/sales-app.query.ts')
    );
    const { QueryFields, createQuery } = queryModule;
    const { ステータス, 商談開始日, 売上見込額 } = QueryFields;

    const query = createQuery()
      .where(
        and(
          ステータス.in(['商談中', '見積提出']),
          商談開始日.equals(THIS_MONTH()),
          売上見込額.greaterThan(1000000)
        )
      )
      .orderBy('売上見込額', 'desc')
      .limit(100)
      .build();

    expect(query).toContain('ステータス in ("商談中", "見積提出")');
    expect(query).toContain('商談開始日 = THIS_MONTH()');
    expect(query).toContain('売上見込額 > 1000000');
    expect(query).toContain('order by 売上見込額 desc');
    expect(query).toContain('limit 100');
  });

  it('自分が担当の期限が迫っている案件を抽出', async () => {
    const queryModule = await import(
      path.resolve(process.cwd(), 'apps/sales-app.query.ts')
    );
    const { QueryFields, createQuery } = queryModule;
    const { 担当者, 期限日, ステータス } = QueryFields;

    const query = createQuery()
      .where(
        and(
          担当者.equals(LOGINUSER()),
          期限日.lessThanOrEqual(FROM_TODAY(7, 'DAYS')),
          not(ステータス.in(['完了', 'キャンセル']))
        )
      )
      .orderBy('期限日', 'asc')
      .build();

    expect(query).toContain('担当者 = LOGINUSER()');
    expect(query).toContain('期限日 <= FROM_TODAY(7, "DAYS")');
    expect(query).toContain('not (ステータス in ("完了", "キャンセル"))');
    expect(query).toContain('order by 期限日 asc');
  });

  describe('複雑なクエリのパフォーマンステスト', () => {
    it('複雑なクエリが1秒以内に生成される', async () => {
      const queryModule = await import(
        path.resolve(process.cwd(), 'apps/sales-app.query.ts')
      );
      const { QueryFields, createQuery } = queryModule;
      const {
        会社名,
        売上高,
        ステータス,
        契約数,
        継続年数,
        登録日,
        初回契約額,
        担当者,
        優先度,
        期限日,
      } = QueryFields;

      const startTime = performance.now();

      const query = createQuery()
        .where(
          or(
            and(
              会社名.like('*株式会社*'),
              売上高.greaterThan(100000000),
              or(
                ステータス.in(['受注']),
                and(契約数.greaterThan(10), 継続年数.greaterThan(5))
              )
            ),
            and(
              登録日.greaterThan(FROM_TODAY(-30, 'DAYS')),
              初回契約額.greaterThan(50000000),
              not(ステータス.in(['失注', 'キャンセル']))
            ),
            and(
              担当者.equals(LOGINUSER()),
              優先度.equals('最高'),
              期限日.lessThan(FROM_TODAY(7, 'DAYS'))
            )
          )
        )
        .orderBy('優先度', 'desc')
        .orderBy('売上高', 'desc')
        .limit(100)
        .build();

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // 1秒未満
      expect(query).toContain('会社名 like "*株式会社*"');
      expect(query).toContain('売上高 > 100000000');
      expect(query).toContain('order by 優先度 desc, 売上高 desc');
    });

    it('大量フィールドのクエリビルダー生成が5秒以内', async () => {
      const startTime = performance.now();

      // 大規模フィールドセットのモック
      const largeFormFields = {
        properties: {},
      };

      // 100個のフィールドを生成
      for (let i = 0; i < 100; i++) {
        largeFormFields.properties[`field_${i}`] = {
          type:
            i % 3 === 0 ? 'NUMBER' : i % 3 === 1 ? 'DATE' : 'SINGLE_LINE_TEXT',
          code: `field_${i}`,
          label: `Field ${i}`,
        };
      }

      mockClient.app.getFormFields.mockResolvedValueOnce(largeFormFields);

      await exportCommand({
        appId: '999',
        name: 'large-app',
        withQuery: true,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // 5秒未満

      // ファイルが生成されていることを確認
      const content = await fs.readFile('apps/large-app.query.ts', 'utf-8');
      expect(content).toContain('field_0');
      expect(content).toContain('field_99');
    });
  });

  describe('エラーハンドリング', () => {
    it('サポートされていないフィールドタイプが適切に処理される', async () => {
      const unsupportedFields = {
        properties: {
          添付ファイル: {
            type: 'FILE',
            code: '添付ファイル',
            label: '添付ファイル',
          },
          サブテーブル: {
            type: 'SUBTABLE',
            code: 'サブテーブル',
            label: 'サブテーブル',
          },
          通常フィールド: {
            type: 'SINGLE_LINE_TEXT',
            code: '通常フィールド',
            label: '通常フィールド',
          },
        },
      };

      mockClient.app.getFormFields.mockResolvedValueOnce(unsupportedFields);

      await exportCommand({
        appId: '456',
        name: 'unsupported-app',
        withQuery: true,
      });

      const content = await fs.readFile(
        'apps/unsupported-app.query.ts',
        'utf-8'
      );

      // サポートされていないフィールドはコメントアウトされる
      expect(content).toContain('// 添付ファイル: FILE type is not supported');
      expect(content).toContain(
        '// サブテーブル: SUBTABLE type is not supported'
      );

      // 通常のフィールドは生成される
      expect(content).toContain('通常フィールド: createStringField');
    });
  });
});

describe('回帰テスト', () => {
  it('既存のExportコマンドの動作が維持されている', async () => {
    mockClient.app.getFormFields.mockResolvedValue({
      properties: {
        テスト: {
          type: 'SINGLE_LINE_TEXT',
          code: 'テスト',
          label: 'テスト',
        },
      },
    });

    // withQuery: false で実行
    await exportCommand({
      appId: '789',
      name: 'no-query-app',
      withQuery: false,
      withRecordSchema: true,
    });

    // クエリビルダーファイルが生成されていないことを確認
    await expect(fs.access('apps/no-query-app.query.ts')).rejects.toThrow();

    // スキーマファイルは生成されている
    await expect(
      fs.access('apps/no-query-app.schema.ts')
    ).resolves.toBeUndefined();
    await expect(
      fs.access('apps/no-query-app.record-schema.ts')
    ).resolves.toBeUndefined();
  });
});
