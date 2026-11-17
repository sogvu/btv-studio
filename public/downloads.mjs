import { saveVideoToDirectory, outputName } from './local-save.mjs';
export function createDownloads({ $, session, notify, getRows, isCloud }) {
  let localDirectory = null,
    localSaving = false;
  const locallySaved = new Set(),
    localFailures = new Map();
  function drawCompleted() {
    const done = getRows().filter((r) => r.status === 'done');
    $('#completed-count').textContent = done.length;
    const list = $('#completed-list');
    list.replaceChildren();
    for (const r of done) {
      const a = document.createElement('button');
      a.className = 'secondary small';
      a.textContent =
        (locallySaved.has(r.id) ? '✓ Đã lưu · ' : '↓ ') +
        r.credit +
        (r.processing === 'original'
          ? ' · Giữ nguyên file'
          : r.processing === 'transcoded'
            ? ' · Đã chuẩn hóa'
            : '');
      a.onclick = () => downloadCompleted(r);
      list.append(a);
    }
  }
  async function downloadCompleted(r) {
    try {
      if (localDirectory) {
        if (localSaving) throw Error('Đang lưu video, hãy chờ hoàn tất.');
        localSaving = true;
        $('#choose-local-folder').disabled = true;
        try {
          localFailures.delete(r.id);
          await saveLocalRow(r, localDirectory);
          drawCompleted();
        } finally {
          localSaving = false;
          $('#choose-local-folder').disabled = false;
        }
        return;
      }
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: outputName(r) });
        const response = await session.fetch('/api/output?id=' + encodeURIComponent(r.id), {});
        if (!response.ok) throw Error('File tạm không còn trên máy chủ.');
        await response.body.pipeTo(await handle.createWritable());
        locallySaved.add(r.id);
        drawCompleted();
        return;
      }
      const res = await session.fetch('/api/output?id=' + encodeURIComponent(r.id), {});
      if (!res.ok) throw Error('File không còn trên máy chủ.');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = r.output.split(/[\\/]/).at(-1);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (e.name !== 'AbortError') notify(e.message, true);
    }
  }
  async function saveLocalRow(row, dir) {
    const response = await session.fetch('/api/output?id=' + encodeURIComponent(row.id), {});
    $('#local-save-status').textContent = 'Đang lưu: ' + outputName(row);
    await saveVideoToDirectory(dir, row, response);
    locallySaved.add(row.id);
    $('#local-save-status').textContent = 'Đã lưu ' + locallySaved.size + ' video vào ' + dir.name;
  }
  async function autoSaveCompleted() {
    if (!localDirectory || localSaving || !$('#auto-local-save').checked) return;
    localSaving = true;
    $('#choose-local-folder').disabled = true;
    const dir = localDirectory;
    try {
      for (const row of getRows().filter(
        (r) =>
          r.status === 'done' &&
          r.mode === 'premiere-mp4-v1' &&
          !locallySaved.has(r.id) &&
          !localFailures.has(r.id),
      )) {
        try {
          await saveLocalRow(row, dir);
        } catch (e) {
          localFailures.set(row.id, e.message);
          $('#local-save-status').textContent =
            'Lưu về máy lỗi: ' + e.message + ' Nhấn vào video trong Đã hoàn thành để thử lại.';
          break;
        }
      }
    } finally {
      localSaving = false;
      $('#choose-local-folder').disabled = false;
      drawCompleted();
    }
  }

  async function ensureDirectory() {
    if (isCloud() && !localDirectory && window.showDirectoryPicker) {
      try {
        localDirectory = await window.showDirectoryPicker({
          mode: 'readwrite',
          id: 'noi-dung-video',
        });
        $('#local-save-status').textContent = 'Thư mục đã chọn: ' + localDirectory.name;
      } catch (e) {
        if (e.name === 'AbortError') return false;
        throw e;
      }
    }
    return true;
  }
  function bind() {
    $('#choose-local-folder').onclick = async () => {
      if (!window.showDirectoryPicker) {
        notify(
          'Trình duyệt chưa hỗ trợ chọn thư mục. Dùng Chrome/Edge trên máy tính, hoặc bật Hỏi nơi lưu từng tệp trong cài đặt tải xuống rồi dùng nút Tải video.',
          true,
        );
        return;
      }
      try {
        const dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'noi-dung-video' });
        localDirectory = dir;
        locallySaved.clear();
        localFailures.clear();
        $('#local-save-status').textContent = 'Thư mục đã chọn: ' + dir.name;
        await autoSaveCompleted();
      } catch (e) {
        if (e.name !== 'AbortError') notify('Không chọn được thư mục: ' + e.message, true);
      }
    };
    $('#auto-local-save').onchange = () => {
      if ($('#auto-local-save').checked) void autoSaveCompleted();
    };
  }
  return { drawCompleted, downloadCompleted, autoSaveCompleted, ensureDirectory, bind };
}
