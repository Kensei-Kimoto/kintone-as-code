import { describe, it, expect } from 'vitest';
import { condition, and, or, not } from '../expression.js';
import { computeDepth, validateExpressionDepth, validateQueryStringLength, ComplexityError, LengthError, validateExpression } from '../validator.js';

describe('validator', () => {
  it('computeDepth: 単一条件は深さ1', () => {
    const expr = condition('A', '=', '1');
    expect(computeDepth(expr)).toBe(1);
  });

  it('computeDepth: and/or/not を含む場合に深さが加算される', () => {
    const expr = and(
      condition('A', '=', '1'),
      or(
        condition('B', '>', 2),
        not(condition('C', '!=', 'x'))
      )
    );
    // and( level 1 ) -> max( condition(1), or(1 + max(condition(1), not(1+condition(1)))) )
    // or部分: 1 + max(1, 1 + 1) = 1 + 2 = 3
    // 全体: 1 + max(1, 3) = 4
    expect(computeDepth(expr)).toBe(4);
  });

  it('validateExpressionDepth: 上限超過でエラー', () => {
    // 深さ6の式を作る: not(not(not(not(not(condition(...))))))
    const deep = not(not(not(not(not(condition('A', '=', '1'))))));
    expect(() => validateExpressionDepth(deep, { maxDepth: 5 })).toThrow(ComplexityError);
  });

  it('validateQueryStringLength: 長さ超過でエラー', () => {
    const longValue = 'a'.repeat(10050);
    // 単純な条件で長さを超過させる
    const query = `name = "${longValue}"`;
    expect(() => validateQueryStringLength(query, { maxLength: 10000 })).toThrow(LengthError);
  });

  it('validateExpression: 深さと長さの両方を検証', () => {
    const expr = condition('name', '=', 'foo');
    expect(() => validateExpression(expr, { maxDepth: 5, maxLength: 10000 })).not.toThrow();
  });
});