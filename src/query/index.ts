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
  toString
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
  createGroupField
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
  LOGINUSER
} from './functions.js';

// Query builder class
export { QueryBuilder } from './builder.js';

// Validator exports
export {
  type ValidationOptions,
  validateExpression,
  validateExpressionDepth,
  validateQueryStringLength,
  ComplexityError,
  LengthError,
} from './validator.js';