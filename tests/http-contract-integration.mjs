import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'btv-http-contract-')),
  base = 'http://127.0.0.1:43193';
let server, token;
const file = path.join(DATA, 'fixture.mp4');
fs.writeFileSync(file, 'fixture-download-body');
fs.writeFileSync(
  path.join(DATA, 'state.json'),
  JSON.stringify({
    rows: [
      {
        id: 'done',
        status: 'done',
        mode: 'premiere-mp4-v1',
        credit: 'Nguồn A',
        url: 'https://example.com/a.mp4',
        output: file,
      },
      {
        id: 'old',
        status: 'done',
        mode: 'old-mode',
        credit: 'old',
        url: 'https://example.com/old.mp4',
        output: file,
      },
    ],
    settings: { workers: 1, outputDir: path.join(DATA, 'exports') },
  }),
);
async function request(url, body, headers = {}) {
  if (headers.host)
    return new Promise((resolve, reject) => {
      const req = http.get(
        base + url,
        { headers: { host: headers.host, 'x-btv-token': token } },
        (res) => {
          res.resume();
          res.on('end', () => resolve({ status: res.statusCode }));
        },
      );
      req.on('error', reject);
    });
  return fetch(base + url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-btv-token': token, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
try {
  server = spawn(process.execPath, ['app/server.mjs'], {
    env: { ...process.env, BTV_CLOUD: '0', BTV_DATA: DATA, BTV_PORT: '43193', PORT: '43193' },
    windowsHide: true,
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try {
      const html = await (await fetch(base)).text();
      token = html.match(/name="btv-token" content="([^"]+)/)[1];
      break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(token);
  for (const asset of [
    'ui.js',
    'studio.mjs',
    'queue-view.mjs',
    'downloads.mjs',
    'connection.mjs',
    'local-save.mjs',
  ]) {
    const r = await request('/' + asset);
    assert.equal(r.status, 200, asset);
    assert.match(r.headers.get('content-type'), /javascript/);
  }
  assert.equal((await request('/api/state', undefined, { host: 'localhost:43193' })).status, 200);
  assert.equal((await request('/api/state', undefined, { host: 'evil.example' })).status, 403);
  assert.equal((await request('/api/stop', {}, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/api/state', undefined, { 'x-btv-token': 'bad' })).status, 403);
  assert.equal((await request('/config.mjs')).status, 404);
  const output = await request('/api/output?id=done');
  assert.equal(output.status, 200);
  assert.equal(await output.text(), 'fixture-download-body');
  assert.ok(output.headers.get('content-disposition').includes('filename*='));
  assert.equal((await request('/api/output?id=old')).status, 400);
  const report = await request('/api/report');
  assert.equal(report.status, 200);
  assert.match(await report.text(), /Nguồn A/);
  const cookies = '# Netscape HTTP Cookie File\n.douyin.com\tTRUE\t/\tTRUE\t0\ttest\tfixture';
  assert.ok(
    (
      await request('/api/douyin-cookies', {
        text: cookies.replaceAll('\\n', '\n').replaceAll('\\t', '\t'),
      })
    ).ok,
  );
  assert.equal((await (await request('/api/state')).json()).douyinCookies, true);
  assert.ok((await request('/api/douyin-cookies', { clear: true })).ok);
  assert.equal((await (await request('/api/state')).json()).douyinCookies, false);
  assert.equal((await request('/api/stop', {})).status, 200);
  console.log(
    'PASS: browser modules MIME, local hosts/origin/session, output bytes/headers, old output rejection, CSV, cookies and stop endpoint',
  );
} finally {
  if (server) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  fs.rmSync(DATA, { recursive: true, force: true });
}
