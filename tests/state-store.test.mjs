import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createStateStore } from '../app/state-store.mjs';
test('state recovery stops unfinished work but preserves completed outputs and settings', () => {
  const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'btv-state-'));
  try {
    const store = createStateStore({ DATA, CLOUD: false }),
      state = store.load();
    state.settings.workers = 3;
    state.rows = [
      { id: 'ok', status: 'done', output: 'keep.mp4' },
      { id: 'checking', status: 'checking', progress: 25 },
      { id: 'bad', status: 'error', error: 'keep error' },
    ];
    state.running = true;
    store.save(state);
    const loaded = store.load();
    assert.equal(loaded.running, false);
    assert.equal(loaded.settings.workers, 3);
    assert.deepEqual(
      loaded.rows.map((r) => r.status),
      ['done', 'stopped', 'error'],
    );
    assert.equal(loaded.rows[0].output, 'keep.mp4');
    assert.equal(loaded.rows[2].error, 'keep error');
    assert.ok(!fs.readdirSync(DATA).some((n) => n.endsWith('.tmp')));
    assert.equal(createStateStore({ DATA, CLOUD: true }).load().settings.workers, 1);
  } finally {
    fs.rmSync(DATA, { recursive: true, force: true });
  }
});
