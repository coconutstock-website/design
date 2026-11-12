/* Variation D · page behaviour: reveals, highlighters, coconut pop-ups, hero toggle, work rail, quote builder, reviews, map, floating talk pill, 3D coconut */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = document.documentElement.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* reveal on scroll (also draws the pink highlighters and pops the coconuts up) */
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add(e.target.classList.contains('pop') ? 'up' : 'in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' }) : null;
  $$('.rv, .hl').forEach((el, i) => { if (io) { if (el.classList.contains('rv')) el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); } else el.classList.add('in'); });

  /* hero toggle: hover or tap moves the lime pill; the link still goes to the quote form */
  const tg = $$('.toggle a');
  tg.forEach(a => a.addEventListener('mouseenter', () => tg.forEach(b => b.classList.toggle('on', b === a))));

  /* our work: slider that keeps gliding; arrows nudge it; loops seamlessly */
  const rail = $('#workRail'), track = rail && $('.rail__track', rail);
  if (rail && track) {
    const originals = [...track.children];
    originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; track.appendChild(k); });
    const half = () => originals[originals.length - 1].offsetLeft + originals[originals.length - 1].offsetWidth + 24 - originals[0].offsetLeft;
    const stepW = () => originals[0].getBoundingClientRect().width + 24;
    let pos = 0, hold = false, nudge = null, last = performance.now();
    const wrap = () => { const hw = half(); if (pos >= hw) pos -= hw; if (pos < 0) pos += hw; };
    function frame(now) {
      const dt = Math.min(64, now - last) / 1000; last = now;
      if (nudge) { const k = clamp((now - nudge.t0) / 650); pos = nudge.from + (nudge.to - nudge.from) * (1 - Math.pow(1 - k, 3)); if (k >= 1) nudge = null; wrap(); rail.scrollLeft = pos; }
      else if (!hold && !reduce && !document.hidden) { pos += 40 * dt; wrap(); rail.scrollLeft = pos; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    $('#workPrev').addEventListener('click', () => { nudge = { from: pos, to: pos - stepW(), t0: performance.now() }; });
    $('#workNext').addEventListener('click', () => { nudge = { from: pos, to: pos + stepW(), t0: performance.now() }; });
    rail.addEventListener('touchstart', () => { hold = true; }, { passive: true });
    rail.addEventListener('touchend', () => setTimeout(() => { pos = rail.scrollLeft; hold = false; }, 1200), { passive: true });
    rail.addEventListener('scroll', () => { if (hold) pos = rail.scrollLeft; }, { passive: true });
  }

  /* how it works: each tile shrinks a little as the next one stacks over it */
  const hcards = $$('#howStack .ncard');
  function stackTick() {
    if (reduce) return;
    hcards.forEach((c, i) => {
      const nx = hcards[i + 1]; if (!nx) return;
      const a = c.getBoundingClientRect(), b = nx.getBoundingClientRect();
      const p = clamp((a.bottom - b.top) / a.height);
      c.style.transform = `scale(${1 - p * .06})`; c.style.filter = `brightness(${1 - p * .08})`;
    });
  }

  /* services menu: rows swap the big photo; cycles until someone picks one */
  const rowsEl = $$('#svcMenu .mrow'), pics = $$('.menu__pic > img'), tagEl = $('#svcTag'); let si = 0, sTimer = null, picked = false;
  const cap = $('#svcCap'), nameEl = $('#svcName'), descEl = $('#svcDesc');
  const setSvc = i => {
    if (i === si && rowsEl[i].classList.contains('on')) return;
    si = i; rowsEl.forEach((r, j) => r.classList.toggle('on', j === i)); pics.forEach((p, j) => p.classList.toggle('on', j === i));
    if (tagEl) tagEl.textContent = rowsEl[i].dataset.tag;
    if (nameEl) nameEl.textContent = rowsEl[i].querySelector('b').textContent;
    if (descEl) descEl.textContent = rowsEl[i].dataset.desc || '';
    if (cap) { cap.classList.remove('go'); void cap.offsetWidth; cap.classList.add('go'); }
  };
  rowsEl.forEach((r, i) => { r.addEventListener('mouseenter', () => { picked = true; setSvc(i); }); r.addEventListener('click', () => { picked = true; setSvc(i); }); });
  if (rowsEl.length && !reduce) sTimer = setInterval(() => { if (!picked && !document.hidden) setSvc((si + 1) % rowsEl.length); }, 3600);

  /* quick quote builder: chips toggle, then pre-fill the quote form */
  $$('.pick').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !g.id) return;
    if (g.hasAttribute('data-single')) $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    else b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  }));
  const go = $('#qbGo');
  if (go) go.addEventListener('click', () => {
    const occ = ($('#qbOcc [aria-pressed="true"]') || {}).textContent || 'Wedding';
    const svc = $$('#qbSvc [aria-pressed="true"]').map(b => b.textContent);
    const qty = ($('input[name="qbQty"]:checked') || {}).value || '';
    const market = $('#qbMarket').value, date = $('#qbDate').value;
    const venue = occ === 'Hotel or venue' || qty === '';
    const tab = $(`#quoteForm [data-kind="${venue ? 'hospitality' : 'event'}"]`); if (tab) tab.click();
    if (market) $('#f-market').value = market;
    if (date) $('#f-date').value = date;
    if (qty && !venue) $('#f-qty').value = qty;
    const note = $('#formNote'); if (note) note.textContent = `From your builder: ${occ}${svc.length ? ' · ' + svc.join(', ') : ''}${market ? ' · ' + market : ''}.`;
    $('#qbNote').textContent = 'Done. Your choices are in the quote form below.';
    $('#quote').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* reviews */
  const slides = $$('#revSlides .rev__slide'), dotsBox = $('#revDots'); let ri = 0, rt;
  slides.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Review ${i + 1}`); b.addEventListener('click', () => show(i, true)); dotsBox.appendChild(b); });
  const dots = $$('button', dotsBox);
  function show(n, user) { ri = (n + slides.length) % slides.length; slides.forEach((s, i) => s.classList.toggle('on', i === ri)); dots.forEach((d, i) => d.setAttribute('aria-current', String(i === ri))); if (user) restart(); }
  const restart = () => { clearInterval(rt); if (!reduce) rt = setInterval(() => show(ri + 1), 6500); };
  $('#revPrev').addEventListener('click', () => show(ri - 1, true)); $('#revNext').addEventListener('click', () => show(ri + 1, true));
  show(0); restart();

  /* map: shapes and market buttons tied to pins */
  fetch('assets/markets-map.svg').then(r => r.ok ? r.text() : Promise.reject()).then(s => { $('#mapSvg').innerHTML = s.replace(' aria-hidden="true"', ''); }).catch(() => {});
  const pick = m => { $$('#markets [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $$('.mpin').forEach(p => p.classList.toggle('on', p.dataset.m === m)); };
  $$('#markets [data-m], .mpin').forEach(b => b.addEventListener('click', () => pick(b.dataset.m)));

  /* floating "let's talk" pill: shows after the hero, hides at the quote form */
  const talk = $('#talk'), heroEl = $('.hero'), quoteEl = $('#quote');
  function talkTick() {
    if (!talk) return;
    const past = heroEl.getBoundingClientRect().bottom < 0;
    const q = quoteEl.getBoundingClientRect(); const atQuote = q.top < innerHeight && q.bottom > 0;
    const f = $('.ftr').getBoundingClientRect(); const atFoot = f.top < innerHeight * .8;
    talk.classList.toggle('show', past && !atQuote && !atFoot);
  }

  /* footer newsletter (no backend yet) */
  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); const i = $('#newsMail'); if (i.value && i.checkValidity()) { i.value = ''; i.placeholder = 'Thanks, you are on the list'; } else i.focus(); });

  /* ---------- the coconut that tunnels ----------
     One coconut lives under the page. It surfaces in the section you are reading, dives when you move on,
     and bursts out of the next hole with a burrow trail, dirt and a little flag. */
  const stops = $$('.pop');
  const motionOff = reduce || matchMedia('(prefers-reduced-motion: reduce)').matches;
  stops.forEach(p => {
    const body = $('.pop__body', p);
    if (p.dataset.flag && body) { const f = document.createElement('span'); f.className = 'pop__flag' + (p.dataset.pink ? ' pop__flag--pink' : ''); const b = document.createElement('b'); b.textContent = p.dataset.flag; f.appendChild(b); body.appendChild(f); }
    const fx = document.createElement('span'); fx.className = 'pop__fx'; $('.pop__hole', p).appendChild(fx);
    p._zone = p.closest('section, footer') || document.body;
    p._dark = p.classList.contains('on-bg') || !!p.closest('.hero__panel, .quote__l');
  });
  if (motionOff) stops.forEach(p => p.classList.add('is-open', 'is-up', 'is-flag'));
  else if (stops.length) {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const rnd = (a, b) => a + Math.random() * (b - a);
    const shown = p => p.getClientRects().length > 0 && $('.pop__clip', p).offsetWidth > 0;
    const wOf = p => $('.pop__clip', p).offsetWidth;
    const holeAt = p => { const r = $('.pop__hole', p).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const stopsIn = z => stops.filter(s => s._zone === z && shown(s));
    async function play(el, kf, o) { const a = el.animate(kf, { fill: 'forwards', ...o }); try { await a.finished; } catch (e) {} try { a.commitStyles(); } catch (e) {} a.cancel(); }
    const spawn = (p, cls, css) => { const i = document.createElement('i'); if (cls) i.className = cls; i.style.cssText = css; $('.pop__fx', p).appendChild(i); return i; };
    const gone = (el, kf, o) => el.animate(kf, o).finished.then(() => el.remove(), () => el.remove());

    /* dirt flying out of the hole */
    function dirt(p, count, power = 1) {
      const w = wOf(p), cols = p._dark ? ['#DDF985', '#C9A574', '#FBF8F1', '#FF3193'] : ['#002217', '#6B4423', '#C9A574', '#FF3193'];
      for (let k = 0; k < count; k++) {
        const a = (-90 + rnd(-68, 68)) * Math.PI / 180, sp = w * rnd(.35, .95) * power, sz = rnd(4, 10);
        const dx = Math.cos(a) * sp, up = Math.sin(a) * sp;
        const s = spawn(p, '', `width:${sz}px;height:${sz * rnd(.55, 1.1)}px;background:${cols[k % cols.length]}`);
        gone(s, [
          { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * .62}px),calc(-50% + ${up}px)) rotate(${rnd(0, 360)}deg) scale(1)`, opacity: 1, offset: .42, easing: 'cubic-bezier(.4,0,.9,.6)' },
          { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${w * rnd(.05, .2)}px)) rotate(${rnd(200, 720)}deg) scale(.7)`, opacity: 0 }
        ], { duration: rnd(820, 1250), easing: 'cubic-bezier(.15,.75,.4,1)' });
      }
    }
    /* soft dust clouds rolling out sideways */
    function dust(p, count) {
      const w = wOf(p), col = p._dark ? 'rgba(251,248,241,.32)' : 'rgba(234,223,200,.95)';
      for (let k = 0; k < count; k++) {
        const side = k % 2 ? 1 : -1, sz = w * rnd(.16, .28);
        const s = spawn(p, 'pf', `width:${sz}px;height:${sz}px;background:${col}`);
        gone(s, [
          { transform: 'translate(-50%,-50%) scale(.3)', opacity: .95 },
          { transform: `translate(calc(-50% + ${side * w * rnd(.45, .85)}px),calc(-50% - ${w * rnd(.04, .22)}px)) scale(${rnd(1.1, 1.7)})`, opacity: 0 }
        ], { duration: rnd(700, 1000), easing: 'cubic-bezier(.2,.8,.3,1)', delay: k * 30 });
      }
    }
    /* shock ring on the ground */
    function ring(p) {
      const w = wOf(p), s = spawn(p, 'rg', `width:${w * 1.3}px;height:${w * .3}px;color:${p._dark ? 'rgba(221,249,133,.7)' : 'rgba(0,34,23,.35)'}`);
      gone(s, [{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.7)', opacity: 0 }], { duration: 750, easing: 'cubic-bezier(.2,.8,.3,1)' });
    }
    /* burrow trail: little mounds pop up along the route the coconut took underground */
    function trail(p, from) {
      const w = wOf(p), hh = holeAt(p); let vx, vy;
      const dx0 = from ? from.x - hh.x : 0, side = Math.abs(dx0) > 30 ? Math.sign(dx0) : (Math.random() < .5 ? -1 : 1);
      vx = side * w * 2.1; vy = -w * .38;
      const len = Math.hypot(vx, vy) || 1, L = Math.min(len, w * 2.3); vx = vx / len * L; vy = vy / len * L;
      const nx = -vy / L, ny = vx / L, bend = w * .28;
      const col = p._dark ? 'rgba(221,249,133,.55)' : 'rgba(0,34,23,.28)';
      const N = 10;
      for (let k = 0; k < N; k++) {
        const t = 1 - k / N, u = 1 - t;
        const x = 2 * u * t * (vx / 2 + nx * bend) + t * t * vx, y = 2 * u * t * (vy / 2 + ny * bend) + t * t * vy;
        const sz = w * (.05 + .03 * (k / N));
        const s = spawn(p, 'tr', `width:${sz * 1.6}px;height:${sz}px;background:${col}`);
        const at = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
        gone(s, [
          { transform: `${at} scale(0)`, opacity: 0 },
          { transform: `${at} scale(1.25)`, opacity: 1, offset: .14 },
          { transform: `${at} scale(1)`, opacity: 1, offset: .6 },
          { transform: `${at} scale(.6)`, opacity: 0 }
        ], { duration: 1500, delay: k * 42, easing: 'ease-out' });
      }
    }
    async function rumble(p) {
      dirt(p, 4, .35);
      await play($('.pop__hole', p), [{ translate: '0 0' }, { translate: '-3px 1px' }, { translate: '3px -1px' }, { translate: '-3px 0' }, { translate: '2px 1px' }, { translate: '-1px 0' }, { translate: '0 0' }], { duration: 360 });
    }
    const shake = el => el && el.animate([{ translate: '0 0' }, { translate: '0 4px' }, { translate: '0 -3px' }, { translate: '0 2px' }, { translate: '0 0' }], { duration: 380, easing: 'ease-out' });

    async function emerge(p, from) {
      const body = $('.pop__body', p);
      p.classList.add('is-open'); await wait(240);
      trail(p, from); await wait(420);
      await rumble(p);
      $$('.tr', $('.pop__fx', p)).forEach(el => el.animate([{ opacity: 0 }], { duration: 160, fill: 'forwards', composite: 'replace' }));
      p.classList.add('is-up'); body.style.rotate = '0deg';
      dirt(p, 16); ring(p);
      await play(body, [
        { transform: 'translateY(112%) scale(.84,1.16)', easing: 'cubic-bezier(.12,.85,.3,1)' },
        { transform: 'translateY(-26%) scale(.93,1.08)', offset: .42, easing: 'cubic-bezier(.55,0,.85,.45)' },
        { transform: 'translateY(0) scale(1.13,.87)', offset: .66, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translateY(-5%) scale(.97,1.03)', offset: .83, easing: 'ease-in-out' },
        { transform: 'translateY(0) scale(1,1)' }
      ], { duration: 1050 });
      dust(p, 4);
      p.classList.add('is-flag');
    }
    async function dive(p) {
      const body = $('.pop__body', p), side = Math.random() < .5 ? -1 : 1;
      p.classList.remove('is-flag'); await wait(200);
      p.classList.remove('is-up'); body.style.rotate = '0deg';
      const fall = play(body, [
        { transform: 'translateY(0) scale(1,1)', easing: 'cubic-bezier(.3,0,.5,1)' },
        { transform: 'translateY(3%) scale(1.14,.85)', offset: .24, easing: 'cubic-bezier(.15,.85,.35,1)' },
        { transform: `translateY(-32%) rotate(${side * 12}deg) scale(.93,1.09)`, offset: .52, easing: 'cubic-bezier(.6,0,.95,.45)' },
        { transform: `translateY(118%) rotate(${side * -28}deg) scale(.9,1.12)` }
      ], { duration: 760 });
      await wait(640); dust(p, 6); ring(p); dirt(p, 6, .5);
      await fall;
    }

    let cur = null, want = null, busy = false, lastPos = null, firstLand = true;
    async function run() {
      if (busy) return; busy = true;
      try {
        while (cur !== want) {
          if (cur) {
            const z = cur._zone, h0 = holeAt(cur);
            await dive(cur);
            lastPos = { x: h0.x, y: h0.y + scrollY }; cur = null;
            if (!want || want._zone !== z) { stops.forEach(s => { if (s._zone === z) s.classList.remove('is-open'); }); await wait(320); }
            else await wait(120);
            continue;
          }
          if (want) {
            const t = want;
            stopsIn(t._zone).forEach((s, i) => s !== t && setTimeout(() => s.classList.add('is-open'), 120 + i * 110));
            await emerge(t, lastPos);
            cur = t; cur._since = performance.now();
            if (firstLand) { firstLand = false; shake(t.closest('.hero__panel')); }
          }
        }
      } finally { busy = false; }
    }

    /* which section is the coconut in? the one whose hole sits nearest the middle of the screen */
    function pick() {
      const vh = innerHeight;
      const vis = stops.filter(shown).map(s => ({ s, y: holeAt(s).y })).filter(o => o.y > vh * .06 && o.y < vh * .985);
      if (!vis.length) { want = null; return; }
      const z0 = (want || cur) && (want || cur)._zone;
      if (z0 && vis.some(o => o.s._zone === z0)) return;
      vis.sort((a, b) => Math.abs(a.y - vh * .55) - Math.abs(b.y - vh * .55));
      const z = vis[0].s._zone;
      want = stopsIn(z).find(s => { const y = holeAt(s).y; return y > 0 && y < vh; }) || vis[0].s;
    }
    let pending = false;
    const onScroll = () => { if (pending) return; pending = true; setTimeout(() => { pending = false; pick(); run(); }, 80); };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
    setTimeout(() => { pick(); run(); }, 650);

    /* inside a section with several holes it hops between them (hero once through, the two cards on a loop) */
    setInterval(() => {
      if (busy || !cur || cur !== want || document.hidden) return;
      const list = stopsIn(cur._zone), loop = cur._zone.id === 'ways';
      if (list.length < 2 || performance.now() - cur._since < (loop ? 3800 : 2600)) return;
      const i = list.indexOf(cur); if (i === list.length - 1 && !loop) return;
      const nx = list[(i + 1) % list.length], y = holeAt(nx).y;
      if (y < innerHeight * .04 || y > innerHeight + 24) return;
      want = nx; run();
    }, 400);

    /* while it is out, it leans with your scroll speed and springs back */
    let lastY = scrollY, lastT = performance.now(), tilt = 0, tv = 0;
    (function lean(now) {
      const dt = Math.min(50, now - lastT) / 1000 || .016; lastT = now;
      const v = (scrollY - lastY) / dt; lastY = scrollY;
      const target = Math.max(-12, Math.min(12, -v * .01));
      tv += ((target - tilt) * 140 - tv * 13) * dt; tilt += tv * dt;
      if (cur && !busy && Math.abs(tilt) > .02) $('.pop__body', cur).style.rotate = tilt.toFixed(2) + 'deg';
      requestAnimationFrame(lean);
    })(performance.now());
  }

  /* ---------- logo tool: the 3D coconut from Variation A ---------- */
  const coco3d = (() => {
    const T = window.THREE, cv = $('#coco3d'), box = $('#toolStage');
    if (!T || !cv) return null;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return null; }
    document.documentElement.classList.add('has3d');
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.outputEncoding = T.sRGBEncoding;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(28, 1, .1, 50); cam.position.set(0, .95, 4.95); cam.lookAt(0, .8, 0);
    scene.add(new T.HemisphereLight(0xfff6e8, 0xb3a07c, .62));
    const key = new T.DirectionalLight(0xffeed6, .72); key.position.set(-2.8, 2.6, 3.2); scene.add(key);
    const rim = new T.DirectionalLight(0xe8ffd0, .3); rim.position.set(2.5, 1.5, -3); scene.add(rim);

    /* diamond-cut profile: flat base, straight body, faceted cone */
    const H = 1.42, prof = [];
    const rAt = y => y < .05 ? .5 + y * 2.4 : y < .16 ? .62 + (y - .05) * .7 : y < .84 ? .7 : y < 1.32 ? .7 - (y - .84) * 1.22 : Math.max(.004, .114 - (y - 1.32) * 1.1);
    prof.push(new T.Vector2(.001, 0));
    for (let i = 0; i <= 28; i++) { const y = i / 28 * H; prof.push(new T.Vector2(rAt(y), y)); }
    prof.push(new T.Vector2(.001, H + .01));
    const geo = new T.LatheGeometry(prof, 14, Math.PI, Math.PI * 2);
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, clamp(pos.getY(i) / H));
    geo.computeVertexNormals();

    /* texture: ivory husk with fibres, then the burned logo on the front */
    const tc = document.createElement('canvas'); tc.width = 2048; tc.height = 1024;
    const tx2 = tc.getContext('2d');
    const base = document.createElement('canvas'); base.width = 2048; base.height = 1024;
    (() => {
      const c = base.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0, '#EADCC1'); g.addColorStop(.12, '#F3E8D3'); g.addColorStop(.5, '#F6EDDC'); g.addColorStop(.86, '#EEE1C8'); g.addColorStop(.93, '#DCCDA6'); g.addColorStop(1, '#CDBF94');
      c.fillStyle = g; c.fillRect(0, 0, 2048, 1024);
      let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9000; i++) { const x = rnd() * 2048, y = rnd() * 1024, l = 6 + rnd() * 26; c.strokeStyle = `rgba(150,112,64,${.03 + rnd() * .07})`; c.lineWidth = .6 + rnd() * 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * 2, y + l); c.stroke(); }
    })();
    const tex = new T.CanvasTexture(tc); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const UNIT_IN = 4.6, CIRC = Math.PI * 2 * .7;
    let last = null;
    function paint(dt) {
      tx2.globalCompositeOperation = 'source-over'; tx2.drawImage(base, 0, 0);
      if (dt) {
        const wpx = dt.wIn / UNIT_IN / CIRC * 2048, hpx = dt.hIn / UNIT_IN / H * 1024;
        const cx = 1024, cy = (1 - .5 / H) * 1024;
        tx2.globalCompositeOperation = 'multiply'; tx2.globalAlpha = .55; tx2.filter = 'blur(1.4px)';
        tx2.drawImage(dt.burn, cx - wpx / 2, cy - hpx / 2, wpx, hpx);
        tx2.filter = 'none'; tx2.globalAlpha = .95; tx2.drawImage(dt.burn, cx - wpx / 2, cy - hpx / 2, wpx, hpx);
        tx2.globalAlpha = 1; tx2.globalCompositeOperation = 'source-over';
      }
      tex.needsUpdate = true;
    }
    paint(null);
    const mat = new T.MeshStandardMaterial({ map: tex, roughness: .92, metalness: 0, flatShading: true });
    const nut = new T.Mesh(geo, mat);
    const straw = new T.Mesh(new T.CylinderGeometry(.03, .03, .8, 16), new T.MeshStandardMaterial({ color: 0xff3193, roughness: .5 }));
    straw.position.set(.1, 1.52, .02); straw.rotation.z = -.32;
    const group = new T.Group(); group.add(nut, straw); scene.add(group);
    addEventListener('cs:render', e => { last = e.detail; paint(last); });

    /* size */
    const size = () => { const w = box.clientWidth; renderer.setSize(w, w, false); cam.aspect = 1; cam.updateProjectionMatrix(); };
    size(); addEventListener('resize', size);

    /* interaction: drag to spin, scroll to sway */
    let drag = 0, dragV = 0, down = false, px = 0, sway = 0;
    cv.addEventListener('pointerdown', e => { down = true; px = e.clientX; cv.classList.add('dragging'); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - px; px = e.clientX; drag += dx * .012; dragV = dx * .012; });
    const up = () => { down = false; cv.classList.remove('dragging'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    let t0 = performance.now(), visible = true;
    const sec = $('#preview');
    function loop(now) {
      const r = sec.getBoundingClientRect(); visible = r.bottom > 0 && r.top < innerHeight;
      if (visible) {
        const t = (now - t0) / 1000;
        if (!down) { drag += dragV; dragV *= .92; drag *= .965; }
        const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
        sway = reduce ? 0 : (p - .5) * 1.4;
        group.rotation.y = drag + sway + (reduce ? 0 : Math.sin(t * .6) * .12);
        group.position.y = reduce ? 0 : Math.sin(t * 1.2) * .035;
        group.rotation.z = reduce ? 0 : Math.sin(t * .9) * .02;
        renderer.render(scene, cam);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return { repaint: () => last && paint(last) };
  })();
  if (!coco3d) { const c = $('#coco3d'); if (c) c.remove(); $('.tool__hint')?.remove(); }
  window.CSTool && window.CSTool.render();

  const tick = () => { talkTick(); stackTick(); };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
})();
