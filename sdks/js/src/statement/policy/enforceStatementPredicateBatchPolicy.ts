import type { Statement } from "../types.js";
import { getForbiddenPredicateReason } from "./getForbiddenPredicateReason.js";

/**
 * Enforce predicate policy for already-built statements (batch context).
 *
 * Batch checks currently apply global forbidden-predicate rules to persisted
 * statement payloads.
 */
export function enforceStatementPredicateBatchPolicy(statements: Statement[]): void {
  for (let i = 0; i < statements.length; i += 1) {
    const predicateRawIdentifier = statements[i]?.predicateRawIdentifier;
    if (typeof predicateRawIdentifier !== "string") continue;

    const reason = getForbiddenPredicateReason(predicateRawIdentifier);
    if (reason) {
      throw new Error(
        `Invalid statement line ${i + 1}: predicate ${JSON.stringify(predicateRawIdentifier)} is not allowed. ${reason}`,
      );
    }
  }
}
