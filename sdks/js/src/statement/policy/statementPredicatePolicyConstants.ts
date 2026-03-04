import { FCP_SPEC } from "../../spec/index.js";

/**
 * Canonical predicate URIs that are not allowed at protocol level.
 */
const FORBIDDEN_PREDICATE_RULES: Record<string, string> = {
  "https://schema.org/identifier":
    "Entity identifiers are implicit in Fide IDs and raw identifiers; do not add redundant identifier predicates.",
  "https://schema.org/sameAs":
    "Use http://www.w3.org/2002/07/owl#sameAs for strict identity assertions; https://schema.org/sameAs is not allowed in FCP statements.",
};

/**
 * Predicates treated as type assertion channels.
 */
const TYPE_ASSERTION_PREDICATE_URIS = new Set<string>([
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "https://schema.org/additionalType",
]);

const STANDARD_PREFIXES: Record<string, string> = {
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

const EXACT_STANDARD_URIS_BY_ENTITY_TYPE: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(FCP_SPEC.entityTypes).map(([entityType, spec]) => {
    const uris = new Set<string>();
    if (spec.standardFit === "Exact") {
      for (const standard of spec.standards) {
        const [prefix, local] = standard.split(":");
        if (!prefix || !local) continue;
        const base = STANDARD_PREFIXES[prefix];
        if (!base) continue;
        uris.add(`${base}${local}`);
      }
    }
    return [entityType, uris];
  }),
);

/**
 * Shared constants for statement predicate policy checks.
 */
export const STATEMENT_PREDICATE_POLICY_CONSTANTS = {
  forbiddenPredicateRules: FORBIDDEN_PREDICATE_RULES,
  typeAssertionPredicateUris: TYPE_ASSERTION_PREDICATE_URIS,
  exactStandardUrisByEntityType: EXACT_STANDARD_URIS_BY_ENTITY_TYPE,
} as const;
