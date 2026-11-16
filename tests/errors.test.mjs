import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadError} from '../app/errors.mjs';
test('real error precedes impersonation warning',()=>{
 const result=downloadError('WARNING: [TikTok] no impersonate target is available\nhttps://github.com/yt-dlp/yt-dlp\nERROR: [TikTok] id: HTTP Error 403: Forbidden');
 assert.match(result.error,/403/);assert.doesNotMatch(result.error,/no impersonate target/);assert.match(result.errorDetails,/WARNING/);
});
test('cookie error is identified with full diagnostics preserved',()=>{const e=downloadError('WARNING: warning\nERROR: Fresh cookies are needed');assert.match(e.error,/cookies mới/);assert.match(e.errorDetails,/Fresh cookies/);});
test('timeouts and plain OS failures remain readable',()=>{assert.match(downloadError('ERROR: request timed out').error,/thời gian/);assert.equal(downloadError('ENOSPC: no space left').error,'ENOSPC: no space left');});
