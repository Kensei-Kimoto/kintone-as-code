import { defineAppSchema, form, getAppId } from '../../src/types';

export default defineAppSchema({
  // アプリIDは環境変数から取得することも可能
  appId: getAppId('KINTONE_TASK_APP_ID'), // または直接: 456
  
  name: 'タスク管理',
  description: 'チームのタスクを管理するアプリケーション',
  
  form: form({
    // =================
    // タスク基本情報
    // =================
    タスク名: form.singleLineText({
      required: true,
      maxLength: 200,
    }),
    
    カテゴリ: form.dropDown({
      options: {
        開発: { index: 0 },
        設計: { index: 1 },
        テスト: { index: 2 },
        ドキュメント: { index: 3 },
        運用: { index: 4 },
        会議: { index: 5 },
        その他: { index: 6 },
      },
      required: true,
    }),
    
    // =================
    // 優先度とステータス
    // =================
    優先度: form.radioButton({
      options: {
        緊急: { index: 0 },
        高: { index: 1 },
        中: { index: 2 },
        低: { index: 3 },
      },
      defaultValue: '中',
      required: true,
    }),
    
    ステータス: form.dropDown({
      options: {
        未着手: { index: 0 },
        進行中: { index: 1 },
        レビュー待ち: { index: 2 },
        修正中: { index: 3 },
        完了: { index: 4 },
        保留: { index: 5 },
        キャンセル: { index: 6 },
      },
      defaultValue: '未着手',
      required: true,
    }),
    
    // =================
    // 日程
    // =================
    開始予定日: form.date({
      defaultValue: 'TODAY',
    }),
    
    期限: form.date({
      required: true,
    }),
    
    完了日: form.date({}),
    
    // =================
    // 担当者
    // =================
    担当者: form.userSelect({
      required: true,
      entities: [
        { type: 'USER', code: 'ALL_USERS' },
      ],
    }),
    
    レビュアー: form.userSelect({
      entities: [
        { type: 'USER', code: 'ALL_USERS' },
      ],
    }),
    
    関係者: form.userSelect({
      entities: [
        { type: 'USER', code: 'ALL_USERS' },
        { type: 'GROUP', code: 'ALL_GROUPS' },
      ],
    }),
    
    // =================
    // 進捗管理
    // =================
    進捗率: form.number({
      minValue: 0,
      maxValue: 100,
      unit: '%',
      defaultValue: '0',
    }),
    
    予定工数: form.number({
      minValue: 0,
      maxValue: 999,
      unit: '時間',
      digit: 1,
    }),
    
    実績工数: form.number({
      minValue: 0,
      maxValue: 999,
      unit: '時間',
      digit: 1,
    }),
    
    // =================
    // プロジェクト関連
    // =================
    プロジェクト名: form.dropDown({
      options: {
        プロジェクトA: { index: 0 },
        プロジェクトB: { index: 1 },
        プロジェクトC: { index: 2 },
        社内業務: { index: 3 },
        その他: { index: 4 },
      },
    }),
    
    マイルストーン: form.radioButton({
      options: {
        フェーズ1: { index: 0 },
        フェーズ2: { index: 1 },
        フェーズ3: { index: 2 },
        リリース: { index: 3 },
      },
    }),
    
    // =================
    // タグとフラグ
    // =================
    タグ: form.checkBox({
      options: {
        バグ: { index: 0 },
        改善: { index: 1 },
        新機能: { index: 2 },
        調査: { index: 3 },
        ドキュメント: { index: 4 },
        緊急対応: { index: 5 },
      },
    }),
    
    完了フラグ: form.checkBox({
      options: {
        完了: { index: 0 },
      },
    }),
    
    // =================
    // 詳細情報
    // =================
    詳細: form.multiLineText({
      maxLength: 10000,
      required: true,
    }),
    
    完了条件: form.multiLineText({
      maxLength: 5000,
    }),
    
    メモ: form.multiLineText({
      maxLength: 5000,
    }),
    
    // =================
    // 関連情報
    // =================
    関連URL: form.link({
      protocol: 'WEB',
      maxLength: 500,
    }),
    
    添付ファイル: form.file({
      thumbnailSize: 150,
    }),
    
    関連タスク: form.referenceTable({
      referenceTable: {
        relatedApp: {
          app: '456', // 自己参照
        },
        condition: {
          field: 'ステータス',
          operator: 'not in',
          value: ['完了', 'キャンセル'],
        },
        filterCond: '',
        displayFields: ['タスク名', 'ステータス', '担当者', '期限'],
        sort: '期限 asc',
        size: 5,
      },
    }),
    
    // =================
    // 自動計算項目
    // =================
    残日数: form.calc({
      expression: 'DAYS(期限, TODAY())',
      format: 'NUMBER',
      unit: '日',
      unitPosition: 'AFTER',
    }),
    
    工数差異: form.calc({
      expression: '実績工数 - 予定工数',
      format: 'NUMBER',
      unit: '時間',
      unitPosition: 'AFTER',
    }),
    
    // =================
    // システム項目
    // =================
    レコード番号: form.recordNumber({}),
    
    作成日時: form.createdTime({}),
    
    作成者: form.creator({}),
    
    更新日時: form.updatedTime({}),
    
    更新者: form.modifier({}),
  }),
});