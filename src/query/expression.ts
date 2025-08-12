// 演算子の型定義（kintoneでサポートされる演算子）
export type Operator = 
  | '=' | '!=' 
  | '>' | '<' | '>=' | '<='
  | 'in' | 'not in'
  | 'like' | 'not like';

// フィールド値の型定義
export type FieldValue = 
  | string 
  | number 
  | boolean 
  | null
  | undefined
  | ReadonlyArray<string | number>;

// Expression ADT (Algebraic Data Type)
export type Expression =
  | {
      readonly _tag: 'condition';
      readonly field: string;
      readonly operator: Operator;
      readonly value: FieldValue;
    }
  | {
      readonly _tag: 'and';
      readonly expressions: readonly Expression[];
    }
  | {
      readonly _tag: 'or';
      readonly expressions: readonly Expression[];
    }
  | {
      readonly _tag: 'not';
      readonly expression: Expression;
    };

// スマートコンストラクタ（不変性を保証）
export const condition = (
  field: string,
  operator: Operator,
  value: FieldValue
): Expression => Object.freeze({
  _tag: 'condition' as const,
  field,
  operator,
  value,
});

// 文字列のエスケープ処理
const escapeString = (str: string): string => {
  return str.replace(/"/g, '\\"');
};

// 値のフォーマット（より堅牢な実装）
const formatValue = (value: FieldValue): string => {
  // null/undefined処理
  if (value === null || value === undefined) {
    return 'null';
  }
  
  // 関数の場合（TODAY()、LOGINUSER()など）
  if (typeof value === 'string' && (
    value.endsWith('()') || 
    value.includes('(') && value.includes(')')
  )) {
    // 関数呼び出しの場合はそのまま返す
    return value;
  }
  
  // 文字列処理
  if (typeof value === 'string') {
    return `"${escapeString(value)}"`;
  }
  
  // 配列処理（IN演算子用）
  if (Array.isArray(value)) {
    const formatted = value.map(v => {
      // 配列内の関数もチェック
      if (typeof v === 'string' && (
        v.endsWith('()') || 
        v.includes('(') && v.includes(')')
      )) {
        return v;
      }
      return typeof v === 'string' ? `"${escapeString(v)}"` : String(v);
    });
    return `(${formatted.join(', ')})`;
  }
  
  // 数値・真偽値処理
  return String(value);
};

// AND演算子（ネストしたANDをフラット化）
export const and = (...expressions: Expression[]): Expression => {
  if (expressions.length === 0) {
    throw new Error('AND requires at least one expression');
  }
  if (expressions.length === 1) {
    return expressions[0]!;
  }
  
  // ネストしたANDをフラット化
  const flattened = expressions.flatMap(expr => 
    expr._tag === 'and' ? expr.expressions : [expr]
  );
  
  return {
    _tag: 'and',
    expressions: flattened,
  };
};

// OR演算子（ネストしたORをフラット化）
export const or = (...expressions: Expression[]): Expression => {
  if (expressions.length === 0) {
    throw new Error('OR requires at least one expression');
  }
  if (expressions.length === 1) {
    return expressions[0]!;
  }
  
  // ネストしたORをフラット化
  const flattened = expressions.flatMap(expr => 
    expr._tag === 'or' ? expr.expressions : [expr]
  );
  
  return {
    _tag: 'or',
    expressions: flattened,
  };
};

// NOT演算子
export const not = (expression: Expression): Expression => ({
  _tag: 'not',
  expression,
});

// 文字列変換（括弧最適化付き）
export const toString = (
  expr: Expression, 
  parentOp?: 'and' | 'or' | 'not'
): string => {
  switch (expr._tag) {
    case 'condition': {
      const formattedValue = formatValue(expr.value);
      return `${expr.field} ${expr.operator} ${formattedValue}`;
    }
    
    case 'and': {
      const parts = expr.expressions.map(e => toString(e, 'and'));
      const result = parts.join(' and ');
      // トップレベル（parentOpなし）または異なる演算子の場合は括弧を付ける
      return !parentOp || parentOp !== 'and' ? `(${result})` : result;
    }
    
    case 'or': {
      const parts = expr.expressions.map(e => toString(e, 'or'));
      const result = parts.join(' or ');
      // トップレベル（parentOpなし）または異なる演算子の場合は括弧を付ける
      return !parentOp || parentOp !== 'or' ? `(${result})` : result;
    }
    
    case 'not': {
      // NOTの中身は常に括弧で囲む（kintoneの仕様）
      const inner = toString(expr.expression, 'not');
      return `not (${inner})`;
    }
    
    default:
      // 型の網羅性チェック
      const _exhaustive: never = expr;
      void _exhaustive;
      throw new Error(`Unknown expression type`);
  }
};