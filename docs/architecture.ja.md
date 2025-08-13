# アーキテクチャ

本プロジェクトは Functional Core, Imperative Shell を採用しています。

## 全体アーキテクチャ（俯瞰）

```mermaid
graph TB
  subgraph CLI
    C0[cli.ts]
    C1[commands/init]
    C2[commands/export]
    C3[commands/apply]
    C4[commands/create]
  end

  subgraph Core
    L["core/loader.ts<br/>config/IO"]
    CFG["core/config.ts<br/>validation"]
    KC["core/kintone-client.ts<br/>REST Client"]
    CONV["core/converter.ts<br/>form→schema"]
    QGEN["core/query-generator.ts<br/>form→query module"]
  end

  subgraph QueryModule[Query Module]
    EX[query/expression.ts]
    F[query/field.ts]
    B[query/builder-fp.ts]
    BOO["query/builder.ts<br/>OO facade"]
    VAL[query/validator.ts]
    PUB["index.ts<br/>exports"]
  end

  C0 --> C2
  C0 --> C3
  C0 --> C4
  C0 --> C1

  C2 --> L --> CFG
  C2 --> KC
  C2 --> CONV
  C2 --> QGEN --> B
  B --> EX
  B --> F
  B --> VAL
  BOO --> B

  C3 --> L --> CFG
  C3 --> KC
  C3 --> CONV

  C4 --> L --> CFG
  C4 --> KC
```

## レイヤ構成

- Functional Core（純関数・テスト容易・型安全）
  - `src/query/expression.ts`: 式ADTと論理結合子（and/or/not/toString）
  - `src/query/builder-fp.ts`: 関数型ビルダー（不変なQueryState + 純関数）
  - `src/query/field.ts`: 不変オブジェクトのフィールドAPI（Class非依存）
  - `src/query/validator.ts`: 純粋なバリデーション（深さ/長さ）
- Imperative Shell（副作用）
  - `src/cli.ts`, `src/commands/*`: CLI統合・FS/ネットワークI/O
  - `src/core/query-generator.ts`: FPファサードを使うクエリモジュールを生成

```mermaid
flowchart TD
  subgraph FunctionalCore["Functional Core"]
    E[expression.ts]
    F[field.ts]
    B[builder-fp.ts]
    V[validator.ts]
  end
  subgraph ImperativeShell["Imperative Shell"]
    CLI[cli.ts / commands/*]
    GEN[core/query-generator.ts]
  end
  E --> B
  F --> B
  B --> V
  B --> GEN
  CLI --> B
```

## クエリビルダー

- 推奨: FP API
  - `createQueryState`, `setWhere`, `appendOrder`, `withLimit`, `withOffset`, `setValidationOptions`, `build`
- 互換: OOファサード
  - `src/query/builder.ts` はFPコアの薄いラッパ（メソッドチェーンを維持）

```mermaid
sequenceDiagram
  participant U as User Code
  participant FP as builder-fp.ts
  participant EX as expression.ts
  participant V as validator.ts
  U->>FP: createQueryState()
  U->>FP: setWhere(Expression)
  note over EX: and()/or()/not()/condition()
  U->>FP: appendOrder()/withLimit()/withOffset()
  U->>FP: setValidationOptions()
  U->>FP: build(state)
  FP->>V: validate (depth/length)
  FP-->>U: query string
```

## フィールドAPI

- `create*Field` ファクトリで不変オブジェクトを返し、各メソッドは副作用なしで Expression を返します
- 内部実装は Class を用いません

## バリデーション

- `validator.ts` の純関数で深さ/長さを検証し、FP/OO双方から利用

## 生成器

- `src/core/query-generator.ts` は FP API をimportし、使いやすい `createQuery()` ファサードを公開

### 生成器の補足

- 未サポートフィールドは生成物から除外し、警告コメントを出力します。
- `--include-subtable=false` を明示した場合、`SUBTABLE` は完全に無視し、コメントも出力しません。
- `--include-related` 指定時は `REFERENCE_TABLE` の `displayFields` だけを `createTableSubField('親.子')` で最小公開します（`in/not in` のみ）。

```mermaid
flowchart LR
  META[Form Metadata] --> GEN[query-generator.ts]
  GEN --> QF[QueryFields]
  GEN --> FACADE[createQuery facade]
  FACADE --> FP[builder-fp.ts]
```

## 移行ノート

- 既存のOOメソッドチェーンはそのまま利用可能
- 新規コードでは合成性とテスト容易性の観点からFP APIの利用を推奨
- Effect-TS統合の高度なサンプル（例: `buildQueryEffect`, `validateExpression` のEffect版）は現時点では未実装です（将来計画）。
