#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidatedEntityTypeSpec } from './lib/entity-types-spec.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FCP_ROOT = resolve(SCRIPT_DIR, '..');

async function main() {
  const spec = await loadValidatedEntityTypeSpec(FCP_ROOT);
  const count = Object.keys(spec.entityTypes).length;
  console.log(`Entity type spec is valid (${count} entity types).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
