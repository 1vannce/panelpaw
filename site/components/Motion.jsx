'use client';

import { useEffect } from 'react';

// All page motion lives here. The markup is server-rendered and complete without it;
// this only enhances it, and every effect is skipped under prefers-reduced-motion.
// GSAP and Lenis load after hydration so they never delay the first paint.
export default function Motion() {
  useEffect(() => {
    let cancelled = false;
    let dispose = null;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(([g, st, l]) => {
      if (!cancelled) dispose = init(g.gsap ?? g.default, st.ScrollTrigger, l.default);
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return null;
}

function init(gsap, ScrollTrigger, Lenis) {
  gsap.registerPlugin(ScrollTrigger);
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const cleanups = [];
  const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };
  const markSeen = () => { try { sessionStorage.setItem('pp-intro-seen', '1'); } catch { /* storage blocked */ } };

  // ---- Track scene state ----
  const track = document.getElementById('track');
  const TOTAL = Number(track.dataset.total);
  const REST = Number(track.dataset.rest) / TOTAL;
  const cells = document.querySelectorAll('#cells .cell');
  const nEl = document.getElementById('ch-n');
  const bar = document.getElementById('bar');
  const rail = document.querySelectorAll('#rail li[data-status]');
  const stamp = document.getElementById('stamp');
  const setProgress = (p) => {
    const ch = Math.round(p * TOTAL);
    nEl.textContent = String(ch).padStart(3, '0');
    const status = ch === 0 ? 'planned' : ch >= TOTAL ? 'completed' : 'reading';
    rail.forEach((li) => li.classList.toggle('is-on', li.dataset.status === status));
    const full = Math.floor(ch / (TOTAL / cells.length));
    cells.forEach((c, i) => c.classList.toggle('is-full', i < full));
    bar.style.transform = `scaleX(${ch / TOTAL})`;
    stamp.classList.toggle('is-on', status === 'completed');
  };

  // ---- Smooth scroll (desktop only) ----
  let lenis = null;
  const tick = (t) => lenis?.raf(t * 1000);
  if (!reduce && window.matchMedia('(min-width: 900px)').matches) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => on(a, 'click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  let mm = null;
  const ctx = gsap.context(() => {
    // ---- Intro: first visit of a session only (preloader, then the hero builds in) ----
    const pre = document.getElementById('pre');
    if (reduce || root.classList.contains('seen')) {
      pre.style.display = 'none';
    } else {
      const counter = { v: 0 };
      const countEl = pre.querySelector('.pre-count');
      gsap.timeline()
        .to(counter, { v: 100, duration: 1, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); } })
        .to('.pre-inner', { autoAlpha: 0, duration: 0.25 })
        .to('.pre-strips i', { yPercent: -100, duration: 0.75, ease: 'expo.inOut', stagger: 0.06 })
        .set(pre, { display: 'none' })
        .from('.panel', { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut', stagger: 0.07, clearProps: 'clipPath' }, '-=0.55')
        .from('.wm .ch > span', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.045 }, '-=0.6')
        .from('.hero-copy > *', { y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, '-=0.7');
    }
    markSeen();

    if (reduce) return;

    // ---- Marquee: CSS loop; speeds up with scroll velocity ----
    const mqAnim = document.querySelector('.marquee-track').getAnimations()[0];
    if (mqAnim) {
      const rate = { v: 1 };
      const apply = () => { mqAnim.playbackRate = rate.v; };
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (s) => {
          const boost = 1 + Math.min(Math.abs(s.getVelocity()) / 450, 5);
          gsap.to(rate, { v: boost, duration: 0.15, overwrite: true, onUpdate: apply, onComplete: () => gsap.to(rate, { v: 1, duration: 0.9, overwrite: true, onUpdate: apply }) });
        }
      });
    }

    // ---- Manifesto: words ink in as you scroll (dim state still passes 3:1 contrast) ----
    gsap.fromTo('.manifesto-text .w', { opacity: 0.45 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 55%', scrub: true }
    });

    // ---- Pinned scenes (desktop only), created in page order ----
    const disc = document.getElementById('discover');
    mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      // Track: scroll drives chapter 0 → total.
      const proxy = { p: 0 };
      setProgress(0);
      const tw = gsap.to(proxy, { p: 1, ease: 'none', onUpdate: () => setProgress(proxy.p) });
      ScrollTrigger.create({ trigger: track, start: 'top top', end: '+=1800', pin: true, scrub: 0.6, animation: tw });

      // Discover: the strip overflows to the left (right-to-left); scrolling slides it right.
      disc.classList.add('is-pinned');
      const viewport = disc.querySelector('.disc-viewport');
      const strip = disc.querySelector('.disc-strip');
      const distance = () => {
        const cs = getComputedStyle(viewport);
        return Math.max(0, strip.scrollWidth - (viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
      };
      gsap.to(strip, {
        x: distance, ease: 'none',
        scrollTrigger: { trigger: disc, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true }
      });

      return () => { setProgress(REST); disc.classList.remove('is-pinned'); };
    });

    // ---- Discover: type the search query once ----
    const typed = disc.querySelector('.typed');
    const query = typed.dataset.text;
    ScrollTrigger.create({
      trigger: disc, start: 'top 70%', once: true,
      onEnter: () => {
        const o = { n: 0 };
        typed.textContent = '';
        gsap.to(o, { n: query.length, duration: 0.8, ease: 'none', onUpdate: () => { typed.textContent = query.slice(0, Math.round(o.n)); } });
      }
    });

    // ---- Lists: cards fly from one pile into their stacks ----
    const board = document.querySelector('.lists-board');
    const center = (el, axis) => { const r = el.getBoundingClientRect(); return axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2; };
    gsap.from('.stack-card', {
      x: (i, el) => center(board, 'x') - center(el, 'x'),
      y: (i, el) => center(board, 'y') - center(el, 'y'),
      rotation: (i) => (i % 2 ? 1 : -1) * (6 + (i % 3) * 4),
      duration: 0.9, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: board, start: 'top 75%', once: true }
    });

    // ---- Footer wordmark fills with ink ----
    gsap.fromTo('.foot-word', { backgroundSize: '0% 100%' }, {
      backgroundSize: '100% 100%',
      ease: 'none',
      scrollTrigger: { trigger: '.foot', start: 'top 92%', end: 'bottom bottom', scrub: true }
    });

    if (!fine) return;

    // ---- Hero cursor parallax ----
    const grid = document.getElementById('hero-grid');
    const layers = [...document.querySelectorAll('[data-depth]')].map((el) => ({
      d: parseFloat(el.dataset.depth),
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' })
    }));
    on(grid, 'pointermove', (e) => {
      const r = grid.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => { l.x(nx * l.d * 36); l.y(ny * l.d * 36); });
    });
    on(grid, 'pointerleave', () => layers.forEach((l) => { l.x(0); l.y(0); }));

    // ---- Magnetic buttons ----
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
      on(btn, 'pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      on(btn, 'pointerleave', () => { xTo(0); yTo(0); });
    });

    // ---- Cursor ----
    const cur = document.getElementById('cursor');
    const label = document.getElementById('cursor-label');
    cur.hidden = false;
    gsap.set(cur, { x: -100, y: -100 });
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    on(window, 'pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll('a, button').forEach((el) => {
      on(el, 'pointerenter', () => { label.textContent = el.dataset.cursor || ''; cur.classList.add('is-big'); });
      on(el, 'pointerleave', () => cur.classList.remove('is-big'));
    });
    cleanups.push(() => { cur.hidden = true; });
  });

  return () => {
    mm?.revert();
    ctx.revert();
    cleanups.forEach((fn) => fn());
    if (lenis) { gsap.ticker.remove(tick); lenis.destroy(); }
  };
}
