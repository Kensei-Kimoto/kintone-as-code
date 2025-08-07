# kintone-as-code

[![npm version](https://badge.fury.io/js/kintone-as-code.svg)](https://badge.fury.io/js/kintone-as-code)
[![CI](https://github.com/kimotokensei/kintone-as-code/actions/workflows/ci.yml/badge.svg)](https://github.com/kimotokensei/kintone-as-code/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[日本語](README.ja.md)

Manage kintone app configurations as code with type safety using Effect-TS.

## Features

- 🔒 **Type-safe** - Full TypeScript support with kintone-effect-schema
- 📝 **Export from kintone** - Generate schema files from existing apps
- 🚀 **Apply changes** - Update existing apps with schema changes and automatically add new fields
- ✨ **Create apps** - Create new kintone apps from schema definitions
- 🔧 **Environment management** - Support multiple kintone environments
- 🎯 **Effect-TS powered** - Leverage the power of Effect-TS for schema validation
- 📋 **Record Schema Generation** - Automatically generate type-safe record schemas for customization development

## Installation

```bash
npm install -g kintone-as-code
```

## Prerequisites

- Node.js 18 or higher
- kintone environment with API access

## Quick Start

### 1. Initialize project

```bash
kintone-as-code init
```

This creates a `kintone-as-code.config.js` file with your environment settings.

### 2. Export an existing app

```bash
kintone-as-code export --app-id 123 --name customer-app
```

This generates:
- `apps/customer-app.schema.ts` - Fully typed field definitions
- `apps/customer-app.record-schema.ts` - Type-safe record validation schema (new!)

### 3. Apply changes to existing app

```bash
kintone-as-code apply --app-id 123 --schema apps/customer-app.schema.ts
```

This updates the app with any schema changes and automatically adds new fields.

### 4. Create a new app from schema

```bash
kintone-as-code create --schema apps/customer-app.schema.ts --name "Customer App Copy"
```

This creates a new app with all fields defined in the schema.

### 5. Define app schema

The exported schema uses kintone-effect-schema for complete type safety:

```typescript
import { defineAppSchema, getAppId } from 'kintone-as-code';
import type { 
  SingleLineTextFieldProperties,
  NumberFieldProperties,
  SubtableFieldProperties 
} from 'kintone-effect-schema';

// Individual field definitions with complete type information
export const companyNameField: SingleLineTextFieldProperties = {
  type: "SINGLE_LINE_TEXT",
  code: "会社名",
  label: "会社名",
  required: true,
  unique: true,
  maxLength: "100"
};

export const revenueField: NumberFieldProperties = {
  type: "NUMBER",
  code: "売上高",
  label: "年間売上高",
  unit: "円",
  unitPosition: "AFTER"
};

// Subtable with nested fields
export const productsField: SubtableFieldProperties = {
  type: "SUBTABLE",
  code: "products",
  fields: {
    productName: {
      type: "SINGLE_LINE_TEXT",
      code: "productName",
      label: "商品名",
      required: true
    },
    price: {
      type: "NUMBER",
      code: "price",
      label: "単価",
      unit: "円"
    }
  }
};

// App fields configuration
export const appFieldsConfig = {
  properties: {
    会社名: companyNameField,
    売上高: revenueField,
    products: productsField
  }
};

// App schema definition
export default defineAppSchema({
  appId: getAppId('KINTONE_CUSTOMER_APP_ID'),
  name: 'Customer Management',
  description: 'Customer information management app',
  fieldsConfig: appFieldsConfig
});
```

## Configuration

### Environment Variables

Set your app IDs as environment variables:

```bash
KINTONE_CUSTOMER_APP_ID=123
KINTONE_PRODUCT_APP_ID=456
```

### Configuration File

`kintone-as-code.config.js`:

```javascript
export default {
  default: 'production',
  environments: {
    production: {
      auth: {
        baseUrl: 'https://your-domain.cybozu.com',
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_API_TOKEN,
      }
    },
    development: {
      auth: {
        baseUrl: 'https://dev.cybozu.com',
        apiToken: process.env.KINTONE_DEV_API_TOKEN,
      }
    }
  }
};
```

## Integration with kintone-effect-schema

This tool is designed to work seamlessly with [kintone-effect-schema](https://github.com/Kensei-Kimoto/kintone-effect-schema), which provides:

- Complete type definitions for all kintone field types
- Runtime validation using Effect-TS
- Support for Japanese field codes
- Automatic handling of empty values

## Commands

### init

Initialize a new kintone-as-code project:

```bash
kintone-as-code init [options]

Options:
  -f, --force  Force overwrite existing files
```

### export

Export kintone app configuration to TypeScript:

```bash
kintone-as-code export [options]

Options:
  --app-id <id>             App ID to export (required)
  --name <name>             Schema file name (required)
  --env <env>               Environment name
  --output <dir>            Output directory (default: "apps")
  --with-record-schema      Generate record schema file (default: true)
  --no-record-schema        Skip record schema generation
```

The export command now generates two files by default:
1. **Field Schema** (`{name}.schema.ts`) - Field definitions and configurations
2. **Record Schema** (`{name}.record-schema.ts`) - Type-safe record validation with Effect Schema

### apply

Apply schema changes to an existing kintone app:

```bash
kintone-as-code apply [options]

Options:
  --app-id <id>    App ID to update (required)
  --schema <path>  Path to schema file (required)
  --env <env>      Environment name
```

Features:
- Updates existing fields with type-safe validation
- Automatically detects and adds new fields
- Deploys changes after successful update

### create

Create a new kintone app from a schema file:

```bash
kintone-as-code create [options]

Options:
  --schema <path>   Path to schema file (required)
  --name <name>     Override app name from schema
  --space-id <id>   Create app in specific space
  --env <env>       Environment name
```

Features:
- Creates new app with all fields defined in schema
- Supports creating apps in specific spaces
- Automatically deploys the app after creation

## Record Schema Usage

The generated record schema provides type-safe validation for kintone records with automatic normalization:

```typescript
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { validateRecord } from './apps/customer-app.record-schema';

// Initialize client
const client = new KintoneRestAPIClient({
  baseUrl: 'https://example.cybozu.com',
  auth: { apiToken: 'YOUR_API_TOKEN' }
});

// Fetch and validate record with automatic normalization
const response = await client.record.getRecord({ 
  app: 123, 
  id: 1 
});
const validatedRecord = validateRecord(response.record);
// validatedRecord is now fully typed and normalized!
// Empty strings in number fields → null, undefined → '', etc.
```

### JavaScript API Usage (Customization)

```typescript
import { validateRecord } from './apps/customer-app.record-schema';

kintone.events.on('app.record.detail.show', (event) => {
  // Same function works for JavaScript API
  const validatedRecord = validateRecord(event.record);
  // Handles all empty value inconsistencies automatically
  return event;
});
```

### Custom Validation Rules

```typescript
import { validateRecordWithCustomRules } from './apps/customer-app.record-schema';

// Custom rules are defined in the generated file
// Also includes automatic normalization
const validatedRecord = validateRecordWithCustomRules(record);
```

## Best Practices

1. **Version Control**: Commit your schema files to track app configuration changes
2. **Environment Variables**: Use environment variables for app IDs to support multiple environments
3. **Type Safety**: Leverage TypeScript's type checking to catch configuration errors early
4. **Code Review**: Review schema changes as part of your development process
5. **Record Validation**: Use generated record schemas in your customization code for type-safe data handling

## License

MIT