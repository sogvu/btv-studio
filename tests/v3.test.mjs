import test from 'node:test';
import assert from 'node:assert/strict';
import {settings} from '../app/core.mjs';
import {supportedWebUrl,isDouyin,douyinCookies,MAX_WEB_ROWS} from '../app/platforms.mjs';
test('v3 allows three workers, rejects unsafe values',()=>{assert.equal(settings({workers:3}).workers,3);assert.throws(()=>settings({workers:4}));assert.throws(()=>settings({workers:0}));assert.equal(MAX_WEB_ROWS,60);});
test('Douyin normal and short links, lookalikes rejected',()=>{for(const u of ['https://www.douyin.com/video/123','https://v.douyin.com/abc/','https://www.iesdouyin.com/share/video/123']){assert.ok(supportedWebUrl(u));assert.ok(isDouyin(u));}for(const u of ['https://douyin.com.evil.test/a','http://127.0.0.1','file:///a','https://user:pass@douyin.com/a'])assert.equal(supportedWebUrl(u),false);});
test('cookies accept Douyin Netscape only',()=>{assert.match(douyinCookies('.douyin.com\tTRUE\t/\tTRUE\t0\ttest\tvalue'),/Netscape/);assert.throws(()=>douyinCookies('.google.com\tTRUE\t/\tTRUE\t0\ttest\tvalue'));assert.throws(()=>douyinCookies('bad'));});
