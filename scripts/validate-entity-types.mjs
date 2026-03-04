#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidatedEntityTypeSpec } from './lib/entity-types-spec.mjs';
import { loadValidatedPredicatePrefixSpec } from './lib/predicate-prefixes-spec.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FCP_ROOT = resolve(SCRIPT_DIR, '..');

async function main() {
  const spec = await loadValidatedEntityTypeSpec(FCP_ROOT);
  const prefixSpec = await loadValidatedPredicatePrefixSpec(FCP_ROOT);
  const entityCount = Object.keys(spec.entityTypes).length;
  const prefixCount = Object.keys(prefixSpec.prefixes).length;
  console.log(
    `FCP specs are valid (${entityCount} entity types, ${prefixCount} predicate prefixes).`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
