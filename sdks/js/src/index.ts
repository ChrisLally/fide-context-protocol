/**
 * @chris-test/fcp - Fide Context Protocol SDK
 *
 * Core functions for calculating Fide IDs and working with
 * the FCP protocol in JavaScript/TypeScript.
 */

// ============================================================================
// FIDE ID MODULE
// ============================================================================

// Core calculation functions
export {
    calculateFideId,
    calculateStatementFideId,
    buildStatementRawIdentifier,
    compactPredicateRawIdentifier,
    expandPredicateRawIdentifier,
    normalizeRawIdentifier,
    normalizePredicateRawIdentifier,
} from "./fide-id/index.js";

// Utility functions
export {
    assertFideId,
    buildFideIdFromParts,
    parseFideId,
} from "./fide-id/index.js";

// Constants
export {
    FCP_NAMESPACE_URL,
    FCP_SPEC_VERSION,
    FCP_SPEC_DATE,
    STANDARD_PREFIXES,
    DEFAULT_PREDICATE_PREFIXES,
    FIDE_ENTITY_TYPE_MAP,
    FIDE_CHAR_TO_ENTITY_TYPE,
    FIDE_ID_PREFIX,
    FIDE_ID_HEX_LENGTH,
    FIDE_ID_LENGTH,
    FIDE_ID_FINGERPRINT_LENGTH
} from "./fide-id/index.js";

// Types
export type {
    CompactPredicateRawIdentifierOptions,
    ExpandPredicateRawIdentifierOptions,
    FideEntityType,
    FideStatementPredicateEntityType,
    FideStatementPredicateSourceType,
    NormalizeRawIdentifierOptions,
    NormalizePredicateRawIdentifierOptions,
    FideEntityTypeChar,
    FideId,
    FideFingerprint,
    ParsedFideId,
    StatementRawIdentifier
} from "./fide-id/index.js";

// ============================================================================
// STATEMENT MODULE
// ============================================================================

export {
    buildStatement,
    enforceStatementPredicateInputPolicy,
    enforceStatementPredicateBatchPolicy,
    calculateCanonicalStatementSetRoot,
    calculateStatementSetRoot,
    type StatementInput,
    type Statement,
    type CanonicalStatementSet
} from "./statement/index.js";

// ============================================================================
// SPEC MODULE
// ============================================================================

export {
    FCP_SPEC,
    FCP_ENTITY_TYPES,
    getFcpEntityTypeSpec,
    type FcpEntityTypeName,
    type FcpEntityTypeSpec,
    type FcpStandardFit,
} from "./spec/index.js";
