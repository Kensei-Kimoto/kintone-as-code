import { Schema } from 'effect';
import { decodeKintoneRecord, FileFieldSchema, SingleLineTextFieldSchema } from 'kintone-effect-schema';

// Static record schema generated from form definition
export const RecordSchema = Schema.Struct({
  "添付ファイル": FileFieldSchema,
  "通常フィールド": SingleLineTextFieldSchema
});

export type AppRecord = Schema.Schema.Type<typeof RecordSchema>;
export type AppRecordEncoded = Schema.Schema.Encoded<typeof RecordSchema>;

export const validateRecord = (record: Record<string, unknown>): AppRecord => {
  const normalizedRecord = decodeKintoneRecord(record);
  return Schema.decodeUnknownSync(RecordSchema)(normalizedRecord);
};
