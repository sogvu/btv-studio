import test from 'node:test';
import assert from 'node:assert/strict';
import {rowsFromText,validateRows,safeName,sheetExportUrl,settings,csvReport} from '../app/core.mjs';
test('Google Sheets paste with STT and Vietnamese header',()=>{
 const r=rowsFromText('STT\tLink video\tNguồn\r\n1\thttps://example.com/a\tNguyễn Văn A\r\n2\thttps://example.com/b\tBirds');assert.equal(r.length,2);assert.equal(r[0].credit,'Nguyễn Văn A');assert.equal(r[0].status,'pending');
});
test('CSV quoted comma and quotes retain credit exactly',()=>{assert.equal(rowsFromText('Link video,Credit\nhttps://example.com,"Alice, ""Birds"" 100%"')[0].credit,'Alice, "Birds" 100%');});
test('missing credit, invalid protocol and duplicated link are surfaced',()=>{const r=validateRows([{url:'file:///C:/x',credit:'x'},{url:'https://example.com',credit:''},{url:'https://example.com',credit:'A'}]);assert.equal(r[0].status,'invalid');assert.equal(r[1].status,'invalid');assert.ok(r[2].warning);});
test('malformed CSV not silently accepted',()=>assert.throws(()=>rowsFromText('"broken')));
test('Google Sheets host validation and selected tab',()=>{assert.match(sheetExportUrl('https://docs.google.com/spreadsheets/d/abc-123/edit#gid=987'),/gid=987$/);assert.match(sheetExportUrl('https://docs.google.com/spreadsheets/d/abc/edit#gid=7','42'),/gid=42$/);assert.throws(()=>sheetExportUrl('https://evil.test/spreadsheets/d/abc/edit'));assert.throws(()=>sheetExportUrl('https://docs.google.com/spreadsheets/d/e/test'));});
test('worker settings and original mode',()=>{assert.throws(()=>settings({workers:99}));assert.throws(()=>settings({workers:1.5}));assert.equal(settings({width:1920}).mode,'original-best-v2');assert.equal(settings({width:1920}).width,undefined);});
test('safe names prevent traversal and preserve Unicode',()=>{assert.equal(safeName('../Nguyễn/A:*'), '.._Nguyễn_A__');});
test('CSV report guards spreadsheet formulas',()=>{assert.match(csvReport([{index:1,url:'https://example.com',credit:'=cmd()',status:'done'}]),/"'=cmd\(\)"/);});
