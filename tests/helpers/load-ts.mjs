/**
 * Carga modulos TypeScript de src/lib en los tests standalone (sin dependencias nuevas):
 * los transpila en memoria con el compilador del proyecto y reescribe los imports relativos.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @param {string[]} files rutas relativas a la raiz, p. ej. ['src/lib/constants.ts'] */
export async function loadTsModules(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ceibo-ts-'));
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    let { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    });
    outputText = outputText.replace(/from '\.\/([\w-]+)'/g, "from './$1.mjs'");
    fs.writeFileSync(path.join(dir, path.basename(file, '.ts') + '.mjs'), outputText);
  }
  const modules = {};
  for (const file of files) {
    const name = path.basename(file, '.ts');
    modules[name] = await import(pathToFileURL(path.join(dir, name + '.mjs')).href);
  }
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  return { modules, cleanup };
}
