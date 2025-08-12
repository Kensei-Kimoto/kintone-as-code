import { Expression, condition } from './expression.js';
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

// フィールド定義インターフェース
interface FieldDefinition {
  readonly code: string;
  readonly type: FieldType;
}

// 基本フィールドクラス（改善版）
abstract class BaseField<T> {
  protected readonly definition: FieldDefinition;
  
  constructor(code: string, type: FieldType) {
    this.definition = Object.freeze({ code, type });
  }
  
  get code(): string {
    return this.definition.code;
  }
  
  get type(): FieldType {
    return this.definition.type;
  }
  
  equals(value: T): Expression {
    return condition(this.code, '=', formatFieldValue(value));
  }
  
  notEquals(value: T): Expression {
    return condition(this.code, '!=', formatFieldValue(value));
  }
  
  in(values: T[]): Expression {
    return condition(this.code, 'in', values.map(formatFieldValue));
  }
  
  notIn(values: T[]): Expression {
    return condition(this.code, 'not in', values.map(formatFieldValue));
  }
}

// 文字列フィールド（改善版）
class StringField extends BaseField<string> {
  constructor(code: string) {
    super(code, 'SINGLE_LINE_TEXT');
  }
  
  like(pattern: string): Expression {
    return condition(this.code, 'like', pattern);
  }
  
  notLike(pattern: string): Expression {
    return condition(this.code, 'not like', pattern);
  }
}

// 数値フィールド（改善版）
class NumberField extends BaseField<number> {
  constructor(code: string) {
    super(code, 'NUMBER');
  }
  
  greaterThan(value: number): Expression {
    return condition(this.code, '>', value);
  }
  
  lessThan(value: number): Expression {
    return condition(this.code, '<', value);
  }
  
  greaterThanOrEqual(value: number): Expression {
    return condition(this.code, '>=', value);
  }
  
  lessThanOrEqual(value: number): Expression {
    return condition(this.code, '<=', value);
  }
}

// ドロップダウンフィールド（equals使えない）
class DropdownField<T extends readonly string[]> {
  constructor(
    private readonly code: string,
    public readonly options: T
  ) {}
  
  in(values: T[number][]): Expression {
    return condition(this.code, 'in', values);
  }
  
  notIn(values: T[number][]): Expression {
    return condition(this.code, 'not in', values);
  }
}

// チェックボックスフィールド
class CheckboxField<T extends readonly string[]> {
  constructor(
    private readonly code: string,
    public readonly options: T
  ) {}
  
  in(values: T[number][]): Expression {
    return condition(this.code, 'in', values);
  }
  
  notIn(values: T[number][]): Expression {
    return condition(this.code, 'not in', values);
  }
}

// 日付フィールド（改善版）
class DateField extends BaseField<DateValue> {
  constructor(code: string) {
    super(code, 'DATE');
  }
  
  greaterThan(value: DateValue): Expression {
    return condition(this.code, '>', formatFieldValue(value));
  }
  
  lessThan(value: DateValue): Expression {
    return condition(this.code, '<', formatFieldValue(value));
  }
  
  greaterThanOrEqual(value: DateValue): Expression {
    return condition(this.code, '>=', formatFieldValue(value));
  }
  
  lessThanOrEqual(value: DateValue): Expression {
    return condition(this.code, '<=', formatFieldValue(value));
  }
}

// ユーザーフィールド（改善版）
class UserField extends BaseField<UserValue> {
  constructor(code: string) {
    super(code, 'USER_SELECT');
  }
}

// 組織フィールド
class OrgField extends BaseField<string> {
  constructor(code: string) {
    super(code, 'ORGANIZATION_SELECT');
  }
}

// グループフィールド  
class GroupField extends BaseField<string> {
  constructor(code: string) {
    super(code, 'GROUP_SELECT');
  }
}

// 時間フィールド
class TimeField extends BaseField<string> {
  constructor(code: string) {
    super(code, 'TIME');
  }
  
  greaterThan(value: string): Expression {
    return condition(this.code, '>', value);
  }
  
  lessThan(value: string): Expression {
    return condition(this.code, '<', value);
  }
  
  greaterThanOrEqual(value: string): Expression {
    return condition(this.code, '>=', value);
  }
  
  lessThanOrEqual(value: string): Expression {
    return condition(this.code, '<=', value);
  }
}

// 日時フィールド
class DateTimeField extends BaseField<DateValue> {
  constructor(code: string) {
    super(code, 'DATETIME');
  }
  
  greaterThan(value: DateValue): Expression {
    return condition(this.code, '>', formatFieldValue(value));
  }
  
  lessThan(value: DateValue): Expression {
    return condition(this.code, '<', formatFieldValue(value));
  }
  
  greaterThanOrEqual(value: DateValue): Expression {
    return condition(this.code, '>=', formatFieldValue(value));
  }
  
  lessThanOrEqual(value: DateValue): Expression {
    return condition(this.code, '<=', formatFieldValue(value));
  }
}

// ラジオボタンフィールド
class RadioButtonField<T extends readonly string[]> {
  constructor(
    private readonly code: string,
    public readonly options: T
  ) {}
  
  equals(value: T[number]): Expression {
    return condition(this.code, '=', value);
  }
  
  notEquals(value: T[number]): Expression {
    return condition(this.code, '!=', value);
  }
  
  in(values: T[number][]): Expression {
    return condition(this.code, 'in', values);
  }
  
  notIn(values: T[number][]): Expression {
    return condition(this.code, 'not in', values);
  }
}

// ファクトリ関数
export const createStringField = (code: string): StringField => {
  return new StringField(code);
};

export const createNumberField = (code: string): NumberField => {
  return new NumberField(code);
};

export const createDropdownField = <T extends readonly string[]>(
  code: string,
  options: T
): DropdownField<T> => {
  return new DropdownField(code, options);
};

export const createCheckboxField = <T extends readonly string[]>(
  code: string,
  options: T
): CheckboxField<T> => {
  return new CheckboxField(code, options);
};

export const createDateField = (code: string): DateField => {
  return new DateField(code);
};

export const createUserField = (code: string): UserField => {
  return new UserField(code);
};

export const createOrgField = (code: string): OrgField => {
  return new OrgField(code);
};

export const createGroupField = (code: string): GroupField => {
  return new GroupField(code);
};

export const createTimeField = (code: string): TimeField => {
  return new TimeField(code);
};

export const createDateTimeField = (code: string): DateTimeField => {
  return new DateTimeField(code);
};

export const createRadioButtonField = <T extends readonly string[]>(
  code: string,
  options: T
): RadioButtonField<T> => {
  return new RadioButtonField(code, options);
};