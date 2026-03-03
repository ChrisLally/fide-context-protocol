#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FCP_ROOT = resolve(SCRIPT_DIR, "..");
const ENTITY_TYPES_PATH = resolve(FCP_ROOT, "spec/v1/entity-types.json");
const CONTEXT_PATH = resolve(FCP_ROOT, "spec/v1/context.jsonld");

function parseEntityTypeSpec(source) {
  const parsed = JSON.parse(source);
  if (!parsed?.entityTypes || typeof parsed.entityTypes !== "object") {
    throw new Error(`Invalid entity type spec at ${ENTITY_TYPES_PATH}`);
  }

  return Object.entries(parsed.entityTypes)
    .map(([name, def]) => ({ name, def }))
    .sort((a, b) => a.def.code.localeCompare(b.def.code));
}

function standardPrefixToBase() {
  return {
    schema: "https://schema.org/",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    org: "http://www.w3.org/ns/org#",
    prov: "http://www.w3.org/ns/prov#",
    sec: "https://w3id.org/security#",
    owl: "http://www.w3.org/2002/07/owl#",
    skos: "http://www.w3.org/2004/02/skos/core#",
  };
}

function toStandardUris(rawStandards) {
  const map = standardPrefixToBase();

  return (rawStandards ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.startsWith("http://") || item.startsWith("https://")) return item;
      const [prefix, local] = item.split(":");
      if (!prefix || !local) return null;
      const base = map[prefix];
      return base ? `${base}${local}` : null;
    })
    .filter((value) => Boolean(value));
}

function buildContextJsonLd(entities) {
  const graph = entities.map(({ name, def }) => {
    const node = {
      "@id": `fide:${name}`,
      "@type": "schema:DefinedTerm",
      "rdfs:label": name,
      "schema:name": name,
      "schema:termCode": def.code,
    };

    if (def.description) node["rdfs:comment"] = def.description;
    if (def.layer) node["schema:category"] = def.layer;
    if (def.litmus) node["schema:disambiguatingDescription"] = def.litmus;

    const standardUris = toStandardUris(def.standards);
    if (standardUris.length > 0) {
      if (def.standardFit === "Exact") {
        node["owl:equivalentClass"] = standardUris.map((uri) => ({ "@id": uri }));
      } else {
        node["rdfs:subClassOf"] = standardUris.map((uri) => ({ "@id": uri }));
      }
    }

    return node;
  });

  const doc = {
    "@context": [
      "https://schema.org/docs/jsonldcontext.json",
      "https://www.w3.org/ns/prov.jsonld",
      {
        fide: "https://fide.work/spec/v1/",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
        owl: "http://www.w3.org/2002/07/owl#",
      },
    ],
    "@id": "fide:entity-types",
    "@type": "schema:DefinedTermSet",
    "schema:name": "Fide Entity Types",
    "@graph": graph,
  };

  return `${JSON.stringify(doc, null, 2)}\n`;
}

async function main() {
  const source = await readFile(ENTITY_TYPES_PATH, "utf8");
  const entities = parseEntityTypeSpec(source);
  const contextJson = buildContextJsonLd(entities);
  await writeFile(CONTEXT_PATH, contextJson, "utf8");
  console.log(`Generated context JSON-LD for ${entities.length} entity types.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
