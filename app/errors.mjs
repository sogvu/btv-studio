export function downloadError(value){
  const details=String(value||'Không xác định được lỗi.').replace(/\x1b\[[0-9;]*m/g,'').trim();
  const lines=details.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const errors=lines.filter(s=>/^ERROR(?:\s|:)/i.test(s));
  const primary=(errors.at(-1)||lines.filter(s=>!/^WARNING:|^https?:\/\//i.test(s)).at(-1)||lines.at(-1)||'Lỗi tải video.').replace(/^ERROR:\s*/i,'');
  let hint='';
  if(/no impersonate target|impersonat.*not available/i.test(primary))hint='Bộ tải thiếu thành phần mô phỏng trình duyệt.';
  else if(/fresh cookies|cookies.*needed|login required|sign in|log in|requiring login/i.test(primary))hint='Nguồn yêu cầu cookies mới hoặc đăng nhập.';
  else if(/403|forbidden/i.test(primary))hint='Nguồn từ chối truy cập (HTTP 403).';
  else if(/429|too many requests/i.test(primary))hint='Nguồn giới hạn lượt tải (HTTP 429). Hãy giảm số lượt đồng thời.';
  else if(/404|not found|removed|unavailable|private video/i.test(primary))hint='Video không khả dụng, riêng tư hoặc đã bị gỡ.';
  else if(/timed out|timeout|quá thời gian/i.test(primary))hint='Kết nối nguồn quá thời gian chờ.';
  return {error:(hint?hint+'\n':'')+primary.slice(0,1600),errorDetails:details.slice(-6000)};
}
