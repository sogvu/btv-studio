import test from 'node:test';
import assert from 'node:assert/strict';
import { importSheet } from '../app/list-import.mjs';
test('Sheets import retains parser contract and rejects login HTML', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.match(String(url), /format=csv&gid=12/);
      return new Response('Link video,Ten nguon\nhttps://example.com/a.mp4,Nguồn A');
    };
    const result = await importSheet({
      url: 'https://docs.google.com/spreadsheets/d/test/edit#gid=12',
    });
    assert.equal(result.rows[0].credit, 'Nguồn A');
    globalThis.fetch = async () => new Response('<!doctype html><html>login</html>');
    await assert.rejects(
      importSheet({ url: 'https://docs.google.com/spreadsheets/d/test/edit' }),
      /yêu cầu đăng nhập/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
