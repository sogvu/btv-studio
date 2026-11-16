import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let localConfig={};try{localConfig=JSON.parse(fs.readFileSync(path.join(root,'runtime-config.json'),'utf8'));}catch{}
const config={dataDir:process.env.BTV_DATA||localConfig.dataDir||path.join(os.tmpdir(),'btv-tests'),binDir:process.env.BTV_BIN||localConfig.binDir||path.join(root,'bin')};
const dir=path.join(config.dataDir,'integration-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ff=path.join(config.binDir,'ffmpeg.exe'),fp=path.join(config.binDir,'ffprobe.exe');
const execute=(p,args)=>execFileSync(p,args,{windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:60000});
const portrait=path.join(dir,'portrait.mp4'),wide=path.join(dir,'wide.mp4');
execute(ff,['-y','-f','lavfi','-i','color=c=0x52755f:s=360x640:d=1','-c:v','libx264','-pix_fmt','yuv420p',portrait]);
execute(ff,['-y','-f','lavfi','-i','color=c=0x7898b4:s=2560x1440:d=1','-f','lavfi','-i','sine=frequency=440:duration=1','-vf','setsar=16/15','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',wide]);
let fail=true;
const fixture=http.createServer((req,res)=>{
  if(req.url==='/retry.mp4'&&fail){res.writeHead(404);res.end();return;}
  const file=req.url==='/wide.mp4'?wide:portrait;
  res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':fs.statSync(file).size});fs.createReadStream(file).pipe(res);
});
await new Promise(r=>fixture.listen(43191,'127.0.0.1',r));
let log='';const server=spawn(process.execPath,[path.join(root,'app','server.mjs')],{env:{...process.env,BTV_DATA:dir,BTV_PORT:'43190'},windowsHide:true});server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
const base='http://127.0.0.1:43190';let token;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(name,body){const res=await fetch(base+'/api/'+name,{method:body===undefined?'GET':'POST',headers:{'x-btv-token':token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const result=await res.json();if(!res.ok)throw Error(result.error);return result;}
async function waitDone(){for(let i=0;i<240;i++){const s=await api('state');if(!s.busy)return s;await sleep(250);}throw Error('Batch timeout');}
try{
  for(let i=0;i<60;i++){try{const html=await(await fetch(base)).text();token=html.match(/name="btv-token" content="([^"]+)/)[1];break;}catch{await sleep(200);}}
  assert.ok(token,log);
  const unauth=await fetch(base+'/api/state');assert.equal(unauth.status,403);
  const cross=await fetch(base+'/api/save',{method:'POST',headers:{origin:'https://evil.example','x-btv-token':token,'Content-Type':'application/json'},body:'{}'});assert.equal(cross.status,403);
  await api('save',{rows:[{url:'http://127.0.0.1:43191/portrait.mp4',credit:'Nguyễn Văn A • Birds 100% "quote" : test'},{url:'http://127.0.0.1:43191/wide.mp4',credit:'radoslawmosart'},{url:'http://127.0.0.1:43191/retry.mp4',credit:'Nguyễn Văn A • Birds 100% "quote" : test'}],settings:{autoRetry:false,outputDir:path.join(dir,'exports'),workers:2}});
  await api('start',{});let state=await waitDone();
  assert.deepEqual(state.rows.map(r=>r.status),['done','done','error'],JSON.stringify(state.rows));
  const first=state.rows[0].output;const stamp=fs.statSync(first).mtimeMs;
  const inspect=f=>JSON.parse(execute(fp,['-v','error','-show_streams','-show_format','-of','json',f]).toString());
  for(let i=0;i<2;i++){
    const result=inspect(state.rows[i].output),video=result.streams.find(s=>s.codec_type==='video');
    assert.equal(video.width,i===0?360:2560);assert.equal(video.height,i===0?640:1440);assert.equal(video.sample_aspect_ratio,i===0?'1:1':'16:15');assert.ok(Number(result.format.duration)>=0.95);
    assert.equal(result.streams.some(s=>s.codec_type==='audio'),i===1);
  }
  const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  assert.equal(sha(first),sha(portrait),'Downloaded video was altered');
  assert.equal(sha(state.rows[1].output),sha(wide),'Audio/video bytes changed');
  assert.equal(path.basename(state.rows[1].output),'radoslawmosart.mp4');
  assert.ok(!/^001_/.test(path.basename(first)));
  const batchBefore=state.batchId;
  const outputDir=state.settings.outputDir;
  await api('save',{rows:[...state.rows.map((r,i)=>({id:r.id,url:r.url,credit:i===1?'Đổi tên':r.credit})),{url:'bad-link',credit:'Cần sửa'}],settings:{autoRetry:false,workers:3,outputDir}});
  state=await api('state');assert.equal(state.batchId,batchBefore);assert.deepEqual(state.rows.map(r=>r.status),['done','pending','error','invalid']);assert.equal(state.rows[0].output,first);
  fail=false;await api('start',{onlyErrors:true});state=await waitDone();assert.deepEqual(state.rows.map(r=>r.status),['done','pending','done','invalid']);
  await api('save',{rows:state.rows.slice(0,3).map(r=>({id:r.id,url:r.url,credit:r.credit})),settings:{autoRetry:false,workers:3,outputDir}});
  fail=false;await api('start',{});state=await waitDone();assert.ok(state.rows.every(r=>r.status==='done'));assert.equal(fs.statSync(first).mtimeMs,stamp,'Retry overwrote a successful clip');
  assert.equal(path.basename(state.rows[2].output),path.basename(first));assert.notEqual(state.rows[2].output,first);
  assert.equal(sha(state.rows[2].output),sha(portrait));
  const preview=await api('preview',{credit:'Nguyễn Văn A 100%',settings:{autoRetry:false,}});assert.ok(preview.url);assert.equal((await fetch(base+preview.url)).status,200);
  assert.ok(fs.existsSync(path.join(state.batchDir,'bang_nguon.csv')));
  // Stopping a newly started batch must retain a resumable row.
  await api('save',{rows:[{url:'http://127.0.0.1:43191/portrait.mp4',credit:'Dừng và tiếp tục'}],settings:{autoRetry:false,outputDir:path.join(dir,'stop-exports')}});
  await api('start',{});await api('stop',{});state=await waitDone();assert.equal(state.rows[0].status,'stopped');
  await api('start',{});state=await waitDone();assert.equal(state.rows[0].status,'done');
  // A failed automatic batch stays active during backoff and Stop interrupts that wait.
  fail=true;
  await api('save',{rows:[{url:'http://127.0.0.1:43191/retry.mp4',credit:'Tự thử lại'}],settings:{autoRetry:true,outputDir:path.join(dir,'auto-retry')}});
  await api('start',{});
  let waiting;
  for(let i=0;i<120;i++){waiting=await api('state');if(waiting.retryState)break;await sleep(250);}
  assert.ok(waiting.busy);assert.ok(waiting.retryState);assert.equal(waiting.rows[0].status,'error');
  await api('stop',{});state=await waitDone();assert.equal(state.busy,false);
  fail=false;await api('start',{});state=await waitDone();assert.equal(state.rows[0].status,'done');
  console.log(JSON.stringify({passed:true,checks:['HTTP download','parallel queue','original dimensions and SAR','byte-identical video and audio (SHA-256)','source filename without prefix','duplicate names in separate folders','retry without overwrite','stop/resume','CSV report','local API protection'],artifacts:dir},null,2));
}finally{server.kill();fixture.close();}
