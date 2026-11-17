import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { safeName } from './filenames.mjs';
export function createOutputFiles({ DATA, getState }) {
  function destination(row) {
    const state = getState();
    const extension = '.mp4',
      base = safeName(row.credit);
    let target = path.join(state.batchDir, base + extension);
    // Keep the source name exactly. Duplicate source names get their own subfolder.
    if (fs.existsSync(target)) {
      const duplicateDir = path.join(state.batchDir, 'trung-ten', row.id);
      fs.mkdirSync(duplicateDir, { recursive: true });
      target = path.join(duplicateDir, base + extension);
    }
    return target;
  }
  function copy(source, target) {
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
  async function open() {
    const state = getState();
    const folder = path.resolve(
      state.batchDir || state.settings.outputDir || path.join(DATA, 'exports'),
    );
    fs.mkdirSync(folder, { recursive: true });
    await new Promise((resolve, reject) => {
      const child = spawn(
        path.join(process.env.WINDIR || 'C:\\Windows', 'explorer.exe'),
        [folder],
        { windowsHide: false, detached: true, stdio: 'ignore' },
      );
      child.once('error', reject);
      child.once('spawn', () => {
        child.unref();
        resolve();
      });
    });
    return { ok: true, folder };
  }
  function cleanExpired() {
    for (const area of ['exports', 'work']) {
      const base = path.join(DATA, area);
      if (!fs.existsSync(base)) continue;
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        const p = path.join(base, entry.name);
        if (entry.isDirectory() && Date.now() - fs.statSync(p).mtimeMs > 2 * 60 * 60 * 1000)
          fs.rmSync(p, { recursive: true, force: true });
      }
    }
  }
  return { destination, copy, open, cleanExpired };
}
