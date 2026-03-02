# FCP Spec Sources

Canonical protocol data lives under versioned folders:

- `v1/entity-types.json`: source of truth for FCP entity type vocabulary.
- `v1/entity-types.schema.json`: schema rules for the entity type spec.

Generated artifacts derived from `spec/v1/entity-types.json`:

- `../sdks/js/src/fide-id/constants.ts`
- `../docs/vocabulary/*`

From repo root:

```bash
pnpm run validate:fcp:spec
pnpm run generate:fcp
pnpm run check:generated:fcp
```
