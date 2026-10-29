const inputField = document.getElementById('function');

const cv=document.getElementById('c'),ctx=cv.getContext('2d'),hud=document.getElementById('hud'),calEl=document.getElementById('cal');
let img=null,W=0,H=0,dpr=1;
// view: centre in image pixels + zoom (screen px per image px)
const view={cx:0,cy:0,z:1};
// calibration: image px of origin and image px per math unit
const cal={ox:0,oy:0,sx:50,sy:50};
let target=null,anim=null;

function loadPhotoFromPath(src){
  const im = new Image();
  im.onload = () => { photo = im; draw(); };
  im.onerror = () => { hud.textContent = 'Could not load photo "' + src + '"'; };
  im.src = src;
}
window.loadPhotoFromPath = loadPhotoFromPath; 

const toImg=(x,y)=>({x:cal.ox+x*cal.sx,y:cal.oy-y*cal.sy});
const toMath=(px,py)=>({x:(px-cal.ox)/cal.sx,y:(cal.oy-py)/cal.sy});
const scrToImg=(sx,sy)=>({x:view.cx+(sx-W/2)/view.z,y:view.cy+(sy-H/2)/view.z});

function compileFunction(source) {
  const expression = source.trim();
  if (!expression) throw new Error('Enter an equation.');

  const evaluate = new Function('x', `"use strict"; return (${expression});`);
  return x => {
    const value = evaluate(x);
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('The equation must return a finite number.');
    }
    return value;
  };
}

let f = compileFunction('0');
const findDerivative = (fn, x, dx = 1e-5) => (fn(x + dx) - fn(x - dx)) / (2 * dx);
window.f = f;

function updateFunction() {
  try {
    f = compileFunction(inputField.value);
    window.f = f;
    inputField.style.outline = '';
    inputField.title = '';
  } catch (err) {
    inputField.style.outline = '2px solid #e5484d';  // keep the last valid f
    inputField.title = err.message;
  }
}

// Fires on every keystroke
inputField.addEventListener('input', updateFunction);

// Initialise from whatever is already in the box
if (inputField.value.trim()) updateFunction();

let photo = null;
const PHOTO_H = 60;   // photo height in screen px



loadPhotoFromPath('./roller.png');

function resize(){
  dpr=window.devicePixelRatio||1;
  const r=cv.getBoundingClientRect();W=r.width;H=r.height;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);draw();
}
window.addEventListener('resize',resize);
const displayText = document.getElementById('display');

function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  if(!img){return;}
  ctx.imageSmoothingQuality='high';
  ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(view.z,view.z);ctx.translate(-view.cx,-view.cy);
  ctx.drawImage(img,0,0);
  if(target){
    const p=toImg(target.x,target.y);
    ctx.lineWidth=2/view.z;ctx.strokeStyle='#e11d48';ctx.fillStyle='rgba(225,29,72,.25)';
    ctx.beginPath();ctx.arc(p.x,p.y,9/view.z,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  calPts.forEach((q,i)=>{
    ctx.fillStyle='#16a34a';ctx.beginPath();ctx.arc(q.px,q.py,5/view.z,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();
  // centre crosshair
   // tangent line at the curve point under the view centre
  const m = toMath(view.cx, view.cy);
  const fy = f(m.x), slope = findDerivative(f, m.x);
  if (isFinite(fy) && isFinite(slope)) {
    const p = toImg(m.x, fy);
    const px = W/2 + (p.x - view.cx) * view.z;
    const py = H/2 + (p.y - view.cy) * view.z;
    let dx = cal.sx, dy = -slope * cal.sy;
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const L = Math.hypot(W, H);
    //ctx.strokeStyle = 'rgba(225,29,72,.9)'; ctx.lineWidth = 2;
    //ctx.beginPath(); ctx.moveTo(px - dx*L, py - dy*L); ctx.lineTo(px + dx*L, py + dy*L); ctx.stroke();
   // ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
    hud.textContent = `x ${m.x.toFixed(2)}  ·  f(x) ${fy.toFixed(3)}  ·  slope ${slope.toFixed(4)}`;
        if (photo) {
      const h = PHOTO_H, w = h * photo.width / photo.height;
      ctx.save();
      ctx.translate(px, py);              // move origin to the curve point
      ctx.rotate(Math.atan2(dy, dx));     // rotate to match the tangent direction
      ctx.drawImage(photo, -w/2+12, -h/2, w/1.5, h/1.5); // bottom-centre of the photo sits on the line
      ctx.restore();
    }
  } else hud.textContent = `x ${m.x.toFixed(2)}`;
}

let resolveFly = null;

function flyTo(cx, cy, ms = 600){
  if (resolveFly) resolveFly();            // finish any interrupted move
  return new Promise(resolve => {
    resolveFly = resolve;
    const s = {cx: view.cx, cy: view.cy}, t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = now => {
      let k = Math.min(1, (now - t0) / ms); k = 1 - Math.pow(1 - k, 3);
      view.cx = s.cx + (cx - s.cx) * k;
      view.cy = s.cy + (cy - s.cy) * k;
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
      else { resolveFly = null; resolve(); }
    };
    anim = requestAnimationFrame(step);
  });
}

function goToXY(x, y, ms = 600){
  if (!img) return Promise.resolve();
  target = {x, y};
  const p = toImg(x, y);
  return flyTo(p.x, p.y, ms);
}

function goTo(){                           // the button still works
  const x = parseFloat(gx.value), y = parseFloat(gy.value);
  if (!isNaN(x) && !isNaN(y)) goToXY(x, y);
}

//const PRESET = {"ox":781.9341812069849,"oy":851.4943997922944,"sx":0.6637811213497392,"sy":0.6549306726367554}

function setImage(im){
  img = im;

   cal.ox = im.width/2; cal.oy = im.height/2; cal.sx = cal.sy = 50; 
  view.z = Math.min(W/im.width, H/im.height, 1) || 1;
  view.cx = cal.ox; view.cy = cal.oy; target = null; calPts.length = 0;
  draw();
}

// 1) from a File object (file input, drag-and-drop, or File System Access API)
function load(file){
  if(!file||!file.type.startsWith('image/')){hud.textContent='That is not an image file';return;}
  const fr=new FileReader();
  fr.onload=()=>{
    const im=new Image();
    im.onload=()=>setImage(im);
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}

// 2) from a path relative to the page (works when the HTML sits in the same folder
//    as the image, or when served from a local web server)
function loadFromPath(src){
  if(!src)return;
  const im=new Image();
  im.onload=()=>setImage(im);
  im.onerror=()=>{hud.textContent='Could not load "'+src+'" — browsers cannot read arbitrary system paths; use Open file… instead'};
  im.src=src;
}

// 3) native file dialog: showOpenFilePicker where supported, else the hidden input
async function openDialog(){
  if(window.showOpenFilePicker){
    try{
      const [h]=await window.showOpenFilePicker({types:[{description:'Images',accept:{'image/*':['.png','.jpg','.jpeg','.gif','.webp','.bmp']}}]});
      load(await h.getFile());return;
    }catch(err){if(err&&err.name==='AbortError')return;}
  }
  document.getElementById('file').click();
}

// zoom
function zoomBy(f,sx=W/2,sy=H/2){
  if(!img)return;
  const before=scrToImg(sx,sy);
  view.z=Math.max(.05,Math.min(40,view.z*f));
  view.cx=before.x-(sx-W/2)/view.z;view.cy=before.y-(sy-H/2)/view.z;draw();
}
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomBy(e.deltaY<0?1.1:1/1.1,e.clientX-r.left,e.clientY-r.top)},{passive:false});

// drag pan / calibration clicks
let drag=null;
cv.addEventListener('pointerdown',e=>{
  if(!img)return;
  cv.setPointerCapture(e.pointerId);
  drag={x:e.clientX,y:e.clientY,cx:view.cx,cy:view.cy,moved:false};
  cancelAnimationFrame(anim);
});
cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect();
  if(drag){
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
    view.cx=drag.cx-dx/view.z;view.cy=drag.cy-dy/view.z;draw();
  }
});
cv.addEventListener('pointerup',e=>{
  if(drag&&!drag.moved&&calStep>=0){
    const r=cv.getBoundingClientRect(),p=scrToImg(e.clientX-r.left,e.clientY-r.top);
    pickPoint(p.x,p.y);
  }
  drag=null;
});

// calibration: two clicked points with known coordinates
const calPts=[];let calStep=-1;
function calUI(html){calEl.innerHTML=html;calEl.classList.add('on');}
function startCal(){
  if(!img)return;
  calPts.length=0;calStep=0;cv.classList.add('cal');
  calUI('<span>Click a point of known coordinates on the graph (1 of 2). Zoom in for precision.</span><button id="cc">Cancel</button>');
  document.getElementById('cc').onclick=endCal;draw();
}
function endCal(){calStep=-1;calPts.length=0;cv.classList.remove('cal');calEl.classList.remove('on');draw();}
function pickPoint(px,py){
  const n=calStep+1;
  calUI(`<span>Point ${n} of 2 — its coordinates:</span><label>x</label><input id="cx" type="number" step="any"><label>y</label><input id="cy" type="number" step="any"><button class="primary" id="ok">Confirm</button><button id="cc">Cancel</button>`);
  calPts[calStep]={px,py};draw();
  document.getElementById('cc').onclick=endCal;
  document.getElementById('ok').onclick=()=>{
    const x=parseFloat(document.getElementById('cx').value),y=parseFloat(document.getElementById('cy').value);
    if(isNaN(x)||isNaN(y))return;
    calPts[calStep].x=x;calPts[calStep].y=y;
    if(calStep===0){
      calStep=1;
      calUI('<span>Now click a second point with a different x and y (2 of 2).</span><button id="cc">Cancel</button>');
      document.getElementById('cc').onclick=endCal;
    }else finishCal();
  };
}
function finishCal(){
  const [a,b]=calPts;
  if(a.x===b.x||a.y===b.y){calUI('<span>The two points need different x and different y values.</span><button id="cc">Retry</button>');document.getElementById('cc').onclick=startCal;return;}
  cal.sx=(b.px-a.px)/(b.x-a.x);
  cal.sy=(a.py-b.py)/(b.y-a.y);
  cal.ox=a.px-a.x*cal.sx;
  cal.oy=a.py+a.y*cal.sy;
  endCal();goTo();
  console.log('PRESET =', JSON.stringify({ox:cal.ox, oy:cal.oy, sx:cal.sx, sy:cal.sy}));
}


const gx=document.getElementById('gx'),gy=document.getElementById('gy');
document.getElementById('go').onclick=goTo;

gx.addEventListener('input', goTo);
[gx,gy].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')goTo()}));
document.getElementById('zi').onclick=()=>zoomBy(1.25);
document.getElementById('zo').onclick=()=>zoomBy(1/1.25);
document.getElementById('calbtn').onclick=startCal;
document.getElementById('file').onchange=e=>{if(e.target.files[0])load(e.target.files[0]);e.target.value=''};
document.getElementById('openbtn').onclick=openDialog;
const pathEl=document.getElementById('path');
document.getElementById('pathbtn').onclick=()=>loadFromPath(pathEl.value.trim());
//loadFromPath('./coaster.png');
const wrapEl=document.getElementById('wrap');
wrapEl.addEventListener('dragover',e=>e.preventDefault());
wrapEl.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)load(f);});
resize();

const sleep = ms => new Promise(r => setTimeout(r, ms));
let running = false;

// Finds x in [a, b] where the derivative crosses zero
function findFlatPoint(f, a, b, iterations = 40) {
  let lo = a, hi = b;
  const slopeLo = findDerivative(f, lo);
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const slopeMid = findDerivative(f, mid);
    if (Math.sign(slopeMid) === Math.sign(slopeLo)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

async function animationLoop(points, moveMs = 600, pauseMs = 300) {
  running = true;
  let prevX = null;
  let prevSlope = null;

  for (const [x, y] of points) {
    if (!running) break;
    const slope = findDerivative(f, x);

    // Did the slope change sign since the last point? Then a flat spot lies between.
    if (prevSlope !== null && Math.sign(slope) !== Math.sign(prevSlope) && prevSlope !== 0) {
      const xFlat = findFlatPoint(f, prevX, x);
      const yFlat = f(xFlat);

      await goToXY(xFlat, yFlat, moveMs / 2);       // go to the exact turning point
     displayText.innerHTML = `<h1>x = ${xFlat.toFixed(3)}</h1>`;
      await sleep(1000);                            // stop here
    }

    displayText.innerHTML = `<h1>${slope.toFixed(4)}</h1>`;

    // Still catches the case where a sampled point is already flat
    if (Math.abs(slope) <= 0.001) {
      displayText.innerHTML = `<h1>x = ${x.toFixed(3)}</h1>`;
      await goToXY(x, y, moveMs);
      await sleep(1000);
    } else {
      await goToXY(x, y, moveMs);
    }

    await sleep(pauseMs);
    prevX = x;
    prevSlope = slope;
  }
  running = false;
}

function stopAnimation(){ running = false; }

const playButton = document.querySelector('#playbtn');

playButton.addEventListener('click', () => {
  animationLoop(Array.from({length: 1000}, (_, x) => [x, f(x)]), 15, 0);
});
