export const MAX_WEB_ROWS=60;
export function supportedWebUrl(value){
  try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&/(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|vimeo\.com|dailymotion\.com|douyin\.com|iesdouyin\.com)$/.test(u.hostname);}catch{return false;}
}
export function isDouyin(value){try{return /(^|\.)(douyin\.com|iesdouyin\.com)$/.test(new URL(value).hostname);}catch{return false;}}
export function douyinCookies(text){
  if(typeof text!=='string'||text.length>250000)throw Error('File cookies quá lớn.');
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
  const valid=lines.filter(l=>l.trim()&&(!l.startsWith('#')||l.startsWith('#HttpOnly_'))).map(l=>{
    const parts=l.replace(/^#HttpOnly_/,'').split('\t');
    if(parts.length!==7||!/(^|\.)(douyin\.com|iesdouyin\.com)$/.test(parts[0].replace(/^\./,'')))throw Error('Chỉ nhận cookies Netscape của Douyin. Không nhập cookies của trang khác.');
    return l;
  });
  if(!valid.length)throw Error('File không có cookies Douyin hợp lệ.');
  return '# Netscape HTTP Cookie File\n'+valid.join('\n')+'\n';
}
