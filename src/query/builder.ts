/**
 * Query builder for kintone
 * Provides fluent interface for building queries
 */

import { Expression, toString } from './expression.js';
import {
  validateExpressionDepth,
  validateQueryStringLength,
} from './validator.js';

export class QueryBuilder {
  private whereClause: Expression | undefined = undefined;
  private orderByClause:
    | Array<{ field: string; direction: 'asc' | 'desc' }>
    | undefined = undefined;
  private limitValue: number | undefined = undefined;
  private offsetValue: number | undefined = undefined;
  private validationOptions:
    | {
        maxDepth?: number;
        maxLength?: number;
      }
    | undefined = undefined;

  /**
   * Set WHERE clause
   * @param expr Expression to use as WHERE clause
   */
  where(expr: Expression): this {
    this.whereClause = expr;
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param field Field name to order by
   * @param direction Sort direction (default: 'asc')
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.orderByClause) {
      this.orderByClause = [];
    }
    this.orderByClause.push({ field, direction });
    return this;
  }

  /**
   * Set LIMIT clause
   * @param value Number of records to return (max: 500)
   */
  limit(value: number): this {
    if (value < 1) {
      throw new Error('Limit must be at least 1');
    }
    if (value > 500) {
      throw new Error('kintone API limit: maximum 500 records per request');
    }
    this.limitValue = value;
    return this;
  }

  /**
   * Set OFFSET clause
   * @param value Number of records to skip
   */
  offset(value: number): this {
    if (value < 0) {
      throw new Error('Offset must be non-negative');
    }
    this.offsetValue = value;
    return this;
  }

  /**
   * Set validation options (optional)
   */
  setValidationOptions(options: {
    maxDepth?: number;
    maxLength?: number;
  }): this {
    this.validationOptions = options;
    return this;
  }

  /**
   * Build the final query string
   * @returns The complete query string for kintone API
   */
  build(): string {
    const parts: string[] = [];

    // Add WHERE clause
    if (this.whereClause) {
      parts.push(toString(this.whereClause));
    }

    // Add ORDER BY clause
    if (this.orderByClause && this.orderByClause.length > 0) {
      const orderBy = this.orderByClause
        .map(({ field, direction }) => `${field} ${direction}`)
        .join(', ');
      parts.push(`order by ${orderBy}`);
    }

    // Add LIMIT clause
    if (this.limitValue !== undefined) {
      parts.push(`limit ${this.limitValue}`);
    }

    // Add OFFSET clause
    if (this.offsetValue !== undefined) {
      parts.push(`offset ${this.offsetValue}`);
    }

    const built = parts.join(' ');

    // Validation
    if (this.whereClause) {
      // Depth check based on expression tree
      const depthOpts =
        this.validationOptions?.maxDepth !== undefined
          ? { maxDepth: this.validationOptions.maxDepth }
          : undefined;
      validateExpressionDepth(this.whereClause, depthOpts);
    }
    // Length check on the built query string (always safe)
    const lengthOpts =
      this.validationOptions?.maxLength !== undefined
        ? { maxLength: this.validationOptions.maxLength }
        : undefined;
    validateQueryStringLength(built, lengthOpts);

    return built;
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.whereClause = undefined;
    this.orderByClause = undefined;
    this.limitValue = undefined;
    this.offsetValue = undefined;
    return this;
  }

  /**
   * Clone the current builder state
   */
  clone(): QueryBuilder {
    const newBuilder = new QueryBuilder();
    newBuilder.whereClause = this.whereClause;
    newBuilder.orderByClause = this.orderByClause
      ? [...this.orderByClause]
      : undefined;
    newBuilder.limitValue = this.limitValue;
    newBuilder.offsetValue = this.offsetValue;
    return newBuilder;
  }
}
