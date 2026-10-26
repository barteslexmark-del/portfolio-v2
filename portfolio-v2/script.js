// 1) Pojawianie się elementów podczas przewijania
const items = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
items.forEach((el) => observer.observe(el));

// 2) Delikatny ruch kształtów w hero za myszką (efekt głębi)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const shapes = document.querySelectorAll('.shape');

if (hero && shapes.length && !reduceMotion) {
  let tx = 0, ty = 0, cx = 0, cy = 0;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;   // od -0.5 do 0.5
    ty = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tick() {
    // płynne doganianie pozycji myszy
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    shapes.forEach((s) => {
      const depth = parseFloat(s.dataset.depth || '1');
      s.style.transform = `translate3d(${cx * -40 * depth}px, ${cy * -30 * depth}px, 0)`;
    });
    requestAnimationFrame(tick);
  }
  tick();
}

// 2b) "Szturchnięcie": po najechaniu mebel obraca się o max ~5° (strona zależy od miejsca wejścia kursora)
if (!reduceMotion) {
  shapes.forEach((s) => {
    s.addEventListener('mouseenter', (e) => {
      const r = s.getBoundingClientRect();
      const rel = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1 .. 1
      const deg = Math.max(-1, Math.min(1, rel)) * 5;
      s.style.rotate = `${deg.toFixed(2)}deg`;
    });
    s.addEventListener('mouseleave', () => { s.style.rotate = '0deg'; });
  });
}

// 3) Szklany kursor (tylko myszka, nie dotyk)
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (fine && !reduceMotion) {
  const cur = document.createElement('div');
  cur.className = 'cursor';
  document.body.appendChild(cur);
  document.documentElement.classList.add('has-cursor');

  let mx = -100, my = -100, px = -100, py = -100;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cur.classList.add('on');
  });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  window.addEventListener('mousedown', () => cur.classList.add('down'));
  window.addEventListener('mouseup', () => cur.classList.remove('down'));

  // powiększanie i rozmycie nad klikalnymi elementami i kształtami hero
  const hoverables = 'a, .card, .shape, .rs-card, .rs-stage button';
  document.addEventListener('mouseover', (e) => {
    cur.classList.toggle('hover', !!e.target.closest(hoverables));
  });

  (function follow() {
    px += (mx - px) * 0.18;
    py += (my - py) * 0.18;
    cur.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    requestAnimationFrame(follow);
  })();
}
// 4) Przejście hero → showreel: klik w wolne miejsce albo delikatny scroll
const reel = document.getElementById('reel');
if (hero && reel) {
  let busy = false;
  const goTo = (y) => {
    if (busy) return;
    busy = true;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => { busy = false; }, reduceMotion ? 50 : 1100);
  };
  const reelTop = () => reel.getBoundingClientRect().top + window.scrollY;
  const inHeroZone = () => window.scrollY < reelTop() * 0.5;       // jesteśmy w górnej części (hero)
  const atReel = () => Math.abs(window.scrollY - reelTop()) < reel.offsetHeight * 0.5;

  // klik w dowolne miejsce hero, poza linkami i nawigacją
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    goTo(reelTop());
  });

  // delikatny scroll kółkiem: z hero w dół do reela i z reela w górę do hero
  window.addEventListener('wheel', (e) => {
    if (busy) { e.preventDefault(); return; }
    if (e.deltaY > 0 && inHeroZone()) { e.preventDefault(); goTo(reelTop()); }
    else if (e.deltaY < 0 && atReel() && window.scrollY <= reelTop() + 4) { e.preventDefault(); goTo(0); }
  }, { passive: false });

  // dotyk (telefon): przesunięcie palcem
  let ty0 = null;
  window.addEventListener('touchstart', (e) => { ty0 = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (ty0 === null) return;
    const d = ty0 - e.touches[0].clientY;
    if (Math.abs(d) < 24) return;
    if (d > 0 && inHeroZone()) { e.preventDefault(); goTo(reelTop()); ty0 = null; }
    else if (d < 0 && atReel() && window.scrollY <= reelTop() + 4) { e.preventDefault(); goTo(0); ty0 = null; }
  }, { passive: false });

  // klawiatura: strzałka w dół / spacja / PageDown z hero
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key) && inHeroZone()) { e.preventDefault(); goTo(reelTop()); }
  });
}

// 5) Wideo gra tylko gdy jest widoczne
const reelVideo = document.querySelector('.reel-video');
if (reelVideo) {
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) reelVideo.play().catch(() => {}); else reelVideo.pause();
  }, { threshold: 0.35 }).observe(reelVideo);
}
// 6) Karuzela projektów: strzałki, przeciągnięcie, zapętlenie bez przeskoku
(function () {
  const viewport = document.getElementById('carViewport');
  const track = document.getElementById('carTrack');
  const prev = document.getElementById('carPrev');
  const next = document.getElementById('carNext');
  const counter = document.getElementById('carCount');
  if (!viewport || !track) return;

  const originals = Array.from(track.children);
  const n = originals.length;
  let V = 5, index = 0, step = 0, busy = false, fallback = null;

  const mod = (x) => ((x % n) + n) % n;
  const makeClone = (el) => {
    const c = el.cloneNode(true);
    c.classList.add('clone');
    c.setAttribute('aria-hidden', 'true');
    return c;
  };

  function build() {
    track.querySelectorAll('.clone').forEach((c) => c.remove());
    V = parseInt(getComputedStyle(track).getPropertyValue('--visible'), 10) || 5;
    const before = document.createDocumentFragment();
    originals.slice(-V).forEach((el) => before.appendChild(makeClone(el)));
    track.insertBefore(before, track.firstChild);
    originals.slice(0, V).forEach((el) => track.appendChild(makeClone(el)));
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = originals[0].getBoundingClientRect().width + gap;
    index = mod(index);
    place(false);
  }

  function place(animate) {
    track.style.transition = animate && !reduceMotion ? 'transform .8s cubic-bezier(.65,0,.2,1)' : 'none';
    void track.offsetWidth;                                   // wymusza przeliczenie przed animacją
    track.style.transform = `translate3d(${-(index + V) * step}px,0,0)`;
    if (counter) counter.textContent = String(mod(index) + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
  }

  function settle() {
    clearTimeout(fallback);
    if (index >= n || index < 0) { index = mod(index); place(false); }  // cichy powrót do oryginałów
    busy = false;
  }

  function go(dir) {
    if (busy) return;
    busy = true;
    index += dir;
    place(true);
    clearTimeout(fallback);
    fallback = setTimeout(settle, reduceMotion ? 30 : 950);
  }

  track.addEventListener('transitionend', (e) => { if (e.target === track && e.propertyName === 'transform') settle(); });
  if (next) next.addEventListener('click', () => go(1));
  if (prev) prev.addEventListener('click', () => go(-1));

  // przeciągnięcie myszką / palcem
  let x0 = null;
  viewport.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  window.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  build();
})();
