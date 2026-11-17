import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessRunner } from '../app/process-runner.mjs';
test('runner keeps line progress and error diagnostics when moved out of HTTP', async () => {
  const lines = [],
    runner = createProcessRunner({ defaultCwd: process.cwd() });
  const out = await runner.run(process.execPath, ['-e', "process.stdout.write('one\\ntwo\\n')"], {
    onLine: (l) => lines.push(l),
  });
  assert.deepEqual(lines, ['one', 'two']);
  assert.match(out, /two/);
  await assert.rejects(
    runner.run(process.execPath, ['-e', "process.stderr.write('fixture failure');process.exit(2)"]),
    /fixture failure/,
  );
});
test('timeout terminates a child instead of leaving the queue stuck', async () => {
  const runner = createProcessRunner({ defaultCwd: process.cwd() });
  await assert.rejects(
    runner.run(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeout: 50 }),
    /Quá thời gian/,
  );
});
