/* Variation A · Still Life — motion and choreography */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = document.documentElement.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* smooth inertial scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2 && id !== '#') return;
    const el = id === '#top' ? document.body : $(id); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : el, { offset: -88, duration: 1.6 });
    else (id === '#top' ? scrollTo(0, 0) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }));

  /* header: hides on the way down, returns on the way up */
  const hdr = $('.hdr'); let lastY = 0;
  const headerTick = y => { hdr.classList.toggle('is-solid', y > 40); hdr.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('nav-open')); lastY = y; };
  const burger = $('#burger');
  burger && burger.addEventListener('click', () => { const open = document.body.classList.contains('nav-open'); burger.firstChild.textContent = open ? 'Close ' : 'Menu '; lenis && (open ? lenis.stop() : lenis.start()); });

  /* ---------- hero scene ---------- */
  const scene = $('#scene'), stage = $('#stage');
  const wl = $('.w-l'), wr = $('.w-r'), ui = $('#heroUi'), cue = $('#cue');
  const marks = $$('.burnzone .mk'), cap = $('#caption'), capName = $('#capName'), capLabel = $('#capLabel'), capLink = $('#capLink');
  const bars = $$('#prog span'), prog = $('#prog');
  const phases = [[.22, .42], [.42, .6], [.6, .78], [.78, 1.01]];
  const names = ['The Setai, Miami Beach', 'The Ritz-Carlton', 'The Miami Beach EDITION', 'Your logo, next.'];
  const labels = ['Served at', 'Served at', 'Served at', 'And now'];
  let lastPhase = -1;
  requestAnimationFrame(() => scene.classList.add('ready'));
  function sceneTick() {
    if (reduce) return;
    const r = scene.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    stage.style.setProperty('--zoom', (1 + .55 * ease(clamp(p / .4))).toFixed(4));
    const t = ease(clamp(p / .2));
    wl.style.transform = `translateX(${-t * 16}vw)`; wr.style.transform = `translateX(${t * 16}vw)`;
    wl.style.opacity = wr.style.opacity = (1 - t * 1.15).toFixed(3);
    const u = 1 - clamp(p / .07);
    ui.style.opacity = u.toFixed(3); ui.style.pointerEvents = u < .2 ? 'none' : ''; cue.style.opacity = u.toFixed(3);
    let active = -1;
    phases.forEach(([s, e], i) => {
      const m = marks[i], local = (p - s) / (e - s);
      if (local < 0 || local > 1) { m.style.opacity = 0; m.style.clipPath = 'inset(0 100% 0 0)'; return; }
      active = i;
      const inn = ease(clamp(local / .42)), out = i < 3 ? clamp((local - .84) / .16) : 0;
      m.style.opacity = (inn * (1 - out) * .9).toFixed(3);
      m.style.clipPath = `inset(0 ${((1 - inn) * 100).toFixed(1)}% 0 0)`;
    });
    const c = clamp((p - .2) / .05);
    cap.style.opacity = c.toFixed(3); prog.style.opacity = (c * (1 - clamp((p - .97) / .03))).toFixed(3);
    if (active !== lastPhase && active >= 0) {
      lastPhase = active; capName.textContent = names[active]; capLabel.textContent = labels[active]; capLink.hidden = active !== 3;
      bars.forEach((b, i) => b.classList.toggle('on', i === active));
    }
  }

  /* ---------- statement: words light up as you read ---------- */
  const st = $('#statement'); let words = [];
  if (st && !reduce) {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) frag.append(w); else { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; frag.append(s); } });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(st); words = $$('.wd', st);
  }
  function statementTick() {
    if (!words.length) return;
    const r = st.getBoundingClientRect();
    const p = clamp((innerHeight * .82 - r.top) / (r.height + innerHeight * .25));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : .16; });
  }

  /* ---------- reveals: only for content below the first screen ---------- */
  /* checked in the scroll loop (a fully masked element never reports as intersecting) */
  let pending = [];
  if (!reduce) {
    $$('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * .9) return;
      const img = el.dataset.reveal === 'img';
      el.classList.add(img ? 'pre-img' : 'pre-up');
      requestAnimationFrame(() => el.classList.add(img ? 'go-img' : 'go-up'));
      pending.push(el);
    });
  }
  function revealTick() {
    if (!pending.length) return;
    pending = pending.filter(el => { if (el.getBoundingClientRect().top < innerHeight * .88) { el.classList.remove('pre-up', 'pre-img'); return false; } return true; });
  }

  /* ---------- parallax inside frames ---------- */
  const para = reduce ? [] : $$('[data-speed]');
  para.forEach(img => { img.style.height = '114%'; img.style.position = 'relative'; img.style.top = '-7%'; });
  function paraTick() {
    para.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; img.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * +img.dataset.speed).toFixed(1)}px`; });
  }

  /* ---------- gallery: drag to explore ---------- */
  const gal = $('#gallery');
  if (gal) {
    let down = false, sx = 0, sl = 0, moved = false;
    gal.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = gal.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; gal.classList.add('dragging'); } gal.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; setTimeout(() => gal.classList.remove('dragging'), 0); });
    gal.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
  }

  /* ---------- services: the list drives the image ---------- */
  const rows = $$('#svcList .srow'), frames = $$('.svc__frame img');
  const pick = i => { rows.forEach((r, j) => r.classList.toggle('on', j === i)); frames.forEach((f, j) => f.classList.toggle('on', j === i)); };
  rows.forEach((r, i) => { r.addEventListener('mouseenter', () => pick(i)); r.addEventListener('focus', () => pick(i)); });

  /* ---------- reviews ---------- */
  const qs = $$('#quotes .quote'), count = $('#rvCount'); let qi = 0, qt;
  const showQ = n => { qs[qi].classList.remove('on'); qi = (n + qs.length) % qs.length; qs[qi].classList.add('on'); count.textContent = `0${qi + 1} / 0${qs.length}`; };
  const auto = () => { clearInterval(qt); if (!reduce) qt = setInterval(() => showQ(qi + 1), 7000); };
  $('#rvPrev')?.addEventListener('click', () => { showQ(qi - 1); auto(); });
  $('#rvNext')?.addEventListener('click', () => { showQ(qi + 1); auto(); });
  auto();

  /* ---------- cursor label on large interactive areas ---------- */
  const cur = $('#cursor');
  if (cur && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; });
    cur.style.opacity = 0;
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { cur.querySelector('span').textContent = el.dataset.cursor; cur.classList.add('big'); cur.style.opacity = 1; });
      el.addEventListener('mouseleave', () => { cur.classList.remove('big'); cur.style.opacity = 0; });
    });
    const loop = () => { cx += (x - cx) * .18; cy += (y - cy) * .18; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* one scroll handler drives everything */
  const tick = () => { const y = lenis ? lenis.scroll : scrollY; headerTick(y); sceneTick(); statementTick(); paraTick(); revealTick(); };
  if (lenis) lenis.on('scroll', tick); else addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick); tick();
})();
