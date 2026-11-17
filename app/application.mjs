import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { settings } from './settings.mjs';
import { validateRows } from './list-parser.mjs';
import { OUTPUT_MODE } from './premiere.mjs';
import { MAX_WEB_ROWS, supportedWebUrl } from './platforms.mjs';
import { downloadError } from './errors.mjs';
import { createStateStore } from './state-store.mjs';
import { createProcessRunner } from './process-runner.mjs';
import { createMediaTools } from './media-tools.mjs';
import { createDownloader } from './downloader.mjs';
import { createOutputFiles } from './output-files.mjs';
import { createVideoProcessor } from './video-processor.mjs';
import { createJobQueue } from './job-queue.mjs';
import { createPreview } from './preview.mjs';
import { createCookies } from './cookies.mjs';
export function createApplication(config) {
  const { DATA, CLOUD, COOKIE_FILE, VERSION } = config;
  const store = createStateStore(config);
  let state = store.load(),
    queue;
  const getState = () => state,
    save = () => store.save(state),
    report = () => store.report(state);
  const processes = createProcessRunner({
    defaultCwd: DATA,
    shouldStop: () => queue?.stopped || false,
  });
  const tools = createMediaTools({ ...config, run: processes.run });
  const downloader = createDownloader({ ...config, ...tools, run: processes.run, save });
  const outputs = createOutputFiles({ DATA, getState });
  const processor = createVideoProcessor({
    ...config,
    ...tools,
    ...downloader,
    run: processes.run,
    getState,
    shouldStop: () => queue.stopped,
    save,
    report,
    outputs,
  });
  queue = createJobQueue({ getState, processRow: processor.processRow, save, report });
  const preview = createPreview({
    ...config,
    ...tools,
    ...downloader,
    run: processes.run,
    getState,
    queue,
  });
  const cookies = createCookies(COOKIE_FILE);
  const { needTools } = tools;
  function assertIdle() {
    if (queue.busy || preview.busy)
      throw new Error('Đang xử lý. Hãy dừng hoặc chờ hoàn thành trước khi thay đổi.');
  }
  function saveRows(b) {
    const rows = validateRows(b.rows || []);
    if (CLOUD) {
      if (rows.length > MAX_WEB_ROWS) throw new Error('Bản web tối đa 60 video/lô.');
      for (const r of rows) {
        if (!r.error && !supportedWebUrl(r.url))
          throw new Error(
            'Nguồn chưa hỗ trợ. Hãy dùng YouTube, TikTok, Douyin, Instagram, Facebook, Vimeo hoặc Dailymotion.',
          );
      }
      b.settings = {
        workers: 1,
        autoRetry: b.settings?.autoRetry !== false,
        outputDir: path.join(DATA, 'exports'),
      };
    }
    if (rows.length > 500) throw new Error('Tối đa 500 dòng.');
    const nextSettings = settings(b.settings);
    const previous = new Map(state.rows.map((r) => [r.id, r]));
    const matches = (r, i) => {
      const old = previous.get(b.rows[i]?.id);
      return old && old.url === r.url && old.credit === r.credit;
    };
    const keepBatch =
      state.mode === OUTPUT_MODE &&
      state.batchId &&
      state.settings.outputDir === nextSettings.outputDir &&
      rows.some(matches);
    const nextRows = rows.map((r, i) =>
      keepBatch && matches(r, i)
        ? { ...previous.get(b.rows[i].id), index: r.index, warning: r.warning }
        : r,
    );
    state = {
      rows: nextRows,
      settings: nextSettings,
      mode: OUTPUT_MODE,
      batchId: keepBatch ? state.batchId : '',
      batchDir: keepBatch ? state.batchDir : '',
      running: false,
    };
    save();
    return { ok: true };
  }
  function start(b) {
    const retryErrors = b.onlyErrors === true;
    if (retryErrors && state.mode !== OUTPUT_MODE)
      throw new Error('Lô cũ cần chạy Bắt đầu để xuất lại MP4 cho Premiere.');
    if (retryErrors && !state.rows.some((r) => r.status === 'error'))
      throw new Error('Không có video lỗi để tải lại.');
    needTools();
    if (!state.rows.length) throw new Error('Chưa có danh sách video.');
    state.settings = settings(state.settings);
    if (CLOUD) state.settings.workers = 1;
    if (!retryErrors && state.rows.some((r) => r.status === 'invalid'))
      throw new Error('Sửa hoặc xóa các dòng thiếu/sai thông tin trước khi chạy.');
    if (state.mode !== OUTPUT_MODE) {
      fs.writeFileSync(
        path.join(DATA, 'state-before-original-' + Date.now() + '.json'),
        JSON.stringify(state, null, 2),
      );
      state.rows = validateRows(state.rows);
      state.mode = OUTPUT_MODE;
      state.batchId = '';
      state.batchDir = '';
    }
    if (!state.batchId) {
      state.batchId =
        new Date().toISOString().replace(/[:.]/g, '-') +
        '_' +
        crypto.randomBytes(3).toString('hex');
      const base = state.settings.outputDir || path.join(DATA, 'exports');
      if (!path.isAbsolute(base)) throw new Error('Thư mục lưu phải là đường dẫn tuyệt đối.');
      state.batchDir = path.join(base, 'BTV_' + state.batchId);
      fs.mkdirSync(state.batchDir, { recursive: true });
    }
    const rows = state.rows.filter((r) =>
      retryErrors ? r.status === 'error' : r.status !== 'done',
    );
    if (!rows.length) throw new Error('Tất cả video đã hoàn thành.');
    for (const r of rows) {
      r.status = 'queued';
      r.error = '';
      r.progress = 0;
    }
    queue.start(rows);
    return { ok: true };
  }
  function snapshot() {
    return {
      ...state,
      rows: state.rows.map((r) =>
        r.error ? { ...r, ...downloadError(r.errorDetails || r.error) } : r,
      ),
      busy: queue.busy,
      previewBusy: preview.busy,
      tools: tools.toolsStatus(),
      dataDir: DATA,
      cloud: CLOUD,
      version: VERSION,
      maxWorkers: CLOUD ? 1 : 3,
      retryState: queue.retryState,
      douyinCookies: cookies.exists(),
      notice: queue.notice,
    };
  }
  function stop() {
    queue.cancel();
    processes.cancel();
    return { ok: true };
  }
  function shutdown() {
    queue.cancel();
    processes.kill();
    state.running = false;
    save();
  }
  return {
    getState,
    snapshot,
    assertIdle,
    saveRows,
    start,
    stop,
    shutdown,
    preview,
    cookies,
    outputs,
    get busy() {
      return queue.busy || preview.busy;
    },
  };
}
