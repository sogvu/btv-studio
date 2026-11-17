import { createSessionClient } from './connection.mjs';
import { createDownloads } from './downloads.mjs';
import { createQueueView } from './queue-view.mjs';
export async function startStudio() {
  const $ = (s) => document.querySelector(s),
    token = $('meta[name="btv-token"]').content;
  const session = createSessionClient(token);
  let refreshing = false,
    disconnected = false,
    connectionFailures = 0;

  let current = null,
    rows = [],
    dirty = false,
    localBusy = false,
    editing = false;
  async function api(route, data) {
    const res = await session.fetch('/api/' + route, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        'x-btv-token': token,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw Error(result.error || 'Không thể thực hiện.');
    return result;
  }
  function notify(text, error = false) {
    $('#notice').hidden = !text;
    $('#notice').textContent = text;
    $('#notice').className = error ? 'error' : '';
  }
  async function action(fn) {
    if (localBusy) return;
    localBusy = true;
    lock();
    try {
      await fn();
    } catch (e) {
      notify(e.message, true);
    } finally {
      localBusy = false;
      lock();
    }
  }
  function readSettings() {
    return {
      autoRetry: $('#auto-retry').checked,
      workers: Number($('#workers').value),
      outputDir: $('#output').value,
    };
  }
  function loadSettings(s) {
    $('#auto-retry').checked = s.autoRetry !== false;
    $('#workers').value = s.workers;
    $('#output').value = s.outputDir;
  }
  const downloads = createDownloads({
    $,
    session,
    notify,
    getRows: () => rows,
    isCloud: () => current?.cloud,
  });
  const { drawCompleted, autoSaveCompleted } = downloads;
  const view = createQueueView({
    $,
    getState: () => ({ current, rows, dirty, localBusy, disconnected }),
    setRows: (next) => (rows = next),
    setDirty: () => (dirty = true),
    setEditing: (value) => (editing = value),
    drawCompleted,
    session,
    notify,
    action,
  });
  const { draw, lock } = view;
  downloads.bind();
  async function refresh(initial = false) {
    if (refreshing) return;
    refreshing = true;
    try {
      const s = await api('state'),
        recovered = disconnected;
      disconnected = false;
      connectionFailures = 0;
      current = s;
      if (s.cloud) {
        for (const o of $('#workers').options) o.disabled = Number(o.value) > (s.maxWorkers || 1);
        $('#workers').value = '1';
        $('#output').disabled = true;
        $('#server-output').hidden = true;
        $('#cloud-save').hidden = false;
        $('#open-output').hidden = true;
      }
      if (s.cloud && !s.notice)
        notify(
          'Bản web: tối đa 60 video/lô. Chọn thư mục trên máy để tự lưu khi hoàn thành; giữ tab này mở.',
        );
      if (recovered)
        notify(
          'Đã kết nối lại. ' +
            (!s.busy && s.rows.some((r) => r.status === 'stopped')
              ? 'Nhấn Tiếp tục tải video để chạy các dòng bị gián đoạn.'
              : 'Tiến độ đã được cập nhật.'),
        );
      if ($('#cookie-status'))
        $('#cookie-status').textContent = s.douyinCookies
          ? 'Đã có cookies Douyin trên máy xử lý'
          : 'Chưa nhập cookies Douyin';
      if (initial) {
        rows = s.rows;
        loadSettings(s.settings);
        draw();
        void autoSaveCompleted();
      } else if (!dirty && !editing) {
        rows = s.rows;
        draw();
        void autoSaveCompleted();
      }
      const ready = Object.values(s.tools).every(Boolean);
      $('#engine').textContent = ready ? '● Bộ xử lý sẵn sàng' : '● Cần cài bộ xử lý';
      $('#engine').className = 'badge' + (ready ? '' : ' warn');
      if (s.retryState)
        notify(
          'Còn ' +
            s.retryState.remaining +
            ' video lỗi. Tự thử lại sau ' +
            Math.max(0, Math.ceil((s.retryState.nextAt - Date.now()) / 1000)) +
            ' giây · vòng ' +
            s.retryState.round +
            '. Nhấn Dừng để ngắt.',
        );
      if (s.notice) notify(s.notice, true);
      else if (s.batchId && s.mode !== 'premiere-mp4-v1')
        notify(
          'Các file trong lô cũ chưa được chuyển sang cấu hình Premiere. Nhấn Xuất lại danh sách thành MP4 Premiere để tạo lô MP4 mới.',
        );
      lock();
    } catch (e) {
      disconnected = true;
      connectionFailures++;
      $('#engine').textContent = '● Đang kết nối lại…';
      $('#engine').className = 'badge warn';
      if (initial || connectionFailures >= 3)
        notify(
          'Máy chủ chưa phản hồi. Tool đang tự kết nối lại; giữ tab này mở. ' +
            (e.name === 'TimeoutError' ? 'Yêu cầu quá thời gian chờ.' : e.message),
          true,
        );
      lock();
    } finally {
      refreshing = false;
    }
  }
  async function save() {
    await api('save', {
      rows: rows.map((r) => ({ id: r.id, url: r.url, credit: r.credit })),
      settings: readSettings(),
    });
    dirty = false;
    await refresh(true);
  }
  function replaceRows(next) {
    if (
      rows.length &&
      !confirm('Thay danh sách đang hiển thị bằng danh sách mới? Kết quả đã xuất vẫn được giữ.')
    )
      return;
    rows = next;
    dirty = true;
    draw();
    notify(`Đã đọc ${rows.length} dòng. Kiểm tra tên nguồn trước khi bắt đầu.`);
  }
  $('#parse').onclick = () =>
    action(async () => replaceRows((await api('parse', { text: $('#paste').value })).rows));
  $('#csv').onclick = () => $('#csv-file').click();
  $('#csv-file').onchange = (e) =>
    action(async () => {
      const file = e.target.files[0];
      if (file) replaceRows((await api('parse', { text: await file.text() })).rows);
      e.target.value = '';
    });
  $('#load-sheet').onclick = () =>
    action(async () => {
      notify('Đang đọc Google Sheets…');
      replaceRows((await api('sheets', { url: $('#sheet-url').value, gid: $('#gid').value })).rows);
    });
  for (const tab of document.querySelectorAll('.tab'))
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === tab));
      $('#paste-panel').hidden = tab.dataset.tab !== 'paste';
      $('#sheets-panel').hidden = tab.dataset.tab !== 'sheets';
    };
  $('#clear-rows').onclick = () =>
    action(async () => {
      if (!rows.length || current?.busy) return;
      await api('save', { rows: [], settings: readSettings() });
      dirty = false;
      editing = false;
      await refresh(true);
      notify('Đã xóa danh sách. File video đã tải vẫn được giữ.');
    });
  $('#retry-errors').onclick = () =>
    action(async () => {
      if (!(await downloads.ensureDirectory())) return;
      await api('start', { onlyErrors: true });
      await refresh();
    });
  $('#add-row').onclick = () => {
    rows.push({
      id: crypto.randomUUID(),
      index: rows.length + 1,
      url: '',
      credit: '',
      status: 'pending',
      progress: 0,
    });
    dirty = true;
    draw();
  };
  for (const input of document.querySelectorAll(
    '.settings input:not(#auto-local-save),.settings select',
  ))
    input.addEventListener('change', () => {
      dirty = true;
    });
  $('#start').onclick = () =>
    action(async () => {
      if (!(await downloads.ensureDirectory())) return;
      if (dirty || !current?.batchId) await save();
      await api('start', {});
      notify('Đã bắt đầu. Tiến độ tự cập nhật; các dòng lỗi có thể thử lại sau.');
      await refresh();
    });
  $('#stop').onclick = async () => {
    try {
      await api('stop', {});
      notify('Đang dừng và lưu tiến độ…');
    } catch (e) {
      notify(e.message, true);
    }
  };
  $('#open-output').onclick = () =>
    action(async () => {
      const result = await api('open-output', {});
      notify(
        'Đã gửi yêu cầu mở File Explorer. Nếu cửa sổ chưa hiện, nhấn Windows + E rồi dán đường dẫn này vào thanh địa chỉ:\n' +
          result.folder,
      );
    });
  $('#report').onclick = () =>
    action(async () => {
      const res = await session.fetch('/api/report', { headers: { 'x-btv-token': token } });
      if (!res.ok) throw Error('Không xuất được bảng nguồn.');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bang_nguon.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  $('#douyin-cookie').onchange = (e) =>
    action(async () => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 250000) throw Error('File cookies tối đa 250 KB.');
      await api('douyin-cookies', { text: await file.text() });
      e.target.value = '';
      notify('Đã lưu cookies Douyin trên máy xử lý.');
      await refresh();
    });
  $('#clear-cookie').onclick = () =>
    action(async () => {
      await api('douyin-cookies', { clear: true });
      notify('Đã xóa cookies Douyin.');
      await refresh();
    });
  async function poll() {
    await refresh();
    setTimeout(
      poll,
      disconnected ? Math.min(30000, 3000 * 2 ** Math.min(connectionFailures, 4)) : 3000,
    );
  }
  await refresh(true);
  setTimeout(poll, 3000);
}
