# fide-context-protocol

Fide Context Protocol workspace.

## Structure

- `spec/`: protocol specification artifacts (canonical source in `spec/v1`)
- `openapi/`: API contract artifacts
- `docs/`: protocol docs
- `sdks/js/`: JavaScript SDK package (`@chris-test/fcp`)

## Generate Protocol Artifacts

Entity vocabulary and JS SDK constants are generated from:

- `spec/v1/entity-types.json`

Run from repo root:

```bash
pnpm run validate:fcp:spec
pnpm run generate:fcp
pnpm run check:generated:fcp
```

## SDK Release

- Monorepo release tag: `fcp/v<version>`
- Standalone repo release tag: `fcp-v<version>`
- From repo root: `pnpm run release:fcp`

## License

See `LICENSE`.
