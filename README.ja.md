# kintone-as-code

kintoneアプリの設定をコードで管理し、Effect-TSによる型安全性を実現するCLIツールです。

## 特徴

- 🔒 **型安全** - kintone-effect-schemaによる完全なTypeScriptサポート
- 📝 **kintoneからエクスポート** - 既存アプリからスキーマファイルを生成
- 🔧 **環境管理** - 複数のkintone環境をサポート
- 🎯 **Effect-TS対応** - Effect-TSの強力なスキーマバリデーション機能
- 📋 **レコードスキーマ生成** - コピペ可能な静的レコードスキーマを自動生成

## インストール

```bash
npm install -g kintone-as-code
```

## 必要条件

- Node.js 18以上
- APIアクセス可能なkintone環境

## クイックスタート

### 1. プロジェクトの初期化

```bash
kintone-as-code init
```

環境設定を含む`kintone-as-code.config.js`ファイルが作成されます。

### 2. 既存アプリのエクスポート

```bash
kintone-as-code export --app-id 123 --name customer-app
```

以下のファイルが生成されます：

- `apps/customer-app.schema.ts` - 完全に型付けされたフィールド定義
- `apps/customer-app.record-schema.ts` - 静的な型安全レコードスキーマ（そのままコピペで利用可能）
- `apps/customer-app.query.ts` - kintone API用の型安全なクエリビルダー（デフォルトで生成）

### 3. アプリスキーマの定義

エクスポートされたスキーマは、完全な型安全性のためにkintone-effect-schemaを使用します：

```typescript
import { defineAppSchema, getAppId } from 'kintone-as-code';
import type {
  SingleLineTextFieldProperties,
  NumberFieldProperties,
  SubtableFieldProperties,
} from 'kintone-effect-schema';

// 完全な型情報を持つ個別フィールド定義
export const 会社名Field: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: '会社名',
  label: '会社名',
  required: true,
  unique: true,
  maxLength: '100',
};

export const 売上高Field: NumberFieldProperties = {
  type: 'NUMBER',
  code: '売上高',
  label: '年間売上高',
  unit: '円',
  unitPosition: 'AFTER',
};

// ネストされたフィールドを持つサブテーブル
export const 商品リストField: SubtableFieldProperties = {
  type: 'SUBTABLE',
  code: '商品リスト',
  fields: {
    商品名: {
      type: 'SINGLE_LINE_TEXT',
      code: '商品名',
      label: '商品名',
      required: true,
    },
    単価: {
      type: 'NUMBER',
      code: '単価',
      label: '単価',
      unit: '円',
    },
  },
};

// アプリフィールド設定
export const appFieldsConfig = {
  properties: {
    会社名: 会社名Field,
    売上高: 売上高Field,
    商品リスト: 商品リストField,
  },
};

// アプリスキーマ定義
export default defineAppSchema({
  appId: getAppId('KINTONE_CUSTOMER_APP_ID'),
  name: '顧客管理',
  description: '顧客情報管理アプリ',
  fieldsConfig: appFieldsConfig,
});
```

## 設定

### 環境変数

アプリIDを環境変数として設定します：

```bash
KINTONE_CUSTOMER_APP_ID=123
KINTONE_PRODUCT_APP_ID=456
```

### 設定ファイル

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
        // またはAPIトークンを使用
        // apiToken: process.env.KINTONE_API_TOKEN,
      },
    },
    development: {
      auth: {
        baseUrl: 'https://dev.cybozu.com',
        apiToken: process.env.KINTONE_DEV_API_TOKEN,
      },
    },
  },
};
```

## kintone-effect-schemaとの統合

このツールは[kintone-effect-schema](https://github.com/Kensei-Kimoto/kintone-effect-schema)とシームレスに連携し、以下を提供します：

- すべてのkintoneフィールドタイプの完全な型定義
- Effect-TSを使用したランタイムバリデーション
- 日本語フィールドコードのサポート
- 空値の自動処理

## コマンド

### init

新しいkintone-as-codeプロジェクトを初期化：

```bash
kintone-as-code init [options]

オプション:
  -f, --force  既存ファイルを強制的に上書き
```

### export

kintoneアプリ設定をTypeScriptにエクスポート：

```bash
kintone-as-code export [options]

オプション:
  --app-id <id>             エクスポートするアプリID（必須）
  --name <name>             スキーマファイル名（必須）
  --env <env>               環境名
  --output <dir>            出力ディレクトリ（デフォルト: "apps"）
  --with-record-schema      レコードスキーマファイルを生成（デフォルト: true）
  --no-record-schema        レコードスキーマ生成をスキップ
  --with-query              クエリビルダーファイルを生成（デフォルト: true）
  --no-query                クエリビルダー生成をスキップ
```

exportコマンドはデフォルトで3つのファイルを生成します：

1. **フィールドスキーマ** (`{name}.schema.ts`) - フィールド定義と設定
2. **レコードスキーマ** (`{name}.record-schema.ts`) - Effect Schemaによる型安全なレコードバリデーション
3. **クエリビルダー** (`{name}.query.ts`) - kintone REST API用の型安全なクエリビルダー

### apply

スキーマを既存のkintoneアプリに適用：

```bash
kintone-as-code apply [options]

オプション:
  --app-id <id>    適用先のアプリID（省略可。指定がない場合はスキーマの appId を使用）
  --schema <path>  スキーマファイルパス（必須）
  --env <env>      環境名
```

### create

スキーマから新しいkintoneアプリを作成：

```bash
kintone-as-code create [options]

オプション:
  --schema <path>  スキーマファイルパス（必須）
  --name <name>    アプリ名（スキーマの名前を上書き）
  --env <env>      環境名
  --space <id>     スペースID（オプション）
  --thread <id>    スレッドID（スペース内で作成する場合）
```

## レコードスキーマの使用方法

生成されたレコードスキーマはkintoneレコードの型安全なバリデーションと自動正規化を提供します：

```typescript
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import {
  validateRecord,
  type AppRecord,
} from './apps/customer-app.record-schema';

// クライアントの初期化
const client = new KintoneRestAPIClient({
  baseUrl: 'https://example.cybozu.com',
  auth: { apiToken: 'YOUR_API_TOKEN' },
});

// レコードの取得とバリデーション（自動正規化付き）
const response = await client.record.getRecord({
  app: 123,
  id: 1,
});
const validatedRecord: AppRecord = validateRecord(response.record);
// validatedRecord は完全に型付け＆正規化されています（型アサーション不要）
// 数値フィールドの空文字列 → null、undefined → '' など

// 複数レコードの検証
const recordsResponse = await client.record.getRecords({
  app: 123,
  query: 'limit 100',
});
const validatedRecords = recordsResponse.records.map((record) =>
  validateRecord(record)
);
```

### 生成されるレコードスキーマの例（シンプル）

```ts
import { Schema } from 'effect';
import {
  SingleLineTextFieldSchema,
  NumberFieldSchema,
  decodeKintoneRecord,
} from 'kintone-effect-schema';

// 静的出力の例
export const RecordSchema = Schema.Struct({
  title: SingleLineTextFieldSchema,
  amount: NumberFieldSchema,
});

export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;

export const validateRecord = (record: Record<string, unknown>): AppRecord => {
  const normalized = decodeKintoneRecord(record);
  return Schema.decodeUnknownSync(RecordSchema)(normalized);
};
```

### JavaScript API利用時（カスタマイズ）

```typescript
import {
  validateRecord,
  type AppRecord,
} from './apps/customer-app.record-schema';

kintone.events.on('app.record.detail.show', (event) => {
  // 同じ関数でJavaScript APIも処理可能
  const validatedRecord: AppRecord = validateRecord(event.record);
  // すべての空値の不整合を自動的に処理

  // 型安全にアクセス
  console.log(validatedRecord.会社名.value);
  return event;
});
```

### ポイント

- **validateRecord**: REST API・JavaScript API両方で使用可能（自動正規化あり）
- **validateRecordWithCustomRules**: カスタムルール + 自動正規化
- どちらのAPIでも同じ関数で安全に処理できます！

## クエリビルダーの使用方法

生成されたクエリビルダーはIDEの自動補完を備えた型安全なクエリ構築を提供します：

```typescript
import { QueryFields, createQuery } from './apps/customer-app.query';
import { and, or } from 'kintone-as-code';

// すべてのフィールド名が自動補完される
const { 会社名, ステータス, 売上高, 担当者 } = QueryFields;

// 型安全なクエリを構築（メソッドチェーンの例）
const query = createQuery()
  .where(
    and(
      会社名.like('*サイボウズ*'),
      売上高.greaterThan(1000000),
      ステータス.in(['商談中', '受注'])
    )
  )
  .orderBy('売上高', 'desc')
  .limit(100)
  .build();

// 関数型API（純関数）での構築例
import {
  createQueryState,
  setWhere,
  appendOrder,
  withLimit,
  build,
} from 'kintone-as-code/query';

const q2 = build(
  withLimit(100)(
    appendOrder(
      '売上高',
      'desc'
    )(
      setWhere(
        and(
          会社名.like('*サイボウズ*'),
          売上高.greaterThan(1000000),
          ステータス.in(['商談中', '受注'])
        )
      )(createQueryState())
    )
  )
);

// kintone REST APIで使用
const client = new KintoneRestAPIClient({
  /* ... */
});
const records = await client.record.getRecords({
  app: 123,
  query: query,
});
```

### クエリビルダーの機能

- **型安全なフィールドアクセス**: すべてのフィールドがkintoneフィールドタイプに基づいて型付け
- **フィールド固有の演算子**: 各フィールドタイプで有効な演算子のみ使用可能
- **kintone関数**: `TODAY()`、`LOGINUSER()`、`THIS_MONTH()` などをサポート
- **複雑な条件**: `and()`、`or()`、`not()` で組み合わせ
- **自動補完**: IDEがフィールドとメソッドの候補を提供

### フィールドタイプ別の例

```typescript
// 文字列フィールドは like/not like をサポート
会社名.like('*株式会社*');
会社名.notLike('*test*');

// 数値フィールドは比較演算子をサポート
売上高.greaterThan(1000000);
売上高.lessThanOrEqual(5000000);

// ドロップダウンは in/not in を使用
ステータス.in(['商談中', '受注']);
ステータス.notIn(['失注', 'キャンセル']);

// 日付フィールドは日付関数をサポート
契約日.equals(TODAY());
期限日.lessThan(FROM_TODAY(7, 'DAYS'));
登録日.in([THIS_MONTH()]);

// ユーザーフィールドはユーザー関数をサポート
担当者.equals(LOGINUSER());
作成者.in(['user1', 'user2']);
```

## ベストプラクティス

1. **バージョン管理**: アプリ設定の変更を追跡するため、スキーマファイルをコミット
2. **環境変数**: 複数環境対応のため、アプリIDには環境変数を使用
3. **型安全性**: TypeScriptの型チェックを活用して設定エラーを早期発見
4. **コードレビュー**: 開発プロセスの一環としてスキーマ変更をレビュー
5. **レコードバリデーション**: カスタマイズコードで生成されたレコードスキーマを使用して型安全なデータ処理を実現

## ライセンス

MIT
