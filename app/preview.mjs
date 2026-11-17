import fs from 'node:fs';
import path from 'node:path';
export function createPreview({
  DATA,
  font,
  TOKEN,
  getState,
  queue,
  needTools,
  download,
  run,
  exe,
}) {
  let previewBusy = false,
    previewFile = '';
  async function prepare(work, credit) {
    fs.mkdirSync(work, { recursive: true });
    fs.copyFileSync(font, path.join(work, 'font.ttf'));
    fs.writeFileSync(path.join(work, 'credit.txt'), credit, 'utf8');
  }

  async function preview(input) {
    const state = getState();
    needTools();
    if (queue.busy || previewBusy) throw new Error('Hãy chờ tác vụ hiện tại hoàn thành.');
    previewBusy = true;
    queue.resetStop();
    try {
      const credit = String(input.credit || 'radoslawmosart');
      if (credit.length > 180 || /[\r\n\x00-\x1f]/.test(credit))
        throw new Error('Credit không hợp lệ.');
      const work = path.join(DATA, 'preview');
      await prepare(work, credit);
      let source;
      if (input.rowId) {
        const row = state.rows.find((r) => r.id === input.rowId);
        if (!row) throw new Error('Không tìm thấy dòng được chọn.');
        // Use a separate row object so preview never changes the batch's state.
        source = await download({ ...row }, path.join(work, row.id));
      } else {
        source = path.join(work, 'demo.mp4');
        if (!fs.existsSync(source))
          await run(
            exe('ffmpeg'),
            [
              '-hide_banner',
              '-y',
              '-f',
              'lavfi',
              '-i',
              'color=c=0x52755f:s=360x640:d=1',
              '-vf',
              'drawgrid=w=90:h=90:t=1:c=white@0.15',
              '-c:v',
              'libx264',
              '-pix_fmt',
              'yuv420p',
              source,
            ],
            { cwd: work, timeout: 30000 },
          );
      }
      const target = path.join(work, 'preview.png');
      await run(
        exe('ffmpeg'),
        ['-hide_banner', '-y', '-i', source, '-frames:v', '1', '-update', '1', target],
        { cwd: work, timeout: 90000 },
      );
      previewFile = target;
      return { url: '/api/preview-image?token=' + TOKEN + '&t=' + Date.now() };
    } finally {
      previewBusy = false;
    }
  }

  return {
    preview,
    get busy() {
      return previewBusy;
    },
    get file() {
      return previewFile;
    },
  };
}
