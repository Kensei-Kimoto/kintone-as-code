# クイックスタート

## インストール

```bash
npm install -g kintone-as-code
```

## 初期化

```bash
kintone-as-code init
```

`kintone-as-code.config.js` が作成され、環境設定を記述できます。

## 既存アプリをエクスポート

```bash
# クエリビルダー/レコードスキーマはデフォルトで生成されます
kintone-as-code export --app-id 123 --name customer-app

# 生成を抑止したい場合（後方互換: --with-* も利用可）
kintone-as-code export --app-id 123 --name customer-app --no-query
kintone-as-code export --app-id 123 --name customer-app --no-record-schema

# 関連レコード/サブテーブルのドット記法（最小: in/not in のみ）を含める場合
kintone-as-code export --app-id 123 --name customer-app \
  --include-related \
  --include-subtable
```

生成物:

- `apps/customer-app.schema.ts`（フィールド定義）
- `apps/customer-app.record-schema.ts`（レコードスキーマ）
- `apps/customer-app.query.ts`（クエリビルダー）

> メモ: `--include-related` を指定すると `REFERENCE_TABLE` の `displayFields` を最小構成で公開し、`親.子` のドット記法を `createTableSubField('親.子')` 経由で使用できます（`in/not in` のみ）。`--include-subtable` も同様に子フィールドを最小APIで公開します。

## スキーマの適用

```bash
kintone-as-code apply --schema apps/customer-app.schema.ts --env production
# または appId を直接指定
kintone-as-code apply --app-id 123 --schema apps/customer-app.schema.ts --env production
```

## 新規アプリの作成

```bash
kintone-as-code create --schema apps/customer-app.schema.ts --name "Customer App Copy" --space 100 --thread 200
```

## 環境変数の設定例

```bash
KINTONE_BASE_URL=https://your-domain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
KINTONE_CUSTOMER_APP_ID=123
KINTONE_PRODUCT_APP_ID=456
```

## 設定ファイル例（抜粋）

```javascript
export default {
  default: 'production',
  environments: {
    production: {
      auth: {
        baseUrl: process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
      },
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASE_URL,
        username: process.env.KINTONE_DEV_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD,
      },
    },
  },
};
```
