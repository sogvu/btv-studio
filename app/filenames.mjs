export function safeName(value) {
  return (
    String(value)
      .normalize('NFC')
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/[. ]+$/g, '')
      .slice(0, 80) || 'nguon'
  );
}
