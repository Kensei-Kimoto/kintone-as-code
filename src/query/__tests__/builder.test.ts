import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../builder.js';
import { condition, and, or } from '../expression.js';

describe('QueryBuilder', () => {
  describe('基本機能', () => {
    it('空のクエリを生成できる', () => {
      const query = new QueryBuilder().build();
      expect(query).toBe('');
    });

    it('WHERE句を設定できる', () => {
      const query = new QueryBuilder()
        .where(condition('status', '=', 'active'))
        .build();
      expect(query).toBe('status = "active"');
    });

    it('ORDER BY句を設定できる', () => {
      const query = new QueryBuilder()
        .orderBy('createdAt', 'desc')
        .build();
      expect(query).toBe('order by createdAt desc');
    });

    it('LIMIT句を設定できる', () => {
      const query = new QueryBuilder()
        .limit(100)
        .build();
      expect(query).toBe('limit 100');
    });

    it('OFFSET句を設定できる', () => {
      const query = new QueryBuilder()
        .offset(50)
        .build();
      expect(query).toBe('offset 50');
    });
  });

  describe('複合クエリ', () => {
    it('すべての句を組み合わせられる', () => {
      const query = new QueryBuilder()
        .where(condition('status', '=', 'active'))
        .orderBy('createdAt', 'desc')
        .limit(100)
        .offset(50)
        .build();
      expect(query).toBe('status = "active" order by createdAt desc limit 100 offset 50');
    });

    it('複数のORDER BY句を設定できる', () => {
      const query = new QueryBuilder()
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc')
        .build();
      expect(query).toBe('order by priority desc, createdAt asc');
    });

    it('複雑なWHERE句を設定できる', () => {
      const activeStatus = condition('status', '=', 'active');
      const highPriority = condition('priority', '>', 5);
      const complexCondition = and(activeStatus, highPriority);

      const query = new QueryBuilder()
        .where(complexCondition)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .build();
      
      expect(query).toBe('(status = "active" and priority > 5) order by createdAt desc limit 50');
    });
  });

  describe('バリデーション', () => {
    it('LIMITが500を超える場合はエラー', () => {
      expect(() => {
        new QueryBuilder().limit(501);
      }).toThrow('kintone API limit: maximum 500 records per request');
    });

    it('LIMITが1未満の場合はエラー', () => {
      expect(() => {
        new QueryBuilder().limit(0);
      }).toThrow('Limit must be at least 1');
    });

    it('OFFSETが負の場合はエラー', () => {
      expect(() => {
        new QueryBuilder().offset(-1);
      }).toThrow('Offset must be non-negative');
    });
  });

  describe('メソッドチェーン', () => {
    it('メソッドチェーンが正しく動作する', () => {
      const builder = new QueryBuilder();
      const result = builder
        .where(condition('status', '=', 'active'))
        .orderBy('createdAt')
        .limit(100)
        .offset(0);
      
      expect(result).toBe(builder);
      expect(builder.build()).toBe('status = "active" order by createdAt asc limit 100 offset 0');
    });

    it('resetで初期状態に戻せる', () => {
      const builder = new QueryBuilder()
        .where(condition('status', '=', 'active'))
        .orderBy('createdAt')
        .limit(100)
        .offset(50);
      
      builder.reset();
      expect(builder.build()).toBe('');
    });

    it('cloneで状態をコピーできる', () => {
      const original = new QueryBuilder()
        .where(condition('status', '=', 'active'))
        .orderBy('createdAt')
        .limit(100);
      
      const cloned = original.clone();
      
      // 元のビルダーに変更を加える
      original.offset(50);
      
      // クローンは影響を受けない
      expect(cloned.build()).toBe('status = "active" order by createdAt asc limit 100');
      expect(original.build()).toBe('status = "active" order by createdAt asc limit 100 offset 50');
    });
  });

  describe('実際のユースケース', () => {
    it('ページネーションクエリを構築できる', () => {
      const pageSize = 50;
      const page = 3;
      
      const query = new QueryBuilder()
        .where(condition('公開状態', '=', '公開中'))
        .orderBy('更新日時', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .build();
      
      expect(query).toBe('公開状態 = "公開中" order by 更新日時 desc limit 50 offset 100');
    });

    it('複数条件の検索クエリを構築できる', () => {
      const categoryCondition = condition('カテゴリ', 'in', ['技術', '開発', 'インフラ']);
      const statusCondition = condition('ステータス', '!=', 'クローズ');
      const dateCondition = condition('作成日', '>=', '2024-01-01');
      
      const query = new QueryBuilder()
        .where(and(categoryCondition, statusCondition, dateCondition))
        .orderBy('優先度', 'desc')
        .orderBy('作成日', 'asc')
        .limit(100)
        .build();
      
      expect(query).toBe(
        '(カテゴリ in ("技術", "開発", "インフラ") and ステータス != "クローズ" and 作成日 >= "2024-01-01") ' +
        'order by 優先度 desc, 作成日 asc limit 100'
      );
    });
  });
});