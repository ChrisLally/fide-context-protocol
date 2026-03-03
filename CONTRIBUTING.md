# Contributing to Fide Context Protocol (FCP)

This guide is for contributors working on the Fide Context Protocol (FCP).
The repository is the home for the protocol spec, docs, and SDK reference implementation.

- Spec content: `spec/`
- Docs content: `docs/`
- JS SDK: `sdks/js/`
- Generation scripts: `scripts/`

## Contribution Scope

FCP contributions should stay protocol-focused:

- normative protocol behavior
- identifier rules and validation policy
- vocabulary and schema structure
- SDK behavior that implements protocol rules

Implementation-specific product behavior should stay outside FCP scope.

## Core Principles

- Keep spec and SDK aligned.
- Prefer deterministic generation over manual edits.
- Keep protocol strict by default; make convenience behavior explicit opt-in.
- Avoid breaking existing protocol contracts unless intentionally versioned.

## Opt-In Option Pattern

When adding convenience behavior, keep defaults strict and expose explicit options on function signatures.

Examples:

```ts
normalizePredicateRawIdentifier(rawIdentifier, {
  expandPrefixes: true,
});

calculateFideId(entityType, sourceType, rawIdentifier, {
  normalizeRawIdentifier: true,
});
```

Naming guidance:

- use positive, explicit opt-in flags for convenience behavior (`expandPrefixes`, `normalizeRawIdentifier`)
- reserve `dangerously*` flags for policy bypasses only
- document default values and behavior in JSDoc and docs pages

## Local Workflow

From repository root:

```bash
pnpm --filter @chris-test/fcp run build
```

If your change affects generated protocol artifacts or SDK reference docs, run:

```bash
pnpm run check:generated:fcp
```

## Where to Change Things

### Protocol rules and behavior

- `sdks/js/src/fide-id/*`
- `sdks/js/src/statement/*`
- `spec/v1/*`

### Entity types and generated vocabulary/constants

- source definitions: `scripts/lib/entity-types-spec.mjs`
- generators: `scripts/generate-entity-type-artifacts.mjs`
- validation: `scripts/validate-entity-types.mjs`

Do not hand-edit generated outputs when a generator owns them.

## Docs Expectations

- Keep docs in `docs/` aligned to actual behavior.
- Prefer concrete examples with exact identifiers and expected outcomes.
- When behavior is strict/optional, document defaults explicitly.

## Pull Request Checklist

- Protocol behavior is clearly defined and justified.
- Spec/docs/sdk are updated together where applicable.
- Generated outputs are up to date.
- `@chris-test/fcp` build passes.
- If touched, graph/cli consumers still build.

## Non-Goals for This File

This document is for contribution workflow only.
Release and publishing flow are intentionally documented elsewhere.
