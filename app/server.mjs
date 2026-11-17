import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { createApplication } from './application.mjs';
import { createRequestHandler } from './http-routes.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(ROOT),
  app = createApplication(config);
const server = http.createServer(createRequestHandler(config, app, () => server.address().port));
server.listen(
  Number(process.env.PORT || process.env.BTV_PORT) || 43210,
  config.CLOUD ? '0.0.0.0' : '127.0.0.1',
  () => {
    const url = 'http://127.0.0.1:' + server.address().port;
    console.log('Nội Dung Tổng Hợp: ' + url + '\nDữ liệu: ' + config.DATA);
    fs.writeFileSync(
      path.join(config.DATA, 'server.json'),
      JSON.stringify({ url, pid: process.pid }),
    );
  },
);
if (config.CLOUD)
  setInterval(() => {
    if (!app.busy) app.outputs.cleanExpired();
  }, 60000).unref();
server.on('error', (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
process.on('SIGINT', () => {
  app.shutdown();
  server.close(() => process.exit());
});
