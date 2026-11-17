import test from 'node:test';
import assert from 'node:assert/strict';
import { showBrandIntro } from '../public/brand-intro.mjs';
function fixture({ decode = () => Promise.resolve(), reduced = false } = {}) {
  const classes = () => {
    const set = new Set();
    return {
      add: (...s) => s.forEach((x) => set.add(x)),
      remove: (...s) => s.forEach((x) => set.delete(x)),
      contains: (s) => set.has(s),
    };
  };
  const root = new EventTarget(),
    store = new Map();
  const element = () =>
    Object.assign(new EventTarget(), {
      classList: classes(),
      hidden: false,
      inert: false,
      isConnected: true,
      focus() {
        root.activeElement = this;
      },
    });
  const before = element(),
    background = element(),
    alreadyInert = element(),
    panel = element(),
    skip = element(),
    enter = element();
  before.tagName = 'BUTTON';
  background.tagName = 'DIV';
  alreadyInert.tagName = 'MAIN';
  alreadyInert.inert = true;
  panel.tagName = 'SECTION';
  panel.hidden = true;
  panel.querySelectorAll = () => [skip, enter];
  panel.querySelector = () => ({ getAttribute: () => '/logo-3s.svg' });
  root.body = { children: [panel, background, alreadyInert], classList: classes() };
  root.activeElement = before;
  root.querySelector = () => panel;
  root.defaultView = {
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: { getItem: (k) => store.get(k), setItem: (k, v) => store.set(k, v) },
    Image: class {
      decode() {
        return decode();
      }
    },
  };
  return { root, panel, skip, background, alreadyInert, before };
}
test('intro auto exits, restores background and focus, and only runs once per tab', async () => {
  const f = fixture();
  const promise = showBrandIntro({ root: f.root, duration: 15 });
  assert.equal(f.panel.hidden, false);
  assert.equal(f.background.inert, true);
  await promise;
  assert.equal(f.panel.hidden, true);
  assert.equal(f.background.inert, false);
  assert.equal(f.alreadyInert.inert, true);
  assert.equal(f.root.activeElement, f.before);
  assert.equal(await showBrandIntro({ root: f.root }), false);
});
test('skip during image preload cannot reopen the intro after decoding', async () => {
  let ready;
  const f = fixture({ decode: () => new Promise((r) => (ready = r)) });
  const promise = showBrandIntro({ root: f.root });
  f.skip.dispatchEvent(new Event('click'));
  ready();
  await promise;
  assert.equal(f.panel.hidden, true);
  assert.equal(f.root.body.classList.contains('intro-open'), false);
  assert.equal(f.background.inert, false);
});
test('Escape and reduced motion close without leaving controls inert', async () => {
  const f = fixture({ reduced: true });
  const promise = showBrandIntro({ root: f.root });
  const event = new Event('keydown');
  Object.defineProperty(event, 'key', { value: 'Escape' });
  f.root.dispatchEvent(event);
  await promise;
  assert.equal(f.panel.hidden, true);
  assert.equal(f.background.inert, false);
});
test('image decode failure does not block entering the application', async () => {
  const f = fixture({ decode: () => Promise.reject(Error('missing image')) });
  await showBrandIntro({ root: f.root, duration: 10 });
  assert.equal(f.panel.hidden, true);
  assert.equal(f.background.inert, false);
});
