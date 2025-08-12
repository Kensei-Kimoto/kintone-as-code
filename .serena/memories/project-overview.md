# kintone-as-code プロジェクト概要

## プロジェクトの目的
kintone アプリケーションのスキーマ管理を Infrastructure as Code の手法で行うための CLI ツール。
kintone アプリの設定をコードとして管理し、バージョン管理やCI/CDパイプラインに組み込むことが可能。

## 技術スタック
- **言語**: TypeScript
- **ランタイム**: Node.js
- **スキーマ定義**: Effect-TS (kintone-effect-schema v0.8.0)
- **CLI フレームワーク**: Commander
- **テスト**: Vitest
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **ビルドツール**: TypeScript Compiler

## 主要機能
1. **export**: kintone アプリからスキーマをエクスポート
2. **apply**: スキーマを kintone アプリに適用
3. **validate**: レコードの検証
4. **query builder**: 型安全なクエリ構築（開発中）