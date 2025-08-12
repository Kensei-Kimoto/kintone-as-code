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
kintone-as-code export --app-id 123 --name customer-app
```
生成物:
- `apps/customer-app.schema.ts`（フィールド定義）
- `apps/customer-app.record-schema.ts`（レコードスキーマ）
- `apps/customer-app.query.ts`（クエリビルダー）

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
        baseUrl: 'https://your-domain.cybozu.com',
        // username/password または apiToken を利用
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
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
