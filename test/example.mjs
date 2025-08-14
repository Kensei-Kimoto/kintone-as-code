import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { QueryFields, createQuery } from './apps/test-app.query.mjs';
import dotenv from 'dotenv';

dotenv.config();

// クライアント初期化
const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

// レコード作成
async function createRecord() {
  try {
    const newRecord = {
      name: { value: 'テスト顧客' },
      testNumberField: { value: '1500' },
      customerType: { value: '個人' },
      isActive: { value: '有効' }
    };

    const response = await client.record.addRecord({
      app: 15, // 実際のアプリIDに変更してください
      record: newRecord
    };

    console.log('レコード作成成功:', response.id);
    return response.id;
  } catch (error) {
    console.error('レコード作成エラー:', error.response?.data || error);
    return null;
  }
}

// レコード検索
async function queryRecords() {
  try {
    // 型安全なクエリビルダー使用
    const query = createQuery()
      .where(QueryFields.testNumberField.greaterThan(100))
      .orderBy('testNumberField', 'desc')
      .limit(5)
      .build();

    const response = await client.record.getRecords({
      app: 15,
      query: query
    });

    console.log(`検索結果 (${response.records.length}件):`);
    response.records.forEach((record, index) => {
      console.log(`\n${index + 1}. ID: ${record.$id.value}`);
      console.log(`   名前: ${record.name.value}`);
      console.log(`   数値: ${record.testNumberField.value}`);
    });

    return response.records;
  } catch (error) {
    console.error('検索エラー:', error.response?.data || error);
    return [];
  }
}

// レコード更新
async function updateRecord(recordId) {
  try {
    const updateData = {
      testNumberField: { value: '2000' },
      notes: { value: '更新済み' }
    };

    await client.record.updateRecord({
      app: 15,
      id: recordId,
      record: updateData
    });

    console.log(`レコード ${recordId} を更新しました`);
  } catch (error) {
    console.error('更新エラー:', error.response?.data || error);
  }
}

// メイン処理
async function main() {
  console.log('=== Kintone レコード操作テスト ===');
  
  // 1. レコード作成
  const recordId = await createRecord();
  if (!recordId) return;
  
  // 2. レコード検索
  await queryRecords();
  
  // 3. レコード更新
  await updateRecord(recordId);
  
  // 4. 更新確認
  await queryRecords();
}

main();