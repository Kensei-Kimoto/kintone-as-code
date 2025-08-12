# 開発用コマンド一覧

## ビルド・開発
- `npm run build` - TypeScript をコンパイル
- `npm run dev` - 開発モード（ウォッチモード）

## テスト
- `npm test` - 全テストを実行
- `npm run test:watch` - テストをウォッチモードで実行

## コード品質
- `npm run lint` - ESLint でコードをチェック
- `npm run format` - Prettier でコードをフォーマット
- `npm run typecheck` - TypeScript の型チェック

## CLI コマンド
- `npx tsx src/cli.ts export --app-id <ID> --name <NAME>` - アプリからスキーマをエクスポート
- `npx tsx src/cli.ts apply --file <PATH>` - スキーマを適用

## Git 操作
- `git status` - 変更状況を確認
- `git diff` - 変更内容を確認
- `git add .` - 変更をステージング
- `git commit -m "message"` - コミット

## macOS/Darwin 特有のコマンド
- `open .` - Finder でディレクトリを開く
- `pbcopy < file` - ファイル内容をクリップボードにコピー
- `pbpaste > file` - クリップボードから貼り付け