# フォーム定義のエクスポートとスキーマ（converter と record-schema）

フォーム設定を「コード」として扱う中心機能です。既存アプリのFormメタデータから型安全なスキーマを生成し、レコードのバリデーション/正規化に使える静的スキーマも併せて出力します。

## 1. 生成の役割

- `src/core/converter.ts`: Form APIレスポンスから TypeScript のフィールド定義（スキーマ）を生成
- `generateStaticRecordSchemaCode`: フィールド定義から Effect-TS の静的レコードスキーマを生成

## 2. 出力テンプレート（フィールド定義）

- エクスポート先: `apps/{name}.schema.ts`
- `defineAppSchema` を利用して1つのアプリスキーマとして定義
- アプリIDは `utils/app-ids.ts` の `APP_IDS` から参照（`export` 実行時に自動更新）

```ts
import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS.MY_APP,
  name: 'Exported App',
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig,
});
```

## 3. レコードスキーマの生成と活用

- 出力先: `apps/{name}.record-schema.ts`
- Effect-TS の `Schema` を用いて、kintoneレコードの型安全な検証と自動正規化を提供
- `decodeKintoneRecord` で空値や型を正規化し、`Schema.Struct` で検証

```mermaid
flowchart LR
  FORM[Form metadata] --> CONV[converter.ts]
  CONV --> FS[fields schema (apps/* .schema.ts)]
  CONV --> RS[record schema (apps/* .record-schema.ts)]
```

### 利用例（抜粋）

```ts
import {
  validateRecord,
  type AppRecord,
} from '../apps/customer-app.record-schema';

const validated: AppRecord = validateRecord(restApiResponse.record);
```

## 4. 注意点とヒント

- SUBTABLE は配下の子フィールドをUnionして型表現
- 未対応フィールドはコメントで警告付与
- 生成物は `apps/` 配下に出力。Git管理する場合は `.gitignore` を調整
- `APP_IDS` は `export` 実行時に安全に追記・更新されます
