// kintone関数の型定義
export interface KintoneFunction {
  readonly _tag: 'function';
  readonly name: string;
  readonly args?: readonly any[];
}

// 日付関数の戻り値型
export interface DateFunction extends KintoneFunction {
  readonly _type: 'date';
}

// ユーザー関数の戻り値型
export interface UserFunction extends KintoneFunction {
  readonly _type: 'user';
}

// 日付の単位
export type DateUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';

// 日付関数
export const TODAY = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'TODAY',
});

export const NOW = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'NOW',
});

export const FROM_TODAY = (days: number, unit: DateUnit): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'FROM_TODAY',
  args: [days, unit],
});

export const THIS_WEEK = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'THIS_WEEK',
});

export const THIS_MONTH = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'THIS_MONTH',
});

export const THIS_YEAR = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'THIS_YEAR',
});

export const LAST_WEEK = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'LAST_WEEK',
});

export const LAST_MONTH = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'LAST_MONTH',
});

export const LAST_YEAR = (): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name: 'LAST_YEAR',
});

// ユーザー関数
export const LOGINUSER = (): UserFunction => ({
  _tag: 'function',
  _type: 'user',
  name: 'LOGINUSER',
});

// カスタム関数（将来の拡張や未サポート関数を型安全に表現するためのエスケープハッチ）
export const customDateFunction = (
  name: string,
  ...args: readonly any[]
): DateFunction => ({
  _tag: 'function',
  _type: 'date',
  name,
  args,
});

export const customUserFunction = (
  name: string,
  ...args: readonly any[]
): UserFunction => ({
  _tag: 'function',
  _type: 'user',
  name,
  args,
});

// 関数を文字列に変換
export const formatFunction = (func: KintoneFunction): string => {
  const escapeString = (s: string): string => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const formatArg = (arg: unknown): string => {
    if (typeof arg === 'string') return `"${escapeString(arg)}"`;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg && typeof arg === 'object' && (arg as { _tag?: string })._tag === 'function') {
      return formatFunction(arg as KintoneFunction);
    }
    return String(arg);
  };
  if (func.args && func.args.length > 0) {
    const formattedArgs = func.args.map((arg) => formatArg(arg));
    return `${func.name}(${formattedArgs.join(', ')})`;
  }
  return `${func.name}()`;
};
