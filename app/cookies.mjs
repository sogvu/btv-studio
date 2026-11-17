import fs from 'node:fs';
import { douyinCookies } from './platforms.mjs';
export function createCookies(COOKIE_FILE) {
  return {
    exists: () => fs.existsSync(COOKIE_FILE),
    update(b) {
      if (b.clear) {
        if (fs.existsSync(COOKIE_FILE)) fs.unlinkSync(COOKIE_FILE);
      } else {
        fs.writeFileSync(COOKIE_FILE, douyinCookies(b.text), { mode: 0o600 });
      }
      return { ok: true };
    },
  };
}
