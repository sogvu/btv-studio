import test from 'node:test';
import assert from 'node:assert/strict';
import {retryQueue,retryDelay} from '../app/retry.mjs';
test('only failed rows retried until success',async()=>{
 const rows=[{id:1,status:'queued'},{id:2,status:'queued'}],calls=[];
 await retryQueue({rows,workers:2,autoRetry:true,shouldStop:()=>false,wait:async()=>{},processRow:async r=>{calls.push(r.id);r.status=r.id===2&&r.attempts<3?'error':'done';}});
 assert.deepEqual(calls,[1,2,2,2]);assert.equal(rows[0].attempts,1);assert.equal(rows[1].attempts,3);
});
test('stop interrupts waiting; permanent errors do not spin',async()=>{
 let stop=false,waits=0;const rows=[{status:'queued'}];
 await retryQueue({rows,workers:1,autoRetry:true,shouldStop:()=>stop,wait:async()=>{waits++;stop=true;},processRow:async r=>r.status='error'});
 assert.equal(waits,1);assert.equal(rows[0].attempts,1);assert.equal(retryDelay(1),30000);assert.equal(retryDelay(100),300000);
});
test('manual mode completes once',async()=>{const rows=[{status:'queued'}];await retryQueue({rows,workers:1,autoRetry:false,shouldStop:()=>false,wait:async()=>assert.fail(),processRow:async r=>r.status='error'});assert.equal(rows[0].attempts,1);});
