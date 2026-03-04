/**
 * THIS FILE IS AUTO-GENERATED FROM spec/v1/entity-types.json + spec/v1/predicate-prefixes.json.
 * DO NOT EDIT DIRECTLY. RUN: pnpm run generate:fcp
 */
export const FCP_NAMESPACE_URL = "https://fide.work/spec/v1/" as const;
export const FCP_SPEC_VERSION = "1" as const;
export const FCP_SPEC_DATE = "2026-02-18" as const;

export const FIDE_ENTITY_TYPE_MAP = {
    Statement: "00",
    Person: "10",
    Organization: "11",
    SoftwareAgent: "12",
    NetworkResource: "20",
    PlatformAccount: "21",
    CryptographicAccount: "22",
    CreativeWork: "30",
    Concept: "31",
    Place: "40",
    Event: "41",
    Action: "42",
    PhysicalObject: "43",
    TextLiteral: "a0",
    IntegerLiteral: "a1",
    DecimalLiteral: "a2",
    BoolLiteral: "a3",
    DateLiteral: "a4",
    TimeLiteral: "a5",
    DateTimeLiteral: "a6",
    DurationLiteral: "a7",
    URILiteral: "a8",
    JSONLiteral: "a9",
} as const;

export const FIDE_CHAR_TO_ENTITY_TYPE: Record<string, keyof typeof FIDE_ENTITY_TYPE_MAP> = {
    "00": "Statement",
    "10": "Person",
    "11": "Organization",
    "12": "SoftwareAgent",
    "20": "NetworkResource",
    "21": "PlatformAccount",
    "22": "CryptographicAccount",
    "30": "CreativeWork",
    "31": "Concept",
    "40": "Place",
    "41": "Event",
    "42": "Action",
    "43": "PhysicalObject",
    "a0": "TextLiteral",
    "a1": "IntegerLiteral",
    "a2": "DecimalLiteral",
    "a3": "BoolLiteral",
    "a4": "DateLiteral",
    "a5": "TimeLiteral",
    "a6": "DateTimeLiteral",
    "a7": "DurationLiteral",
    "a8": "URILiteral",
    "a9": "JSONLiteral",
};

export const FIDE_ID_PREFIX = 'did:fide:0x' as const;
export const FIDE_ID_HEX_LENGTH = 40;
export const FIDE_ID_LENGTH = FIDE_ID_PREFIX.length + FIDE_ID_HEX_LENGTH;
export const FIDE_ID_FINGERPRINT_LENGTH = 36;

/**
 * Prefix map for expanding standards CURIEs to canonical IRIs.
 */
export const STANDARD_PREFIXES: Record<string, string> = {
  schema: "https://schema.org/",
  rdf: "https://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "https://www.w3.org/2000/01/rdf-schema#",
  xsd: "https://www.w3.org/2001/XMLSchema#",
  org: "https://www.w3.org/ns/org#",
  prov: "https://www.w3.org/ns/prov#",
  sec: "https://w3id.org/security#",
  owl: "https://www.w3.org/2002/07/owl#",
  skos: "https://www.w3.org/2004/02/skos/core#",
} as const;

/**
 * Default prefix map for predicate shorthand expansion/compaction.
 */
export const DEFAULT_PREDICATE_PREFIXES: Record<string, string> = {
  schema: STANDARD_PREFIXES.schema,
  owl: STANDARD_PREFIXES.owl,
  rdf: STANDARD_PREFIXES.rdf,
  rdfs: STANDARD_PREFIXES.rdfs,
  prov: STANDARD_PREFIXES.prov,
} as const;
