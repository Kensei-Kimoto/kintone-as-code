import { Expression, toString } from './expression.js';
import {
  validateExpressionDepth,
  validateQueryStringLength,
  type ValidationOptions,
} from './validator.js';

export type QueryState = Readonly<{
  where?: Expression;
  orderBy?: ReadonlyArray<{
    readonly field: string;
    readonly direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
  validationOptions?: Readonly<ValidationOptions>;
}>;

export const createQueryState = (): QueryState => ({}) as const;

// Helpers to construct new immutable states
const withProp = <K extends keyof QueryState>(
  state: QueryState,
  key: K,
  value: NonNullable<QueryState[K]>
): QueryState => ({ ...state, [key]: value });

// Curried, FP-first operators over QueryState
export const where =
  (expr: Expression) =>
  (state: QueryState): QueryState =>
    withProp(state, 'where', expr);

export const orderBy =
  (field: string, direction: 'asc' | 'desc' = 'asc') =>
  (state: QueryState): QueryState => {
    const next = [...(state.orderBy ?? []), { field, direction }] as const;
    return withProp(state, 'orderBy', next);
  };

export const limit =
  (value: number) =>
  (state: QueryState): QueryState => {
    if (value < 1) {
      throw new Error('Limit must be at least 1');
    }
    if (value > 500) {
      throw new Error('kintone API limit: maximum 500 records per request');
    }
    return withProp(state, 'limit', value);
  };

export const offset =
  (value: number) =>
  (state: QueryState): QueryState => {
    if (value < 0) {
      throw new Error('Offset must be non-negative');
    }
    return withProp(state, 'offset', value);
  };

export const setValidationOptions =
  (options: ValidationOptions) =>
  (state: QueryState): QueryState =>
    withProp(state, 'validationOptions', { ...options });

// Build final query string (pure)
export const build = (state: QueryState): string => {
  const parts: string[] = [];

  if (state.where) {
    parts.push(toString(state.where));
  }

  if (state.orderBy && state.orderBy.length > 0) {
    const order = state.orderBy
      .map(({ field, direction }) => `${field} ${direction}`)
      .join(', ');
    parts.push(`order by ${order}`);
  }

  if (state.limit !== undefined) {
    parts.push(`limit ${state.limit}`);
  }

  if (state.offset !== undefined) {
    parts.push(`offset ${state.offset}`);
  }

  const built = parts.join(' ');

  // Validation (pure, derived from state)
  if (state.where) {
    const depthOpts =
      state.validationOptions?.maxDepth !== undefined
        ? { maxDepth: state.validationOptions.maxDepth }
        : undefined;
    validateExpressionDepth(state.where, depthOpts);
  }

  const lengthOpts =
    state.validationOptions?.maxLength !== undefined
      ? { maxLength: state.validationOptions.maxLength }
      : undefined;
  validateQueryStringLength(built, lengthOpts);

  return built;
};
