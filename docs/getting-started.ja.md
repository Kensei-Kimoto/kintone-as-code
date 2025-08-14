# クイックスタート（IaC：フォーム設定のコード管理）

このガイドは「フォームフィールド設定をコードで管理」する最短ルートです。まずは既存アプリをエクスポートして、生成されたスキーマをレビューし、`apply` で反映する一連の流れを体験します。

## 1. インストール

```bash
npm install -g kintone-as-code
```

## 2. 初期化（設定ファイルと .env）

```bash
kintone-as-code init
```

`kintone-as-code.config.js` が作成されます。.env（自動読込）には以下を設定します。

```bash
KINTONE_BASE_URL=https://your-domain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
```

## 3. 既存アプリをエクスポート（フォーム → スキーマ）

```bash
# デフォルトで フィールドスキーマ / レコードスキーマ / クエリ（任意） を生成
kintone-as-code export --app-id 123 --name customer-app

# 生成の制御（後方互換: --with-* も利用可）
kintone-as-code export --app-id 123 --name customer-app --no-query
kintone-as-code export --app-id 123 --name customer-app --no-record-schema

# 関連 / サブテーブルの最小公開（in/not in のみ）
kintone-as-code export --app-id 123 --name customer-app \
  --include-related \
  --include-subtable
```

生成物:

- `apps/customer-app.schema.ts`（フォーム設定を表すTypeScriptスキーマ）
- `apps/customer-app.record-schema.ts`（Effect-TSによる型安全なレコードバリデーション）
- `apps/customer-app.query.ts`（任意の派生機能：生成物のクエリビルダー）

メモ:

- このリポジトリでは `apps/` と `utils/app-ids.ts` が `.gitignore` に含まれています。生成物をバージョン管理したい場合は `.gitignore` の `apps/` を外してください。
- `utils/app-ids.ts` は `export` 実行時に自動更新されます（アプリIDの一元管理）。

## 4. スキーマをレビュー・編集（例：フィールド追加）

`apps/customer-app.schema.ts` にフィールドを追加・修正します。型は[kintone-effect-schema](https://github.com/Kensei-Kimoto/kintone-effect-schema)のプロパティ型に準拠します。

```ts
// 例: 数値フィールドの追加（抜粋）
export const 売上高Field = {
  type: 'NUMBER',
  code: '売上高',
  label: '年間売上高',
  unit: '円',
  unitPosition: 'AFTER',
} as const;
```

## 5. スキーマの適用（差分更新）

```bash
kintone-as-code apply --schema apps/customer-app.schema.ts --env production
# または appId を直接指定
kintone-as-code apply --app-id 123 --schema apps/customer-app.schema.ts --env production
```

- 既存フィールドは型安全に更新、新規フィールドは追加されます。
- 適用後に自動デプロイまで行われます。

## 6. 新規アプリを作成（必要に応じて）

```bash
kintone-as-code create --schema apps/customer-app.schema.ts --name "Customer App" --space 100 --thread 200
```

## 7. レコードスキーマの活用（REST / JS API）

```ts
import {
  validateRecord,
  type AppRecord,
} from './apps/customer-app.record-schema';

const validated: AppRecord = validateRecord(response.record);
```

## トラブルシュート（よくあるエラー）

- Environment 'xxx' not found → `kintone-as-code.config.js` の `default` と `environments` を確認
- 認証エラー → `.env` の `KINTONE_*` 値を再確認
- appId 未設定 → `--app-id` 指定 or スキーマの `appId` 設定
