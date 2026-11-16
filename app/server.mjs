import {retryQueue} from './retry.mjs';
import {MAX_WEB_ROWS,supportedWebUrl,isDouyin,douyinCookies} from './platforms.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {defaults,settings,rowsFromText,validateRows,sheetExportUrl,safeName,csvReport} from './core.mjs';

const CLOUD=process.env.BTV_CLOUD==='1';
if(CLOUD&&!process.env.BTV_PASSWORD)throw new Error('BTV_PASSWORD required');
const VERSION='3.2.0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let config={};try{config=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime-config.json'),'utf8'));}catch{}
const DATA=process.env.BTV_DATA||config.dataDir||path.join(os.homedir(),'BTV Credit Studio');
const BIN=process.env.BTV_BIN||config.binDir||path.join(ROOT,'bin');
fs.mkdirSync(DATA,{recursive:true});
const COOKIE_FILE=path.join(DATA,'douyin-cookies.txt');
const STATE=path.join(DATA,'state.json');
const font=process.env.BTV_FONT||path.join(process.env.WINDIR||'C:\\Windows','Fonts','times.ttf');
const exe=name=>path.join(BIN,name+(process.platform==='win32'?'.exe':''));
const TOKEN=crypto.randomBytes(32).toString('hex');
let state={rows:[],settings:{...defaults,outputDir:path.join(DATA,'exports')},batchId:'',running:false};
try{state={...state,...JSON.parse(fs.readFileSync(STATE,'utf8')),running:false};for(const r of state.rows){if(['downloading','rendering','copying','queued'].includes(r.status)){r.status='stopped';r.error='Lượt trước bị gián đoạn. Nhấn Tiếp tục / thử lại.';r.progress=0;}}}catch{}
let busy=false,stop=false,previewBusy=false,previewFile='',notice='';
const children=new Set();
let retryState=null,cancelRetryWait=null;
function retryWait(ms){return new Promise(resolve=>{const timer=setTimeout(done,ms);function done(){clearTimeout(timer);cancelRetryWait=null;resolve();}cancelRetryWait=done;});}
function save(){
  const temporary=STATE+'.'+process.pid+'.'+crypto.randomUUID()+'.tmp';
  try{
    fs.writeFileSync(temporary,JSON.stringify(state,null,2));
    for(let attempt=0;;attempt++){
      try{fs.renameSync(temporary,STATE);break;}
      catch(e){
        if(!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt>=5)throw e;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50*(attempt+1));
      }
    }
  }finally{try{fs.unlinkSync(temporary);}catch{}}
}
function report(){if(state.batchDir){fs.writeFileSync(path.join(state.batchDir,'bang_nguon.csv'),csvReport(state.rows));fs.writeFileSync(path.join(state.batchDir,'thiet_lap.json'),JSON.stringify(state.settings,null,2));}save();}
function toolsStatus(){return {ffmpeg:fs.existsSync(exe('ffmpeg')),ffprobe:fs.existsSync(exe('ffprobe')),downloader:fs.existsSync(exe('yt-dlp'))};}
function needTools(){if(Object.values(toolsStatus()).some(v=>!v))throw new Error('Thiếu bộ xử lý. Chạy Cài bộ xử lý.ps1 theo hướng dẫn.');}
function run(command,args,{cwd=DATA,onLine=()=>{},cancellable=true,timeout=0}={}){
  return new Promise((resolve,reject)=>{
    const p=spawn(command,args,{cwd,windowsHide:true,shell:false});if(cancellable)children.add(p);
    let err='',out='',pending='',settled=false;
    const timer=timeout?setTimeout(()=>{p.kill();done(new Error('Quá thời gian xử lý. Hãy thử lại.'));},timeout):null;
    function done(e){if(settled)return;settled=true;if(timer)clearTimeout(timer);children.delete(p);e?reject(e):resolve(out);}
    p.stdout.on('data',b=>{const str=b.toString();out=(out+str).slice(-100000);pending+=str;let n;while((n=pending.indexOf('\n'))>=0){onLine(pending.slice(0,n).trim());pending=pending.slice(n+1);}});
    p.stderr.on('data',b=>{err=(err+b.toString()).slice(-6000);});
    p.on('error',e=>done(e));p.on('close',code=>done(code===0?null:new Error(stop&&cancellable?'Đã dừng theo yêu cầu.':err.trim()||`Bộ xử lý kết thúc với mã ${code}.`)));
  });
}
async function probe(file){const output=await run(exe('ffprobe'),['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],{timeout:30000});const result=JSON.parse(output);if(!result.streams?.some(s=>s.codec_type==='video'))throw new Error('Nguồn không có luồng video.');return result;}
async function prepare(work,credit){fs.mkdirSync(work,{recursive:true});fs.copyFileSync(font,path.join(work,'font.ttf'));fs.writeFileSync(path.join(work,'credit.txt'),credit,'utf8');}
async function download(row,work){
  const sourceDir=path.join(work,'original-best-v2');fs.mkdirSync(sourceDir,{recursive:true});
  const marker=path.join(sourceDir,'download.json');
  try{const cached=JSON.parse(fs.readFileSync(marker,'utf8'));if(cached.url===row.url&&fs.existsSync(cached.file)){await probe(cached.file);return cached.file;}}catch{}
  row.status='downloading';row.progress=0;save();
  const cookieArgs=[];if(isDouyin(row.url)&&fs.existsSync(COOKIE_FILE)){const localCookie=path.join(work,'douyin-cookies.txt');fs.copyFileSync(COOKIE_FILE,localCookie);cookieArgs.push('--cookies',localCookie);}
  const output=await run(exe('yt-dlp'),[...cookieArgs,'--ignore-config','--no-playlist','--no-overwrites','--newline','--progress','--progress-template','download:BTV:%(progress._percent_str)s','--print','after_move:BTVFILE:%(filepath)s','--no-simulate',...(CLOUD?['--max-filesize','200M','--limit-rate','4M']:[]),'--socket-timeout','30','--retries','3','--fragment-retries','3','--ffmpeg-location',BIN,'--js-runtimes',`node:${process.execPath}`,'-f','bv*+ba/b','-o',path.join(sourceDir,'source.%(ext)s'),'--',row.url],{cwd:work,onLine:line=>{if(line.startsWith('BTV:'))row.progress=Math.max(0,Math.min(100,parseFloat(line.slice(4))||0));},timeout:30*60*1000});
  const found=output.split(/\r?\n/).filter(s=>s.startsWith('BTVFILE:')).at(-1)?.slice(8).trim();
  if(!found||!fs.existsSync(found))throw new Error('Không tìm thấy file sau khi tải.');
  const resolved=path.resolve(found);if(!resolved.startsWith(path.resolve(sourceDir)+path.sep))throw new Error('Đường dẫn tải không hợp lệ.');
  await probe(resolved);fs.writeFileSync(marker,JSON.stringify({url:row.url,file:resolved}));return resolved;
}
async function processRow(row){
  const work=path.join(DATA,'work',state.batchId,row.id);
  let partial='';
  try{
    if(stop)return;
    fs.mkdirSync(work,{recursive:true});
    const source=await download(row,work);if(stop)throw new Error('Đã dừng theo yêu cầu.');
    const info=await probe(source);
    row.status='copying';row.progress=99;row.error='';save();
    const extension=path.extname(source),base=safeName(row.credit);
    let target=path.join(state.batchDir,base+extension);
    // Keep the source name exactly. Duplicate source names get their own subfolder.
    if(fs.existsSync(target)){const duplicateDir=path.join(state.batchDir,'trung-ten',row.id);fs.mkdirSync(duplicateDir,{recursive:true});target=path.join(duplicateDir,base+extension);}
    fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
    if(CLOUD)fs.rmSync(work,{recursive:true,force:true});
    row.media=info;row.mode='original-best-v2';
    row.output=target;row.status='done';row.progress=100;row.error='';
  }catch(e){row.status=stop?'stopped':'error';row.error=(isDouyin(row.url)&&/cookies|403|Unable to extract|JSON/i.test(e.message)?'Douyin từ chối truy cập. Thử cookies Douyin mới hoặc dùng bản Windows trên mạng của bạn. Chi tiết: ':'')+e.message.slice(-1800);row.progress=0;if(partial)try{fs.unlinkSync(partial);}catch{}}
  report();
}
async function batch(rows){
  try{await retryQueue({rows,workers:state.settings.workers,autoRetry:state.settings.autoRetry!==false,shouldStop:()=>stop,processRow,wait:retryWait,onRound:()=>{retryState=null;},onWait:({round,delay,remaining})=>{retryState={round,nextAt:Date.now()+delay,remaining};save();}});}
  catch(e){notice='Không thể lưu kết quả: '+e.message;}
  finally{retryState=null;for(const r of rows)if(r.status==='queued'){r.status='stopped';r.error='Chưa xử lý do dừng lô.';}state.running=false;busy=false;try{report();}catch(e){notice=e.message;}}
}
async function preview(input){
  needTools();if(busy||previewBusy)throw new Error('Hãy chờ tác vụ hiện tại hoàn thành.');previewBusy=true;stop=false;
  try{
    const credit=String(input.credit||'radoslawmosart');
    if(credit.length>180||/[\r\n\x00-\x1f]/.test(credit))throw new Error('Credit không hợp lệ.');
    const work=path.join(DATA,'preview');await prepare(work,credit);let source;
    if(input.rowId){
      const row=state.rows.find(r=>r.id===input.rowId);if(!row)throw new Error('Không tìm thấy dòng được chọn.');
      // Use a separate row object so preview never changes the batch's state.
      source=await download({...row},path.join(work,row.id));
    }else{
      source=path.join(work,'demo.mp4');
      if(!fs.existsSync(source))await run(exe('ffmpeg'),['-hide_banner','-y','-f','lavfi','-i','color=c=0x52755f:s=360x640:d=1','-vf','drawgrid=w=90:h=90:t=1:c=white@0.15','-c:v','libx264','-pix_fmt','yuv420p',source],{cwd:work,timeout:30000});
    }
    const target=path.join(work,'preview.png');await run(exe('ffmpeg'),['-hide_banner','-y','-i',source,'-frames:v','1','-update','1',target],{cwd:work,timeout:90000});previewFile=target;
    return {url:'/api/preview-image?token='+TOKEN+'&t='+Date.now()};
  }finally{previewBusy=false;}
}
function json(res,value,code=200){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){let data='';for await(const c of req){data+=c;if(data.length>2_000_000)throw new Error('Dữ liệu quá lớn.');}return JSON.parse(data||'{}');}
function staticFile(res,file,type){if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);}
const server=http.createServer(async(req,res)=>{
  try{
    const host=`127.0.0.1:${server.address().port}`;
    if(CLOUD){
      if(req.url==='/health')return json(res,{ok:true});
      const provided=Buffer.from(req.headers.authorization?.replace(/^Basic /,'')||'','base64').toString();
      const expected='btv:'+process.env.BTV_PASSWORD;
      const a=crypto.createHash('sha256').update(provided).digest(),b=crypto.createHash('sha256').update(expected).digest();
      if(!crypto.timingSafeEqual(a,b)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="BTV Studio"','Cache-Control':'no-store'});return res.end('Login: btv');}
    }
    if(!CLOUD&&(req.headers.host!==host&&req.headers.host!==`localhost:${server.address().port}`))return json(res,{error:'Invalid host'},403);
    if(req.headers.origin&&req.headers.origin!==`${CLOUD?'https':'http'}://${req.headers.host}`)return json(res,{error:'Invalid origin'},403);
    const u=new URL(req.url,`http://${host}`);
    if(u.pathname.startsWith('/api/')){
      if(req.headers['x-btv-token']!==TOKEN&&!(u.pathname==='/api/preview-image'&&u.searchParams.get('token')===TOKEN))return json(res,{error:'Phiên không hợp lệ. Tải lại trang.'},403);
      if(req.method==='GET'&&u.pathname==='/api/state')return json(res,{...state,busy,previewBusy,tools:toolsStatus(),dataDir:DATA,cloud:CLOUD,version:VERSION,retryState,douyinCookies:fs.existsSync(COOKIE_FILE),notice});
      if(req.method==='GET'&&u.pathname==='/api/output'){
        const row=state.rows.find(r=>r.id===u.searchParams.get('id'));
        if(!row||row.status!=='done'||!row.output||!fs.existsSync(row.output))throw new Error('Không tìm thấy video đã xuất.');
        res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':fs.statSync(row.output).size,'Content-Disposition':`attachment; filename="video${path.extname(row.output)}"; filename*=UTF-8''${encodeURIComponent(path.basename(row.output))}`,'Cache-Control':'no-store'});
        return fs.createReadStream(row.output).pipe(res);
      }
      if(req.method==='GET'&&u.pathname==='/api/preview-image'&&previewFile)return staticFile(res,previewFile,'image/png');
      if(req.method==='GET'&&u.pathname==='/api/report'){res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="bang_nguon.csv"'});return res.end(csvReport(state.rows));}
      if(req.method!=='POST')return json(res,{error:'Không tìm thấy chức năng.'},404);
      const b=await body(req);
      if(u.pathname==='/api/parse')return json(res,{rows:rowsFromText(b.text||'')});
      if(u.pathname==='/api/sheets'){
        const link=sheetExportUrl(b.url,b.gid);let response;
        try{response=await fetch(link,{signal:AbortSignal.timeout(30000)});}catch{throw new Error('Không kết nối được Google Sheets. Kiểm tra Internet hoặc mở lại tool bằng Mo BTV Studio.cmd. Bạn vẫn có thể dán hai cột từ Sheets.');}
        if(!response.ok)throw new Error('Không đọc được Google Sheets. Với bảng riêng tư, hãy sao chép hai cột Link/Credit và dán vào tool hoặc nhập CSV.');
        const text=await response.text();if(/<!doctype html|<html/i.test(text)||text.length>2_000_000)throw new Error('Bảng tính yêu cầu đăng nhập hoặc không trả về CSV. Hãy dùng cách dán hai cột.');
        return json(res,{rows:rowsFromText(text)});
      }
      if(CLOUD&&['/api/preview','/api/open-output'].includes(u.pathname))throw new Error('Tải file bằng nút Tải video trong danh sách.');
      if(u.pathname==='/api/preview')return json(res,await preview(b));
      if(u.pathname==='/api/stop'){stop=true;cancelRetryWait?.();for(const p of children){if(process.platform==='win32')spawn('taskkill',['/pid',String(p.pid),'/T','/F'],{windowsHide:true});else p.kill();}return json(res,{ok:true});}
      if(u.pathname==='/api/open-output'){
        const folder=path.resolve(state.batchDir||state.settings.outputDir||path.join(DATA,'exports'));fs.mkdirSync(folder,{recursive:true});
        await new Promise((resolve,reject)=>{
          const child=spawn(path.join(process.env.WINDIR||'C:\\Windows','explorer.exe'),[folder],{windowsHide:false,detached:true,stdio:'ignore'});
          child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});
        });
        return json(res,{ok:true,folder});
      }
      if(busy||previewBusy)throw new Error('Đang xử lý. Hãy dừng hoặc chờ hoàn thành trước khi thay đổi.');
      if(u.pathname==='/api/douyin-cookies'){if(b.clear){if(fs.existsSync(COOKIE_FILE))fs.unlinkSync(COOKIE_FILE);}else{fs.writeFileSync(COOKIE_FILE,douyinCookies(b.text),{mode:0o600});}return json(res,{ok:true});}
      if(u.pathname==='/api/save'){
        const rows=validateRows(b.rows||[]);if(CLOUD){if(rows.length>MAX_WEB_ROWS)throw new Error('Bản web tối đa 60 video/lô.');for(const r of rows){if(!r.error&&!supportedWebUrl(r.url))throw new Error('Nguồn chưa hỗ trợ. Hãy dùng YouTube, TikTok, Douyin, Instagram, Facebook, Vimeo hoặc Dailymotion.');}b.settings={workers:b.settings?.workers??1,autoRetry:b.settings?.autoRetry!==false,outputDir:path.join(DATA,'exports')};}
        if(rows.length>500)throw new Error('Tối đa 500 dòng.');
        const nextSettings=settings(b.settings);
        const previous=new Map(state.rows.map(r=>[r.id,r]));
        const matches=(r,i)=>{const old=previous.get(b.rows[i]?.id);return old&&old.url===r.url&&old.credit===r.credit;};
        const keepBatch=state.mode==='original-best-v2'&&state.batchId&&state.settings.outputDir===nextSettings.outputDir&&rows.some(matches);
        const nextRows=rows.map((r,i)=>keepBatch&&matches(r,i)?{...previous.get(b.rows[i].id),index:r.index,warning:r.warning}:r);
        state={rows:nextRows,settings:nextSettings,mode:'original-best-v2',batchId:keepBatch?state.batchId:'',batchDir:keepBatch?state.batchDir:'',running:false};save();return json(res,{ok:true});
      }
      if(u.pathname==='/api/start'){
        const retryErrors=b.onlyErrors===true;
        if(retryErrors&&state.mode!=='original-best-v2')throw new Error('Lô cũ cần chuyển sang bản nguyên gốc trước.');
        if(retryErrors&&!state.rows.some(r=>r.status==='error'))throw new Error('Không có video lỗi để tải lại.');
        needTools();if(!state.rows.length)throw new Error('Chưa có danh sách video.');
        state.settings=settings(state.settings);
        if(!retryErrors&&state.rows.some(r=>r.status==='invalid'))throw new Error('Sửa hoặc xóa các dòng thiếu/sai thông tin trước khi chạy.');
        if(state.mode!=='original-best-v2'){
          fs.writeFileSync(path.join(DATA,'state-before-original-'+Date.now()+'.json'),JSON.stringify(state,null,2));
          state.rows=validateRows(state.rows);state.mode='original-best-v2';state.batchId='';state.batchDir='';
        }
        if(!state.batchId){
          state.batchId=new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(3).toString('hex');
          const base=state.settings.outputDir||path.join(DATA,'exports');if(!path.isAbsolute(base))throw new Error('Thư mục lưu phải là đường dẫn tuyệt đối.');
          state.batchDir=path.join(base,'BTV_'+state.batchId);fs.mkdirSync(state.batchDir,{recursive:true});
        }
        const rows=state.rows.filter(r=>retryErrors?r.status==='error':r.status!=='done');if(!rows.length)throw new Error('Tất cả video đã hoàn thành.');
        for(const r of rows){r.status='queued';r.error='';r.progress=0;}
        stop=false;notice='';report();busy=true;state.running=true;void batch(rows);return json(res,{ok:true});
      }
      return json(res,{error:'Không tìm thấy chức năng.'},404);
    }
    if(req.method!=='GET'){res.writeHead(405);return res.end();}
    if(u.pathname==='/'){
      const html=fs.readFileSync(path.join(ROOT,'public','index.html'),'utf8').replace('__TOKEN__',TOKEN);
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"});return res.end(html);
    }
    const files={'/style.css':['style.css','text/css; charset=utf-8'],'/ui.js':['ui.js','text/javascript; charset=utf-8']};
    if(files[u.pathname])return staticFile(res,path.join(ROOT,'public',files[u.pathname][0]),files[u.pathname][1]);
    res.writeHead(404);res.end();
  }catch(e){json(res,{error:e.message},400);}
});
server.listen(Number(process.env.PORT||process.env.BTV_PORT)||43189,CLOUD?'0.0.0.0':'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${server.address().port}`;console.log(`BTV Credit Studio: ${url}\nDữ liệu: ${DATA}`);
  fs.writeFileSync(path.join(DATA,'server.json'),JSON.stringify({url,pid:process.pid}));
});
if(CLOUD)setInterval(()=>{if(busy||previewBusy)return;for(const area of ['exports','work']){const base=path.join(DATA,area);if(!fs.existsSync(base))continue;for(const entry of fs.readdirSync(base,{withFileTypes:true})){const p=path.join(base,entry.name);if(entry.isDirectory()&&Date.now()-fs.statSync(p).mtimeMs>2*60*60*1000)fs.rmSync(p,{recursive:true,force:true});}}},60000).unref();
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
process.on('SIGINT',()=>{stop=true;for(const p of children)p.kill();state.running=false;save();server.close(()=>process.exit());});
