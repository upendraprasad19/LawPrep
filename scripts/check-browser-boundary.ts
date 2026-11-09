import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Supabase Auth is the sole approved provider SDK in the browser. Database and
// publishing calls still go through the typed HTTP client and server boundary.
const browserPackages = new Set(['react', 'react-dom', 'react-router-dom', 'zod', '@supabase/supabase-js']);
const nodePackages = new Set(builtinModules.map(name => name.replace(/^node:/, '')));
export async function checkBrowserBoundary(options: { root: string; entries: string[] }): Promise<string[]> {
  const root = resolve(options.root);
  const problems: string[] = [], seen = new Set<string>();
  const configPath = join(root, 'tsconfig.json');
  const config = existsSync(configPath) ? ts.readConfigFile(configPath, ts.sys.readFile) : { config: {} };
  if (config.error) return ['Cannot read TypeScript configuration'];
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const compilerOptions = { ...parsed.options, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext };
  async function walk(file: string) {
    file = resolve(file);
    if (seen.has(file)) return;
    seen.add(file);
    const path = relative(root, file).replaceAll('\\', '/');
    if (path.startsWith('../') || /(^|\/)(packages\/server|apps\/site|content\/imports|content\/editorial|Past_Papers)(\/|$)/.test(path) || path === 'LexCommand.html') { problems.push(`Private, server or external source: ${path}`); return; }
    if (/\.(css|svg|png|webmanifest)$/.test(file)) return;
    const source = await readFile(file, 'utf8');
    if (/\bprocess\s*\.\s*env\b|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/.test(source)) problems.push(`Server environment reference: ${path}`);
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const imports: string[] = [];
    function isImportMeta(node: ts.Node) { return ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword; }
    function containsImportMeta(node: ts.Node): boolean { return isImportMeta(node) || Boolean(ts.forEachChild(node, containsImportMeta)); }
    function visit(node: ts.Node) {
      if (ts.isPropertyAccessExpression(node) && isImportMeta(node.expression) && ['glob', 'globEager'].includes(node.name.text)) problems.push(`Unsupported Vite glob import: ${path}`);
      if (ts.isElementAccessExpression(node) && isImportMeta(node.expression)) problems.push(`Uncheckable import.meta access: ${path}`);
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL' && node.arguments?.some(containsImportMeta)) problems.push(`Unsupported URL asset import: ${path}`);
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
        if (node.expression.kind !== ts.SyntaxKind.ImportKeyword || node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) problems.push(`Uncheckable dynamic import or require: ${path}`);
        else imports.push(node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    for (const specifier of imports) {
      const packageName = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
      if (specifier.startsWith('node:') || nodePackages.has(packageName) || specifier === 'server-only' || specifier === 'next' || specifier.startsWith('next/')) { problems.push(`Prohibited import ${specifier}: ${path}`); continue; }
      if (browserPackages.has(packageName)) continue;
      if (specifier.startsWith('.') && /\.(css|svg|png|webmanifest)$/.test(specifier)) {
        if (!existsSync(resolve(file, '..', specifier))) problems.push(`Missing browser asset ${specifier}: ${path}`);
        continue;
      }
      const dependency = ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule;
      if (!dependency || dependency.resolvedFileName.includes('/node_modules/') || dependency.resolvedFileName.includes('\\node_modules\\')) problems.push(`Unknown browser dependency ${specifier}: ${path}`);
      else await walk(dependency.resolvedFileName);
    }
  }
  for (const entry of options.entries) await walk(join(root, entry));
  return problems;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = await checkBrowserBoundary({ root: process.cwd(), entries: ['apps/learner/src/main.tsx', 'packages/api-client/src/index.ts', 'packages/contracts/src/index.ts'] });
  if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
  else console.log('Browser import boundary checked');
}
