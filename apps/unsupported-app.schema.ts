import type {
  FileFieldProperties,
  SingleLineTextFieldProperties,
  SubtableFieldProperties
} from 'kintone-effect-schema';

export const 添付ファイルField: FileFieldProperties = {
  type: "FILE",
  code: "添付ファイル",
  label: "添付ファイル"
};
export const サブテーブルField: SubtableFieldProperties = {
  type: "SUBTABLE",
  code: "サブテーブル",
  label: "サブテーブル"
};
export const 通常フィールドField: SingleLineTextFieldProperties = {
  type: "SINGLE_LINE_TEXT",
  code: "通常フィールド",
  label: "通常フィールド"
};

export const appFieldsConfig = {
  properties: {
    "添付ファイル": 添付ファイルField,
    "サブテーブル": サブテーブルField,
    "通常フィールド": 通常フィールドField
  }
};

import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS.UNSUPPORTED_APP,
  name: 'unsupported-app',
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig
});