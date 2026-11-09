import ts from 'typescript';
import { createHash } from 'node:crypto';
import { ImportBatchSchema, type ImportBatch, type ImportRecord } from '../packages/contracts/src/content.ts';

function literal(node: ts.Expression, depth = 0): unknown {
  if (depth > 100) throw new Error('Unsupported literal nesting');
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(value => literal(value as ts.Expression, depth + 1));
  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, unknown> = Object.create(null);
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name))) throw new Error('Unsupported object property');
      const key = property.name.text;
      if (Object.hasOwn(result, key)) throw new Error('Unsupported duplicate object key');
      result[key] = literal(property.initializer, depth + 1);
    }
    return result;
  }
  throw new Error(`Unsupported executable or non-literal initializer (${ts.SyntaxKind[node.kind]})`);
}
export function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
const kinds: Record<string, ImportRecord['kind']> = { questions: 'question', lessons: 'lesson', curriculum: 'curriculum', decks: 'deck', blueprints: 'blueprint' };
export function extractLegacy(html: string): ImportBatch {
  const records: ImportRecord[] = [], errors: string[] = [];
  const counts = { question: 0, lesson: 0, curriculum: 0, deck: 0, blueprint: 0 };
  const initializers = new Map<string, ts.Expression[]>();
  // Parse inline scripts as syntax only. Never evaluate the prototype or its expressions.
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const diagnostics = ts.transpileModule(script[1], { fileName: 'legacy.js', reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext } }).diagnostics ?? [];
    if (diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) { errors.push('Unsupported script syntax; no records recovered from this script'); continue; }
    const tree = ts.createSourceFile('legacy.js', script[1], ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const statement of tree.statements) if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && ['BANK', 'DECKS', 'BLUEPRINTS'].includes(declaration.name.text) && declaration.initializer) {
          const values = initializers.get(declaration.name.text) ?? [];
          values.push(declaration.initializer); initializers.set(declaration.name.text, values);
        }
      }
    }
  }
  const banks = initializers.get('BANK') ?? [];
  if (banks.length !== 1) errors.push('Expected exactly one BANK initializer');
  function add(sourceKey: string, kind: ImportRecord['kind'], values: unknown) {
    if (!Array.isArray(values)) { errors.push(`Unsupported ${sourceKey}: expected an array`); return; }
    for (const [sourceIndex, payload] of values.entries()) {
      const value = object(payload), issues: string[] = [];
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) issues.push('unsupported-record-shape');
      if (kind === 'question') {
        if (!Array.isArray(value.opts) || value.opts.length < 2 || value.opts.some(option => typeof option !== 'string')) issues.push('invalid-options');
        if (!Number.isInteger(value.ans) || !Array.isArray(value.opts) || Number(value.ans) < 0 || Number(value.ans) >= value.opts.length) issues.push('invalid-answer-index');
        if (typeof value.q !== 'string' || !value.q.trim()) issues.push('missing-question');
        if (typeof value.expl !== 'string' || !value.expl.trim()) issues.push('missing-explanation');
      }
      records.push({ kind, sourceKey, sourceIndex, originalId: typeof value.id === 'string' ? value.id : null, status: 'draft', payload, issues });
      counts[kind]++;
    }
  }
  if (banks.length === 1) try {
    const bank = literal(banks[0]);
    if (!bank || typeof bank !== 'object' || Array.isArray(bank)) errors.push('Unsupported BANK shape');
    else for (const [key, values] of Object.entries(bank)) {
      if (Object.hasOwn(kinds, key)) add(`BANK.${key}`, kinds[key], values);
      else errors.push(`Unsupported BANK field: ${key}`);
    }
  } catch (error) { errors.push(error instanceof Error ? error.message : 'Unsupported BANK initializer'); }
  for (const [key, kind] of [['DECKS', 'deck'], ['BLUEPRINTS', 'blueprint']] as const) {
    const values = initializers.get(key);
    if (!values) continue;
    if (values.length !== 1) { errors.push(`Expected exactly one ${key} initializer`); continue; }
    try {
      const data = literal(values[0]);
      if (!Array.isArray(data) && (!data || typeof data !== 'object')) throw new Error('Unsupported container: expected an array or object');
      add(key, kind, Array.isArray(data) ? data : Object.entries(object(data)).map(([id, payload]) => ({ id, payload })));
    } catch (error) { errors.push(`${key}: ${error instanceof Error ? error.message : 'Unsupported structure'}`); }
  }
  return ImportBatchSchema.parse({ formatVersion: 1, sourceHash: createHash('sha256').update(html).digest('hex'), records, errors, counts });
}
