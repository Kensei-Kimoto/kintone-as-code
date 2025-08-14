# 概要（Infrastructure as Code for kintone）

このツールは、kintone の「フォームフィールド設定」をコードとして管理するための IaC ツールです。再現性・レビュー性・自動化を高め、複数環境への安全なデプロイを支援します。クエリビルダーは派生機能（生成物）であり、公開APIは関数型（FP）APIのみです。

## できること（コア機能）

- フィールド定義のエクスポート（既存アプリ → TypeScript スキーマ）
- レコードスキーマの自動生成（型安全なバリデーション/正規化）
- スキーマの適用（差分更新/新規追加/デプロイ）
- スキーマからの新規アプリ作成（スペース指定、スレッド指定も対応）

注: クエリビルダーは `export` 時に生成可能なオプション機能です（アプリごとの `apps/{name}.query.ts`）。

## 推奨ワークフロー

1. 初期化（config 作成）
   ```bash
   kintone-as-code init
   ```
2. 既存アプリをエクスポート（またはスキーマを定義）
   ```bash
   kintone-as-code export --app-id 123 --name customer-app
   # 生成物: apps/customer-app.schema.ts, apps/customer-app.record-schema.ts, apps/customer-app.query.ts（任意）
   ```
3. 生成物をバージョン管理（PR レビュー）
4. 変更の適用
   ```bash
   kintone-as-code apply --schema apps/customer-app.schema.ts --env production
   ```
5. 新規アプリ作成が必要な場合
   ```bash
   kintone-as-code create --schema apps/customer-app.schema.ts --name "Customer App"
   ```

## コマンドと生成物の関係

- `export`: フォーム定義 → `apps/{name}.schema.ts`、`{name}.record-schema.ts`、`{name}.query.ts`（任意）
- `apply`: スキーマ → 既存アプリへ適用（差分更新・追加・デプロイ）
- `create`: スキーマ → 新規アプリ作成（必要に応じてスペース/スレッド）

```mermaid
flowchart LR
  A[既存アプリ (kintone)] -->|form metadata| E[export]
  E --> S[apps/{name}.schema.ts]
  E --> R[apps/{name}.record-schema.ts]
  E --> Q[apps/{name}.query.ts (任意)]
  S --> AP[apply]
  S --> CR[create]
  AP --> K[kintone]
  CR --> K
```

## 環境/認証

- 設定ファイル: `kintone-as-code.config.js`
- 認証: ユーザ/パスワード（APIトークンは非対応。設定例もPW方式に統一）
- `.env` を自動読込（`KINTONE_BASE_URL`/`KINTONE_USERNAME`/`KINTONE_PASSWORD`）

詳細は `docs/config.ja.md` を参照してください。

## ベストプラクティス

- 生成物（`apps/` 配下）をリポジトリで管理し、PR レビューを通す
- アプリIDは `utils/app-ids.ts` で一元管理（`export` 時に自動更新）
- レコードスキーマは REST API / JavaScript API 双方で活用
- 環境ごとに `default` と `environments` を適切に設定

## 派生機能: クエリビルダー

- `export` で `--with-query`（デフォルト: 生成）
- 生成先: `apps/{name}.query.ts`
- これは生成物の API（メソッドチェーンヘルパ）であり、パッケージの公開APIではありません
- 詳細: `docs/query-builder.ja.md` と `docs/query-cookbook.ja.md`
