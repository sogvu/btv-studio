import fs from 'node:fs';
import path from 'node:path';
export function createMediaTools({ BIN, run }) {
  const exe = (name) => path.join(BIN, name + (process.platform === 'win32' ? '.exe' : ''));
  function toolsStatus() {
    return {
      ffmpeg: fs.existsSync(exe('ffmpeg')),
      ffprobe: fs.existsSync(exe('ffprobe')),
      downloader: fs.existsSync(exe('yt-dlp')),
    };
  }
  function needTools() {
    if (Object.values(toolsStatus()).some((v) => !v))
      throw new Error('Thiếu bộ xử lý. Chạy Cài bộ xử lý.ps1 theo hướng dẫn.');
  }

  async function probe(file) {
    const output = await run(
      exe('ffprobe'),
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration,format_name:format_tags=major_brand:stream=codec_type,codec_name,width,height,pix_fmt,sample_rate,avg_frame_rate,r_frame_rate,color_transfer,sample_aspect_ratio',
        '-of',
        'json',
        file,
      ],
      { timeout: 30000 },
    );
    const result = JSON.parse(output);
    if (!result.streams?.some((s) => s.codec_type === 'video'))
      throw new Error('Nguồn không có luồng video.');
    return result;
  }

  return { exe, toolsStatus, needTools, probe };
}
