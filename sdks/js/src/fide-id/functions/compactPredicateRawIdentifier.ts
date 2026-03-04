import {
  DEFAULT_PREDICATE_PREFIXES,
} from "../constants.js";
import type { CompactPredicateRawIdentifierOptions } from "../types.js";

/**
 * Compact a full predicate IRI (e.g. `https://schema.org/name`) to CURIE form.
 *
 * Returns the original input unchanged when it does not match a configured prefix.
 *
 * @param rawIdentifier Predicate raw identifier token.
 * @param options Prefix override options.
 * @returns CURIE form or original input.
 */
export function compactPredicateRawIdentifier(
  rawIdentifier: string,
  options?: CompactPredicateRawIdentifierOptions,
): string {
  const map = {
    ...DEFAULT_PREDICATE_PREFIXES,
    ...(options?.prefixes ?? {}),
  };

  for (const [prefix, base] of Object.entries(map)) {
    if (rawIdentifier.startsWith(base)) {
      const local = rawIdentifier.slice(base.length);
      if (local.length > 0) {
        return `${prefix}:${local}`;
      }
    }
  }

  return rawIdentifier;
}
