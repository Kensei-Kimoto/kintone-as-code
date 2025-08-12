import { Expression, condition, and } from './expression.js';
import { DateFunction, UserFunction, formatFunction } from './functions.js';

// toString関数を再エクスポート
export { toString } from './expression.js';

// フィールドタイプの列挙
export type FieldType =
  | 'SINGLE_LINE_TEXT'
  | 'MULTI_LINE_TEXT'
  | 'NUMBER'
  | 'CALC'
  | 'DROP_DOWN'
  | 'CHECK_BOX'
  | 'RADIO_BUTTON'
  | 'MULTI_SELECT'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'USER_SELECT'
  | 'ORGANIZATION_SELECT'
  | 'GROUP_SELECT';

// 日付型（文字列 or 関数）
type DateValue = string | DateFunction;

// ユーザー型（文字列 or 関数）
type UserValue = string | UserFunction;

// 値のフォーマット（関数対応）
const formatFieldValue = (value: any): any => {
  if (value && typeof value === 'object' && value._tag === 'function') {
    return formatFunction(value);
  }
  return value;
};

// 汎用の等価系（不変オブジェクトにメソッドを実装）
const baseOps = <T>(code: string) => ({
  equals(value: T): Expression {
    return condition(code, '=', formatFieldValue(value));
  },
  notEquals(value: T): Expression {
    return condition(code, '!=', formatFieldValue(value));
  },
  in(values: T[]): Expression {
    return condition(code, 'in', values.map(formatFieldValue));
  },
  notIn(values: T[]): Expression {
    return condition(code, 'not in', values.map(formatFieldValue));
  },
});

// 文字列フィールド（like/not like を追加）
export const createStringField = (code: string) => {
  return Object.freeze({
    ...baseOps<string>(code),
    like(pattern: string): Expression {
      return condition(code, 'like', pattern);
    },
    notLike(pattern: string): Expression {
      return condition(code, 'not like', pattern);
    },
    contains(substr: string): Expression {
      return condition(code, 'like', `*${substr}*`);
    },
    startsWith(prefix: string): Expression {
      return condition(code, 'like', `${prefix}*`);
    },
    endsWith(suffix: string): Expression {
      return condition(code, 'like', `*${suffix}`);
    },
  });
};

// 数値フィールド（比較演算子）
export const createNumberField = (code: string) => {
  return Object.freeze({
    ...baseOps<number>(code),
    greaterThan(value: number): Expression {
      return condition(code, '>', value);
    },
    lessThan(value: number): Expression {
      return condition(code, '<', value);
    },
    greaterThanOrEqual(value: number): Expression {
      return condition(code, '>=', value);
    },
    lessThanOrEqual(value: number): Expression {
      return condition(code, '<=', value);
    },
    between(minInclusive: number, maxInclusive: number): Expression {
      return and(
        condition(code, '>=', minInclusive),
        condition(code, '<=', maxInclusive)
      );
    },
  });
};

// ドロップダウン（in/not in のみ）
export const createDropdownField = <T extends readonly string[]>(
  code: string,
  options: T
) => {
  const obj = {
    options,
    in(values: T[number][]): Expression {
      return condition(code, 'in', values);
    },
    notIn(values: T[number][]): Expression {
      return condition(code, 'not in', values);
    },
  } as const;
  return Object.freeze(obj);
};

// チェックボックス（in/not in のみ）
export const createCheckboxField = <T extends readonly string[]>(
  code: string,
  options: T
) => {
  const obj = {
    options,
    in(values: T[number][]): Expression {
      return condition(code, 'in', values);
    },
    notIn(values: T[number][]): Expression {
      return condition(code, 'not in', values);
    },
  } as const;
  return Object.freeze(obj);
};

// 日付フィールド（比較演算子、関数フォーマット対応）
export const createDateField = (code: string) => {
  return Object.freeze({
    ...baseOps<DateValue>(code),
    greaterThan(value: DateValue): Expression {
      return condition(code, '>', formatFieldValue(value));
    },
    lessThan(value: DateValue): Expression {
      return condition(code, '<', formatFieldValue(value));
    },
    greaterThanOrEqual(value: DateValue): Expression {
      return condition(code, '>=', formatFieldValue(value));
    },
    lessThanOrEqual(value: DateValue): Expression {
      return condition(code, '<=', formatFieldValue(value));
    },
    between(minInclusive: DateValue, maxInclusive: DateValue): Expression {
      return and(
        condition(code, '>=', formatFieldValue(minInclusive)),
        condition(code, '<=', formatFieldValue(maxInclusive))
      );
    },
  });
};

// 日時フィールド
export const createDateTimeField = (code: string) => {
  return Object.freeze({
    ...baseOps<DateValue>(code),
    greaterThan(value: DateValue): Expression {
      return condition(code, '>', formatFieldValue(value));
    },
    lessThan(value: DateValue): Expression {
      return condition(code, '<', formatFieldValue(value));
    },
    greaterThanOrEqual(value: DateValue): Expression {
      return condition(code, '>=', formatFieldValue(value));
    },
    lessThanOrEqual(value: DateValue): Expression {
      return condition(code, '<=', formatFieldValue(value));
    },
    between(minInclusive: DateValue, maxInclusive: DateValue): Expression {
      return and(
        condition(code, '>=', formatFieldValue(minInclusive)),
        condition(code, '<=', formatFieldValue(maxInclusive))
      );
    },
  });
};

// 時間フィールド（比較演算子）
export const createTimeField = (code: string) => {
  return Object.freeze({
    ...baseOps<string>(code),
    greaterThan(value: string): Expression {
      return condition(code, '>', value);
    },
    lessThan(value: string): Expression {
      return condition(code, '<', value);
    },
    greaterThanOrEqual(value: string): Expression {
      return condition(code, '>=', value);
    },
    lessThanOrEqual(value: string): Expression {
      return condition(code, '<=', value);
    },
    between(minInclusive: string, maxInclusive: string): Expression {
      return and(
        condition(code, '>=', minInclusive),
        condition(code, '<=', maxInclusive)
      );
    },
  });
};

// ユーザー/組織/グループ（等価系のみ）
export const createUserField = (code: string) =>
  Object.freeze(baseOps<UserValue>(code));
export const createOrgField = (code: string) =>
  Object.freeze(baseOps<string>(code));
export const createGroupField = (code: string) =>
  Object.freeze(baseOps<string>(code));

// ラジオボタン（equals/in/not in を提供）
export const createRadioButtonField = <T extends readonly string[]>(
  code: string,
  options: T
) => {
  const obj = {
    options,
    equals(value: T[number]): Expression {
      return condition(code, '=', value);
    },
    notEquals(value: T[number]): Expression {
      return condition(code, '!=', value);
    },
    in(values: T[number][]): Expression {
      return condition(code, 'in', values);
    },
    notIn(values: T[number][]): Expression {
      return condition(code, 'not in', values);
    },
  } as const;
  return Object.freeze(obj);
};

// サブテーブル子フィールド用（制約: in/not in のみ）
export const createTableSubField = (code: string) => {
  const obj = {
    in(values: ReadonlyArray<string | number>): Expression {
      return condition(code, 'in', values as unknown as (string | number)[]);
    },
    notIn(values: ReadonlyArray<string | number>): Expression {
      return condition(
        code,
        'not in',
        values as unknown as (string | number)[]
      );
    },
  } as const;
  return Object.freeze(obj);
};
