import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(errors) {
  const message = ["Predicate prefix spec validation failed:", ...errors.map((e) => `- ${e}`)].join("\n");
  throw new Error(message);
}

export async function loadValidatedPredicatePrefixSpec(fcpRoot) {
  const specPath = resolve(fcpRoot, "spec/v1/predicate-prefixes.json");
  const schemaPath = resolve(fcpRoot, "spec/v1/predicate-prefixes.schema.json");

  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));

  const errors = [];

  if (!isObject(spec)) {
    fail(["spec root must be an object"]);
  }

  const rootRequired = schema.required ?? [];
  for (const key of rootRequired) {
    if (!(key in spec)) errors.push(`missing required root field: ${key}`);
  }

  if (typeof spec.namespaceUrl !== "string" || spec.namespaceUrl.length === 0) {
    errors.push("namespaceUrl must be a non-empty URI string");
  }

  const specVersionPattern = new RegExp(schema.properties.specVersion.pattern);
  if (typeof spec.specVersion !== "string" || !specVersionPattern.test(spec.specVersion)) {
    errors.push(`specVersion must match ${schema.properties.specVersion.pattern}`);
  }

  const datePattern = new RegExp(schema.properties.specDate.pattern);
  if (typeof spec.specDate !== "string" || !datePattern.test(spec.specDate)) {
    errors.push(`specDate must match ${schema.properties.specDate.pattern}`);
  }

  const prefixPattern = new RegExp(
    schema.properties.prefixes.patternProperties["^[a-z][a-z0-9]*$"].pattern,
  );
  if (!isObject(spec.prefixes)) {
    errors.push("prefixes must be an object");
  } else {
    for (const [prefix, base] of Object.entries(spec.prefixes)) {
      if (!/^[a-z][a-z0-9]*$/.test(prefix)) {
        errors.push(`prefix '${prefix}' must match ^[a-z][a-z0-9]*$`);
      }
      if (typeof base !== "string" || !prefixPattern.test(base)) {
        errors.push(`prefixes.${prefix} must be an https URI ending with /, #, or \\\\`);
      }
    }
  }

  if (!Array.isArray(spec.defaultPredicatePrefixes) || spec.defaultPredicatePrefixes.length === 0) {
    errors.push("defaultPredicatePrefixes must be a non-empty array");
  } else {
    const seen = new Set();
    for (const prefix of spec.defaultPredicatePrefixes) {
      if (typeof prefix !== "string" || !/^[a-z][a-z0-9]*$/.test(prefix)) {
        errors.push("defaultPredicatePrefixes entries must match ^[a-z][a-z0-9]*$");
        continue;
      }
      if (seen.has(prefix)) {
        errors.push(`defaultPredicatePrefixes contains duplicate '${prefix}'`);
      }
      seen.add(prefix);
      if (!spec.prefixes || !(prefix in spec.prefixes)) {
        errors.push(`defaultPredicatePrefixes contains unknown prefix '${prefix}'`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  return spec;
}
