export function csvReport(rows) {
  const escape = (v) => {
    let s = String(v ?? '');
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    '\uFEFF' +
    [
      ['STT', 'Link video', 'Credit', 'Trang thai', 'File', 'Loi'],
      ...rows.map((r) => [r.index, r.url, r.credit, r.status, r.output || '', r.error || '']),
    ]
      .map((r) => r.map(escape).join(','))
      .join('\r\n')
  );
}
