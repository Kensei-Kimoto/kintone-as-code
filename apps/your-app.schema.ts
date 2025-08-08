import { defineAppSchema, getAppId } from 'kintone-as-code';
import type {
  CategoryFieldProperties,
  CreatedTimeFieldProperties,
  CreatorFieldProperties,
  DateTimeFieldProperties,
  ModifierFieldProperties,
  MultiLineTextFieldProperties,
  NumberFieldProperties,
  RadioButtonFieldProperties,
  RecordNumberFieldProperties,
  SingleLineTextFieldProperties,
  StatusAssigneeFieldProperties,
  StatusFieldProperties,
  SubtableFieldProperties,
  UpdatedTimeFieldProperties,
  UserSelectFieldProperties,
} from 'kintone-effect-schema';

export const レコード番号Field: RecordNumberFieldProperties = {
  type: 'RECORD_NUMBER',
  code: 'レコード番号',
  label: 'レコード番号',
  noLabel: false,
};
export const notesField: MultiLineTextFieldProperties = {
  type: 'MULTI_LINE_TEXT',
  code: 'notes',
  label: 'メモ欄',
  noLabel: false,
  required: false,
  defaultValue: 'ここにメモを入力してください',
};
export const nameKanaField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'nameKana',
  label: 'お名前（カナ）',
  noLabel: false,
  required: true,
  defaultValue: '',
  unique: false,
  minLength: '1',
  maxLength: '50',
  expression: '',
  hideExpression: false,
};
export const 更新者Field: ModifierFieldProperties = {
  type: 'MODIFIER',
  code: '更新者',
  label: '更新者',
  noLabel: false,
};
export const ステータスField: StatusFieldProperties = {
  type: 'STATUS',
  code: 'ステータス',
  label: 'ステータス',
  enabled: false,
};
export const isActiveField: RadioButtonFieldProperties = {
  type: 'RADIO_BUTTON',
  code: 'isActive',
  label: 'アクティブ状態',
  noLabel: false,
  required: true,
  options: {
    無効: {
      label: '無効',
      index: '1',
    },
    有効: {
      label: '有効',
      index: '0',
    },
  },
  defaultValue: '有効',
  align: 'VERTICAL',
};
export const deletedByField: UserSelectFieldProperties = {
  type: 'USER_SELECT',
  code: 'deletedBy',
  label: 'deletedBy',
  noLabel: false,
  required: false,
  entities: [],
  defaultValue: [],
};
export const カテゴリーField: CategoryFieldProperties = {
  type: 'CATEGORY',
  code: 'カテゴリー',
  label: 'カテゴリー',
  enabled: false,
};
export const createdAtField: DateTimeFieldProperties = {
  type: 'DATETIME',
  code: 'createdAt',
  label: 'createdAt',
  noLabel: false,
  required: false,
  defaultValue: '',
  unique: false,
  defaultNowValue: false,
};
export const customerTypeField: RadioButtonFieldProperties = {
  type: 'RADIO_BUTTON',
  code: 'customerType',
  label: 'customerType',
  noLabel: false,
  required: true,
  options: {
    個人: {
      label: '個人',
      index: '0',
    },
  },
  defaultValue: '個人',
  align: 'HORIZONTAL',
};
export const customerIdField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'customerId',
  label: 'customerId',
  noLabel: false,
  required: true,
  defaultValue: '',
  unique: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
};
export const emailField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'email',
  label: 'email',
  noLabel: false,
  required: false,
  defaultValue: '',
  unique: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
};
export const updatedAtField: DateTimeFieldProperties = {
  type: 'DATETIME',
  code: 'updatedAt',
  label: 'updatedAt',
  noLabel: false,
  required: false,
  defaultValue: '',
  unique: false,
  defaultNowValue: false,
};
export const 作業者Field: StatusAssigneeFieldProperties = {
  type: 'STATUS_ASSIGNEE',
  code: '作業者',
  label: '作業者',
  enabled: false,
};
export const updatedByField: UserSelectFieldProperties = {
  type: 'USER_SELECT',
  code: 'updatedBy',
  label: 'updatedBy',
  noLabel: false,
  required: true,
  entities: [],
  defaultValue: [],
};
export const 作成者Field: CreatorFieldProperties = {
  type: 'CREATOR',
  code: '作成者',
  label: '作成者',
  noLabel: false,
};
export const testNewFieldField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'testNewField',
  label: 'テスト新規フィールド',
  noLabel: false,
  required: false,
  defaultValue: 'デフォルト値',
  unique: false,
  minLength: '',
  maxLength: '100',
  expression: '',
  hideExpression: false,
};
export const 更新日時Field: UpdatedTimeFieldProperties = {
  type: 'UPDATED_TIME',
  code: '更新日時',
  label: '更新日時',
  noLabel: false,
};
export const deletedAtField: DateTimeFieldProperties = {
  type: 'DATETIME',
  code: 'deletedAt',
  label: 'deletedAt',
  noLabel: false,
  required: false,
  defaultValue: '',
  unique: false,
  defaultNowValue: false,
};
export const createdByField: UserSelectFieldProperties = {
  type: 'USER_SELECT',
  code: 'createdBy',
  label: 'createdBy',
  noLabel: false,
  required: true,
  entities: [],
  defaultValue: [],
};
export const phoneField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'phone',
  label: 'phone',
  noLabel: false,
  required: false,
  defaultValue: '',
  unique: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
};
export const nameField: SingleLineTextFieldProperties = {
  type: 'SINGLE_LINE_TEXT',
  code: 'name',
  label: 'name',
  noLabel: false,
  required: true,
  defaultValue: '',
  unique: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
};
export const testNumberFieldField: NumberFieldProperties = {
  type: 'NUMBER',
  code: 'testNumberField',
  label: 'テスト数値フィールド！',
  noLabel: false,
  required: false,
  defaultValue: '0',
  unique: false,
  minValue: '0',
  maxValue: '1000',
  digit: false,
  displayScale: '0',
  unit: '円',
  unitPosition: 'AFTER',
};
export const 作成日時Field: CreatedTimeFieldProperties = {
  type: 'CREATED_TIME',
  code: '作成日時',
  label: '作成日時',
  noLabel: false,
};
export const relocationsField: SubtableFieldProperties = {
  type: 'SUBTABLE',
  code: 'relocations',
  label: '変ならべる',
  noLabel: true,
  fields: {
    relocations_postalCode: {
      type: 'SINGLE_LINE_TEXT',
      code: 'relocations_postalCode',
      label: 'ぽすたるこーど！',
      noLabel: false,
      required: false,
      defaultValue: '',
      unique: false,
      minLength: '',
      maxLength: '',
      expression: '',
      hideExpression: false,
    },
    relocations_address: {
      type: 'SINGLE_LINE_TEXT',
      code: 'relocations_address',
      label: 'relocations_address',
      noLabel: false,
      required: false,
      defaultValue: '',
      unique: false,
      minLength: '',
      maxLength: '',
      expression: '',
      hideExpression: false,
    },
    relocations_moveReason: {
      type: 'RADIO_BUTTON',
      code: 'relocations_moveReason',
      label: 'relocations_moveReason',
      noLabel: false,
      required: true,
      options: {
        移転: {
          label: '移転',
          index: '1',
        },
        登録: {
          label: '登録',
          index: '0',
        },
        その他: {
          label: 'その他',
          index: '2',
        },
      },
      defaultValue: '登録',
      align: 'HORIZONTAL',
    },
    relocations_relocationId: {
      type: 'SINGLE_LINE_TEXT',
      code: 'relocations_relocationId',
      label: 'relocations_relocationId',
      noLabel: false,
      required: false,
      defaultValue: '',
      unique: false,
      minLength: '',
      maxLength: '',
      expression: '',
      hideExpression: false,
    },
    relocations_movedAt: {
      type: 'DATETIME',
      code: 'relocations_movedAt',
      label: 'relocations_movedAt',
      noLabel: false,
      required: false,
      defaultValue: '',
      unique: false,
      defaultNowValue: false,
    },
    relocations_registeredBy: {
      type: 'USER_SELECT',
      code: 'relocations_registeredBy',
      label: 'relocations_registeredBy',
      noLabel: false,
      required: false,
      entities: [],
      defaultValue: [],
    },
  },
};

export const appFieldsConfig = {
  properties: {
    レコード番号: レコード番号Field,
    notes: notesField,
    nameKana: nameKanaField,
    更新者: 更新者Field,
    ステータス: ステータスField,
    isActive: isActiveField,
    deletedBy: deletedByField,
    カテゴリー: カテゴリーField,
    createdAt: createdAtField,
    customerType: customerTypeField,
    customerId: customerIdField,
    email: emailField,
    updatedAt: updatedAtField,
    作業者: 作業者Field,
    updatedBy: updatedByField,
    作成者: 作成者Field,
    testNewField: testNewFieldField,
    更新日時: 更新日時Field,
    deletedAt: deletedAtField,
    createdBy: createdByField,
    phone: phoneField,
    name: nameField,
    testNumberField: testNumberFieldField,
    作成日時: 作成日時Field,
    relocations: relocationsField,
  },
};

// Export app schema configuration
export default defineAppSchema({
  appId: getAppId('KINTONE_APP_ID'), // Please replace with your env variable
  name: 'Exported App',
  description: 'This schema was exported from kintone.',

  // Use the generated fields configuration
  fieldsConfig: appFieldsConfig,
});
