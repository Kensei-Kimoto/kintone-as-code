import 'dotenv/config';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import {
  createStringField,
  createNumberField,
  createQueryState,
  setWhere,
  appendOrder,
  withLimit,
  build,
  and,
} from 'kintone-as-code';

// 対象アプリID（exportで作成した dev-demo の新規作成アプリ）
const APP_ID = process.env.KINTONE_QUERY_APP_ID || '38';

// フィールド定義（生成物のQueryFields相当を手元で再現）
const Fields = {
  name: createStringField('顧客名'),
  age: createNumberField('年齢'),
};

// 認証クライアント
const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

// デモ実行
const main = async () => {
  // 1) サンプルレコードを1件追加
  const sample = {
    顧客名: { value: `テスト太郎_${Date.now()}` },
    年齢: { value: '27' },
  };
  await client.record.addRecord({ app: APP_ID, record: sample });

  // 2) クエリをビルド（顧客名: テスト*, 年齢>20、降順、最大10件）
  const queryString = build(
    withLimit(10)(
      appendOrder('レコード番号', 'desc')(
        setWhere(
          and(
            Fields.name.like('テスト'),
            Fields.age.greaterThan(20),
          ),
        )(createQueryState()),
      ),
    ),
  );

  // 3) クエリで取得
  const res = await client.record.getRecords({ app: APP_ID, query: queryString });

  console.log('Query:', queryString);
  console.log('Records:', res.records.length);
  for (const r of res.records) {
    console.log(`- 顧客名=${r['顧客名']?.value}, 年齢=${r['年齢']?.value}`);
  }
};

await main();