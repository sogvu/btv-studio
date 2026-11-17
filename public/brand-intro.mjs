let activeIntro = null;
export function showBrandIntro({ force = false, root = document, duration = 2400 } = {}) {
  const panel = root.querySelector('#brand-intro');
  if (!panel) return Promise.resolve(false);
  if (activeIntro) return activeIntro;
  const win = root.defaultView;
  try {
    if (!force && win.sessionStorage.getItem('3s-intro-seen') === '1')
      return Promise.resolve(false);
  } catch {}
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previous = root.activeElement,
    background = [...root.body.children]
      .filter((el) => el !== panel && ['DIV', 'HEADER', 'MAIN', 'FOOTER'].includes(el.tagName))
      .map((el) => [el, el.inert]);
  for (const [el] of background) el.inert = true;
  panel.hidden = false;
  panel.classList.remove('intro-closing');
  root.body.classList.add('intro-open');
  const buttons = [...panel.querySelectorAll('[data-intro-close]')];
  let timer,
    closed = false;
  activeIntro = new Promise((resolve) => {
    function finish() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      panel.classList.add('intro-closing');
      root.removeEventListener('keydown', key);
      for (const b of buttons) b.removeEventListener('click', finish);
      setTimeout(
        () => {
          panel.hidden = true;
          panel.classList.remove('intro-closing');
          root.body.classList.remove('intro-open');
          for (const [el, inert] of background) el.inert = inert;
          if (previous?.isConnected && previous !== root.body)
            previous.focus({ preventScroll: true });
          activeIntro = null;
          try {
            win.sessionStorage.setItem('3s-intro-seen', '1');
          } catch {}
          resolve(true);
        },
        reduced ? 0 : 320,
      );
    }
    function key(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
      if (e.key === 'Tab') {
        const first = buttons[0],
          last = buttons.at(-1);
        if (e.shiftKey && root.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && root.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    for (const b of buttons) b.addEventListener('click', finish);
    root.addEventListener('keydown', key);
    buttons.at(-1)?.focus({ preventScroll: true });
    timer = duration > 0 ? setTimeout(finish, reduced ? 700 : duration) : null;
  });
  return activeIntro;
}
export function mountBrandIntro(root = document) {
  for (const button of root.querySelectorAll('[data-replay-intro]'))
    button.addEventListener('click', () => void showBrandIntro({ force: true, root, duration: 0 }));
  void showBrandIntro({ root });
}
