import fs from 'node:fs';
import path from 'node:path';
import { DOWNLOAD_POLICY, SOURCE_FORMAT } from './formats.mjs';
import { downloadTuning } from './performance.mjs';
import { isDouyin } from './platforms.mjs';
export function createDownloader({ BIN, CLOUD, COOKIE_FILE, run, probe, save, exe }) {
  async function download(row, work) {
    const sourceDir = path.join(work, DOWNLOAD_POLICY);
    fs.mkdirSync(sourceDir, { recursive: true });
    const marker = path.join(sourceDir, 'download.json');
    try {
      const cached = JSON.parse(fs.readFileSync(marker, 'utf8'));
      if (
        cached.policy === DOWNLOAD_POLICY &&
        cached.url === row.url &&
        fs.existsSync(cached.file)
      ) {
        await probe(cached.file);
        return cached.file;
      }
    } catch {}
    row.status = 'downloading';
    row.progress = 0;
    save();
    const cookieArgs = [];
    if (isDouyin(row.url) && fs.existsSync(COOKIE_FILE)) {
      const localCookie = path.join(work, 'douyin-cookies.txt');
      fs.copyFileSync(COOKIE_FILE, localCookie);
      cookieArgs.push('--cookies', localCookie);
    }
    const output = await run(
      exe('yt-dlp'),
      [
        ...cookieArgs,
        '--ignore-config',
        '--no-playlist',
        '--no-overwrites',
        '--newline',
        '--progress',
        '--progress-template',
        'download:BTV:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s',
        '--print',
        'after_move:BTVFILE:%(filepath)s',
        '--no-simulate',
        ...downloadTuning(CLOUD),
        '--socket-timeout',
        '30',
        '--retries',
        '3',
        '--fragment-retries',
        '3',
        '--ffmpeg-location',
        BIN,
        '--js-runtimes',
        `node:${process.execPath}`,
        '-f',
        SOURCE_FORMAT,
        '-o',
        path.join(sourceDir, 'source.%(ext)s'),
        '--',
        row.url,
      ],
      {
        cwd: work,
        onLine: (line) => {
          if (line.startsWith('BTV:')) {
            const [percent, speed, eta] = line.slice(4).split('|');
            row.progress = Math.max(0, Math.min(100, parseFloat(percent) || 0));
            row.transfer = [speed, eta && 'còn ' + eta]
              .filter((x) => x && !x.includes('Unknown') && !x.includes('N/A'))
              .join(' · ');
          }
        },
        timeout: 30 * 60 * 1000,
      },
    );
    const found = output
      .split(/\r?\n/)
      .filter((s) => s.startsWith('BTVFILE:'))
      .at(-1)
      ?.slice(8)
      .trim();
    if (!found || !fs.existsSync(found)) throw new Error('Không tìm thấy file sau khi tải.');
    const resolved = path.resolve(found);
    if (!resolved.startsWith(path.resolve(sourceDir) + path.sep))
      throw new Error('Đường dẫn tải không hợp lệ.');
    await probe(resolved);
    fs.writeFileSync(
      marker,
      JSON.stringify({ policy: DOWNLOAD_POLICY, url: row.url, file: resolved }),
    );
    return resolved;
  }

  return { download };
}
