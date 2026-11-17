import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { defaults } from './settings.mjs';
import { csvReport } from './csv-report.mjs';
export function createStateStore({ DATA, CLOUD }) {
  const STATE = path.join(DATA, 'state.json');
  function load() {
    let state = {
      rows: [],
      settings: { ...defaults, outputDir: path.join(DATA, 'exports') },
      batchId: '',
      running: false,
    };
    try {
      state = { ...state, ...JSON.parse(fs.readFileSync(STATE, 'utf8')), running: false };
      for (const r of state.rows) {
        if (['downloading', 'checking', 'rendering', 'copying', 'queued'].includes(r.status)) {
          r.status = 'stopped';
          r.error = 'Lượt trước bị gián đoạn. Nhấn Tiếp tục / thử lại.';
          r.progress = 0;
        }
      }
    } catch {}
    if (CLOUD) state.settings.workers = 1;
    return state;
  }
  function save(state) {
    const temporary = STATE + '.' + process.pid + '.' + crypto.randomUUID() + '.tmp';
    try {
      fs.writeFileSync(temporary, JSON.stringify(state, null, 2));
      for (let attempt = 0; ; attempt++) {
        try {
          fs.renameSync(temporary, STATE);
          break;
        } catch (e) {
          if (!['EPERM', 'EACCES', 'EBUSY'].includes(e.code) || attempt >= 5) throw e;
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (attempt + 1));
        }
      }
    } finally {
      try {
        fs.unlinkSync(temporary);
      } catch {}
    }
  }
  function report(state) {
    if (state.batchDir) {
      fs.writeFileSync(path.join(state.batchDir, 'bang_nguon.csv'), csvReport(state.rows));
      fs.writeFileSync(
        path.join(state.batchDir, 'thiet_lap.json'),
        JSON.stringify(state.settings, null, 2),
      );
    }
    save(state);
  }

  return { load, save, report };
}
