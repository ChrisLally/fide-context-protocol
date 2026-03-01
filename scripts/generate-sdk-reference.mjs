#!/usr/bin/env node

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FCP_ROOT = resolve(SCRIPT_DIR, '..');
const SDK_ROOT = resolve(FCP_ROOT, 'sdks/js');
const SDK_ENTRY = resolve(SDK_ROOT, 'src/index.ts');
const OUTPUT_DIR = resolve(FCP_ROOT, 'docs/fcp/sdks/js');
const TSCONFIG_PATH = resolve(SDK_ROOT, 'tsconfig.json');

const SECTION_ORDER = ['Fide ID', 'Statement', 'Other'];

function toSlug(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function yamlQuoted(value) {
  return JSON.stringify(value ?? '');
}

function displayPartsToString(parts) {
  return parts?.map((part) => part.text).join('') ?? '';
}

function parseNamedExports(source) {
  const items = [];
  const re = /export\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const names = match[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.split(/\s+as\s+/).pop().trim())
      .filter((name) => name && !name.startsWith('type '))
      .map((name) => name.replace(/^type\s+/, ''));

    for (const name of names) {
      items.push({ name, source: match[2] });
    }
  }
  return items;
}

function sectionFor(sourcePath) {
  if (sourcePath.includes('/fide-id/')) return 'Fide ID';
  if (sourcePath.includes('/statement/')) return 'Statement';
  return 'Other';
}

function signatureToCode(name, signature, checker, decl) {
  const params = signature.getParameters().map((paramSymbol) => {
    const paramDecl = paramSymbol.valueDeclaration ?? paramSymbol.declarations?.[0] ?? decl;
    const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, paramDecl);
    const isOptional = Boolean(paramSymbol.flags & ts.SymbolFlags.Optional);
    return `${paramSymbol.getName()}${isOptional ? '?' : ''}: ${checker.typeToString(paramType, decl, ts.TypeFormatFlags.NoTruncation)}`;
  });

  const returnType = checker.typeToString(signature.getReturnType(), decl, ts.TypeFormatFlags.NoTruncation);
  return `${name}(${params.join(', ')}): ${returnType}`;
}

function getParamDescription(signature, paramName, checker) {
  for (const tag of signature.getJsDocTags()) {
    if (tag.name !== 'param') continue;
    const text = displayPartsToString(tag.text);
    if (!text.startsWith(`${paramName} `)) continue;
    return text.replace(new RegExp(`^${paramName}\\s*-?\\s*`), '').trim();
  }
  return '';
}

async function cleanGeneratedFiles(outputDir) {
  await mkdir(outputDir, { recursive: true });
  const files = await readdir(outputDir);
  for (const file of files) {
    if (file.endsWith('.mdx') || file === 'meta.json') {
      await rm(resolve(outputDir, file), { force: true });
    }
  }
}

function buildProgram() {
  const configRead = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  if (configRead.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configRead.error.messageText, '\n'));
  }

  const parsed = ts.parseJsonConfigFileContent(configRead.config, ts.sys, SDK_ROOT);
  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
}

function collectFunctionDocs() {
  const source = ts.sys.readFile(SDK_ENTRY);
  if (!source) {
    throw new Error(`Missing SDK entry: ${SDK_ENTRY}`);
  }

  const exportedItems = parseNamedExports(source);
  const program = buildProgram();
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(SDK_ENTRY);
  if (!entryFile) {
    throw new Error(`Unable to load source file: ${SDK_ENTRY}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(entryFile);
  if (!moduleSymbol) {
    throw new Error('Unable to resolve module symbol for SDK entry');
  }

  const exportedSymbols = checker.getExportsOfModule(moduleSymbol);
  const byName = new Map(exportedSymbols.map((symbol) => [symbol.getName(), symbol]));

  const functionDocs = [];

  for (const item of exportedItems) {
    const exportedSymbol = byName.get(item.name);
    if (!exportedSymbol) continue;

    const symbol = (exportedSymbol.flags & ts.SymbolFlags.Alias) !== 0
      ? checker.getAliasedSymbol(exportedSymbol)
      : exportedSymbol;

    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) continue;
    const decl = declarations[0];

    const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
    const signatures = type.getCallSignatures();
    if (signatures.length === 0) continue;

    const description = displayPartsToString(symbol.getDocumentationComment(checker)).trim();

    const signatureDocs = signatures.map((signature) => {
      const signatureDescription = displayPartsToString(signature.getDocumentationComment(checker)).trim();
      const returnTag = signature.getJsDocTags().find((tag) => tag.name === 'returns' || tag.name === 'return');
      const returnDescription = returnTag ? displayPartsToString(returnTag.text).replace(/^\s*-\s*/, '').trim() : '';
      const code = signatureToCode(item.name, signature, checker, decl);

      const parameters = signature.getParameters().map((paramSymbol) => {
        const paramDecl = paramSymbol.valueDeclaration ?? paramSymbol.declarations?.[0] ?? decl;
        const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, paramDecl);
        const isOptional = Boolean(paramSymbol.flags & ts.SymbolFlags.Optional);
        return {
          name: paramSymbol.getName(),
          type: checker.typeToString(paramType, decl, ts.TypeFormatFlags.NoTruncation),
          optional: isOptional,
          description: getParamDescription(signature, paramSymbol.getName(), checker),
        };
      });

      return { code, signatureDescription, returnDescription, parameters };
    });

    functionDocs.push({
      name: item.name,
      slug: toSlug(item.name),
      section: sectionFor(item.source),
      description,
      signatures: signatureDocs,
    });
  }

  return functionDocs;
}

function buildFunctionPage(doc) {
  const intro = doc.description || `SDK reference for ${doc.name}.`;

  const signatureBlocks = doc.signatures.map((sig, index) => {
    const heading = doc.signatures.length > 1 ? `### Signature ${index + 1}` : '## Signature';

    const parameters = sig.parameters.length === 0
      ? 'No parameters.'
      : [
          '| Name | Type | Required | Description |',
          '| :--- | :--- | :--- | :--- |',
          ...sig.parameters.map((param) => {
            const desc = (param.description || ' ').replace(/\|/g, '\\|');
            const type = param.type
              .replace(/\|/g, '\\|')
              .replace(/\{/g, '\\{')
              .replace(/\}/g, '\\}');
            return `| \`${param.name}\` | ${type} | ${param.optional ? 'No' : 'Yes'} | ${desc} |`;
          }),
        ].join('\n');

    const returnSection = [
      '#### Returns',
      sig.returnDescription || 'Return value described by the TypeScript signature.',
    ].join('\n\n');

    return `${heading}\n\n\`\`\`ts\n${sig.code}\n\`\`\`\n\n${sig.signatureDescription || ''}\n\n#### Parameters\n\n${parameters}\n\n${returnSection}`.trim();
  });

  return `---
title: ${yamlQuoted(doc.name)}
description: ${yamlQuoted(intro)}
---

{/* AUTO-GENERATED FROM sdks/js/src/index.ts. DO NOT EDIT DIRECTLY. */}

${intro}

${signatureBlocks.join('\n\n')}
`;
}

function buildIndexPage(grouped) {
  const lines = [
    '---',
    'title: SDKs',
    'description: "Complete API surface for @chris-test/fcp"',
    '---',
    '',
    '{/* AUTO-GENERATED. DO NOT EDIT DIRECTLY. */}',
    '',
  ];

  for (const section of SECTION_ORDER) {
    const items = grouped.get(section);
    if (!items || items.length === 0) continue;

    lines.push(`## ${section}`);
    lines.push('');
    for (const item of items) {
      lines.push(`- [\`${item.name}\`](/docs/fcp/sdks/js/${item.slug})`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function buildMeta(grouped) {
  const pages = ['index'];

  for (const section of SECTION_ORDER) {
    const items = grouped.get(section);
    if (!items || items.length === 0) continue;

    pages.push(`--- ${section} ---`);
    for (const item of items) {
      pages.push(item.slug);
    }
  }

  return {
    title: 'SDKs',
    description: 'FCP JavaScript SDK reference',
    root: true,
    pages,
  };
}

async function main() {
  const docs = collectFunctionDocs().sort((a, b) => a.name.localeCompare(b.name));

  await cleanGeneratedFiles(OUTPUT_DIR);

  const grouped = new Map();
  for (const section of SECTION_ORDER) grouped.set(section, []);
  for (const doc of docs) {
    grouped.get(doc.section).push(doc);
    await writeFile(resolve(OUTPUT_DIR, `${doc.slug}.mdx`), buildFunctionPage(doc), 'utf8');
  }

  await writeFile(resolve(OUTPUT_DIR, 'index.mdx'), buildIndexPage(grouped), 'utf8');
  await writeFile(resolve(OUTPUT_DIR, 'meta.json'), `${JSON.stringify(buildMeta(grouped), null, 2)}\n`, 'utf8');

  console.log(`Generated SDK reference pages: ${docs.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
