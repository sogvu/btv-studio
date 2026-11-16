import test from 'node:test';
import assert from 'node:assert/strict';
import {outputName,saveVideoToDirectory} from '../public/local-save.mjs';
function directory(name='root'){
 const files=new Map(),dirs=new Map();
 return {name,files,dirs,async getFileHandle(n,options={}){
   if(!files.has(n)){if(!options.create)throw Object.assign(Error('missing'),{name:'NotFoundError'});files.set(n,[]);}
   return {async createWritable(){const chunks=[];return new WritableStream({write(c){chunks.push(...c);},close(){files.set(n,chunks);}});}};
 },async getDirectoryHandle(n){if(!dirs.has(n))dirs.set(n,directory(n));return dirs.get(n);}};
}
const row={id:'clip-id',output:'C:\\exports\\Nguồn.mp4'};
test('streams original bytes into selected folder',async()=>{const dir=directory();await saveVideoToDirectory(dir,row,new Response(new Uint8Array([1,2,3])));assert.deepEqual(dir.files.get('Nguồn.mp4'),[1,2,3]);assert.equal(outputName(row),'Nguồn.mp4');});
test('duplicate name preserves existing file and original filename',async()=>{const dir=directory();dir.files.set('Nguồn.mp4',[9]);await saveVideoToDirectory(dir,row,new Response('new'));assert.deepEqual(dir.files.get('Nguồn.mp4'),[9]);assert.ok(dir.dirs.get('trung-ten').dirs.get('clip-id').files.has('Nguồn.mp4'));});
test('server error does not create files or report success',async()=>{const dir=directory();await assert.rejects(saveVideoToDirectory(dir,row,new Response('missing',{status:404})));assert.equal(dir.files.size,0);});
