export function sheetExportUrl(value, gid = '') {
  const u = new URL(value);
  if (u.hostname !== 'docs.google.com' || u.protocol !== 'https:')
    throw new Error('Hãy nhập link Google Sheets tại docs.google.com.');
  const m = u.pathname.match(/^\/spreadsheets\/d\/([\w-]+)(?:\/|$)/);
  if (!m || m[1] === 'e') throw new Error('Dùng link bảng tính dạng /spreadsheets/d/ID/edit.');
  const tab = String(
    gid || u.searchParams.get('gid') || new URLSearchParams(u.hash.slice(1)).get('gid') || '0',
  );
  if (!/^\d+$/.test(tab)) throw new Error('Mã tab (gid) phải là số.');
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${tab}`;
}
