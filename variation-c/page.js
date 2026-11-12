/* Variation C · page behaviour: hero letters, statement fill, accordion, reviews, pinned spin, map, work slider, 3D coconut */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = document.documentElement.classList.contains('rm');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

  /* reveal on scroll */
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
  $$('.rv, #howBox').forEach((el, i) => { if (io) { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); } else el.classList.add('in'); });

  /* hero: headline rises letter by letter */
  let k = 0;
  $$('[data-split]').forEach(ln => { ln.innerHTML = [...ln.textContent].map(c => c === ' ' ? ' ' : `<span class="ch" style="--i:${k++}">${c}</span>`).join(''); });

  /* statement: words fill in as you scroll */
  const st = $('#stateLine'); let words = [];
  if (st) { st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); words = $$('.w', st); }
  function stateTick() {
    if (!st) return;
    const r = st.getBoundingClientRect();
    const p = reduce ? 1 : clamp((innerHeight * .9 - r.top) / (innerHeight * .55));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }

  /* about accordion: one open at a time, photo follows */
  const items = $$('.acc__item'), pics = $$('#accPic img');
  items.forEach((it, i) => $('.acc__btn', it).addEventListener('click', () => {
    items.forEach((o, j) => { const on = j === i; o.classList.toggle('open', on); $('.acc__btn', o).setAttribute('aria-expanded', String(on)); });
    pics.forEach((p, j) => p.classList.toggle('on', j === i));
  }));

  /* reviews */
  const slides = $$('#revSlides .tst__slide'), dotsBox = $('#revDots'); let ri = 0, rt;
  slides.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Review ${i + 1}`); b.addEventListener('click', () => go(i, true)); dotsBox.appendChild(b); });
  const dots = $$('button', dotsBox);
  function go(n, user) { ri = (n + slides.length) % slides.length; slides.forEach((s, i) => s.classList.toggle('on', i === ri)); dots.forEach((d, i) => d.setAttribute('aria-current', String(i === ri))); if (user) restart(); }
  const restart = () => { clearInterval(rt); if (!reduce) rt = setInterval(() => go(ri + 1), 6500); };
  $('#revPrev').addEventListener('click', () => go(ri - 1, true)); $('#revNext').addEventListener('click', () => go(ri + 1, true));
  go(0); restart();

  /* spin: the coconut rises over the giant wordmark while the section is pinned */
  const spin = $('#spin'), word = $('#spinWord'), nut = $('#spinNut'), copy = $('#spinCopy'), tag = $('#spinTag');
  function spinTick() {
    if (!spin || reduce) return;
    const r = spin.getBoundingClientRect(), total = r.height - innerHeight;
    const p = clamp(-r.top / total);
    const ww = word.scrollWidth / 3;
    word.style.transform = `translate(${-p * ww * 1.1}px,-50%)`;
    const rise = smooth(p / .45);
    nut.style.transform = `translateY(${(1 - rise) * 70}vh) rotate(${(1 - rise) * -28 + Math.sin(p * Math.PI * 2) * 6}deg) scale(${.82 + rise * .18})`;
    copy.classList.toggle('in', p > .42);
    tag.classList.toggle('in', p > .3);
  }

  /* how it works: line drawing draws in when seen (class from the reveal observer) */

  /* our work: arrows */
  const wv = $('#workView');
  if (wv) {
    const stepW = () => { const c = $('.card', wv); return c ? c.getBoundingClientRect().width + 24 : 320; };
    $('#workPrev').addEventListener('click', () => wv.scrollBy({ left: -stepW(), behavior: 'smooth' }));
    $('#workNext').addEventListener('click', () => wv.scrollBy({ left: stepW(), behavior: 'smooth' }));
  }

  /* map: shapes, market list tied to pins */
  fetch('assets/markets-map.svg').then(r => r.ok ? r.text() : Promise.reject()).then(s => { $('#mapSvg').innerHTML = s.replace(' aria-hidden="true"', ''); }).catch(() => {});
  const pick = m => { $$('#markets [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $$('.mpin').forEach(p => p.classList.toggle('on', p.dataset.m === m)); };
  $$('#markets [data-m], .mpin').forEach(b => b.addEventListener('click', () => pick(b.dataset.m)));

  /* footer newsletter (no backend yet) */
  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); const i = $('#newsMail'); if (i.value && i.checkValidity()) { i.value = ''; i.placeholder = 'Thanks, you are on the list'; } else i.focus(); });

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

  const tick = () => { stateTick(); spinTick(); };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
})();
