import { expandPredicateRawIdentifier } from "../../fide-id/functions/expandPredicateRawIdentifier.js";
import { normalizePredicateRawIdentifier } from "../../fide-id/functions/normalizeRawIdentifier.js";

/**
 * Canonicalize a predicate token to an absolute predicate IRI.
 *
 * Accepts shorthand (for example `schema:name`) and returns `null`
 * when the value cannot be normalized as a valid predicate IRI.
 */
export function toCanonicalPredicateIri(predicateRawIdentifier: string): string | null {
  try {
    const expanded = expandPredicateRawIdentifier(predicateRawIdentifier);
    return normalizePredicateRawIdentifier(expanded);
  } catch {
    return null;
  }
}
