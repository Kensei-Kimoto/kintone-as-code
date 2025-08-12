import { describe, it, expect } from 'vitest';
import { condition, toString, and, or, not } from '../expression.js';

describe('Condition', () => {
  describe('基本的な等価条件', () => {
    it('文字列フィールドの等価条件を生成できる', () => {
      const expr = condition('会社名', '=', 'サイボウズ');
      expect(toString(expr)).toBe('会社名 = "サイボウズ"');
    });

    it('数値フィールドの等価条件を生成できる', () => {
      const expr = condition('売上高', '=', 1000000);
      expect(toString(expr)).toBe('売上高 = 1000000');
    });

    it('真偽値フィールドの等価条件を生成できる', () => {
      const expr = condition('有効フラグ', '=', true);
      expect(toString(expr)).toBe('有効フラグ = true');
    });
  });

  describe('比較演算子', () => {
    it('より大きい条件を生成できる', () => {
      const expr = condition('売上高', '>', 1000000);
      expect(toString(expr)).toBe('売上高 > 1000000');
    });

    it('より小さい条件を生成できる', () => {
      const expr = condition('在庫数', '<', 100);
      expect(toString(expr)).toBe('在庫数 < 100');
    });

    it('以上条件を生成できる', () => {
      const expr = condition('売上高', '>=', 1000000);
      expect(toString(expr)).toBe('売上高 >= 1000000');
    });

    it('以下条件を生成できる', () => {
      const expr = condition('在庫数', '<=', 100);
      expect(toString(expr)).toBe('在庫数 <= 100');
    });

    it('不等価条件を生成できる', () => {
      const expr = condition('ステータス', '!=', '完了');
      expect(toString(expr)).toBe('ステータス != "完了"');
    });
  });

  describe('IN演算子', () => {
    it('複数値のIN条件を生成できる', () => {
      const expr = condition('ステータス', 'in', ['商談中', '受注']);
      expect(toString(expr)).toBe('ステータス in ("商談中", "受注")');
    });

    it('数値配列のIN条件を生成できる', () => {
      const expr = condition('優先度', 'in', [1, 2, 3]);
      expect(toString(expr)).toBe('優先度 in (1, 2, 3)');
    });

    it('NOT IN条件を生成できる', () => {
      const expr = condition('ステータス', 'not in', ['失注', 'キャンセル']);
      expect(toString(expr)).toBe('ステータス not in ("失注", "キャンセル")');
    });
  });

  describe('LIKE演算子', () => {
    it('部分一致条件を生成できる', () => {
      const expr = condition('会社名', 'like', '*サイボウズ*');
      expect(toString(expr)).toBe('会社名 like "*サイボウズ*"');
    });

    it('前方一致条件を生成できる', () => {
      const expr = condition('電話番号', 'like', '03*');
      expect(toString(expr)).toBe('電話番号 like "03*"');
    });

    it('後方一致条件を生成できる', () => {
      const expr = condition('メールアドレス', 'like', '*@cybozu.com');
      expect(toString(expr)).toBe('メールアドレス like "*@cybozu.com"');
    });

    it('NOT LIKE条件を生成できる', () => {
      const expr = condition('会社名', 'not like', '*テスト*');
      expect(toString(expr)).toBe('会社名 not like "*テスト*"');
    });
  });

  describe('特殊な値の処理', () => {
    it('空文字列を正しく処理できる', () => {
      const expr = condition('備考', '=', '');
      expect(toString(expr)).toBe('備考 = ""');
    });

    it('nullを正しく処理できる', () => {
      const expr = condition('削除日', '=', null);
      expect(toString(expr)).toBe('削除日 = null');
    });

    it('undefinedをnullとして処理できる', () => {
      const expr = condition('更新日', '=', undefined);
      expect(toString(expr)).toBe('更新日 = null');
    });

    it('ダブルクォートを含む文字列をエスケープできる', () => {
      const expr = condition('会社名', '=', 'サイボウズ"株式会社"');
      expect(toString(expr)).toBe('会社名 = "サイボウズ\\"株式会社\\""');
    });
  });
});

describe('AND演算子', () => {
  it('2つの条件をANDで結合できる', () => {
    const cond1 = condition('会社名', '=', 'サイボウズ');
    const cond2 = condition('売上高', '>', 1000000);
    const expr = and(cond1, cond2);
    expect(toString(expr)).toBe('(会社名 = "サイボウズ" and 売上高 > 1000000)');
  });

  it('3つ以上の条件をANDで結合できる', () => {
    const cond1 = condition('会社名', '=', 'サイボウズ');
    const cond2 = condition('売上高', '>', 1000000);
    const cond3 = condition('ステータス', 'in', ['商談中', '受注']);
    const expr = and(cond1, cond2, cond3);
    expect(toString(expr)).toBe(
      '(会社名 = "サイボウズ" and 売上高 > 1000000 and ステータス in ("商談中", "受注"))'
    );
  });

  it('単一条件のANDは括弧を付けない', () => {
    const cond = condition('会社名', '=', 'サイボウズ');
    const expr = and(cond);
    expect(toString(expr)).toBe('会社名 = "サイボウズ"');
  });
});

describe('OR演算子', () => {
  it('2つの条件をORで結合できる', () => {
    const cond1 = condition('ステータス', '=', '商談中');
    const cond2 = condition('ステータス', '=', '受注');
    const expr = or(cond1, cond2);
    expect(toString(expr)).toBe(
      '(ステータス = "商談中" or ステータス = "受注")'
    );
  });

  it('3つ以上の条件をORで結合できる', () => {
    const cond1 = condition('優先度', '=', '高');
    const cond2 = condition('優先度', '=', '中');
    const cond3 = condition('優先度', '=', '低');
    const expr = or(cond1, cond2, cond3);
    expect(toString(expr)).toBe(
      '(優先度 = "高" or 優先度 = "中" or 優先度 = "低")'
    );
  });

  it('単一条件のORは括弧を付けない', () => {
    const cond = condition('ステータス', '=', '完了');
    const expr = or(cond);
    expect(toString(expr)).toBe('ステータス = "完了"');
  });
});

describe('NOT演算子', () => {
  it('条件を否定できる', () => {
    const cond = condition('ステータス', '=', '完了');
    const expr = not(cond);
    expect(toString(expr)).toBe('not (ステータス = "完了")');
  });

  it('複雑な条件を否定できる', () => {
    const cond1 = condition('売上高', '>', 1000000);
    const cond2 = condition('売上高', '<', 5000000);
    const andExpr = and(cond1, cond2);
    const expr = not(andExpr);
    expect(toString(expr)).toBe(
      'not ((売上高 > 1000000 and 売上高 < 5000000))'
    );
  });
});

describe('ネスト条件', () => {
  it('ANDとORを組み合わせられる', () => {
    const highPriority = condition('優先度', '=', '高');
    const urgent = condition('緊急フラグ', '=', true);
    const important = and(highPriority, urgent);

    const assigned = condition('担当者', '=', 'LOGINUSER()');
    const expr = or(important, assigned);

    expect(toString(expr)).toBe(
      '((優先度 = "高" and 緊急フラグ = true) or 担当者 = LOGINUSER())'
    );
  });

  it('ORとANDを組み合わせられる', () => {
    const status1 = condition('ステータス', '=', '商談中');
    const status2 = condition('ステータス', '=', '受注');
    const activeStatuses = or(status1, status2);

    const highValue = condition('売上高', '>', 10000000);
    const expr = and(activeStatuses, highValue);

    expect(toString(expr)).toBe(
      '((ステータス = "商談中" or ステータス = "受注") and 売上高 > 10000000)'
    );
  });

  it('深いネストも正しく処理できる', () => {
    const a = condition('A', '=', '1');
    const b = condition('B', '=', '2');
    const c = condition('C', '=', '3');
    const d = condition('D', '=', '4');
    const e = condition('E', '=', '5');
    const f = condition('F', '=', '6');

    const expr = or(and(a, or(b, c)), and(d, e, not(f)));

    expect(toString(expr)).toBe(
      '((A = "1" and (B = "2" or C = "3")) or (D = "4" and E = "5" and not (F = "6")))'
    );
  });
});

describe('関数や比較の等価表現', () => {
  it('登録日 >= NOW() を condition で表現できる', () => {
    const expr = condition('登録日', '>=', 'NOW()');
    expect(toString(expr)).toBe('登録日 >= NOW()');
  });

  it('ANDの右項を数値比較で置き換え', () => {
    const left = condition('会社名', 'like', '*サイボウズ*');
    const right = condition('売上高', '>', 1000000);
    const expr = and(left, right);
    expect(toString(expr)).toBe(
      '(会社名 like "*サイボウズ*" and 売上高 > 1000000)'
    );
  });

  it('NOT (ステータス in ("完了")) を型安全APIで表現', () => {
    const expr = not(condition('ステータス', 'in', ['完了']));
    expect(toString(expr)).toBe('not (ステータス in ("完了"))');
  });
});
