let activeIntro = null;
const SEEN_KEY = '3s-puzzle-intro-seen';

export function showBrandIntro({ root = document, duration = 4000 } = {}) {
  const panel = root.querySelector('#brand-intro');
  if (!panel) return Promise.resolve(false);
  if (activeIntro) return activeIntro;
  const win = root.defaultView;
  try {
    if (win.sessionStorage.getItem(SEEN_KEY) === '1') return Promise.resolve(false);
  } catch {}
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previous = root.activeElement;
  const background = [...root.body.children]
    .filter((el) => el !== panel && ['DIV', 'HEADER', 'MAIN', 'FOOTER'].includes(el.tagName))
    .map((el) => [el, el.inert]);
  for (const [el] of background) el.inert = true;
  panel.classList.remove('intro-closing');
  panel.classList.add('intro-preparing');
  panel.hidden = false;
  root.body.classList.add('intro-open');
  const buttons = [...panel.querySelectorAll('[data-intro-close]')];
  let timer,
    loadTimer,
    started = false,
    closed = false;
  activeIntro = new Promise((resolve) => {
    function finish() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      clearTimeout(loadTimer);
      panel.classList.add('intro-closing');
      root.removeEventListener('keydown', key);
      for (const button of buttons) button.removeEventListener('click', finish);
      setTimeout(
        () => {
          panel.hidden = true;
          panel.classList.remove('intro-closing', 'intro-preparing');
          root.body.classList.remove('intro-open');
          for (const [el, inert] of background) el.inert = inert;
          if (previous?.isConnected && previous !== root.body)
            previous.focus({ preventScroll: true });
          activeIntro = null;
          try {
            win.sessionStorage.setItem(SEEN_KEY, '1');
          } catch {}
          resolve(true);
        },
        reduced ? 0 : 320,
      );
    }
    function key(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
      }
      if (event.key === 'Tab') {
        const first = buttons[0],
          last = buttons.at(-1);
        if (event.shiftKey && root.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && root.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    function start() {
      if (closed || started) return;
      started = true;
      clearTimeout(loadTimer);
      panel.classList.remove('intro-preparing');
      timer = duration > 0 ? setTimeout(finish, reduced ? 700 : duration) : null;
    }
    for (const button of buttons) button.addEventListener('click', finish);
    root.addEventListener('keydown', key);
    buttons[0]?.focus({ preventScroll: true });
    // Decode the shared logo before starting its movement; never wait indefinitely.
    loadTimer = setTimeout(start, 1500);
    const src = panel.querySelector('.puzzle-final')?.getAttribute('href');
    if (src) {
      const image = new win.Image();
      image.src = src;
      if (image.decode)
        image
          .decode()
          .catch(() => {})
          .then(start);
      else start();
    } else start();
  });
  return activeIntro;
}
export function mountBrandIntro(root = document) {
  void showBrandIntro({ root });
}
