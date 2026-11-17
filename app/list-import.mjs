import { rowsFromText } from './list-parser.mjs';
import { sheetExportUrl } from './sheets-url.mjs';
export { rowsFromText };
export async function importSheet(b) {
  const link = sheetExportUrl(b.url, b.gid);
  let response;
  try {
    response = await fetch(link, { signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error(
      'Không kết nối được Google Sheets. Kiểm tra Internet hoặc mở lại tool bằng Mo BTV Studio.cmd. Bạn vẫn có thể dán hai cột từ Sheets.',
    );
  }
  if (!response.ok)
    throw new Error(
      'Không đọc được Google Sheets. Với bảng riêng tư, hãy sao chép hai cột Link/Credit và dán vào tool hoặc nhập CSV.',
    );
  const text = await response.text();
  if (/<!doctype html|<html/i.test(text) || text.length > 2_000_000)
    throw new Error(
      'Bảng tính yêu cầu đăng nhập hoặc không trả về CSV. Hãy dùng cách dán hai cột.',
    );

  return { rows: rowsFromText(text) };
}
