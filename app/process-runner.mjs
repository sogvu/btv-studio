import { spawn } from 'node:child_process';
export function createProcessRunner({ defaultCwd, shouldStop = () => false }) {
  const children = new Set();
  function run(
    command,
    args,
    {
      cwd = defaultCwd,
      onLine = () => {},
      cancellable = true,
      timeout = 0,
      returnStderr = false,
    } = {},
  ) {
    return new Promise((resolve, reject) => {
      const p = spawn(command, args, { cwd, windowsHide: true, shell: false });
      if (cancellable) children.add(p);
      let err = '',
        out = '',
        pending = '',
        settled = false;
      const timer = timeout
        ? setTimeout(() => {
            p.kill();
            done(new Error('Quá thời gian xử lý. Hãy thử lại.'));
          }, timeout)
        : null;
      function done(e) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        children.delete(p);
        e ? reject(e) : resolve(returnStderr ? err : out);
      }
      p.stdout.on('data', (b) => {
        const str = b.toString();
        out = (out + str).slice(-100000);
        pending += str;
        let n;
        while ((n = pending.indexOf('\n')) >= 0) {
          onLine(pending.slice(0, n).trim());
          pending = pending.slice(n + 1);
        }
      });
      p.stderr.on('data', (b) => {
        err = (err + b.toString()).slice(-6000);
      });
      p.on('error', (e) => done(e));
      p.on('close', (code) =>
        done(
          code === 0
            ? null
            : new Error(
                shouldStop() && cancellable
                  ? 'Đã dừng theo yêu cầu.'
                  : err.trim() || `Bộ xử lý kết thúc với mã ${code}.`,
              ),
        ),
      );
    });
  }

  function cancel() {
    for (const p of children) {
      if (process.platform === 'win32')
        spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { windowsHide: true });
      else p.kill();
    }
  }
  function kill() {
    for (const p of children) p.kill();
  }
  return { run, cancel, kill };
}
