import 'dotenv/config';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';

const app = process.env.KINTONE_QUERY_APP_ID || '38';
const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { username: process.env.KINTONE_USERNAME, password: process.env.KINTONE_PASSWORD },
});

const res = await client.record.getRecords({ app });
console.log('Total:', res.records.length);
for (const r of res.records) {
  console.log(r['レコード番号']?.value, r['顧客名']?.value, r['年齢']?.value);
}