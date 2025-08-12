/**
 * Query builder module exports
 * Provides a type-safe query builder for kintone
 */

// Expression builder exports
export {
  type Expression,
  type Operator,
  type FieldValue,
  condition,
  and,
  or,
  not,
  toString,
} from './expression.js';

// Field factory exports
export {
  type FieldType,
  createStringField,
  createNumberField,
  createDropdownField,
  createCheckboxField,
  createRadioButtonField,
  createDateField,
  createTimeField,
  createDateTimeField,
  createUserField,
  createOrgField,
  createGroupField,
  createTableSubField,
} from './field.js';

// Date and user function exports
export {
  type DateFunction,
  type UserFunction,
  type KintoneFunction,
  TODAY,
  FROM_TODAY,
  THIS_WEEK,
  THIS_MONTH,
  THIS_YEAR,
  LAST_WEEK,
  LAST_MONTH,
  LAST_YEAR,
  LOGINUSER,
  customDateFunction,
  customUserFunction,
} from './functions.js';

// Query builder class
export { QueryBuilder } from './builder.js';

// Functional Query Builder (FP API)
export {
  type QueryState,
  createQueryState,
  where as setWhere,
  orderBy as appendOrder,
  limit as withLimit,
  offset as withOffset,
  setValidationOptions,
  build,
} from './builder-fp.js';

// Validator exports
export {
  type ValidationOptions,
  validateExpression,
  validateExpressionDepth,
  validateQueryStringLength,
  ComplexityError,
  LengthError,
} from './validator.js';
