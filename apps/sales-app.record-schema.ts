import { Schema } from 'effect';
import { DateFieldSchema, DateTimeFieldSchema, decodeKintoneRecord, DropDownFieldSchema, NumberFieldSchema, RadioButtonFieldSchema, SingleLineTextFieldSchema, UserSelectFieldSchema } from 'kintone-effect-schema';

// Static record schema generated from form definition
export const RecordSchema = Schema.Struct({
  "会社名": SingleLineTextFieldSchema,
  "ステータス": DropDownFieldSchema,
  "商談開始日": DateFieldSchema,
  "売上見込額": NumberFieldSchema,
  "担当者": UserSelectFieldSchema,
  "期限日": DateFieldSchema,
  "売上高": NumberFieldSchema,
  "契約数": NumberFieldSchema,
  "継続年数": NumberFieldSchema,
  "登録日": DateTimeFieldSchema,
  "初回契約額": NumberFieldSchema,
  "優先度": RadioButtonFieldSchema
});

export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;
export type AppRecordEncoded = Schema.Schema.Encoded<typeof RecordSchema>;

export const validateRecord = (record: Record<string, unknown>): AppRecord => {
  const normalizedRecord = decodeKintoneRecord(record);
  return Schema.decodeUnknownSync(RecordSchema)(normalizedRecord);
};
