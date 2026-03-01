import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(errors) {
  const message = ['Entity type spec validation failed:', ...errors.map((e) => `- ${e}`)].join('\n');
  throw new Error(message);
}

export async function loadValidatedEntityTypeSpec(fcpRoot) {
  const specPath = resolve(fcpRoot, 'spec/v1/entity-types.json');
  const schemaPath = resolve(fcpRoot, 'spec/v1/entity-types.schema.json');

  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

  const errors = [];

  if (!isObject(spec)) {
    fail(['spec root must be an object']);
  }

  const rootRequired = schema.required ?? [];
  for (const key of rootRequired) {
    if (!(key in spec)) errors.push(`missing required root field: ${key}`);
  }

  if (typeof spec.protocolId !== 'string' || spec.protocolId.length === 0) {
    errors.push('protocolId must be a non-empty string');
  }

  const generationPattern = new RegExp(schema.properties.protocolGeneration.pattern);
  if (typeof spec.protocolGeneration !== 'string' || !generationPattern.test(spec.protocolGeneration)) {
    errors.push(`protocolGeneration must match ${schema.properties.protocolGeneration.pattern}`);
  }

  const datePattern = new RegExp(schema.properties.specDate.pattern);
  if (typeof spec.specDate !== 'string' || !datePattern.test(spec.specDate)) {
    errors.push(`specDate must match ${schema.properties.specDate.pattern}`);
  }

  if (!isObject(spec.entityTypes)) {
    errors.push('entityTypes must be an object');
  }

  const entitySchema = schema.properties.entityTypes.patternProperties['^[A-Za-z][A-Za-z0-9]*$'];
  const entityRequired = entitySchema.required ?? [];
  const codePattern = new RegExp(entitySchema.properties.code.pattern);
  const standardFitEnum = new Set(entitySchema.properties.standardFit.enum);
  const namePattern = /^[A-Za-z][A-Za-z0-9]*$/;

  const seenCodes = new Map();

  for (const [name, entity] of Object.entries(spec.entityTypes ?? {})) {
    if (!namePattern.test(name)) {
      errors.push(`entityTypes key '${name}' must match ^[A-Za-z][A-Za-z0-9]*$`);
      continue;
    }

    if (!isObject(entity)) {
      errors.push(`${name} must be an object`);
      continue;
    }

    for (const key of entityRequired) {
      if (!(key in entity)) errors.push(`${name}.${key} is required`);
    }

    if (typeof entity.code !== 'string' || !codePattern.test(entity.code)) {
      errors.push(`${name}.code must match ${entitySchema.properties.code.pattern}`);
    } else {
      const existing = seenCodes.get(entity.code);
      if (existing) {
        errors.push(`duplicate entity code '${entity.code}' used by ${existing} and ${name}`);
      } else {
        seenCodes.set(entity.code, name);
      }
    }

    if (typeof entity.layer !== 'string' || entity.layer.length === 0) {
      errors.push(`${name}.layer must be a non-empty string`);
    }

    if (!Array.isArray(entity.standards) || entity.standards.length === 0) {
      errors.push(`${name}.standards must be a non-empty string array`);
    } else {
      for (const [idx, standard] of entity.standards.entries()) {
        if (typeof standard !== 'string' || standard.length === 0) {
          errors.push(`${name}.standards[${idx}] must be a non-empty string`);
        }
      }
    }

    if (typeof entity.standardFit !== 'string' || !standardFitEnum.has(entity.standardFit)) {
      errors.push(`${name}.standardFit must be one of: ${Array.from(standardFitEnum).join(', ')}`);
    }

    if (typeof entity.description !== 'string' || entity.description.length === 0) {
      errors.push(`${name}.description must be a non-empty string`);
    }

    if (typeof entity.litmus !== 'string' || entity.litmus.length === 0) {
      errors.push(`${name}.litmus must be a non-empty string`);
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  return spec;
}
