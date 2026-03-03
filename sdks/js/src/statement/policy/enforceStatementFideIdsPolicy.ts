/**
 * Enforce statement ID policy after deriving subject/predicate/object Fide IDs.
 */
import { assertFideId, parseFideId } from "../../fide-id/index.js";

/**
 * Enforce role-specific ID policy on a derived Fide ID.
 *
 * Subject/object IDs cannot use Statement source (`00`) unless the entity
 * itself is Statement.
 */
function assertRoleFideIdPolicy(fideId: string, role: "subject" | "object"): void {
  assertFideId(fideId);
  const { typeChar, sourceChar } = parseFideId(fideId);

  if (sourceChar !== "00" || typeChar === "00") {
    return;
  }

  throw new Error(
    `Invalid Fide ID for statement ${role}: ${fideId}. ` +
      `Protocol disallows Statement source (source code 00) for non-Statement entities. ` +
      `Use a concrete source (e.g. Person 0x1020, Organization 0x1120) instead of Statement-derived IDs.`
  );
}

/**
 * Enforce post-derivation statement ID invariants.
 *
 * Predicate ID policy is enforced earlier through input constraints; this
 * function keeps subject/object Statement-source restrictions centralized.
 */
export function enforceStatementFideIdsPolicy(
  subjectFideId: string,
  predicateFideId: string,
  objectFideId: string
): void {
  assertRoleFideIdPolicy(subjectFideId, "subject");
  assertRoleFideIdPolicy(objectFideId, "object");
}
