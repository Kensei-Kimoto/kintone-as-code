# クエリ クックブック（FP）

本書はFPスタイルのクエリ構築レシピ集です。公開APIとしてクエリビルダーは提供していないため、生成物（`apps/{name}.query.ts`）での利用を前提としたパターンを示します。

## 基本レシピ

### シンプルなWHERE + ORDER + LIMIT

```ts
import { and } from 'kintone-as-code';
import { QueryFields, createQuery } from '../apps/customer-app.query';

const { 会社名, ステータス } = QueryFields;

const q = createQuery()
  .where(and(会社名.contains('サイボウズ'), ステータス.in(['商談中'])))
  .orderBy('会社名', 'asc')
  .limit(100)
  .build();
```

### ページング

```ts
import {
  createQueryState,
  setWhere,
  appendOrder,
  withLimit,
  withOffset,
  build,
} from 'kintone-as-code';
import { and } from 'kintone-as-code';
import { QueryFields } from '../apps/customer-app.query';

const { ステータス } = QueryFields;

const pageSize = 50;
const page = 3;

const q = build(
  withOffset((page - 1) * pageSize)(
    withLimit(pageSize)(
      appendOrder(
        '更新日時',
        'desc'
      )(setWhere(ステータス.notIn(['完了', 'キャンセル']))(createQueryState()))
    )
  )
);
```

## 日付/ユーザー関数

```ts
import { TODAY, FROM_TODAY, LOGINUSER } from 'kintone-as-code';
import { QueryFields, createQuery } from '../apps/customer-app.query';

const { 期限日, 担当者 } = QueryFields;

const q = createQuery()
  .where(
    // 期限が7日以内、担当者は自分
    期限日.lessThanOrEqual(FROM_TODAY(7, 'DAYS'))
  )
  .where(担当者.equals(LOGINUSER()))
  .build();
```

## between と補助メソッド

```ts
import { QueryFields, createQuery } from '../apps/customer-app.query';
const { 売上高, 会社名 } = QueryFields;

const q = createQuery()
  .where(売上高.between(1000000, 5000000))
  .where(会社名.startsWith('テスト'))
  .build();
```

## サブテーブル/関連レコード（最小公開）

- サブテーブル子/関連の表示フィールドは `createTableSubField('親.子')` で最小API（`in/not in` のみ）を公開します。
- 生成時のオプションで切り替え: `--include-subtable` / `--include-related`。

```ts
import { QueryFields } from '../apps/customer-app.query';

// 例: サブテーブル 親=商品、子=商品名
// 生成物が `商品: { 商品名: createTableSubField('商品.商品名') }` を提供

const q = QueryFields.商品.商品名.in(['A', 'B']);
```

## バリデーション（深さ/長さ）

```ts
import {
  createQueryState,
  setWhere,
  setValidationOptions,
  build,
} from 'kintone-as-code';
import { and } from 'kintone-as-code';
import { QueryFields } from '../apps/customer-app.query';

const { 会社名, ステータス } = QueryFields;

const q = build(
  setValidationOptions({ maxDepth: 5, maxLength: 10000 })(
    setWhere(and(会社名.like('*株式会社*'), ステータス.in(['商談中', '受注'])))(
      createQueryState()
    )
  )
);
```

## 共通ビルド関数

```ts
import {
  createQueryState,
  setWhere,
  appendOrder,
  withLimit,
  withOffset,
  setValidationOptions,
  build,
} from 'kintone-as-code';

export const buildQuery = (
  expr: ReturnType<typeof setWhere> extends (s: any) => any
    ? Parameters<typeof setWhere>[0]
    : never
) =>
  build(
    setValidationOptions({ maxDepth: 6, maxLength: 12000 })(
      withOffset(0)(
        withLimit(100)(
          appendOrder('更新日時', 'desc')(setWhere(expr)(createQueryState()))
        )
      )
    )
  );
```

## 注意

- `raw()` のような生クエリ挿入は提供しません（代替: `contains/startsWith/endsWith`, `between`, `customDateFunction/customUserFunction`）。
- 未サポートのフィールドタイプは生成物から除外されます（`SUBTABLE`/`REFERENCE_TABLE`はオプション指定時に最小API公開）。
