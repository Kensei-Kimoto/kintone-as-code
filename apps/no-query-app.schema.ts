import type {
  SingleLineTextFieldProperties
} from 'kintone-effect-schema';

export const テストField: SingleLineTextFieldProperties = {
  type: "SINGLE_LINE_TEXT",
  code: "テスト",
  label: "テスト"
};

export const appFieldsConfig = {
  properties: {
    "テスト": テストField
  }
};

import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS.NO_QUERY_APP,
  name: 'no-query-app',
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig
});