export function createQueueView({
  $,
  getState,
  setRows,
  setDirty,
  setEditing,
  drawCompleted,
  session,
  notify,
  action,
}) {
  const labels = {
    pending: 'Chờ xử lý',
    queued: 'Trong hàng đợi',
    invalid: 'Cần sửa',
    downloading: 'Đang tải',
    checking: 'Kiểm tra định dạng',
    rendering: 'Xuất MP4',
    copying: 'Đang lưu',
    done: 'Hoàn thành',
    error: 'Lỗi',
    stopped: 'Đã dừng',
  };

  function lock() {
    const { current, rows, localBusy, disconnected, dirty } = getState();
    const running = current?.busy || current?.previewBusy,
      disabled = localBusy || running || disconnected;
    for (const id of ['parse', 'csv', 'load-sheet', 'add-row', 'start'])
      $('#' + id).disabled = !!disabled;
    for (const el of document.querySelectorAll(
      '.settings input,.settings select,#rows input,#rows .delete',
    ))
      el.disabled = !!disabled;
    if (current?.cloud) {
      $('#output').disabled = true;
      $('#auto-local-save').disabled = false;
    }
    $('#clear-rows').disabled = !!disabled || !rows.length;
    $('#retry-errors').disabled = !!disabled || dirty || !rows.some((r) => r.status === 'error');
    $('#stop').hidden = !running;
    $('#start').hidden = !!current?.busy;
  }

  function draw() {
    const { current, rows, dirty } = getState();
    const body = $('#rows');
    body.replaceChildren();
    $('#empty').hidden = rows.some((r) => r.status !== 'done');
    drawCompleted();
    for (const r of rows.filter((r) => r.status !== 'done')) {
      const tr = document.createElement('tr');
      let td = document.createElement('td');
      td.textContent = r.index;
      tr.append(td);
      for (const key of ['url', 'credit']) {
        td = document.createElement('td');
        const input = document.createElement('input');
        input.value = r[key];
        input.title = r[key];
        input.setAttribute('aria-label', `${key === 'url' ? 'Link' : 'Credit'} dòng ${r.index}`);
        input.onfocus = () => setEditing(true);
        input.onblur = () => setEditing(false);
        input.oninput = () => {
          r[key] = input.value;
          setDirty();
          $('#start').textContent = '▶ Lưu và tiếp tục';
        };
        td.append(input);
        if (key === 'credit' && r.warning) {
          const w = document.createElement('div');
          w.className = 'row-warning';
          w.textContent = r.warning;
          td.append(w);
        }
        tr.append(td);
      }
      td = document.createElement('td');
      const status = document.createElement('span');
      status.className = 'status ' + r.status;
      status.textContent =
        (labels[r.status] || r.status) +
        (r.attempts ? ' · lần ' + r.attempts : '') +
        (['downloading', 'rendering'].includes(r.status) ? ' ' + Math.round(r.progress) + '%' : '');
      td.append(status);
      if (r.status === 'downloading' && r.transfer) {
        const speed = document.createElement('div');
        speed.className = 'transfer-info';
        speed.textContent = r.transfer;
        td.append(speed);
      }
      if (r.status === 'done' && r.output) {
        const download = document.createElement('button');
        download.className = 'text-button';
        download.textContent = '↓ Tải video';
        download.onclick = () =>
          action(async () => {
            const response = await session.fetch('/api/output?id=' + encodeURIComponent(r.id), {});
            if (!response.ok) throw Error('Không đọc được file video.');
            const href = URL.createObjectURL(await response.blob());
            const a = document.createElement('a');
            a.href = href;
            a.download = r.output.split(/[\\/]/).at(-1);
            a.click();
            setTimeout(() => URL.revokeObjectURL(href), 60000);
          });
        td.append(download);
      }
      if (r.error) {
        const error = document.createElement('div');
        error.className = 'row-error main-error';
        error.textContent = r.error;
        td.append(error);
        if (r.errorDetails) {
          const details = document.createElement('details');
          details.className = 'error-details';
          const summary = document.createElement('summary');
          summary.textContent = 'Xem log chi tiết';
          const log = document.createElement('pre');
          log.textContent = r.errorDetails;
          details.append(summary, log);
          td.append(details);
        }
      }
      tr.append(td);
      td = document.createElement('td');
      const remove = document.createElement('button');
      remove.className = 'delete';
      remove.textContent = '×';
      remove.title = 'Xóa dòng';
      remove.onclick = () => {
        const next = rows.filter((x) => x !== r);
        next.forEach((x, i) => (x.index = i + 1));
        setRows(next);
        setDirty();
        draw();
      };
      td.append(remove);
      tr.append(td);
      body.append(tr);
    }
    const done = rows.filter((r) => r.status === 'done').length,
      errors = rows.filter((r) => ['error', 'invalid'].includes(r.status)).length;
    $('#stat-total').textContent = rows.length;
    $('#stat-active').textContent = rows.filter((r) =>
      ['downloading', 'checking', 'copying', 'rendering'].includes(r.status),
    ).length;
    $('#stat-done').textContent = done;
    $('#stat-error').textContent = errors;
    $('#row-count').textContent = rows.length
      ? `${rows.filter((r) => r.status !== 'done').length} video còn chờ / lỗi`
      : 'Chưa có video';
    $('#counts').textContent = `${done} hoàn thành · ${errors} lỗi`;
    const pct = rows.length
      ? Math.round(
          rows.reduce(
            (n, r) =>
              n +
              (r.status === 'done'
                ? 100
                : r.status === 'copying'
                  ? 99
                  : ['downloading', 'rendering'].includes(r.status)
                    ? r.progress
                    : 0),
            0,
          ) / rows.length,
        )
      : 0;
    $('#total-progress').value = pct;
    $('#percent').textContent = pct + '%';
    $('#progress-title').textContent = current?.busy
      ? `Đang xử lý · ${done}/${rows.length} clip`
      : done === rows.length && rows.length
        ? 'Đã hoàn thành lô video'
        : `${done}/${rows.length} clip hoàn thành`;
    $('#start').textContent =
      current?.batchId && current?.mode !== 'premiere-mp4-v1'
        ? '▶ Xuất lại danh sách thành MP4 Premiere'
        : dirty && current?.batchId
          ? '▶ Lưu và tiếp tục'
          : rows.some((r) => ['error', 'stopped', 'done'].includes(r.status))
            ? '▶ Tiếp tục tải video'
            : '↓ Bắt đầu tải video';
    lock();
  }

  return { draw, lock };
}
