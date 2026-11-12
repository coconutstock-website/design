/* Variation A · Grove — motion and interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = document.documentElement.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const below = el => el.getBoundingClientRect().top > innerHeight * .9;
  const progress = (el, pinned) => { const r = el.getBoundingClientRect(); return pinned ? clamp(-r.top / (r.height - innerHeight)) : clamp((innerHeight - r.top) / (innerHeight + r.height)); };

  /* hero wordmark: letters blur into focus */
  let d = .45;
  $$('[data-split]').forEach(el => {
    if (el.dataset.delay) d = +el.dataset.delay;
    const txt = el.textContent; el.textContent = '';
    [...txt].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.style.animationDelay = `${d.toFixed(2)}s`; d += .055; el.append(s); });
  });

  /* headings: *word* is italic; words rise out of a mask */
  const heads = [];
  $$('[data-words]').forEach(h => {
    let italic = false, i = 0;
    h.innerHTML = h.textContent.trim().split(/\s+/).map(w => {
      let open = false, close = false;
      if (w.startsWith('*')) { open = true; w = w.slice(1); }
      if (/\*[?.!,]?$/.test(w)) { close = true; w = w.replace(/\*([?.!,]?)$/, '$1'); }
      if (open) italic = true;
      const inner = italic ? `<em>${w}</em>` : w;
      if (close) italic = false;
      return `<span class="w"><span style="--i:${i++}">${inner}</span></span>`;
    }).join(' ');
    if (!reduce && below(h)) { h.classList.add('pre'); heads.push(h); }
  });

  /* smooth scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id === '#') return;
    const el = id === '#top' ? document.body : $(id); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : el, { offset: -72, duration: 1.8 });
    else (id === '#top' ? scrollTo(0, 0) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }));

  /* header */
  const hdr = $('.hdr'), hero = $('#hero'); let lastY = 0;
  function headerTick(y) {
    hdr.classList.toggle('is-light', y > hero.offsetHeight * .7);
    if (y > lastY + 2 && y > hero.offsetHeight && !document.body.classList.contains('nav-open')) hdr.classList.add('is-hidden');
    if (y < lastY - 2) hdr.classList.remove('is-hidden');
    lastY = y;
  }
  $('#burger')?.addEventListener('click', () => { lenis && (document.body.classList.contains('nav-open') ? lenis.stop() : lenis.start()); });

  /* hero shrinks into a frame as you leave */
  const media = $('#heroMedia'), hbody = $('.hero__body'), chapter = $('.hero__chapter');
  function heroTick(y) {
    if (reduce) return;
    const p = clamp(y / hero.offsetHeight), e = easeOut(p);
    hero.style.clipPath = p > 0 ? `inset(${(e * 16).toFixed(1)}px round ${(e * 28).toFixed(1)}px)` : '';
    media.style.transform = `translate3d(0, ${(p * 22).toFixed(2)}%, 0) scale(${(1 + p * .08).toFixed(4)})`;
    hbody.style.opacity = (1 - p * 1.6).toFixed(3); hbody.style.transform = `translateY(${(-p * 70).toFixed(1)}px)`;
    chapter.style.opacity = (1 - p * 2).toFixed(3);
  }

  /* logo ticker */
  const tk = $('#ticker'); let tx = 0, vel = 0, prevY = scrollY;
  if (tk) { tk.innerHTML += tk.innerHTML; [...tk.children].slice(tk.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true')); }
  (function tickerLoop() {
    if (!tk || reduce) return;
    vel += ((scrollY - prevY) - vel) * .1; prevY = scrollY;
    tx -= .35 + Math.min(10, Math.abs(vel) * .25);
    const half = tk.scrollWidth / 2; if (-tx >= half) tx += half;
    tk.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
    requestAnimationFrame(tickerLoop);
  })();

  /* headings reveal + depth inside frames */
  let pendH = heads.slice();
  function revealTick() { pendH = pendH.filter(h => { if (h.getBoundingClientRect().top < innerHeight * .86) { h.classList.remove('pre'); return false; } return true; }); }
  const para = reduce ? [] : $$('[data-par]');
  function paraTick() { para.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return; img.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * -.08).toFixed(1)}px`; }); }

  /* ---------- our work: one lane of four photos that change as you scroll ---------- */
  const collage = $('#work'), cpin = $('.collage__pin'), stage = $('#stage'), frs = $$('.fr', stage);
  const sets = stage.dataset.sets.split('|'), setLabel = $('#setLabel');
  let curSet = 0;
  const setCaps = () => frs.forEach(f => { const img = f.querySelectorAll('img')[curSet]; f.querySelector('.cap').textContent = img.dataset.t; f.setAttribute('aria-label', `Open photo: ${img.dataset.t}`); });
  function showSet(n) {
    if (n === curSet) return;
    curSet = n; setCaps();
    $('#setName').textContent = sets[n]; $('#setNum').textContent = `0${n + 1} / 0${sets.length}`;
    setLabel.dataset.i = n; setLabel.classList.remove('swap'); void setLabel.offsetWidth; setLabel.classList.add('swap');
  }
  setCaps();
  /* the photos in each frame sit in a vertical reel; scroll scrubs the reel, so the change is smooth
     in both directions every time. Each frame trails the one before it a little, so they ripple. */
  const nSets = sets.length, reelA = frs.map(() => 0), reelT = frs.map(() => 0); let reelRaf = 0;
  const hold = x => { x = clamp(x, 0, nSets - 1); const b = Math.min(nSets - 2, Math.floor(x)), f = x - b, t = clamp((f - .18) / .64); return b + t * t * t * (t * (t * 6 - 15) + 10); };
  function renderReel() {
    frs.forEach((f, k) => f.querySelectorAll('img').forEach((im, j) => { im.style.transform = `translate3d(0,${((j - reelA[k]) * 100).toFixed(3)}%,0)`; }));
  }
  function reelLoop() {
    let moving = false;
    reelA.forEach((a, k) => { const d = reelT[k] - a; if (Math.abs(d) < .0006) reelA[k] = reelT[k]; else { reelA[k] = a + d * .09; moving = true; } });
    renderReel();
    reelRaf = moving ? requestAnimationFrame(reelLoop) : 0;
  }
  function collageTick() {
    const r = collage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const pinned = getComputedStyle(cpin).position === 'sticky';
    const p = pinned ? clamp(-r.top / (r.height - innerHeight)) : progress(collage);
    $('#setBar').style.setProperty('--p', `${(p * 100).toFixed(1)}%`);
    const raw = p * (nSets - 1) * 1.1 - .05;
    frs.forEach((f, k) => { reelT[k] = hold(raw - k * .06); });
    showSet(Math.round(hold(raw - .09)));
    if (reduce) { reelT.forEach((t, k) => reelA[k] = Math.round(t)); renderReel(); return; }
    if (!reelRaf) reelRaf = requestAnimationFrame(reelLoop);
  }

  /* ---------- paths: two panels; the open one widens and shows its details ---------- */
  const pathEls = $$('#pathsGrid .path');
  const openPath = p => pathEls.forEach(x => { const on = x === p; x.classList.toggle('on', on); x.setAttribute('aria-expanded', String(on)); });
  pathEls.forEach(p => {
    p.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) openPath(p); });
    p.addEventListener('click', e => { if (!p.classList.contains('on')) { e.preventDefault(); openPath(p); } });
    p.addEventListener('focusin', () => openPath(p));
    p.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === p) openPath(p); });
  });

  /* lightbox for the collage */
  const lb = $('#lb'), lbImg = $('#lbImg'); let li = 0, list = [], lastFocus = null;
  const showLb = i => { li = (i + list.length) % list.length; const im = list[li]; lbImg.src = im.src; lbImg.alt = im.alt; $('#lbTitle').textContent = im.dataset.t; $('#lbKind').textContent = sets[curSet]; $('#lbCount').textContent = `${String(li + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`; };
  const closeLb = () => { lb.hidden = true; lenis && lenis.start(); lastFocus && lastFocus.focus(); };
  frs.forEach((f, i) => f.addEventListener('click', () => { list = frs.map(x => x.querySelectorAll('img')[curSet]); lastFocus = f; showLb(i); lb.hidden = false; lenis && lenis.stop(); $('#lbClose').focus(); }));
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => showLb(li - 1));
  $('#lbNext').addEventListener('click', () => showLb(li + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb__img')) closeLb(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') showLb(li + 1); if (e.key === 'ArrowLeft') showLb(li - 1); });
  let sx = null; lb.addEventListener('pointerdown', e => sx = e.clientX); lb.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) showLb(li + (e.clientX < sx ? 1 : -1)); sx = null; });

  /* ---------- logo tool: steps + a 3D coconut ---------- */
  const steps = $('#steps'), stepEls = $$('[data-step]');
  if (steps && innerWidth > 1023) steps.classList.add('js');
  function stepsTick() {
    if (!steps.classList.contains('js')) return;
    let best = 0, bestD = 1e9;
    stepEls.forEach((s, i) => { const r = s.getBoundingClientRect(); const dd = Math.abs(r.top + r.height / 2 - innerHeight * .5); if (dd < bestD) { bestD = dd; best = i; } });
    stepEls.forEach((s, i) => s.classList.toggle('active', i === best));
  }

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

  /* ---------- how it works: a coconut rolls along the track ---------- */
  const how = $('#how'), howPin = $('.how__pin'), hcs = $$('.hc'), track = $('#track'), tlFill = $('#tlFill'), tlHead = $('#tlHead'), stops = $$('span', track);
  function howTick() {
    const r = how.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const pinned = getComputedStyle(howPin).position === 'sticky';
    const p = reduce ? 1 : pinned ? clamp(-r.top / (r.height - innerHeight)) : clamp((innerHeight * .8 - r.top) / (r.height * .8));
    const w = track.clientWidth - 48, x = clamp(p / .8) * w;
    tlFill.style.width = `${x + 48}px`; tlHead.style.transform = `translateX(${x}px) rotate(${(x * .9).toFixed(1)}deg)`;
    stops.forEach(s => s.classList.toggle('on', x + 48 >= s.offsetLeft + s.offsetWidth / 2 - 30));
    hcs.forEach((c, i) => {
      if (reduce) { c.style.opacity = ''; c.style.transform = ''; return; }
      const t = easeOut(clamp((p - (.06 + i * .2)) / .2));
      const float = Math.sin((p * 2 + i * .7) * Math.PI) * 10 * (i % 2 ? -1 : 1);
      c.style.opacity = (.15 + .85 * t).toFixed(3);
      c.style.transform = `translateY(${((1 - t) * 120 + float * t).toFixed(1)}px)`;
    });
  }

  /* ---------- services: pinned story, one service per scroll step ---------- */
  const story = $('#services'), storyPin = $('.story__pin'), sItems = $$('#storyList li'), sImgs = $$('#storyMedia img'), sCard = $('#storyCard');
  const SV = [
    ['Custom-branded <em>coconuts</em>', 'Young Thai coconuts, trimmed by hand and heat-branded with your logo, names or monogram.'],
    ['<em>Straws</em>', 'A straw for every coconut, chosen to suit your event.'],
    ['Opening <em>service</em>', 'Our team opens every coconut on site, fresh, right before it is served.'],
    ['Serving <em>service</em>', 'Staff who hand a coconut to every guest, so you can enjoy the day.'],
    ['<em>Delivery</em>', 'Local delivery in our five markets, and nationwide shipping everywhere else.'],
    ['Custom <em>cart</em>', 'A styled coconut cart, set up on site and branded for your event.']
  ];
  let sCur = -1;
  function showService(n) {
    if (n === sCur) return;
    const prev = sCur; sCur = n;
    sItems.forEach((li, i) => { li.classList.toggle('on', i === n); li.style.setProperty('--c', li.dataset.c); });
    sImgs.forEach((im, i) => { im.classList.toggle('prev', i === prev); if (i !== n) im.classList.remove('on'); });
    const im = sImgs[n]; void im.offsetWidth; im.classList.add('on');
    sCard.style.setProperty('--c', sItems[n].dataset.c);
    $('#storyH').innerHTML = SV[n][0]; $('#storyP').textContent = SV[n][1];
  }
  showService(0);
  sItems.forEach((li, i) => li.addEventListener('click', () => {
    const top = story.getBoundingClientRect().top + scrollY, span = story.offsetHeight - innerHeight;
    const y = top + span * (i + .5) / sItems.length;
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));
  function storyTick() {
    const r = story.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const pinned = getComputedStyle(storyPin).position === 'sticky';
    const p = pinned ? clamp(-r.top / (r.height - innerHeight)) : progress(story);
    showService(Math.min(sItems.length - 1, Math.floor(p * sItems.length * .999)));
  }

  /* ---------- where we deliver: fly to a market ---------- */
  const map = $('#map'), world = $('#mapWorld'), card = $('.dcard');
  const MK = {
    all: { k: 'Five markets', n: 'Where we deliver', t: 'Miami and South Florida, Orlando, Tampa, Houston and The Bahamas. Nationwide shipping everywhere else.' },
    miami: { k: 'Home market', n: 'Miami & South Florida', t: 'Where it all started. Local delivery for events, hotels and restaurants.' },
    orlando: { k: 'Central Florida', n: 'Orlando', t: 'Local delivery for weddings, events and venues.' },
    tampa: { k: 'Gulf coast', n: 'Tampa', t: 'Local delivery for weddings, events and venues.' },
    houston: { k: 'Texas', n: 'Houston', t: 'Local delivery for events, hotels and restaurants.' },
    nassau: { k: 'Islands', n: 'The Bahamas', t: 'Branded coconuts for island resorts and events.' }
  };
  let current = 'all';
  fetch('assets/markets-map.svg').then(r => r.ok ? r.text() : Promise.reject()).then(svg => { const b = $('#mapSvg'); b.setAttribute('aria-hidden', 'true'); b.innerHTML = svg.replace(' aria-hidden="true"', ''); }).catch(() => { $('#mapSvg').innerHTML = '<img src="assets/markets-map.svg" alt="" style="width:100%;height:100%">'; });
  function layoutMap() { const W = map.clientWidth, H = map.clientHeight, wh = W * 720 / 1200; world.style.top = `${Math.round((H - wh) / 2)}px`; focus(current, true); }
  function focus(m, instant) {
    current = m;
    const W = map.clientWidth, H = map.clientHeight, top = parseFloat(world.style.top) || 0, wh = W * 720 / 1200;
    const mobile = innerWidth < 600;
    /* free area: right of the card on desktop, above it on phones */
    const cr = card.getBoundingClientRect(), mr = map.getBoundingClientRect();
    const fx1 = mobile ? 16 : cr.right - mr.left + 40, fx2 = W - 40, fy1 = 60, fy2 = mobile ? cr.top - mr.top - 30 : H - 50;
    const pos = p => [parseFloat(p.style.left) / 100 * W, parseFloat(p.style.top) / 100 * wh];
    let s, tx, ty;
    if (m === 'all') {
      const pts = $$('.pin', world).map(pos);
      const x1 = Math.min(...pts.map(p => p[0])), x2 = Math.max(...pts.map(p => p[0])), y1 = Math.min(...pts.map(p => p[1])), y2 = Math.max(...pts.map(p => p[1]));
      s = Math.min((fx2 - fx1 - 60) / (x2 - x1), (fy2 - fy1) / (y2 - y1), 1.6);
      tx = (fx1 + fx2) / 2 - (x1 + x2) / 2 * s; ty = (fy1 + fy2) / 2 + 16 - top - (y1 + y2) / 2 * s;
    } else {
      const [px, py] = pos($(`.pin[data-m="${m}"]`, world));
      s = mobile ? 2.6 : 2.2;
      tx = (fx1 + fx2) / 2 - px * s; ty = (fy1 + fy2) / 2 + 20 - top - py * s;
    }
    if (instant) world.style.transition = 'none';
    world.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s})`;
    world.style.setProperty('--inv', (1 / s).toFixed(3));
    if (instant) requestAnimationFrame(() => world.style.transition = '');
    map.classList.toggle('is-all', m === 'all');
    $$('.pin', world).forEach(p => p.classList.toggle('on', p.dataset.m === m || (m === 'all' && p.dataset.m === 'miami')));
    const dd = MK[m]; $('#mkK').textContent = dd.k; $('#mkName').textContent = dd.n; $('#mkText').textContent = dd.t;
    $('#mapAll').hidden = m === 'all';
  }
  $$('.pin', world).forEach(b => b.addEventListener('click', () => focus(b.dataset.m === current ? 'all' : b.dataset.m)));
  $('#mapAll').addEventListener('click', () => focus('all'));
  addEventListener('resize', layoutMap); layoutMap();

  /* ---------- reviews: one card at a time travels bottom-left to top-right ----------
     the current card is deep green, the next ones light green, the passed ones white */
  const rev = $('#reviews'), rbox = $('#rbox'), rcards = $$('.rcard', rbox);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = a => `rgb(${a.join(',')})`;
  const C_GREEN = [0, 34, 23], C_LIME = [221, 249, 133], C_WHITE = [255, 255, 255];
  /* scroll sets a target; every frame the deck eases toward it, so the motion never jumps */
  let revA = 0, revT = 0, revRaf = 0;
  function renderDeck(a) {
    const n = rcards.length, W = rbox.clientWidth, H = rbox.clientHeight, mobile = W < 700;
    const cx = mobile ? W * .5 : W * .6, cy = mobile ? H * .7 : H * .5;
    const dx = mobile ? W * .12 : Math.min(W * .2, 300), dy = mobile ? H * .16 : Math.min(H * .28, 220);
    rcards.forEach((c, i) => {
      const d = i - a, ad = Math.abs(d);
      const x = cx - c.offsetWidth / 2 - d * dx, y = cy - c.offsetHeight / 2 + d * dy;
      const s = 1 - Math.min(ad, 2) * .1;
      c.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)}) rotate(${(-d * 2).toFixed(3)}deg)`;
      c.style.opacity = (mobile && d < 0 ? clamp(1.6 + d) : clamp(2.1 - ad)).toFixed(3);
      c.style.zIndex = String(100 - Math.round(ad * 10));
      c.style.background = rgb(d >= 0 ? mix(C_GREEN, C_LIME, clamp(d)) : mix(C_GREEN, C_WHITE, clamp(-d)));
      c.style.color = rgb(mix(C_LIME, C_GREEN, clamp(ad)));
    });
    $('#revNum').textContent = `0${Math.round(a) + 1} / 0${n}`;
    $('#revBar').style.setProperty('--p', `${((a + 1) / n * 100).toFixed(1)}%`);
  }
  function deckLoop() {
    revA += (revT - revA) * .075;
    if (Math.abs(revT - revA) < .0008) revA = revT;
    renderDeck(revA);
    revRaf = revA === revT ? 0 : requestAnimationFrame(deckLoop);
  }
  function reviewsTick() {
    if (reduce) return;
    const r = rev.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp(-r.top / (r.height - innerHeight)), n = rcards.length;
    /* a short rest on each card, then a soft glide to the next */
    const raw = p * (n - 1), base = Math.floor(raw), f = raw - base;
    const t = clamp((f - .12) / .76), ease = t * t * t * (t * (t * 6 - 15) + 10);
    revT = Math.min(n - 1, base + ease);
    if (!revRaf) revRaf = requestAnimationFrame(deckLoop);
  }
  if (!reduce) renderDeck(0);

  const tick = () => { const y = scrollY; headerTick(y); heroTick(y); revealTick(); paraTick(); collageTick(); stepsTick(); howTick(); storyTick(); reviewsTick(); };
  if (lenis) lenis.on('scroll', tick); else addEventListener('scroll', tick, { passive: true });

  /* ---------- even rhythm: the same space between every section's visible content ----------
     Pinned sections keep spare screen height inside their pin, so CSS padding alone can't make
     the gaps equal. Measure each section's content edges and set its top margin so every gap
     equals --s9 (120 desktop, 88 tablet, 64 phone). */
  const blocks = [$('.ticker'), ...$$('main > section:not(.hero)'), $('footer.ftr')].filter(Boolean);
  const pinOf = s => s.querySelector(':scope > .collage__pin, :scope > .how__pin, :scope > .story__pin, :scope > .rev__pin');
  function contentBox(host) {
    const hr = host.getBoundingClientRect(); let t = Infinity, b = -Infinity;
    (function walk(el) {
      for (const c of el.children) {
        const cs = getComputedStyle(c);
        if (c.classList.contains('shade') || cs.display === 'none') continue;
        const r = c.getBoundingClientRect(); if (!r.height) continue;
        if (c.classList.contains('wrap') && cs.paddingTop === '0px' && cs.paddingBottom === '0px') { walk(c); continue; }
        t = Math.min(t, r.top - hr.top); b = Math.max(b, r.bottom - hr.top);
      }
    })(host);
    return { t, b, h: hr.height };
  }
  function edges(s) {
    const top = s.getBoundingClientRect().top + scrollY;
    if (s.classList.contains('ticker') || s.classList.contains('ftr')) return { top, bottom: top + s.offsetHeight };
    const pin = pinOf(s);
    if (pin && getComputedStyle(pin).position === 'sticky') { const c = contentBox(pin); return { top: top + c.t, bottom: top + s.offsetHeight - (c.h - c.b) }; }
    const c = contentBox(s); return { top: top + c.t, bottom: top + c.b };
  }
  function evenSpacing() {
    const G = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s9')) || 120;
    blocks.forEach(b => b.style.marginTop = '');
    const e = blocks.map(edges);
    blocks.forEach((b, i) => { if (i) b.style.marginTop = `${Math.round(G - (e[i].top - e[i - 1].bottom))}px`; });
  }
  evenSpacing();
  let spT; const respace = () => { clearTimeout(spT); spT = setTimeout(() => { evenSpacing(); tick(); }, 120); };
  addEventListener('load', respace); addEventListener('resize', respace);
  document.fonts && document.fonts.ready.then(respace);
  addEventListener('resize', tick); tick();
})();
