/* Variation B · page behaviour: reveals, logo-tool steps, reviews, map, 3D coconut */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = document.documentElement.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

  /* reveal on scroll */
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.rv').forEach((el, i) => { if (io) { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); } else el.classList.add('in'); });

  /* ---------- logo tool: steps appear one by one as you scroll ---------- */
  const steps = $$('.step');
  function stepsTick() {
    let best = 0, bd = 1e9;
    steps.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < innerHeight * .8) s.classList.add('shown'); const d = Math.abs(r.top + r.height / 2 - innerHeight * .5); if (d < bd) { bd = d; best = i; } });
    steps.forEach((s, i) => s.classList.toggle('active', i === best));
  }

  /* reviews: one big quote at a time */
  const slides = $$('#revSlides .rev__slide'), dotsBox = $('#revDots'); let ri = 0, rt;
  slides.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Review ${i + 1}`); b.addEventListener('click', () => go(i, true)); dotsBox.appendChild(b); });
  const dots = $$('button', dotsBox);
  function go(n, user) { ri = (n + slides.length) % slides.length; slides.forEach((s, i) => s.classList.toggle('on', i === ri)); dots.forEach((d, i) => d.setAttribute('aria-current', String(i === ri))); if (user) restart(); }
  const restart = () => { clearInterval(rt); if (!reduce) rt = setInterval(() => go(ri + 1), 6000); };
  $('#revPrev').addEventListener('click', () => go(ri - 1, true)); $('#revNext').addEventListener('click', () => go(ri + 1, true));
  go(0); restart();

  /* map: shapes + market stamps tied to pins */
  fetch('assets/markets-map.svg').then(r => r.ok ? r.text() : Promise.reject()).then(s => { $('#mapSvg').innerHTML = s.replace(' aria-hidden="true"', ''); });
  const pick = m => { $$('#markets [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $$('.mpin').forEach(p => p.classList.toggle('on', p.dataset.m === m)); };
  $$('#markets [data-m], .mpin').forEach(b => b.addEventListener('click', () => pick(b.dataset.m)));

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

  /* ---------- hero: the tossed coconut and its bits drift as you scroll ---------- */
  const toss = $('#toss'), bitEls = $$('.bit');
  function heroTick() {
    if (reduce) return;
    const y = scrollY; if (y > innerHeight * 1.4) return;
    if (toss) toss.style.transform = `translate3d(0,${-y * .22}px,0) rotate(${y * .025}deg)`;
    bitEls.forEach(b => { b.style.transform = `translate3d(0,${y * parseFloat(b.dataset.k)}px,0)`; });
  }

  /* ---------- about: words fill in and the photos fan out as you scroll ---------- */
  const at = $('#aboutTitle'), fan = $('#fan'); let words = [];
  if (at) {
    $$('.ln', at).forEach(ln => { ln.innerHTML = ln.textContent.trim().split(/\s+/).map(w => `<span class="w${/name/i.test(w) ? ' hl' : ''}">${w}</span>`).join(' '); });
    words = $$('.w', at);
  }
  function aboutTick() {
    if (!at) return;
    const r = at.getBoundingClientRect();
    const p = clamp((innerHeight * .92 - r.top) / (innerHeight * .5));
    const lit = reduce ? words.length : Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    if (fan) {
      const fr = fan.getBoundingClientRect();
      const q = reduce ? 1 : smooth((innerHeight - fr.top) / (innerHeight * .75));
      fan.style.setProperty('--spread', (q * 34).toFixed(2));
      fan.style.setProperty('--fanr', (q * 11).toFixed(2));
    }
  }

  /* ---------- how it works: the connector line draws itself ---------- */
  const hl = $('#howLine');
  if (hl) {
    if (reduce || !('IntersectionObserver' in window)) hl.classList.add('drawn');
    else { const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { hl.classList.add('drawn'); o.disconnect(); } }), { rootMargin: '0px 0px -20% 0px' }); o.observe(hl); }
  }

  /* ---------- services slider: glides on its own forever, arrows nudge it ---------- */
  const sv = $('#svView'), svTrack = sv && $('.sv__track', sv);
  if (sv && svTrack) {
    // a second copy of the cards makes the loop seamless
    const originals = [...svTrack.children];
    originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); $$('a', k).forEach(a => a.tabIndex = -1); svTrack.appendChild(k); });
    const half = () => originals[originals.length - 1].offsetLeft + originals[originals.length - 1].offsetWidth + 16 - originals[0].offsetLeft;
    const stepW = () => originals[0].getBoundingClientRect().width + 16;
    let pos = 0, hold = false, nudge = null, last = performance.now();
    const SPEED = 38; // px per second
    const wrap = () => { const hw = half(); if (pos >= hw) pos -= hw; if (pos < 0) pos += hw; };
    const go = dir => { nudge = { from: pos, to: pos + dir * stepW(), t0: performance.now() }; };
    function frame(now) {
      const dt = Math.min(64, now - last) / 1000; last = now;
      if (nudge) {
        const k = clamp((now - nudge.t0) / 650); pos = nudge.from + (nudge.to - nudge.from) * (1 - Math.pow(1 - k, 3));
        if (k >= 1) nudge = null;
        wrap(); sv.scrollLeft = pos;
      } else if (!hold && !reduce && !document.hidden) { pos += SPEED * dt; wrap(); sv.scrollLeft = pos; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    $('#svPrev').addEventListener('click', () => go(-1));
    $('#svNext').addEventListener('click', () => go(1));
    // pause only while someone swipes on touch, then carry on from where they left it
    sv.addEventListener('touchstart', () => { hold = true; }, { passive: true });
    sv.addEventListener('touchend', () => { setTimeout(() => { pos = sv.scrollLeft; hold = false; }, 1200); }, { passive: true });
    sv.addEventListener('scroll', () => { if (hold) pos = sv.scrollLeft; }, { passive: true });
  }

  /* ---------- footer newsletter (no backend yet) ---------- */
  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); const i = $('#newsMail'); if (i.value && i.checkValidity()) { i.value = ''; i.placeholder = 'Thanks, you are on the list'; } else i.focus(); });

  const tick = () => { stepsTick(); heroTick(); aboutTick(); };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
})();
