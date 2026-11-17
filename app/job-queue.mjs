import { retryQueue } from './retry.mjs';
export function createJobQueue({ getState, processRow, save, report }) {
  let busy = false,
    stop = false,
    notice = '',
    retryState = null,
    cancelRetryWait = null;
  function retryWait(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(done, ms);
      function done() {
        clearTimeout(timer);
        cancelRetryWait = null;
        resolve();
      }
      cancelRetryWait = done;
    });
  }

  async function batch(rows) {
    const state = getState();
    try {
      await retryQueue({
        rows,
        workers: state.settings.workers,
        autoRetry: state.settings.autoRetry !== false,
        shouldStop: () => stop,
        processRow,
        wait: retryWait,
        onRound: () => {
          retryState = null;
        },
        onWait: ({ round, delay, remaining }) => {
          retryState = { round, nextAt: Date.now() + delay, remaining };
          save();
        },
      });
    } catch (e) {
      notice = 'Không thể lưu kết quả: ' + e.message;
    } finally {
      retryState = null;
      for (const r of rows)
        if (r.status === 'queued') {
          r.status = 'stopped';
          r.error = 'Chưa xử lý do dừng lô.';
        }
      state.running = false;
      busy = false;
      try {
        report();
      } catch (e) {
        notice = e.message;
      }
    }
  }

  function start(rows) {
    stop = false;
    notice = '';
    report();
    busy = true;
    getState().running = true;
    void batch(rows);
  }
  function cancel() {
    stop = true;
    cancelRetryWait?.();
  }
  return {
    start,
    cancel,
    resetStop: () => {
      stop = false;
    },
    get busy() {
      return busy;
    },
    get stopped() {
      return stop;
    },
    get notice() {
      return notice;
    },
    get retryState() {
      return retryState;
    },
  };
}
