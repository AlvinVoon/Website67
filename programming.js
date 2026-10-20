    const $ = (id) => document.getElementById(id);
    const viewer = $('viewer'), stage = $('stage');

    // ---- Settings ----
    const HIGHLIGHT_COLOR = '#ff3b30';  // border colour of the focused shape
    const HIGHLIGHT_WIDTH = 4;          // border width in screen pixels
    const FOCUS_FILL = 0.55;            // how much of the screen the focused shape fills
    const MAX_SCALE = 12;
    const STEP = 150;                   // pixels per up/down/left/right move
    const ZOOM_STEP = 1.4;
    const AUTO_MS = 1000;               // time per shape in auto mode

    let svg, shapes = [], index = -1, iw = 0, ih = 0;
    let scale = 1, x = 0, y = 0, timer = null;
    let current = null, savedStyle = '';

    // ---- Load SVG inline ----
   fetch('foodv3.svg')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then((text) => {
    stage.innerHTML = text;
    svg = stage.querySelector('svg');
    const vb = svg.viewBox && svg.viewBox.baseVal;
    iw = (vb && vb.width) || parseFloat(svg.getAttribute('width')) || 800;
    ih = (vb && vb.height) || parseFloat(svg.getAttribute('height')) || 600;
    svg.setAttribute('width', iw);
    svg.setAttribute('height', ih);

    // ---- 1. Build the shapes list (the version from the previous step) ----
    const SHAPE_TAGS = 'path,rect,circle,ellipse,polygon';
    const MIN_THICKNESS = 0.03;

    shapes = [...svg.querySelectorAll(SHAPE_TAGS)]
      .filter((el) => !el.closest('defs,clipPath,mask,symbol,pattern,marker'))
      .filter((el) => {
        const fill = getComputedStyle(el).fill;
        return fill && fill !== 'none' && fill !== 'transparent';
      })
      .filter((el) => {
        const b = el.getBBox();
        const long = Math.max(b.width, b.height), short = Math.min(b.width, b.height);
        return long > 0 && short / long >= MIN_THICKNESS;
      });

    // ---- 2. Method 1: ids and ordering goes HERE ----
   shapes.forEach((el, i) => { if (!el.id) el.id = 'shape-' + (i + 1); });

const ROW_TOLERANCE = 20;   // px: shapes within this vertical distance count as the same row

// Each segment: after = a number (tour stops so far) OR an id (after that shape is visited),
// list = the ids to visit in exactly this order. Position order resumes after the list ends.
const SEGMENTS = [
  { after: 'shape-13', list: ['shape-11', 'shape-17'] },   // e.g. the triangle bit
    { after: 'shape-29', list: ['shape-30', 'shape-31', 'shape-24', 'shape-25'] },
];

// Base order: top to bottom, then left to right
const pos = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top }; };
const byPosition = [...shapes].sort((a, b) => {
  const pa = pos(a), pb = pos(b);
  return Math.abs(pa.y - pb.y) > ROW_TOLERANCE ? pa.y - pb.y : pa.x - pb.x;
});

const byId = new Map(shapes.map((el) => [el.id, el]));
const reserved = new Set(SEGMENTS.flatMap((s) => s.list));        // ids handled by lists
let remaining = byPosition.filter((el) => !reserved.has(el.id));  // position-ordered pool
const result = [];
const phase = new Map();

const take = (el, p) => { result.push(el); phase.set(el.id, p); };

for (const seg of SEGMENTS) {
  // Position phase: consume from the pool until the segment's start point
  if (typeof seg.after === 'number') {
    while (result.length < seg.after && remaining.length) take(remaining.shift(), 'position');
  } else {
    const i = remaining.findIndex((el) => el.id === seg.after);
    if (i === -1 && !phase.has(seg.after)) console.warn('Segment start id not found:', seg.after);
    else if (i !== -1) remaining.splice(0, i + 1).forEach((el) => take(el, 'position'));
  }
  // List phase: your exact order
  seg.list.forEach((id) => {
    const el = byId.get(id);
    if (!el) return console.warn('List id not found:', id);
    take(el, 'list');
  });
}
remaining.forEach((el) => take(el, 'position'));   // back to position order for the rest

shapes = result;
console.table(shapes.map((el, i) => ({ tour: i + 1, id: el.id, phase: phase.get(el.id) })));
  })
  .catch((e) => {
    $('count').textContent = 'Load failed: ' + e.message + ' (use a local server, not file://)';
  });
    // ---- Camera ----
    function apply(instant) {
      if (instant) stage.style.transition = 'none';
      stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      if (instant) { stage.getBoundingClientRect(); stage.style.transition = ''; }
    }

    function overview(instant) {
      unhighlight();
      index = -1;
      const vw = viewer.clientWidth, vh = viewer.clientHeight;
      scale = Math.min(vw / iw, vh / ih) * 0.95;
      x = (vw - iw * scale) / 2;
      y = (vh - ih * scale) / 2;
      apply(instant);
      updateCount();
    }

    function focusShape(el, instant) {
      const vw = viewer.clientWidth, vh = viewer.clientHeight;
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
      const k = s.width / stage.offsetWidth;          // current stage scale (works mid-animation)
      const bx = (r.left - s.left) / k, by = (r.top - s.top) / k;
      const bw = Math.max(r.width / k, 1), bh = Math.max(r.height / k, 1);

      scale = Math.min(MAX_SCALE, (vw * FOCUS_FILL) / bw, (vh * FOCUS_FILL) / bh);
      x = vw / 2 - (bx + bw / 2) * scale;
      y = vh / 2 - (by + bh / 2) * scale;
      apply(instant);
    }

    // ---- Highlight ----
    function unhighlight() {
      if (current) current.style.cssText = savedStyle;
      current = null;
    }
    function highlight(el) {
      unhighlight();
      current = el;
      savedStyle = el.style.cssText;
      el.style.stroke = HIGHLIGHT_COLOR;
      el.style.strokeWidth = HIGHLIGHT_WIDTH + 'px';
      el.style.strokeOpacity = 1;
      el.style.vectorEffect = 'non-scaling-stroke';   // border stays the same size at any zoom
    }

    // ---- Tour ----
    function updateCount() {
     $('count').textContent = index < 0
    ? 'Overview'
    : `${index + 1} / ${shapes.length} · ${shapes[index].id}`;
    console.log('Current shape:', index < 0 ? 'overview' : shapes[index].id);   
    }
    function go(i) {
      if (!shapes.length) return;
      if (i < 0 || i >= shapes.length) return overview();   // wrap through the overview
      index = i;
      focusShape(shapes[i]);
      highlight(shapes[i]);
      updateCount();
    }
    const next = () => go(index + 1);
    const prev = () => go(index < 0 ? shapes.length - 1 : index - 1);

    function toggleAuto() {
      if (timer) { clearInterval(timer); timer = null; $('play').textContent = '▶ Auto'; }
      else { next(); timer = setInterval(next, AUTO_MS); $('play').textContent = '❚❚ Pause'; }
    }

    // ---- Preset moves ----
    const pan = (dx, dy) => { x += dx; y += dy; apply(); };
    function zoom(f) {
      const vw = viewer.clientWidth / 2, vh = viewer.clientHeight / 2;
      const ns = Math.min(MAX_SCALE * 3, Math.max(0.05, scale * f)), r = ns / scale;
      x = vw - (vw - x) * r; y = vh - (vh - y) * r; scale = ns; apply();
    }
const VIDEO_MS_PER_SHAPE = 2600;   // time spent on each shape in the video
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let recording = false;

async function exportVideo() {
  if (recording || !shapes.length) return;
  if (timer) toggleAuto();   // stop auto-play if it's running

  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 }, audio: false, preferCurrentTab: true
    });
  } catch (e) {
    $('count').textContent = 'Recording cancelled';
    return;
  }

  recording = true;
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const finished = new Promise((res) => (rec.onstop = res));

  // If the user clicks the browser's "Stop sharing", end gracefully
  let aborted = false;
  stream.getVideoTracks()[0].onended = () => {
    aborted = true;
    if (rec.state !== 'inactive') rec.stop();
  };

  document.body.classList.add('recording');
  overview(true);
  await sleep(600);          // let the panels disappear before recording starts
  rec.start();
  await sleep(1000);         // short hold on the overview

  for (let i = 0; i < shapes.length && !aborted; i++) {
    go(i);
    await sleep(VIDEO_MS_PER_SHAPE);
  }
  if (!aborted) { overview(); await sleep(1500); }   // zoom back out at the end

  if (rec.state !== 'inactive') rec.stop();
  await finished;
  stream.getTracks().forEach((t) => t.stop());
  document.body.classList.remove('recording');
  recording = false;
  updateCount();

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
  a.download = 'programming-tour.webm';
  a.click();
  URL.revokeObjectURL(a.href);
}
    // ---- Wiring ----
    $('export').onclick = exportVideo;
    $('next').onclick = next;
    $('prev').onclick = prev;
    $('play').onclick = toggleAuto;
    $('up').onclick = () => pan(0, STEP);
    $('down').onclick = () => pan(0, -STEP);
    $('left').onclick = () => pan(STEP, 0);
    $('right').onclick = () => pan(-STEP, 0);
    $('zoomIn').onclick = () => zoom(ZOOM_STEP);
    $('zoomOut').onclick = () => zoom(1 / ZOOM_STEP);
    $('reset').onclick = () => overview();

    window.addEventListener('keydown', (e) => {
        if (recording) return;
      const map = {
        ArrowUp: () => pan(0, STEP), ArrowDown: () => pan(0, -STEP),
        ArrowLeft: () => pan(STEP, 0), ArrowRight: () => pan(-STEP, 0),
        '+': () => zoom(ZOOM_STEP), '=': () => zoom(ZOOM_STEP), '-': () => zoom(1 / ZOOM_STEP),
        '0': () => overview(),
        ' ': () => (e.shiftKey ? prev() : next()),
        n: next, p: prev, a: toggleAuto
      };
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    });

    window.addEventListener('resize', () => {
      if (index < 0) overview(true); else focusShape(shapes[index], true);
    });


    