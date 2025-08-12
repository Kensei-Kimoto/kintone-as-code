# Export / Apply / Create

## Export
- フォーム定義の取得 → 生成（フィールド/レコードスキーマ/クエリ）
- 主要ファイル: `commands/export.ts`, `core/kintone-client.ts`, `core/converter.ts`, `core/query-generator.ts`

```mermaid
sequenceDiagram
  participant CLI as commands/export
  participant KC as core/kintone-client
  participant CONV as core/converter
  participant QGEN as core/query-generator
  CLI->>KC: app.getFormFields(appId)
  KC-->>CLI: form metadata
  CLI->>CONV: convertKintoneFieldsToSchema()
  CLI->>QGEN: generateQueryBuilder()
  CLI-->>CLI: write apps/*.ts
```

## Apply
- 既存アプリへのスキーマ適用（フィールド追加/更新）
- 主要ファイル: `commands/apply.ts`, `core/kintone-client.ts`

```mermaid
sequenceDiagram
  participant CLI as commands/apply
  participant KC as core/kintone-client
  CLI->>KC: app.updateFormFields / addFormFields
  KC-->>CLI: result
```

## Create
- スキーマから新規アプリ作成（スペース/スレッドは必要に応じて）
- 主要ファイル: `commands/create.ts`, `core/kintone-client.ts`

```mermaid
sequenceDiagram
  participant CLI as commands/create
  participant KC as core/kintone-client
  CLI->>KC: app.create
  CLI->>KC: set fields / deploy
```
