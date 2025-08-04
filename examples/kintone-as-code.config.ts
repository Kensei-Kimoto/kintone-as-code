import { defineConfig, getAuthFromEnv } from '../src/types';

export default defineConfig({
  // デフォルト環境
  default: 'development',
  
  // 環境別の設定
  environments: {
    // 開発環境
    development: {
      auth: getAuthFromEnv(), // 環境変数から取得
      apps: {
        // アプリ名とスキーマファイルのマッピング
        'customer-management': './apps/customer-management.schema.ts',
        'task-management': './apps/task-management.schema.ts',
      },
    },
    
    // ステージング環境
    staging: {
      auth: {
        apiToken: process.env.KINTONE_STAGING_API_TOKEN,
        domain: process.env.KINTONE_STAGING_DOMAIN,
      },
      apps: {
        'customer-management': './apps/customer-management.schema.ts',
        'task-management': './apps/task-management.schema.ts',
      },
    },
    
    // 本番環境
    production: {
      auth: {
        apiToken: process.env.KINTONE_PROD_API_TOKEN,
        domain: process.env.KINTONE_PROD_DOMAIN,
      },
      apps: {
        'customer-management': './apps/customer-management.schema.ts',
        'task-management': './apps/task-management.schema.ts',
      },
    },
  },
  
  // オプション設定
  options: {
    // 差分チェック時に無視するフィールド
    ignoreFields: ['$id', '$revision', 'creator', 'modifier', 'createdTime', 'modifiedTime'],
    
    // ログレベル
    logLevel: 'info',
    
    // ドライラン時の確認スキップ
    skipConfirmation: false,
  },
});