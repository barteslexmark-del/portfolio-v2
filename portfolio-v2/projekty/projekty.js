(function () {
'use strict';
/* ==========================================================
   KARUZELA PROJEKTÓW – prototyp
   1) LISTA PRAC: tu dopisujesz / usuwasz zdjęcia (reszta liczy się sama)
   2) USTAWIENIA: prędkość obrotu, promienie, rozmiary kart
   ========================================================== */

/* ---------- 1) LISTA PRAC ----------
   thumb = mała wersja (ok. 700 px szerokości) widoczna na karuzeli
   full  = duża wersja pokazywana po kliknięciu (ok. 1800–2400 px)
   Możesz dodać dowolną liczbę, ale czytelnie jest do ok. 10–12 na pierścień. */
const WORKS = {
  exterior: [
    { thumb: 'projekty/img/e4-t.jpg', full: 'projekty/img/e4.jpg', title: 'Cabins' },
    { thumb: 'projekty/img/e1-t.jpg', full: 'projekty/img/e1.jpg', title: 'DGDA Diriyah Gate' },
    { thumb: 'projekty/img/e9-t.jpg', full: 'projekty/img/e9.jpg', title: 'Tenement' },
    { thumb: 'projekty/img/e5-t.jpg', full: 'projekty/img/e5.jpg', title: 'Cabins' },
    { thumb: 'projekty/img/e12-t.jpg', full: 'projekty/img/e12.jpg', title: 'Competition' },
    { thumb: 'projekty/img/e2-t.jpg', full: 'projekty/img/e2.jpg', title: 'Mount Arafat – Pilgrimage' },
    { thumb: 'projekty/img/e6-t.jpg', full: 'projekty/img/e6.jpg', title: 'Cabins' },
    { thumb: 'projekty/img/e7-t.jpg', full: 'projekty/img/e7.jpg', title: 'Houses' },
    { thumb: 'projekty/img/e11-t.jpg', full: 'projekty/img/e11.jpg', title: 'Competition' },
    { thumb: 'projekty/img/e13-t.jpg', full: 'projekty/img/e13.jpg', title: 'The Line World Cup 2034' },
    { thumb: 'projekty/img/e3-t.jpg', full: 'projekty/img/e3.jpg', title: 'Exterior' },
    { thumb: 'projekty/img/e8-t.jpg', full: 'projekty/img/e8.jpg', title: 'Exterior' },
    { thumb: 'projekty/img/e10-t.jpg', full: 'projekty/img/e10.jpg', title: 'Exterior' },
  ],
  interior: [
    { thumb: 'projekty/img/i2-t.jpg', full: 'projekty/img/i2.jpg', title: 'Interior 01' },
    { thumb: 'projekty/img/i1-t.jpg', full: 'projekty/img/i1.jpg', title: 'Interior 02' },
    { thumb: 'projekty/img/i6-t.jpg', full: 'projekty/img/i6.jpg', title: 'Interior 03' },
    { thumb: 'projekty/img/i3-t.jpg', full: 'projekty/img/i3.jpg', title: 'Interior 04' },
    { thumb: 'projekty/img/i5-t.jpg', full: 'projekty/img/i5.jpg', title: 'Interior 05' },
    { thumb: 'projekty/img/i9-t.jpg', full: 'projekty/img/i9.jpg', title: 'Interior 06' },
    { thumb: 'projekty/img/i4-t.jpg', full: 'projekty/img/i4.jpg', title: 'Interior 07' },
    { thumb: 'projekty/img/i7-t.jpg', full: 'projekty/img/i7.jpg', title: 'Interior 08' },
    { thumb: 'projekty/img/i8-t.jpg', full: 'projekty/img/i8.jpg', title: 'Interior 09' },
    { thumb: 'projekty/img/i10-t.jpg', full: 'projekty/img/i10.jpg', title: 'Interior 10' },
    { thumb: 'projekty/img/i11-t.jpg', full: 'projekty/img/i11.jpg', title: 'Interior 11' },
    { thumb: 'projekty/img/i12-t.jpg', full: 'projekty/img/i12.jpg', title: 'Interior 12' },
    { thumb: 'projekty/img/i13-t.jpg', full: 'projekty/img/i13.jpg', title: 'Interior 13' },
    { thumb: 'projekty/img/i14-t.jpg', full: 'projekty/img/i14.jpg', title: 'Interior 14' },
    { thumb: 'projekty/img/i15-t.jpg', full: 'projekty/img/i15.jpg', title: 'Interior 15' },
  ],
};

/* ---------- 2) USTAWIENIA ----------
   radius    – promień pierścienia (px w "świecie" 3D)
   maxW/maxH – największy rozmiar karty (zdjęcie jest dopasowane, proporcje zostają)
   speed     – prędkość obrotu w stopniach na sekundę (minus = w drugą stronę)
   offset    – przesunięcie startowe pierścienia (stopnie)                       */
const RINGS = [
  { id: 'rs-ring-exterior', cat: 'exterior', label: 'EXTERIOR', radius: 700, maxW: 230, maxH: 190, speed: -4, offset: 10 },
  { id: 'rs-ring-interior', cat: 'interior', label: 'INTERIOR', radius: 440, maxW: 170, maxH: 140, speed:  6, offset: 25 },
];
const TILT = -27;          // nachylenie kamery (większa liczba ujemna = patrzymy bardziej z góry)
const ROLL = -5;           // delikatne przechylenie całości
const BASE_SCALE = 0.64;   // wielkość całej karuzeli
const HOVER_SLOW = 0.1;    // jak bardzo zwalnia pierścień pod kursorem (0.1 = prawie stoi)
const HOVER_POP = 80;      // jak mocno karta wysuwa się do przodu po najechaniu (px)
const HOVER_GROW = 0.75;   // powiększenie karty po najechaniu (0.75 = +75%)

/* ========================================================== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const stage = $('#rs-stage'), world = $('#rs-world');
const caption = $('#rs-caption');
const lb = { root: $('#rs-lightbox'), img: $('#rs-lbImg'), cap: $('#rs-lbCap'), prev: $('#rs-lbPrev'), next: $('#rs-lbNext'), close: $('#rs-lbClose') };

const wrap = (d) => ((d + 540) % 360) - 180;         // kąt do zakresu -180..180
let scale = BASE_SCALE, tiltX = TILT, tiltZ = ROLL, tiltXT = TILT, tiltZT = ROLL;

function fit() {
  scale = BASE_SCALE * Math.min(innerWidth / 1600, innerHeight / 900);
}
addEventListener('resize', fit); fit();

/* ---------- budowa pierścieni ---------- */
const rings = RINGS.map((cfg) => ({
  cfg, el: document.getElementById(cfg.id), angle: 0, k: 1, cards: [], hovered: null,
}));

function loadImage(src) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = src;
  });
}

async function build() {
  for (const ring of rings) {
    const list = WORKS[ring.cfg.cat] || [];
    const n = list.length;
    const imgs = await Promise.all(list.map((w) => loadImage(w.thumb)));
    list.forEach((work, i) => {
      const im = imgs[i];
      const ratio = im ? im.naturalWidth / im.naturalHeight : 1.5;
      const w = Math.min(ring.cfg.maxW, ring.cfg.maxH * ratio);   // dopasowanie do pola maxW × maxH
      const h = w / ratio;
      const a = (360 / n) * i + ring.cfg.offset;                   // kąt karty na pierścieniu
      const el = document.createElement('div');
      el.className = 'rs-card';
      el.style.cssText = `width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h}px;`;
      el.style.transitionDelay = (i * 60 + (ring.cfg.cat === 'interior' ? 300 : 0)) + 'ms';
      el.innerHTML = `<img src="${work.thumb}" alt="${work.title}" draggable="false">`;
      ring.el.appendChild(el);
      const card = { el, a, h: 0, hTarget: 0, work, index: i, ring };
      el.addEventListener('mouseenter', () => hover(card, true));
      el.addEventListener('mouseleave', () => hover(card, false));
      el.addEventListener('click', () => { if (!moved) openLightbox(ring, i); });
      ring.cards.push(card);
      setCardTransform(card);
    });
  }
  $('#projekty').classList.add('rs-ready');
  requestAnimationFrame(frame);
}

function setCardTransform(card) {
  const { a, h, ring } = card;
  const R = ring.cfg.radius;
  // po najechaniu karta obraca się twarzą do widza (kąt "globalny" = 0) i wysuwa do przodu
  const face = -(a + ring.angle);
  const rot = 90 + wrap(face - 90) * h;
  card.el.style.transform =
    `rotateY(${a}deg) translateZ(${R}px) rotateY(${rot}deg) translateZ(${HOVER_POP * h}px) scale(${1 + HOVER_GROW * h})`;
  card.el.style.zIndex = h > 0.05 ? 2 : 1;
}

function hover(card, on) {
  card.hTarget = on ? 1 : 0;
  card.ring.hovered = on ? card : null;
  if (on) {
    caption.innerHTML = `${card.ring.cfg.label}<span>${card.work.title}</span>`;
    caption.classList.add('rs-on');
  } else if (!rings.some((r) => r.hovered)) {
    caption.classList.remove('rs-on');
  }
}

/* ---------- pętla animacji ---------- */
let last = performance.now(), paused = false, dragVel = 0, moved = false;
let visible = true;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(document.getElementById('projekty'));
function frame(now) {
  if (!visible) { last = now; requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - last) / 1000); last = now;

  // delikatny ruch kamery za myszką
  tiltX += (tiltXT - tiltX) * Math.min(1, dt * 3);
  tiltZ += (tiltZT - tiltZ) * Math.min(1, dt * 3);
  world.style.transform = `scale(${scale}) rotateX(${tiltX}deg) rotateZ(${tiltZ}deg)`;

  for (const ring of rings) {
    const slowTarget = (ring.hovered || paused || dragging) ? HOVER_SLOW : 1;
    ring.k += (slowTarget - ring.k) * Math.min(1, dt * 4);
    const auto = reduceMotion ? 0 : ring.cfg.speed * ring.k;
    ring.angle += (auto + dragVel) * dt;
    ring.el.style.transform = `rotateY(${ring.angle}deg)`;

    for (const c of ring.cards) {
      c.h += (c.hTarget - c.h) * Math.min(1, dt * 9);
      if (Math.abs(c.hTarget - c.h) < 0.001) c.h = c.hTarget;
      setCardTransform(c);
    }
  }
  if (!dragging) dragVel *= Math.exp(-dt * 2.6);        // wybieg po przeciągnięciu
  requestAnimationFrame(frame);
}

/* ---------- przeciąganie myszką / palcem ---------- */
let dragging = false, startX = 0, lastX = 0, lastT = 0;
stage.addEventListener('pointerdown', (e) => {
  dragging = true; moved = false; startX = lastX = e.clientX; lastT = performance.now();
  stage.classList.add('rs-dragging');
});
addEventListener('pointermove', (e) => {
  // ruch kamery
  tiltXT = TILT + (e.clientY / innerHeight - 0.5) * 6;
  tiltZT = ROLL + (e.clientX / innerWidth - 0.5) * 4;
  if (!dragging) return;
  const dx = e.clientX - lastX;
  if (Math.abs(e.clientX - startX) > 6) moved = true;
  const now = performance.now(), dtm = Math.max(1, now - lastT);
  const deg = dx * 0.22;
  rings.forEach((r) => { r.angle += deg; });
  dragVel = (deg / dtm) * 1000 * 0.6;
  lastX = e.clientX; lastT = now;
});
addEventListener('pointerup', () => {
  dragging = false; stage.classList.remove('rs-dragging');
  setTimeout(() => { moved = false; }, 0);
});

/* ---------- podgląd pełnoekranowy ---------- */
let lbRing = null, lbIndex = 0;
function showLb(i, animate) {
  const list = lbRing.cards;
  lbIndex = (i + list.length) % list.length;
  const w = list[lbIndex].work;
  const apply = () => {
    lb.img.src = w.full || w.thumb; lb.img.alt = w.title;
    lb.cap.innerHTML = `${lbRing.cfg.label}<span>${String(lbIndex + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')} &nbsp;·&nbsp; ${w.title}</span>`;
    lb.img.classList.remove('rs-swap');
  };
  if (animate) { lb.img.classList.add('rs-swap'); setTimeout(apply, 180); } else apply();
}
function openLightbox(ring, i) {
  lbRing = ring; paused = true;
  lb.root.hidden = false;
  showLb(i, false);
  requestAnimationFrame(() => lb.root.classList.add('rs-open'));
}
function closeLightbox() {
  lb.root.classList.remove('rs-open'); paused = false;
  setTimeout(() => { lb.root.hidden = true; }, 350);
}
lb.close.addEventListener('click', closeLightbox);
lb.prev.addEventListener('click', (e) => { e.stopPropagation(); showLb(lbIndex - 1, true); });
lb.next.addEventListener('click', (e) => { e.stopPropagation(); showLb(lbIndex + 1, true); });
lb.root.addEventListener('click', (e) => { if (e.target === lb.root) closeLightbox(); });
addEventListener('keydown', (e) => {
  if (lb.root.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showLb(lbIndex - 1, true);
  if (e.key === 'ArrowRight') showLb(lbIndex + 1, true);
});
let sx = null;
lb.root.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
lb.root.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx; sx = null;
  if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1), true);
});

build();
})();
