# CLI ガイド

## export
```bash
kintone-as-code export --app-id 123 --name sales --with-query --with-record-schema
kintone-as-code export --app-id 123 --name sales --no-query --no-record-schema
```

```mermaid
sequenceDiagram
  participant CLI as kintone-as-code export
  participant CFG as config.ts
  participant KC as kintone-client.ts
  participant GEN as core/query-generator.ts
  CLI->>CFG: loadConfig()
  CFG-->>CLI: environments[env].auth
  CLI->>KC: getKintoneClient(auth)
  CLI->>KC: client.app.getFormFields(appId)
  KC-->>CLI: form metadata
  CLI->>GEN: generateQueryBuilder(form, name)
  CLI-->>CLI: write apps/{name}.query.ts
```

## apply
```bash
kintone-as-code apply --schema apps/sales.schema.ts --env dev
# or
kintone-as-code apply --app-id 123 --schema apps/sales.schema.ts --env dev
```

## create
```bash
kintone-as-code create --schema apps/sales.schema.ts --name "Sales Copy" --space 100 --thread 200
```
