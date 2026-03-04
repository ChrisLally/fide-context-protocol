#!/usr/bin/env node

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidatedEntityTypeSpec } from './lib/entity-types-spec.mjs';
import { loadValidatedPredicatePrefixSpec } from './lib/predicate-prefixes-spec.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FCP_ROOT = resolve(SCRIPT_DIR, '..');
const SDK_CONSTANTS_PATH = resolve(FCP_ROOT, 'sdks/js/src/fide-id/constants.ts');
const SDK_SPEC_MODULE_PATH = resolve(FCP_ROOT, 'sdks/js/src/spec/index.ts');
const VOCAB_DIR = resolve(FCP_ROOT, 'docs/vocabulary');

const LAYER_ORDER = ['Protocol', 'Agents', 'Network Anchors', 'Knowledge', 'Spacetime', 'Literals', 'Unknown'];

const LAYER_DESCRIPTIONS = {
  Protocol: 'The atomic primitive layer that anchors graph assertions.',
  Agents: 'Entities with agency - they make decisions, take actions, and bear responsibility.',
  'Network Anchors': 'Network addresses where evidence lives: resolvable locations, platform handles, and cryptographic principals.',
  Knowledge: 'Things that represent intellectual property, abstract ideas, or data structures.',
  Spacetime: 'Entities bounded in time; optionally in physical or virtual space. Substrate-neutral Places, Events, Actions, and physical Objects.',
  Literals: 'Typed scalar literals represented as first-class addressed values.',
  Unknown: '',
};

function ensureString(value, path) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid string at ${path}`);
  }
  return value;
}

function toSlug(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function quote(text) {
  return JSON.stringify(text);
}

function escapeMdx(text) {
  return text.replace(/\|/g, '\\|').replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
}

function normalizeSpec(raw) {
  const namespaceUrl = ensureString(raw.namespaceUrl, 'namespaceUrl');
  const specVersion = ensureString(raw.specVersion, 'specVersion');
  const specDate = ensureString(raw.specDate, 'specDate');

  if (!raw.entityTypes || typeof raw.entityTypes !== 'object') {
    throw new Error('Invalid entityTypes object');
  }

  const entities = Object.entries(raw.entityTypes).map(([name, value]) => {
    if (!value || typeof value !== 'object') {
      throw new Error(`Invalid entity type entry for ${name}`);
    }

    const standards = Array.isArray(value.standards) ? value.standards.map((standard, idx) => ensureString(standard, `${name}.standards[${idx}]`)) : [];

    return {
      name: ensureString(name, `entityTypes key`),
      code: ensureString(value.code, `${name}.code`),
      layer: ensureString(value.layer, `${name}.layer`),
      standards,
      standardFit: ensureString(value.standardFit, `${name}.standardFit`),
      description: ensureString(value.description, `${name}.description`),
      litmus: ensureString(value.litmus, `${name}.litmus`),
      slug: toSlug(name),
    };
  });

  return { namespaceUrl, specVersion, specDate, entities };
}

function generateConstantsTs(spec, prefixSpec) {
  const entityTypeMapEntries = spec.entities
    .map((entity) => `    ${entity.name}: ${quote(entity.code)},`)
    .join('\n');

  const reverseMapEntries = spec.entities
    .map((entity) => `    ${quote(entity.code)}: ${quote(entity.name)},`)
    .join('\n');

  const standardPrefixEntries = Object.entries(prefixSpec.prefixes)
    .map(([prefix, base]) => `  ${prefix}: ${quote(base)},`)
    .join('\n');

  const defaultPredicatePrefixEntries = prefixSpec.defaultPredicatePrefixes
    .map((prefix) => `  ${prefix}: STANDARD_PREFIXES.${prefix},`)
    .join('\n');

  return `/**
 * THIS FILE IS AUTO-GENERATED FROM spec/v1/entity-types.json + spec/v1/predicate-prefixes.json.
 * DO NOT EDIT DIRECTLY. RUN: pnpm run generate:fcp
 */
export const FCP_NAMESPACE_URL = ${quote(spec.namespaceUrl)} as const;
export const FCP_SPEC_VERSION = ${quote(spec.specVersion)} as const;
export const FCP_SPEC_DATE = ${quote(spec.specDate)} as const;

export const FIDE_ENTITY_TYPE_MAP = {
${entityTypeMapEntries}
} as const;

export const FIDE_CHAR_TO_ENTITY_TYPE: Record<string, keyof typeof FIDE_ENTITY_TYPE_MAP> = {
${reverseMapEntries}
};

export const FIDE_ID_PREFIX = 'did:fide:0x' as const;
export const FIDE_ID_HEX_LENGTH = 40;
export const FIDE_ID_LENGTH = FIDE_ID_PREFIX.length + FIDE_ID_HEX_LENGTH;
export const FIDE_ID_FINGERPRINT_LENGTH = 36;

/**
 * Prefix map for expanding standards CURIEs to canonical IRIs.
 */
export const STANDARD_PREFIXES: Record<string, string> = {
${standardPrefixEntries}
} as const;

/**
 * Default prefix map for predicate shorthand expansion/compaction.
 */
export const DEFAULT_PREDICATE_PREFIXES: Record<string, string> = {
${defaultPredicatePrefixEntries}
} as const;
`;
}

function generateSpecModuleTs(spec) {
  const entityEntries = spec.entities
    .map((entity) => {
      const standards = entity.standards.map((standard) => quote(standard)).join(', ');
      return `  ${entity.name}: {
    code: ${quote(entity.code)},
    layer: ${quote(entity.layer)},
    standards: [${standards}] as const,
    standardFit: ${quote(entity.standardFit)},
    description: ${quote(entity.description)},
    litmus: ${quote(entity.litmus)},
  },`;
    })
    .join('\n');

  return `/**
 * THIS FILE IS AUTO-GENERATED FROM spec/v1/entity-types.json.
 * DO NOT EDIT DIRECTLY. RUN: pnpm run generate:fcp
 */
export const FCP_SPEC = {
  namespaceUrl: ${quote(spec.namespaceUrl)},
  specVersion: ${quote(spec.specVersion)},
  specDate: ${quote(spec.specDate)},
  entityTypes: {
${entityEntries}
  },
} as const;

export const FCP_ENTITY_TYPES = FCP_SPEC.entityTypes;
export type FcpEntityTypeName = keyof typeof FCP_ENTITY_TYPES;
export type FcpStandardFit = (typeof FCP_ENTITY_TYPES)[FcpEntityTypeName]["standardFit"];
export type FcpEntityTypeSpec = (typeof FCP_ENTITY_TYPES)[FcpEntityTypeName];

export function getFcpEntityTypeSpec(name: FcpEntityTypeName): FcpEntityTypeSpec {
  return FCP_ENTITY_TYPES[name];
}
`;
}

function buildVocabularyIndex(spec) {
  let links = '';

  for (const layer of LAYER_ORDER) {
    const entities = spec.entities.filter((entity) => entity.layer === layer);
    if (entities.length === 0) continue;

    entities.sort((a, b) => a.code.localeCompare(b.code));

    links += `### ${layer}\n\n`;
    if (LAYER_DESCRIPTIONS[layer]) {
      links += `${LAYER_DESCRIPTIONS[layer]}\n\n`;
    }

    links += '| Entity | Code | Definition | Not |\n';
    links += '| :--- | :--- | :--- | :--- |\n';

    for (const entity of entities) {
      links += `| [\`${entity.name}\`](/docs/fcp/vocabulary/${entity.slug}) | \`${entity.code}\` | ${escapeMdx(entity.description)} | ${escapeMdx(entity.litmus)} |\n`;
    }

    links += '\n';
  }

  return `---
title: Fide Entity Vocabulary
description: Explore the seven conceptual layers and entity types of the Fide Context Protocol.
---

${links}
---

> **Immutable Base Types**
>
> Entity types are mathematically hardcoded into the \`did:fide\` identifier. Therefore, **FCP only defines fundamental entity types that will never change.**
>
> Subjective or transient categorizations (like \"Product\", \"License\", or \"Policy\") are asserted dynamically in the graph via \`Statements\`. When in doubt, default to the most objective, immutable base form.
`;
}

function buildVocabularyPage(entity) {
  return `---
title: ${quote(entity.name)}
description: ${quote(entity.description)}
full: true
---

## Summary

- **Definition:** ${escapeMdx(entity.description)}
- **Not:** ${escapeMdx(entity.litmus)}
- **Layer:** [${entity.layer}](/docs/fcp/vocabulary#${toSlug(entity.layer)})
- **Hex Code:** \`${entity.code}\`
- **Standard Alignment:** ${entity.standards.map((standard) => `\`${standard}\``).join(" + ")} (${entity.standardFit} fit)
`;
}

function buildVocabularyMeta(spec) {
  const pages = ['index'];

  for (const layer of LAYER_ORDER) {
    const entities = spec.entities.filter((entity) => entity.layer === layer);
    if (entities.length === 0) continue;

    entities.sort((a, b) => a.code.localeCompare(b.code));
    pages.push(`--- ${layer} ---`);
    for (const entity of entities) {
      pages.push(entity.slug);
    }
  }

  return {
    title: 'Vocabulary',
    description: 'FCP Fide Entity Vocabulary',
    root: true,
    icon: 'Library',
    pages,
  };
}

async function cleanVocabularyDir() {
  await mkdir(VOCAB_DIR, { recursive: true });
  const files = await readdir(VOCAB_DIR);
  for (const file of files) {
    if (file.endsWith('.mdx') || file === 'meta.json') {
      await rm(resolve(VOCAB_DIR, file), { force: true });
    }
  }
}

async function writeVocabulary(spec) {
  await cleanVocabularyDir();

  await writeFile(resolve(VOCAB_DIR, 'index.mdx'), buildVocabularyIndex(spec), 'utf8');
  await writeFile(resolve(VOCAB_DIR, 'meta.json'), `${JSON.stringify(buildVocabularyMeta(spec), null, 2)}\n`, 'utf8');

  for (const entity of spec.entities) {
    await writeFile(resolve(VOCAB_DIR, `${entity.slug}.mdx`), buildVocabularyPage(entity), 'utf8');
  }
}

async function main() {
  const rawSpec = await loadValidatedEntityTypeSpec(FCP_ROOT);
  const prefixSpec = await loadValidatedPredicatePrefixSpec(FCP_ROOT);
  const spec = normalizeSpec(rawSpec);

  await mkdir(dirname(SDK_SPEC_MODULE_PATH), { recursive: true });
  await writeFile(SDK_CONSTANTS_PATH, generateConstantsTs(spec, prefixSpec), 'utf8');
  await writeFile(SDK_SPEC_MODULE_PATH, generateSpecModuleTs(spec), 'utf8');
  await writeVocabulary(spec);

  console.log(`Generated constants + vocabulary for ${spec.entities.length} entity types.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
