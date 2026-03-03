import type { ExpandPredicateRawIdentifierOptions } from "../types.js";

/**
 * Default prefix map for predicate shorthand expansion.
 */
export const DEFAULT_PREDICATE_PREFIXES: Record<string, string> = {
  schema: "https://schema.org/",
  owl: "https://www.w3.org/2002/07/owl#",
  rdf: "https://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "https://www.w3.org/2000/01/rdf-schema#",
} as const;

/**
 * Expand a prefixed predicate token (e.g. `schema:name`) to a full IRI.
 *
 * If `rawIdentifier` is already an absolute URL, it is returned unchanged.
 * If `rawIdentifier` contains a prefix not found in the configured map, throws.
 *
 * @param rawIdentifier Predicate raw identifier token.
 * @param options Prefix override options.
 * @returns Expanded full IRI or original absolute URL.
 */
export function expandPredicateRawIdentifier(
  rawIdentifier: string,
  options?: ExpandPredicateRawIdentifierOptions,
): string {
  if (/^https?:\/\//i.test(rawIdentifier)) {
    return rawIdentifier;
  }

  const idx = rawIdentifier.indexOf(":");
  if (idx <= 0) {
    return rawIdentifier;
  }

  const prefix = rawIdentifier.slice(0, idx);
  const local = rawIdentifier.slice(idx + 1);
  if (!prefix || !local) {
    return rawIdentifier;
  }

  const map = {
    ...DEFAULT_PREDICATE_PREFIXES,
    ...(options?.prefixes ?? {}),
  };
  const base = map[prefix];
  if (!base) {
    throw new Error(
      `Unknown predicate prefix: ${prefix}. Provide a full URL or configure this prefix explicitly.`,
    );
  }

  return `${base}${local}`;
}
