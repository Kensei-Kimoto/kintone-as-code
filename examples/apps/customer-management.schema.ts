import { defineAppSchema, form, getAppId } from '../../src/types';

export default defineAppSchema({
  // アプリIDは環境変数から取得することも可能
  appId: getAppId('KINTONE_CUSTOMER_APP_ID'), // または直接: 123
  
  name: '顧客管理',
  description: '顧客情報を管理するアプリケーション',
  
  form: form({
    // =================
    // 基本情報
    // =================
    会社名: form.singleLineText({
      required: true,
      unique: true,
      maxLength: 100,
    }),
    
    会社名カナ: form.singleLineText({
      maxLength: 100,
    }),
    
    // =================
    // 分類
    // =================
    業種: form.radioButton({
      options: {
        製造業: { index: 0 },
        サービス業: { index: 1 },
        IT: { index: 2 },
        小売業: { index: 3 },
        金融: { index: 4 },
        不動産: { index: 5 },
        建設: { index: 6 },
        医療・福祉: { index: 7 },
        教育: { index: 8 },
        その他: { index: 9 },
      },
      required: true,
    }),
    
    規模: form.dropDown({
      options: {
        大企業: { index: 0 },
        中堅企業: { index: 1 },
        中小企業: { index: 2 },
        スタートアップ: { index: 3 },
        個人事業主: { index: 4 },
      },
    }),
    
    // =================
    // 詳細情報
    // =================
    従業員数: form.number({
      minValue: 1,
      maxValue: 1000000,
      unit: '人',
      displayScale: ',',
    }),
    
    資本金: form.number({
      minValue: 0,
      unit: '万円',
      displayScale: ',',
    }),
    
    設立日: form.date({
      defaultValue: 'TODAY',
    }),
    
    決算月: form.dropDown({
      options: {
        '1月': { index: 0 },
        '2月': { index: 1 },
        '3月': { index: 2 },
        '4月': { index: 3 },
        '5月': { index: 4 },
        '6月': { index: 5 },
        '7月': { index: 6 },
        '8月': { index: 7 },
        '9月': { index: 8 },
        '10月': { index: 9 },
        '11月': { index: 10 },
        '12月': { index: 11 },
      },
    }),
    
    // =================
    // 連絡先
    // =================
    代表電話番号: form.singleLineText({
      maxLength: 20,
    }),
    
    FAX番号: form.singleLineText({
      maxLength: 20,
    }),
    
    メールアドレス: form.link({
      protocol: 'MAIL',
      maxLength: 100,
    }),
    
    ウェブサイト: form.link({
      protocol: 'WEB',
      maxLength: 200,
    }),
    
    // =================
    // 住所
    // =================
    郵便番号: form.singleLineText({
      maxLength: 8,
    }),
    
    都道府県: form.dropDown({
      options: {
        北海道: { index: 0 },
        青森県: { index: 1 },
        岩手県: { index: 2 },
        宮城県: { index: 3 },
        秋田県: { index: 4 },
        山形県: { index: 5 },
        福島県: { index: 6 },
        茨城県: { index: 7 },
        栃木県: { index: 8 },
        群馬県: { index: 9 },
        埼玉県: { index: 10 },
        千葉県: { index: 11 },
        東京都: { index: 12 },
        神奈川県: { index: 13 },
        新潟県: { index: 14 },
        富山県: { index: 15 },
        石川県: { index: 16 },
        福井県: { index: 17 },
        山梨県: { index: 18 },
        長野県: { index: 19 },
        岐阜県: { index: 20 },
        静岡県: { index: 21 },
        愛知県: { index: 22 },
        三重県: { index: 23 },
        滋賀県: { index: 24 },
        京都府: { index: 25 },
        大阪府: { index: 26 },
        兵庫県: { index: 27 },
        奈良県: { index: 28 },
        和歌山県: { index: 29 },
        鳥取県: { index: 30 },
        島根県: { index: 31 },
        岡山県: { index: 32 },
        広島県: { index: 33 },
        山口県: { index: 34 },
        徳島県: { index: 35 },
        香川県: { index: 36 },
        愛媛県: { index: 37 },
        高知県: { index: 38 },
        福岡県: { index: 39 },
        佐賀県: { index: 40 },
        長崎県: { index: 41 },
        熊本県: { index: 42 },
        大分県: { index: 43 },
        宮崎県: { index: 44 },
        鹿児島県: { index: 45 },
        沖縄県: { index: 46 },
      },
    }),
    
    市区町村: form.singleLineText({
      maxLength: 100,
    }),
    
    番地建物名: form.singleLineText({
      maxLength: 200,
    }),
    
    // =================
    // 担当者情報
    // =================
    担当営業: form.userSelect({
      entities: [
        { type: 'USER', code: 'user1' },
        { type: 'USER', code: 'user2' },
        { type: 'GROUP', code: 'sales' },
      ],
      defaultValue: [
        { type: 'USER', code: 'LOGINUSER()' },
      ],
    }),
    
    サポート担当: form.userSelect({
      entities: [
        { type: 'USER', code: 'support1' },
        { type: 'USER', code: 'support2' },
        { type: 'GROUP', code: 'support' },
      ],
    }),
    
    // =================
    // ステータス
    // =================
    取引状況: form.checkBox({
      options: {
        見込み客: { index: 0 },
        商談中: { index: 1 },
        既存顧客: { index: 2 },
        休眠顧客: { index: 3 },
        失注: { index: 4 },
      },
    }),
    
    重要度: form.radioButton({
      options: {
        A: { index: 0 },
        B: { index: 1 },
        C: { index: 2 },
      },
      defaultValue: 'B',
    }),
    
    // =================
    // 取引情報
    // =================
    初回取引日: form.date({}),
    
    最終取引日: form.date({}),
    
    累計取引金額: form.calc({
      expression: 'SUM(取引金額)',
      format: 'NUMBER',
      displayScale: ',',
      unit: '円',
      unitPosition: 'AFTER',
    }),
    
    // =================
    // その他
    // =================
    備考: form.multiLineText({
      maxLength: 5000,
    }),
    
    添付ファイル: form.file({
      thumbnailSize: 250,
    }),
    
    // =================
    // システム項目
    // =================
    最終更新日時: form.dateTime({
      defaultValue: 'NOW',
      defaultNowValue: true,
    }),
    
    更新者: form.modifier({}),
    
    作成日時: form.createdTime({}),
    
    作成者: form.creator({}),
  }),
});