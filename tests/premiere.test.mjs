import test from 'node:test';
import assert from 'node:assert/strict';
import {frameRate,premiereArgs,verifyPremiere} from '../app/premiere.mjs';
test('CFR rates match common source rates',()=>{assert.equal(frameRate({avg_frame_rate:'30000/1001'}),'30000/1001');assert.equal(frameRate({avg_frame_rate:'60/1'}),'60');assert.equal(frameRate({avg_frame_rate:'0/0'}),'30');});
test('MP4 command explicitly encodes H264 8bit AAC48k and CFR',()=>{const a=premiereArgs('a.webm','b.mp4',{streams:[{codec_type:'video'}]});for(const x of ['libx264','yuv420p','aac','48000','cfr','+faststart','0:a:0?'])assert.ok(a.includes(x));assert.ok(!a.includes('copy'));});
test('HDR gets tone mapping and incompatible output rejected',()=>{assert.match(premiereArgs('a','b',{streams:[{codec_type:'video',color_transfer:'smpte2084'}]}).join(' '),/tonemap/);assert.throws(()=>verifyPremiere({streams:[{codec_type:'video',codec_name:'vp9',pix_fmt:'yuv420p'}]}));verifyPremiere({streams:[{codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p'}]});});
