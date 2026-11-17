import crypto from 'node:crypto';
import { json } from './http-utils.mjs';
export function authorizeRequest(req, res, host, CLOUD) {
  if (CLOUD) {
    if (req.url === '/health') return json(res, { ok: true });
    const provided = Buffer.from(
      req.headers.authorization?.replace(/^Basic /, '') || '',
      'base64',
    ).toString();
    const expected = 'btv:' + process.env.BTV_PASSWORD;
    const a = crypto.createHash('sha256').update(provided).digest(),
      b = crypto.createHash('sha256').update(expected).digest();
    if (!crypto.timingSafeEqual(a, b)) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="BTV Studio"',
        'Cache-Control': 'no-store',
      });
      return res.end('Login: btv');
    }
  }
  if (
    !CLOUD &&
    req.headers.host !== host &&
    req.headers.host !== host.replace('127.0.0.1:', 'localhost:')
  )
    return json(res, { error: 'Invalid host' }, 403);
  if (
    req.headers.origin &&
    req.headers.origin !== `${CLOUD ? 'https' : 'http'}://${req.headers.host}`
  )
    return json(res, { error: 'Invalid origin' }, 403);

  return true;
}
export function authorizeApi(req, res, u, TOKEN) {
  if (
    req.headers['x-btv-token'] !== TOKEN &&
    !(u.pathname === '/api/preview-image' && u.searchParams.get('token') === TOKEN)
  ) {
    json(res, { error: 'Phiên không hợp lệ. Đang kết nối lại.', code: 'SESSION_EXPIRED' }, 403);
    return false;
  }
  return true;
}
