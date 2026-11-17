export const defaults = { workers: 1, outputDir: '', mode: 'premiere-mp4-v1' };
export function settings(input = {}) {
  const workers = Number(input.workers ?? 1);
  if (!Number.isInteger(workers) || workers < 1 || workers > 3)
    throw new Error('Số video đồng thời từ 1 đến 3.');
  return {
    workers,
    autoRetry: input.autoRetry !== false,
    outputDir: String(input.outputDir || '').trim(),
    mode: 'premiere-mp4-v1',
  };
}
