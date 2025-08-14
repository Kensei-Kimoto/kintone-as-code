import type {
  DateFieldProperties,
  DateTimeFieldProperties,
  DropDownFieldProperties,
  NumberFieldProperties,
  RadioButtonFieldProperties,
  SingleLineTextFieldProperties,
  UserSelectFieldProperties
} from 'kintone-effect-schema';

export const 会社名Field: SingleLineTextFieldProperties = {
  type: "SINGLE_LINE_TEXT",
  code: "会社名",
  label: "会社名",
  required: true
};
export const ステータスField: DropDownFieldProperties = {
  type: "DROP_DOWN",
  code: "ステータス",
  label: "ステータス",
  options: {
    "商談中": {
      label: "商談中",
      index: "0"
    },
    "見積提出": {
      label: "見積提出",
      index: "1"
    },
    "受注": {
      label: "受注",
      index: "2"
    },
    "失注": {
      label: "失注",
      index: "3"
    },
    "完了": {
      label: "完了",
      index: "4"
    },
    "キャンセル": {
      label: "キャンセル",
      index: "5"
    }
  }
};
export const 商談開始日Field: DateFieldProperties = {
  type: "DATE",
  code: "商談開始日",
  label: "商談開始日"
};
export const 売上見込額Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "売上見込額",
  label: "売上見込額"
};
export const 担当者Field: UserSelectFieldProperties = {
  type: "USER_SELECT",
  code: "担当者",
  label: "担当者"
};
export const 期限日Field: DateFieldProperties = {
  type: "DATE",
  code: "期限日",
  label: "期限日"
};
export const 売上高Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "売上高",
  label: "売上高"
};
export const 契約数Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "契約数",
  label: "契約数"
};
export const 継続年数Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "継続年数",
  label: "継続年数"
};
export const 登録日Field: DateTimeFieldProperties = {
  type: "DATETIME",
  code: "登録日",
  label: "登録日"
};
export const 初回契約額Field: NumberFieldProperties = {
  type: "NUMBER",
  code: "初回契約額",
  label: "初回契約額"
};
export const 優先度Field: RadioButtonFieldProperties = {
  type: "RADIO_BUTTON",
  code: "優先度",
  label: "優先度",
  options: {
    "最高": {
      label: "最高"
    },
    "高": {
      label: "高"
    },
    "中": {
      label: "中"
    },
    "低": {
      label: "低"
    }
  }
};

export const appFieldsConfig = {
  properties: {
    "会社名": 会社名Field,
    "ステータス": ステータスField,
    "商談開始日": 商談開始日Field,
    "売上見込額": 売上見込額Field,
    "担当者": 担当者Field,
    "期限日": 期限日Field,
    "売上高": 売上高Field,
    "契約数": 契約数Field,
    "継続年数": 継続年数Field,
    "登録日": 登録日Field,
    "初回契約額": 初回契約額Field,
    "優先度": 優先度Field
  }
};

import { defineAppSchema } from 'kintone-as-code';
import { APP_IDS } from '../utils/app-ids.js';

export default defineAppSchema({
  appId: APP_IDS.SALES_APP,
  name: 'sales-app',
  description: 'This schema was exported from kintone.',
  fieldsConfig: appFieldsConfig
});