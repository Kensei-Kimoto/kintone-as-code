import { $1toString as expressionToString,$2 } from '../field.js';
import { TODAY, FROM_TODAY, LOGINUSER, NOW } from '../functions.js';

describe('StringField', () => {
  const 会社名Field = createStringField('会社名');

  it('equals演算子が使える', () => {
    const expr = 会社名Field.equals('サイボウズ');
    expect(expressionToString(expr)).toBe('会社名 = "サイボウズ"');
  });

  it('notEquals演算子が使える', () => {
    const expr = 会社名Field.notEquals('サイボウズ');
    expect(expressionToString(expr)).toBe('会社名 != "サイボウズ"');
  });

  it('like演算子が使える', () => {
    const expr = 会社名Field.like('*サイボウズ*');
    expect(expressionToString(expr)).toBe('会社名 like "*サイボウズ*"');
  });

  it('notLike演算子が使える', () => {
    const expr = 会社名Field.notLike('*サイボウズ*');
    expect(expressionToString(expr)).toBe('会社名 not like "*サイボウズ*"');
  });

  it('contains/startsWith/endsWith が使える', () => {
    expect(expressionToString(会社名Field.contains('株式'))).toBe('会社名 like "*株式*"');
    expect(expressionToString(会社名Field.startsWith('サイ'))).toBe(
      '会社名 like "サイ*"'
    );
    expect(expressionToString(会社名Field.endsWith('ボウズ'))).toBe(
      '会社名 like "*ボウズ"'
    );
  });

  it('in演算子が使える', () => {
    const expr = 会社名Field.in(['サイボウズ', 'kintone']);
    expect(expressionToString(expr)).toBe('会社名 in ("サイボウズ", "kintone")');
  });

  it('notIn演算子が使える', () => {
    const expr = 会社名Field.notIn(['テスト', 'デモ']);
    expect(expressionToString(expr)).toBe('会社名 not in ("テスト", "デモ")');
  });
});

describe('NumberField', () => {
  const 売上高Field = createNumberField('売上高');

  it('equals演算子が使える', () => {
    const expr = 売上高Field.equals(1000000);
    expect(expressionToString(expr)).toBe('売上高 = 1000000');
  });

  it('notEquals演算子が使える', () => {
    const expr = 売上高Field.notEquals(0);
    expect(expressionToString(expr)).toBe('売上高 != 0');
  });

  it('greaterThan演算子が使える', () => {
    const expr = 売上高Field.greaterThan(1000000);
    expect(expressionToString(expr)).toBe('売上高 > 1000000');
  });

  it('lessThan演算子が使える', () => {
    const expr = 売上高Field.lessThan(1000000);
    expect(expressionToString(expr)).toBe('売上高 < 1000000');
  });

  it('greaterThanOrEqual演算子が使える', () => {
    const expr = 売上高Field.greaterThanOrEqual(1000000);
    expect(expressionToString(expr)).toBe('売上高 >= 1000000');
  });

  it('lessThanOrEqual演算子が使える', () => {
    const expr = 売上高Field.lessThanOrEqual(1000000);
    expect(expressionToString(expr)).toBe('売上高 <= 1000000');
  });

  it('betweenが使える', () => {
    const expr = 売上高Field.between(100, 200);
    expect(expressionToString(expr)).toBe('(売上高 >= 100 and 売上高 <= 200)');
  });

  it('in演算子が使える', () => {
    const expr = 売上高Field.in([100, 200, 300]);
    expect(expressionToString(expr)).toBe('売上高 in (100, 200, 300)');
  });

  it('notIn演算子が使える', () => {
    const expr = 売上高Field.notIn([0, -1]);
    expect(expressionToString(expr)).toBe('売上高 not in (0, -1)');
  });
});

describe('DropdownField', () => {
  const ステータスField = createDropdownField('ステータス', [
    '商談中',
    '受注',
    '失注',
    '保留',
  ] as const);

  it('in演算子が使える', () => {
    const expr = ステータスField.in(['商談中', '受注']);
    expect(expressionToString(expr)).toBe('ステータス in ("商談中", "受注")');
  });

  it('notIn演算子が使える', () => {
    const expr = ステータスField.notIn(['失注', '保留']);
    expect(expressionToString(expr)).toBe('ステータス not in ("失注", "保留")');
  });

  // ドロップダウンフィールドはequals演算子を持たない（型エラーになる）
  // これはコンパイル時にチェックされる
});

describe('CheckboxField', () => {
  const タグField = createCheckboxField('タグ', [
    '重要',
    '緊急',
    '確認済み',
    '対応中',
  ] as const);

  it('in演算子が使える', () => {
    const expr = タグField.in(['重要', '緊急']);
    expect(expressionToString(expr)).toBe('タグ in ("重要", "緊急")');
  });

  it('notIn演算子が使える', () => {
    const expr = タグField.notIn(['確認済み']);
    expect(expressionToString(expr)).toBe('タグ not in ("確認済み")');
  });
});

describe('DateField', () => {
  const 契約日Field = createDateField('契約日');

  it('文字列の日付でequals演算子が使える', () => {
    const expr = 契約日Field.equals('2024-01-01');
    expect(expressionToString(expr)).toBe('契約日 = "2024-01-01"');
  });

  it('TODAY関数でequals演算子が使える', () => {
    const expr = 契約日Field.equals(TODAY());
    expect(expressionToString(expr)).toBe('契約日 = TODAY()');
  });

  it('FROM_TODAY関数でgreaterThan演算子が使える', () => {
    const expr = 契約日Field.greaterThan(FROM_TODAY(-30, 'DAYS'));
    expect(expressionToString(expr)).toBe('契約日 > FROM_TODAY(-30, "DAYS")');
  });

  it('lessThanOrEqual演算子が使える', () => {
    const expr = 契約日Field.lessThanOrEqual(TODAY());
    expect(expressionToString(expr)).toBe('契約日 <= TODAY()');
  });

  it('in演算子で複数の日付を指定できる', () => {
    const expr = 契約日Field.in(['2024-01-01', '2024-02-01', '2024-03-01']);
    expect(expressionToString(expr)).toBe(
      '契約日 in ("2024-01-01", "2024-02-01", "2024-03-01")'
    );
  });

  it('betweenが使える（関数を含む）', () => {
    const expr = 契約日Field.between(FROM_TODAY(-7, 'DAYS'), NOW());
    expect(expressionToString(expr)).toBe(
      '(契約日 >= FROM_TODAY(-7, "DAYS") and 契約日 <= NOW())'
    );
  });
});

describe('UserField', () => {
  const 担当者Field = createUserField('担当者');

  it('文字列（ユーザー名）でequals演算子が使える', () => {
    const expr = 担当者Field.equals('田中太郎');
    expect(expressionToString(expr)).toBe('担当者 = "田中太郎"');
  });

  it('LOGINUSER関数でequals演算子が使える', () => {
    const expr = 担当者Field.equals(LOGINUSER());
    expect(expressionToString(expr)).toBe('担当者 = LOGINUSER()');
  });

  it('in演算子で複数のユーザーを指定できる', () => {
    const expr = 担当者Field.in(['田中太郎', '鈴木花子']);
    expect(expressionToString(expr)).toBe('担当者 in ("田中太郎", "鈴木花子")');
  });

  it('notIn演算子が使える', () => {
    const expr = 担当者Field.notIn(['システム', 'ゲスト']);
    expect(expressionToString(expr)).toBe('担当者 not in ("システム", "ゲスト")');
  });
});

describe('フィールドの組み合わせ', () => {
  it('異なるフィールドタイプを組み合わせられる', () => {
    const 会社名Field = createStringField('会社名');
    const 売上高Field = createNumberField('売上高');
    const ステータスField = createDropdownField('ステータス', [
      '商談中',
      '受注',
    ] as const);

    // and関数は別途テスト済みなので、ここではフィールドメソッドの結果がExpressionであることを確認
    const expr1 = 会社名Field.like('*サイボウズ*');
    const expr2 = 売上高Field.greaterThan(1000000);
    const expr3 = ステータスField.in(['商談中']);

    expect(expr1).toHaveProperty('_tag');
    expect(expr2).toHaveProperty('_tag');
    expect(expr3).toHaveProperty('_tag');
  });
});
