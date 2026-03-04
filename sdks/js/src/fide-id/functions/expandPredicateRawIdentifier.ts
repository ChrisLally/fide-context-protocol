import {
  DEFAULT_PREDICATE_PREFIXES,
} from "../constants.js";
import type { ExpandPredicateRawIdentifierOptions } from "../types.js";

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
