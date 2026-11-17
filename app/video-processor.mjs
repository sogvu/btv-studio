import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  OUTPUT_MODE,
  premiereArgs,
  verifyPremiere,
  originalCandidate,
  constantRateDetected,
  inspectOriginalArgs,
} from './premiere.mjs';
import { cpuThreads } from './performance.mjs';
import { downloadError } from './errors.mjs';
export function createVideoProcessor({
  DATA,
  CLOUD,
  getState,
  shouldStop,
  download,
  probe,
  run,
  exe,
  save,
  report,
  outputs,
}) {
  async function processRow(row) {
    const state = getState();
    const work = path.join(DATA, 'work', state.batchId, row.id);
    let partial = '';
    try {
      if (shouldStop()) return;
      fs.mkdirSync(work, { recursive: true });
      const source = await download(row, work);
      if (shouldStop()) throw new Error('Đã dừng theo yêu cầu.');
      const info = await probe(source);
      const threads = cpuThreads(CLOUD, os.availableParallelism(), state.settings.workers);
      let keepOriginal = false;
      row.status = 'checking';
      row.progress = 0;
      row.error = '';
      save();
      if (originalCandidate(info, source)) {
        try {
          keepOriginal = constantRateDetected(
            await run(exe('ffmpeg'), inspectOriginalArgs(source, threads), {
              cwd: work,
              returnStderr: true,
            }),
          );
        } catch (e) {
          if (shouldStop()) throw e;
        }
      }
      let result = info,
        ready = source;
      if (!keepOriginal) {
        row.status = 'rendering';
        row.progress = 0;
        save();
        partial = path.join(work, 'premiere.partial.mp4');
        const duration = Number(info.format?.duration) || 0;
        await run(
          exe('ffmpeg'),
          premiereArgs(source, partial, info, threads, { lowMemory: CLOUD }),
          {
            cwd: work,
            onLine: (line) => {
              if (line.startsWith('out_time_us=') && duration)
                row.progress = Math.min(
                  99,
                  Math.round((Number(line.split('=')[1]) / 1000000 / duration) * 100),
                );
            },
          },
        );
        result = await probe(partial);
        ready = partial;
      }
      if (shouldStop()) throw Error('Đã dừng theo yêu cầu.');
      verifyPremiere(result);
      const target = outputs.destination(row);
      row.status = 'copying';
      row.progress = 99;
      save();
      outputs.copy(ready, target);
      if (partial) fs.unlinkSync(partial);
      if (CLOUD) fs.rmSync(work, { recursive: true, force: true });
      row.media = result;
      row.mode = OUTPUT_MODE;
      row.processing = keepOriginal ? 'original' : 'transcoded';
      row.output = target;
      row.status = 'done';
      row.progress = 100;
      row.error = '';
      row.errorDetails = '';
    } catch (e) {
      row.status = shouldStop() ? 'stopped' : 'error';
      Object.assign(row, downloadError(e.message));
      row.progress = 0;
      if (partial)
        try {
          fs.unlinkSync(partial);
        } catch {}
    }
    report();
  }

  return { processRow };
}
