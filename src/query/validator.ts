import { Expression, toString } from './expression.js';

export interface ValidationOptions {
  readonly maxDepth?: number; // default 5
  readonly maxLength?: number; // default 10000
}

export class ComplexityError extends Error {
  readonly _tag = 'ComplexityError' as const;
  constructor(
    public readonly depth: number,
    public readonly maxDepth: number
  ) {
    super(`Query depth ${depth} exceeds maximum ${maxDepth}`);
  }
}

export class LengthError extends Error {
  readonly _tag = 'LengthError' as const;
  constructor(
    public readonly length: number,
    public readonly maxLength: number
  ) {
    super(`Query length ${length} exceeds maximum ${maxLength}`);
  }
}

const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_MAX_LENGTH = 10000;

export const computeDepth = (expr: Expression): number => {
  switch (expr._tag) {
    case 'condition':
      return 1;
    case 'not':
      return 1 + computeDepth(expr.expression);
    case 'and':
    case 'or': {
      const childDepths = expr.expressions.map(computeDepth);
      return 1 + (childDepths.length === 0 ? 0 : Math.max(...childDepths));
    }
    default: {
      const _exhaustive: never = expr;
      void _exhaustive;
      return 1;
    }
  }
};

export const validateExpressionDepth = (
  expr: Expression,
  options?: Pick<ValidationOptions, 'maxDepth'>
): void => {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const depth = computeDepth(expr);
  if (depth > maxDepth) {
    throw new ComplexityError(depth, maxDepth);
  }
};

export const validateQueryStringLength = (
  query: string,
  options?: Pick<ValidationOptions, 'maxLength'>
): void => {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  const length = query.length;
  if (length > maxLength) {
    throw new LengthError(length, maxLength);
  }
};

export const validateExpression = (
  expr: Expression,
  options?: ValidationOptions
): void => {
  const depthOpts =
    options?.maxDepth !== undefined
      ? { maxDepth: options.maxDepth }
      : undefined;
  validateExpressionDepth(expr, depthOpts);
  const query = toString(expr);
  const lengthOpts =
    options?.maxLength !== undefined
      ? { maxLength: options.maxLength }
      : undefined;
  validateQueryStringLength(query, lengthOpts);
};
