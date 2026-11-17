import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
export const VERSION = '3.5.0';
export function loadConfig(ROOT) {
  const CLOUD = process.env.BTV_CLOUD === '1';
  if (CLOUD && !process.env.BTV_PASSWORD) throw new Error('BTV_PASSWORD required');
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.join(ROOT, 'runtime-config.json'), 'utf8'));
  } catch {}
  const DATA =
    process.env.BTV_DATA ||
    config.dataDir ||
    path.join(process.env.LOCALAPPDATA || os.homedir(), 'NoiDungTongHop');
  const BIN = process.env.BTV_BIN || config.binDir || path.join(ROOT, 'bin');
  fs.mkdirSync(DATA, { recursive: true });
  return {
    ROOT,
    DATA,
    BIN,
    CLOUD,
    VERSION,
    COOKIE_FILE: path.join(DATA, 'douyin-cookies.txt'),
    TOKEN: crypto.randomBytes(32).toString('hex'),
    font:
      process.env.BTV_FONT || path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'times.ttf'),
  };
}
