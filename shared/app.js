/* Shared behaviour for all Coconut Stock homepage variations.
   Each page supplies the same element ids; anything missing is skipped. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  /* icons (Lucide, loaded from the CDN) */
  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': getComputedStyle(document.documentElement).getPropertyValue('--icon-stroke').trim() || 1.5 } });

  /* header: solid on scroll */
  const hdr = $('.hdr');
  if (hdr) { const f = () => hdr.classList.toggle('is-solid', scrollY > 16); on(window, 'scroll', f, { passive: true }); f(); }

  /* mobile menu */
  const burger = $('#burger'), mnav = $('#mnav');
  if (burger && mnav) {
    on(burger, 'click', () => { const open = mnav.hidden; mnav.hidden = !open; burger.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('nav-open', open); });
    $$('a', mnav).forEach(a => on(a, 'click', () => { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('nav-open'); }));
  }

  /* seamless marquees: duplicate children once */
  $$('[data-marquee]').forEach(t => { const n = t.children.length; t.innerHTML += t.innerHTML; [...t.children].slice(n).forEach(c => c.setAttribute('aria-hidden', 'true')); });

  /* hero reel: crossfading stills standing in for the hero video */
  const reel = $('#reel');
  if (reel) {
    const frames = $$('.reel__frame img', reel), cap = $('[data-reel-cap]', reel), btn = $('#reelPause');
    let i = 0, timer, paused = reduce;
    const show = n => { frames[i].classList.remove('on'); i = (n + frames.length) % frames.length; frames[i].classList.add('on'); if (cap) cap.textContent = frames[i].dataset.cap || ''; };
    const run = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), +reel.dataset.interval || 5000); };
    const set = p => { paused = p; reel.classList.toggle('paused', p); if (btn) { btn.setAttribute('aria-pressed', String(p)); btn.setAttribute('aria-label', p ? 'Play hero slideshow' : 'Pause hero slideshow'); const l = $('[data-label]', btn); if (l) l.textContent = p ? 'Play' : 'Pause'; } p ? clearInterval(timer) : run(); };
    on(btn, 'click', () => set(!paused));
    if (cap) cap.textContent = frames[0].dataset.cap || '';
    set(paused);
  }

  /* reveal-on-scroll fallback for browsers without scroll timelines (content is visible by default) */

  /* ---------- logo preview tool ---------- */
  const cv = $('#coco');
  if (cv) {
    const ctx = cv.getContext('2d'), W = cv.width, k = W / 600;
    const css = n => getComputedStyle(cv).getPropertyValue(n).trim();
    /* data-area="cx,cy,ppi" as fractions of canvas width maps the 3″ × 2.2″ brand area onto a photo */
    const geo = cv.dataset.area ? cv.dataset.area.split(',').map(Number) : null;
    const PPI = geo ? geo[2] * W : 70 * k;
    const AREA = geo ? { cx: geo[0] * W, cy: geo[1] * W, w: 3 * PPI, h: 2.2 * PPI } : { cx: W / 2, cy: W * 0.66, w: 3 * PPI, h: 2.2 * PPI };
    let photo = null;
    if (cv.dataset.photo) { photo = new Image(); photo.onload = () => render(); photo.src = cv.dataset.photo; }
    let scale = 0.8, mode = 'text', style = 'script', logoImg = null;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const fibres = Array.from({ length: 520 }, () => [rnd(), rnd(), rnd(), rnd()]);
    const P = (x, y) => [x * k, y * k];
    function shape(c) {
      c.beginPath(); c.moveTo(...P(300, 92)); c.lineTo(...P(352, 120)); c.lineTo(...P(412, 196));
      c.quadraticCurveTo(...P(470, 262), ...P(470, 330)); c.quadraticCurveTo(...P(490, 420), ...P(462, 500)); c.quadraticCurveTo(...P(450, 536), ...P(408, 538));
      c.lineTo(...P(192, 538)); c.quadraticCurveTo(...P(150, 536), ...P(138, 500)); c.quadraticCurveTo(...P(110, 420), ...P(130, 330));
      c.quadraticCurveTo(...P(130, 262), ...P(188, 196)); c.lineTo(...P(248, 120)); c.closePath();
    }
    function coconut() {
      if (photo && photo.complete && photo.naturalWidth) { ctx.drawImage(photo, 0, 0, W, W); return; }
      ctx.fillStyle = css('--coco-bg') || '#F4E4D8'; ctx.fillRect(0, 0, W, W);
      const disc = css('--coco-disc'); if (disc && disc !== 'none') { ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(...P(300, 315), 240 * k, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,34,23,.16)'; ctx.beginPath(); ctx.ellipse(...P(300, 546), 190 * k, 16 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); shape(ctx); ctx.clip();
      const g = ctx.createLinearGradient(130 * k, 0, 470 * k, 0);
      [[0, '#d9c29b'], [.18, '#f1e4c8'], [.5, '#fbf4e4'], [.82, '#efe0c2'], [1, '#cdb48a']].forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      const facet = (pts, a) => { ctx.fillStyle = a; ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(...P(...p)) : ctx.moveTo(...P(...p))); ctx.closePath(); ctx.fill(); };
      facet([[300, 92], [248, 120], [188, 196], [240, 250], [300, 150]], 'rgba(160,120,70,.16)');
      facet([[300, 92], [352, 120], [412, 196], [360, 250], [300, 150]], 'rgba(160,120,70,.26)');
      facet([[300, 150], [240, 250], [360, 250]], 'rgba(255,255,255,.35)');
      ctx.strokeStyle = 'rgba(140,100,55,.28)'; ctx.lineWidth = 1.5 * k; ctx.beginPath();
      [[[188, 196], [240, 250], [360, 250], [412, 196]], [[240, 250], [300, 150], [360, 250]], [[300, 92], [300, 150]]].forEach(l => l.forEach((p, n) => n ? ctx.lineTo(...P(...p)) : ctx.moveTo(...P(...p))));
      ctx.stroke();
      fibres.forEach(([x, y, l, a]) => { ctx.strokeStyle = `rgba(150,110,60,${0.05 + a * 0.08})`; ctx.lineWidth = (0.6 + a) * k; const px = (130 + x * 340) * k, py = (250 + y * 285) * k; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (a - .5) * 3 * k, py + (6 + l * 16) * k); ctx.stroke(); });
      ctx.restore();
      shape(ctx); ctx.strokeStyle = 'rgba(0,34,23,.3)'; ctx.lineWidth = 1.5 * k; ctx.stroke();
      ctx.fillStyle = '#e8d2a6'; ctx.beginPath(); ctx.ellipse(...P(300, 100), 26 * k, 10 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const straw = css('--coco-straw'); if (straw && straw !== 'none') { ctx.save(); ctx.translate(...P(304, 100)); ctx.rotate(.32); ctx.fillStyle = straw; ctx.fillRect(-6 * k, -118 * k, 12 * k, 122 * k); ctx.restore(); }
    }
    function burn(src, w, h) {
      const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w)); o.height = Math.max(1, Math.round(h));
      const c = o.getContext('2d'); c.drawImage(src, 0, 0, o.width, o.height);
      const d = c.getImageData(0, 0, o.width, o.height), p = d.data;
      let t = 0; for (let i = 3; i < p.length; i += 16) if (p[i] < 200) t++;
      const alpha = t > p.length / 64 * 0.05;
      for (let i = 0; i < p.length; i += 4) {
        const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2], a = p[i + 3] / 255;
        let ink = alpha ? a * Math.min(1, (255 - lum) / 120 + 0.25) : Math.max(0, Math.min(1, (225 - lum) / 150));
        if (alpha && lum > 235) ink *= 0.2;
        p[i] = 112; p[i + 1] = 62; p[i + 2] = 30; p[i + 3] = Math.round(ink * 235);
      }
      c.putImageData(d, 0, 0);
      if (photo) { /* follow the curve of the husk: the burn softens toward the edges */
        const g = c.createLinearGradient(0, 0, o.width, 0);
        g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.18, '#000'); g.addColorStop(.82, '#000'); g.addColorStop(1, 'rgba(0,0,0,.55)');
        c.globalCompositeOperation = 'destination-in'; c.fillStyle = g; c.fillRect(0, 0, o.width, o.height);
      }
      return o;
    }
    function lettering() {
      const t = (($('#txtInput') || {}).value || 'Your name').trim() || 'Your name';
      const o = document.createElement('canvas'), c = o.getContext('2d');
      const font = style === 'script' ? `400 160px ${css('--coco-script') || 'cursive'}` : `700 120px ${css('--coco-bold') || 'sans-serif'}`;
      c.font = font;
      const parts = t.includes('&') && t.length > 12 ? t.split('&').map((x, n) => (n ? '& ' : '') + x.trim()) : [t];
      const lh = style === 'script' ? 150 : 124; let mw = 0; parts.forEach(x => mw = Math.max(mw, c.measureText(style === 'bold' ? x.toUpperCase() : x).width));
      o.width = Math.ceil(mw + 40); o.height = Math.ceil(lh * parts.length + 50);
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
      parts.forEach((x, n) => c.fillText(style === 'bold' ? x.toUpperCase() : x, o.width / 2, 25 + lh * (n + .5)));
      return o;
    }
    function render() {
      coconut();
      const art = mode === 'file' && logoImg ? logoImg : lettering();
      const aw = art.naturalWidth || art.width, ah = art.naturalHeight || art.height;
      const fit = Math.min(AREA.w / aw, AREA.h / ah) * scale, w = aw * fit, h = ah * fit, b = burn(art, w, h);
      /* let other views (e.g. a 3D coconut) use the same burned artwork */
      window.dispatchEvent(new CustomEvent('cs:render', { detail: { burn: b, wIn: w / PPI, hIn: h / PPI } }));
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.filter = 'blur(1.6px)'; ctx.globalAlpha = .55; ctx.drawImage(b, AREA.cx - w / 2, AREA.cy - h / 2, w, h);
      ctx.filter = 'none'; ctx.globalAlpha = .95; ctx.drawImage(b, AREA.cx - w / 2, AREA.cy - h / 2, w, h);
      ctx.restore();
      const dim = $('#dim'); if (dim) dim.textContent = `${(w / PPI).toFixed(1)}″ × ${(h / PPI).toFixed(1)}″ of 3″ × 2.2″`;
      if ($('#smaller')) $('#smaller').disabled = scale <= 0.41;
      if ($('#larger')) $('#larger').disabled = scale >= 0.99;
      try { if ($('#thumb')) $('#thumb').src = cv.toDataURL('image/jpeg', .8); } catch (e) {}
    }
    on($('#smaller'), 'click', () => { scale = Math.max(0.4, +(scale - 0.1).toFixed(2)); render(); });
    on($('#larger'), 'click', () => { scale = Math.min(1, +(scale + 0.1).toFixed(2)); render(); });
    on($('#another'), 'click', () => $('#logoFile').click());
    on($('#txtToggle'), 'click', () => { mode = 'text'; $('#txtMode').hidden = false; $('#txtInput').focus(); render(); });
    on($('#txtInput'), 'input', () => { mode = 'text'; render(); });
    $$('[data-style]').forEach(b => on(b, 'click', () => { style = b.dataset.style; $$('[data-style]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); render(); }));
    const drop = $('#drop'), fileIn = $('#logoFile');
    function load(f) {
      if (!f) return;
      const label = $('[data-drop-title]', drop), small = $('[data-drop-hint]', drop);
      if (f.type === 'application/pdf') { label.textContent = 'PDF received'; small.textContent = 'PDF previews come in the live build. Try PNG, JPG or SVG here.'; return; }
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => { logoImg = img; mode = 'file'; $('#txtMode').hidden = true; label.textContent = f.name; small.textContent = 'Drop another file to replace it'; render(); }; img.src = r.result; };
      r.readAsDataURL(f);
    }
    on(fileIn, 'change', () => load(fileIn.files[0]));
    ['dragenter', 'dragover'].forEach(e => on(drop, e, ev => { ev.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(e => on(drop, e, ev => { ev.preventDefault(); drop.classList.remove('is-over'); }));
    on(drop, 'drop', ev => load(ev.dataTransfer.files[0]));
    const mailbox = $('#mailbox'), toast = $('#mailToast');
    on($('#mailToggle'), 'click', () => { mailbox.hidden = !mailbox.hidden; if (!mailbox.hidden) $('#mailInput').focus(); });
    on(mailbox, 'submit', e => { e.preventDefault(); const v = $('#mailInput').value.trim(); toast.hidden = false;
      toast.textContent = /\S+@\S+\.\S+/.test(v) ? `Prototype: the live site emails this preview to ${v}.` : 'Enter an email address like you@company.com.'; });
    /* optional extras: sample logos, a size slider, and a small API for page scripts */
    const loadUrl = (url, name) => { const img = new Image(); img.onload = () => { logoImg = img; mode = 'file'; if ($('#txtMode')) $('#txtMode').hidden = true; const t = drop && $('[data-drop-title]', drop); if (t && name) t.textContent = name; render(); }; img.src = url; };
    $$('[data-sample-src]').forEach(b => on(b, 'click', () => { loadUrl(b.dataset.sampleSrc, b.dataset.sampleName); $$('[data-sample-src],[data-sample-text]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    $$('[data-sample-text]').forEach(b => on(b, 'click', () => {
      mode = 'text'; style = b.dataset.sampleStyle || 'script';
      if ($('#txtInput')) $('#txtInput').value = b.dataset.sampleText;
      if ($('#txtMode')) $('#txtMode').hidden = false;
      $$('[data-style]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.style === style)));
      $$('[data-sample-src],[data-sample-text]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    const range = $('#sizeRange');
    if (range) { range.value = Math.round(scale * 100); on(range, 'input', () => { scale = +range.value / 100; render(); }); }
    const _render = render;
    render = function () { _render(); if (range) range.value = Math.round(scale * 100); };
    window.CSTool = { render: () => render(), loadUrl };
    render();
    if (document.fonts) document.fonts.ready.then(() => render());
  }

  /* ---------- quote form ---------- */
  const form = $('#quoteForm');
  if (form) {
    const tabs = $$('[data-kind]', form), note = $('#formNote');
    const notes = { event: 'Goes to the events team for your market.', hospitality: 'Goes to the hospitality team. We ask about delivery days next.', other: 'Goes to our general inbox.' };
    let kind = 'event';
    const set = k => { kind = k; tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.kind === k))); $$('[data-for]', form).forEach(f => f.hidden = !f.dataset.for.split(' ').includes(k)); if (note) note.textContent = notes[k]; };
    tabs.forEach(t => on(t, 'click', () => set(t.dataset.kind)));
    $$('[data-tab]').forEach(a => on(a, 'click', () => set(a.dataset.tab)));
    on($('#f-logo'), 'change', e => $('#f-logo-name').textContent = e.target.files[0]?.name || 'No file chosen');
    on($('#useDesign'), 'click', () => { set('event'); $('#f-logo-name').textContent = 'coconut-preview.png (from the logo preview)'; });
    on(form, 'submit', e => {
      e.preventDefault();
      const name = $('#f-name'), email = $('#f-email');
      if (!name.value.trim()) { name.focus(); name.setAttribute('aria-invalid', 'true'); return; }
      if (!/\S+@\S+\.\S+/.test(email.value)) { email.focus(); email.setAttribute('aria-invalid', 'true'); return; }
      const market = kind === 'other' ? '' : ` for ${$('#f-market').value}`;
      $('#doneText').textContent = `Thanks, ${name.value.trim().split(' ')[0]}. On the live site this goes to the ${kind === 'other' ? 'general' : kind === 'event' ? 'events' : 'hospitality'} team${market}.`;
      $('#formBody').hidden = true; $('#formDone').hidden = false;
    });
    on($('#formReset'), 'click', () => { form.reset(); $('#f-logo-name').textContent = 'No file chosen'; $$('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid')); $('#formBody').hidden = false; $('#formDone').hidden = true; set('event'); });
    set('event');
  }

  /* ---------- custom: hover image follow for list rows (data-follow) ---------- */
  $$('[data-follow]').forEach(list => {
    const pic = $('[data-follow-img]', list); if (!pic || reduce || matchMedia('(hover: none)').matches) return;
    $$('[data-img]', list).forEach(row => {
      on(row, 'mouseenter', () => { pic.src = row.dataset.img; pic.alt = row.dataset.alt || ''; list.classList.add('is-hovering'); });
      on(row, 'mouseleave', () => list.classList.remove('is-hovering'));
    });
    on(list, 'mousemove', e => { const r = list.getBoundingClientRect(); pic.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%)`; });
  });

  /* ---------- custom: horizontal scroll track driven by vertical scroll (data-hscroll) ---------- */
  $$('[data-hscroll]').forEach(sec => {
    const track = $('[data-hscroll-track]', sec); if (!track) return;
    const size = () => { const extra = Math.max(0, track.scrollWidth - innerWidth); sec.style.height = matchMedia('(min-width: 900px)').matches && !reduce ? `${innerHeight + extra}px` : ''; return extra; };
    let extra = size();
    on(window, 'resize', () => { extra = size(); });
    const move = () => { if (!sec.style.height) { track.style.transform = ''; return; } const r = sec.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); track.style.transform = `translateX(${-p * extra}px)`; };
    on(window, 'scroll', move, { passive: true }); move();
  });
})();
