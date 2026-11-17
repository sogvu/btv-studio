import crypto from 'node:crypto';
export function parseDelimited(text) {
  text = String(text).replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = first.includes('\t') ? '\t' : first.includes(';') && !first.includes(',') ? ';' : ',';
  const rows = [];
  let row = [],
    cell = '',
    quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quote || !cell) quote = !quote;
      else cell += c;
    } else if (c === sep && !quote) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quote) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quote) throw new Error('Dữ liệu có dấu ngoặc kép chưa đóng. Hãy kiểm tra file CSV.');
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
export function rowsFromText(text) {
  const raw = parseDelimited(text);
  if (!raw.length) return [];
  const head = raw[0].map(normalize);
  let link = head.findIndex((s) => ['link', 'link video', 'url', 'video url'].includes(s));
  let credit = head.findIndex((s) =>
    ['credit', 'nguon', 'nguon video', 'ten nguon', 'source'].includes(s),
  );
  if (link >= 0 && credit >= 0) raw.shift();
  else {
    link = 0;
    credit = 1;
  }
  if (raw.length > 500) throw new Error('Mỗi lô tối đa 500 dòng.');
  return validateRows(raw.map((r) => ({ url: r[link] || '', credit: r[credit] || '' })));
}
export function validateRows(rows) {
  const seen = new Set();
  return rows.map((r, i) => {
    const url = String(r.url || '').trim(),
      credit = String(r.credit || '').trim();
    let error = '',
      warning = '';
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw Error();
    } catch {
      error = 'Link không hợp lệ (cần http/https).';
    }
    if (!credit) error += ' Thiếu credit.';
    if (credit.length > 180 || /[\r\n\x00-\x1f]/.test(credit))
      error += ' Credit tối đa 180 ký tự, trên một dòng.';
    if (seen.has(url)) warning = 'Link trùng trong danh sách; vẫn xử lý nếu bạn giữ dòng này.';
    seen.add(url);
    return {
      id: crypto.randomUUID(),
      index: i + 1,
      url,
      credit,
      error: error.trim(),
      warning,
      status: error ? 'invalid' : 'pending',
      progress: 0,
    };
  });
}
