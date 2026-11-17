import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = ['app', 'public'].flatMap((dir) =>
  fs
    .readdirSync(path.join(root, dir))
    .filter((f) => /\.(mjs|js)$/.test(f))
    .map((f) => dir + '/' + f),
);
const dependencies = new Map(
  modules.map((name) => {
    const source = fs.readFileSync(path.join(root, name), 'utf8'),
      imports = [
        ...source.matchAll(
          /\b(?:import|export)\s+(?:[^;'" ]*|[^;'" ]*[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]/g,
        ),
      ].map((m) => m[1]);
    return [name, imports];
  }),
);
test('modules resolve without import cycles or imports of the server entry point', () => {
  const done = new Set(),
    active = new Set();
  function visit(name) {
    assert.ok(!active.has(name), 'Import cycle at ' + name);
    if (done.has(name)) return;
    active.add(name);
    for (const spec of dependencies.get(name) || []) {
      if (!spec.startsWith('.')) continue;
      const dep = path
        .relative(root, path.resolve(root, path.dirname(name), spec))
        .replaceAll('\\', '/');
      assert.ok(dependencies.has(dep), 'Missing module ' + dep);
      assert.notEqual(dep, 'app/server.mjs', 'Modules must not start the HTTP server');
      visit(dep);
    }
    active.delete(name);
    done.add(name);
  }
  for (const name of modules) visit(name);
});
test('browser modules cannot import Node or backend modules', () => {
  for (const [name, deps] of dependencies)
    if (name.startsWith('public/'))
      for (const dep of deps) {
        assert.ok(!dep.startsWith('node:'), name + ' imports Node');
        assert.ok(!dep.includes('/app/'), name + ' imports backend');
      }
});
test('policy modules stay independent of file IO, HTTP and subprocesses', () => {
  for (const name of [
    'settings',
    'list-parser',
    'filenames',
    'sheets-url',
    'csv-report',
    'formats',
    'premiere',
    'performance',
    'retry',
    'errors',
  ])
    for (const dep of dependencies.get('app/' + name + '.mjs') || [])
      assert.ok(
        !/^node:(fs|http|https|child_process)/.test(dep),
        name + ' has infrastructure dependency ' + dep,
      );
});
