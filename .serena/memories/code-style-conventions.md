# コードスタイル・規約

## 命名規則
- **ファイル名**: kebab-case（例: `query-generator.ts`）
- **変数・関数**: camelCase（例: `exportCommand`, `generateQueryBuilder`）
- **定数**: CONSTANT_CASE または PascalCase（例: `QueryFields`）
- **型・インターフェース**: PascalCase（例: `ExportOptions`）

## TypeScript 規約
- strict モード有効
- 明示的な型定義を推奨
- `any` 型の使用は最小限に
- const アサーションを活用（`as const`）

## インポート規約
- 相対パスには `.js` 拡張子を付ける（ESM 対応）
- 例: `import { loadConfig } from '../core/config.js'`

## コメント
- 日本語コメントOK（特にビジネスロジック）
- JSDoc スタイルは必要に応じて

## ファイル構造
- 機能ごとにディレクトリを分離
- テストは `__tests__` ディレクトリ配下
- 1ファイル1機能を基本とする