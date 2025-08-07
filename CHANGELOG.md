# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-01-07

### Added
- Automatic empty value normalization using `decodeKintoneRecord` from kintone-effect-schema
- Separate validation functions for different use cases:
  - `validateRecord` - For JavaScript API with automatic normalization
  - `validateRecordStrict` - For REST API without normalization
  - `validateRecordWithCustomRules` - Custom validation with normalization

### Changed
- Improved generated record schema to handle both JavaScript API and REST API responses
- Updated documentation with clear usage examples for different scenarios

### Fixed
- JavaScript API's undefined and empty string values are now properly normalized

## [0.2.0] - 2025-01-07

### Added
- Record schema generation feature for type-safe record validation in kintone customizations
- New `--with-record-schema` option for export command (default: true)
- Automatic generation of `{name}.record-schema.ts` files alongside field schemas
- Integration with kintone-effect-schema's `convertFormFieldsToRecordSchema` function
- Helper functions (`validateRecord`, `validateRecordWithCustomRules`) for record validation
- Support for custom validation rules in generated record schemas
- Type inference helpers for `AppRecord` and `AppRecordEncoded` types
- Comprehensive documentation and usage examples for record schema feature

### Changed
- Export command now generates two files by default (field schema and record schema)
- Updated README with record schema usage examples and best practices
- Enhanced Japanese documentation with customization development examples

## [0.1.1] - 2025-01-06

### Fixed
- Updated repository URLs and documentation links

## [0.1.0] - 2025-01-13

### Added
- Initial release of kintone-as-code CLI tool
- `init` command - Initialize new kintone-as-code projects with configuration files
- `export` command - Export existing kintone apps to TypeScript schema files
- `apply` command - Apply schema changes to existing kintone apps with automatic new field detection
- `create` command - Create new kintone apps from TypeScript schema definitions
- Full TypeScript support with type-safe field definitions
- Integration with [kintone-effect-schema](https://github.com/naohito-T/kintone-effect-schema) for robust type validation
- Support for multiple environments (development, staging, production)
- Environment variable support for secure credential management
- Comprehensive test suite with integration tests
- Example schemas for common use cases
- Documentation in both English and Japanese

### Features
- Type-safe field property validation at compile time
- Automatic detection and addition of new fields during apply
- Support for all kintone field types including subtables
- Deployment automation after successful updates
- CLI with intuitive command structure
- ESM module support

### Technical Details
- Built with Effect-TS for functional programming patterns
- Uses official @kintone/rest-api-client for API interactions
- Minimum Node.js version: 18.0.0
- Full ESM module support
- Comprehensive TypeScript type definitions