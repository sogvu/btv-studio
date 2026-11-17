import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_MODE } from './premiere.mjs';
import { csvReport } from './csv-report.mjs';
import { rowsFromText, importSheet } from './list-import.mjs';
import { json, body, staticFile } from './http-utils.mjs';
import { authorizeRequest, authorizeApi } from './security.mjs';
export function createRequestHandler(config, app, getPort) {
  const { CLOUD, DATA, ROOT, TOKEN } = config;
  return async (req, res) => {
    try {
      const host = `127.0.0.1:${getPort()}`;
      if (authorizeRequest(req, res, host, CLOUD) !== true) return;
      const u = new URL(req.url, `http://${host}`);
      if (u.pathname.startsWith('/api/')) {
        if (!authorizeApi(req, res, u, TOKEN)) return;
        if (req.method === 'GET' && u.pathname === '/api/state') return json(res, app.snapshot());
        const state = app.getState();
        if (req.method === 'GET' && u.pathname === '/api/output') {
          const row = state.rows.find((r) => r.id === u.searchParams.get('id'));
          if (!row || row.status !== 'done' || !row.output || !fs.existsSync(row.output))
            throw new Error('Không tìm thấy video đã xuất.');
          if (row.mode !== OUTPUT_MODE)
            throw new Error(
              'File cũ chưa được xuất MP4 cho Premiere. Nhấn Xuất lại danh sách thành MP4 Premiere trước.',
            );
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': fs.statSync(row.output).size,
            'Content-Disposition': `attachment; filename="video${path.extname(row.output)}"; filename*=UTF-8''${encodeURIComponent(path.basename(row.output))}`,
            'Cache-Control': 'no-store',
          });
          return fs.createReadStream(row.output).pipe(res);
        }
        if (req.method === 'GET' && u.pathname === '/api/preview-image' && app.preview.file)
          return staticFile(res, app.preview.file, 'image/png');
        if (req.method === 'GET' && u.pathname === '/api/report') {
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="bang_nguon.csv"',
          });
          return res.end(csvReport(state.rows));
        }
        if (req.method !== 'POST') return json(res, { error: 'Không tìm thấy chức năng.' }, 404);
        const b = await body(req);
        if (u.pathname === '/api/parse') return json(res, { rows: rowsFromText(b.text || '') });
        if (u.pathname === '/api/sheets') {
          return json(res, await importSheet(b));
        }
        if (CLOUD && ['/api/preview', '/api/open-output'].includes(u.pathname))
          throw new Error('Tải file bằng nút Tải video trong danh sách.');
        if (u.pathname === '/api/preview') return json(res, await app.preview.preview(b));
        if (u.pathname === '/api/stop') return json(res, app.stop());
        if (u.pathname === '/api/open-output') return json(res, await app.outputs.open());
        app.assertIdle();
        if (u.pathname === '/api/douyin-cookies') return json(res, app.cookies.update(b));
        if (u.pathname === '/api/save') return json(res, app.saveRows(b));
        if (u.pathname === '/api/start') return json(res, app.start(b));
        return json(res, { error: 'Không tìm thấy chức năng.' }, 404);
      }
      if (req.method !== 'GET') {
        res.writeHead(405);
        return res.end();
      }
      if (u.pathname === '/') {
        const html = fs
          .readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8')
          .replace('__TOKEN__', TOKEN);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
        });
        return res.end(html);
      }
      const files = {
        '/studio.mjs': ['studio.mjs', 'text/javascript; charset=utf-8'],
        '/downloads.mjs': ['downloads.mjs', 'text/javascript; charset=utf-8'],
        '/queue-view.mjs': ['queue-view.mjs', 'text/javascript; charset=utf-8'],
        '/connection.mjs': ['connection.mjs', 'text/javascript; charset=utf-8'],
        '/local-save.mjs': ['local-save.mjs', 'text/javascript; charset=utf-8'],
        '/brand.css': ['brand.css', 'text/css; charset=utf-8'],
        '/style.css': ['style.css', 'text/css; charset=utf-8'],
        '/ui.js': ['ui.js', 'text/javascript; charset=utf-8'],
      };
      if (files[u.pathname])
        return staticFile(
          res,
          path.join(ROOT, 'public', files[u.pathname][0]),
          files[u.pathname][1],
        );
      res.writeHead(404);
      res.end();
    } catch (e) {
      json(res, { error: e.message }, 400);
    }
  };
}
