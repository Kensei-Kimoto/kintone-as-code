/**
 * Query builder (OO facade) backed by functional core
 */

import { Expression } from './expression.js';
import {
  type QueryState,
  createQueryState,
  where as setWhere,
  orderBy as appendOrder,
  limit as withLimit,
  offset as withOffset,
  setValidationOptions,
  build as buildFromState,
} from './builder-fp.js';

export class QueryBuilder {
  private state: QueryState = createQueryState();

  where(expr: Expression): this {
    this.state = setWhere(expr)(this.state);
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.state = appendOrder(field, direction)(this.state);
    return this;
  }

  limit(value: number): this {
    this.state = withLimit(value)(this.state);
    return this;
  }

  offset(value: number): this {
    this.state = withOffset(value)(this.state);
    return this;
  }

  setValidationOptions(options: {
    maxDepth?: number;
    maxLength?: number;
  }): this {
    this.state = setValidationOptions(options)(this.state);
    return this;
  }

  build(): string {
    return buildFromState(this.state);
  }

  reset(): this {
    this.state = createQueryState();
    return this;
  }

  clone(): QueryBuilder {
    const qb = new QueryBuilder();
    // state is a plain object; shallow copy is enough since values are immutable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (qb as any).state = { ...this.state };
    return qb;
  }
}
