# kintone-as-code

kintoneアプリの設定をコードで管理し、Effect-TSによる型安全性を実現するCLIツールです。

## 特徴

- 🔒 **型安全** - kintone-effect-schemaによる完全なTypeScriptサポート
- 📝 **kintoneからエクスポート** - 既存アプリからスキーマファイルを生成
- 🔧 **環境管理** - 複数のkintone環境をサポート
- 🎯 **Effect-TS対応** - Effect-TSの強力なスキーマバリデーション機能

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

完全に型付けされたフィールド定義を含む`apps/customer-app.schema.ts`が生成されます。

### 3. アプリスキーマの定義

エクスポートされたスキーマは、完全な型安全性のためにkintone-effect-schemaを使用します：

```typescript
import { defineAppSchema, getAppId } from 'kintone-as-code';
import type { 
  SingleLineTextFieldProperties,
  NumberFieldProperties,
  SubtableFieldProperties 
} from 'kintone-effect-schema';

// 完全な型情報を持つ個別フィールド定義
export const 会社名Field: SingleLineTextFieldProperties = {
  type: "SINGLE_LINE_TEXT",
  code: "会社名",
  label: "会社名",
  required: true,
  unique: true,
  maxLength: "100"
};

export const 売上高Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "売上高",
  label: "年間売上高",
  unit: "円",
  unitPosition: "AFTER"
};

// ネストされたフィールドを持つサブテーブル
export const 商品リストField: SubtableFieldProperties = {
  type: "SUBTABLE",
  code: "商品リスト",
  fields: {
    商品名: {
      type: "SINGLE_LINE_TEXT",
      code: "商品名",
      label: "商品名",
      required: true
    },
    単価: {
      type: "NUMBER",
      code: "単価",
      label: "単価",
      unit: "円"
    }
  }
};

// アプリフィールド設定
export const appFieldsConfig = {
  properties: {
    会社名: 会社名Field,
    売上高: 売上高Field,
    商品リスト: 商品リストField
  }
};

// アプリスキーマ定義
export default defineAppSchema({
  appId: getAppId('KINTONE_CUSTOMER_APP_ID'),
  name: '顧客管理',
  description: '顧客情報管理アプリ',
  fieldsConfig: appFieldsConfig
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
  --app-id <id>    エクスポートするアプリID（必須）
  --name <name>    スキーマファイル名（必須）
  --env <env>      環境名
  --output <dir>   出力ディレクトリ（デフォルト: "apps"）
```

### apply

スキーマを既存のkintoneアプリに適用：

```bash
kintone-as-code apply [options]

オプション:
  --app-id <id>    適用先のアプリID（必須）
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

## ベストプラクティス

1. **バージョン管理**: アプリ設定の変更を追跡するため、スキーマファイルをコミット
2. **環境変数**: 複数環境対応のため、アプリIDには環境変数を使用
3. **型安全性**: TypeScriptの型チェックを活用して設定エラーを早期発見
4. **コードレビュー**: 開発プロセスの一環としてスキーマ変更をレビュー

## ライセンス

MIT