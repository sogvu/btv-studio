import fs from 'node:fs';
export function json(res, value, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(value));
}
export async function body(req) {
  let data = '';
  for await (const c of req) {
    data += c;
    if (data.length > 2_000_000) throw new Error('Dữ liệu quá lớn.');
  }
  return JSON.parse(data || '{}');
}
export function staticFile(res, file, type) {
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(file).pipe(res);
}
