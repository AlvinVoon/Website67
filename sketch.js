let A, B, C;
let mainCam;
let camAnim = null; // holds active animation state, or null when idle
let font;
let targetCoordinates = [0, 0, 800];

let lastYaw = null;
let lastPitch = null;
let lastRoll = null;

let ABase = [];
let BBase = [];

let saved;

let operation;

let index = -1;

// Controls whether the yellow Vector C is drawn. Only true when the
// currently-loaded entry (or the live/unsaved state) actually has vector3 data.
let showVectorC = true;

let animatedList = [];
const cameraX = document.querySelector('#cameraX');
const cameraY = document.querySelector('#cameraY');
const cameraZ = document.querySelector('#cameraZ');
const keyFrameBtn = document.querySelector('#keyframe');
const playBtn = document.querySelector('#play');
const saveBtn = document.querySelector('#save');
const deleteBtn = document.querySelector('#deleteSaved');
const resetBtn = document.querySelector('#reset');
const addSlideBtn = document.querySelector('#addSlide');

const documentBody = document.querySelector('body');

const addBtn = document.querySelector('#addOperater');
const dotproductBtn = document.querySelector('#dotOperater');
const crossProductBtn = document.querySelector('#crossOperater');

const vector1Heading = document.querySelector('#vector1heading');
const vector1Length = document.querySelector('#vector1length');
const vector1Z = document.querySelector('#vector1z');

const vector2Heading = document.querySelector('#vector2heading');
const vector2Length = document.querySelector('#vector2length');
const vector2Z = document.querySelector('#vector2z');

const vector3Heading = document.querySelector('#vector3heading');
const vector3Length = document.querySelector('#vector3length');
const vector3Z = document.querySelector('#vector3z');

const DisplayList = document.querySelector('.list');

const previousBtn = document.querySelector('.previousBtn');
const forwardBtn = document.querySelector('.forwardBtn');

const observerA = document.querySelector('#observerA');
const observerB = document.querySelector('#observerB');

const questionTextbox = document.querySelector('.questionText');

const pAx = document.querySelector('#pAx'), pAy = document.querySelector('#pAy'), pAz = document.querySelector('#pAz');
const pBx = document.querySelector('#pBx'), pBy = document.querySelector('#pBy'), pBz = document.querySelector('#pBz');
const pCx = document.querySelector('#pCx'), pCy = document.querySelector('#pCy'), pCz = document.querySelector('#pCz');
const pDx = document.querySelector('#pDx'), pDy = document.querySelector('#pDy'), pDz = document.querySelector('#pDz');
const volumeOutput = document.querySelector('#volumeOutput');

let pointA, pointB, pointC, pointD;
let boxEdges = null; // { AB, AC, AD, volume }, or null

function applyPointParameters() {
  pointA = createVector(Number(pAx.value), Number(pAy.value), Number(pAz.value));
  pointB = createVector(Number(pBx.value), Number(pBy.value), Number(pBz.value));
  pointC = createVector(Number(pCx.value), Number(pCy.value), Number(pCz.value));
  pointD = createVector(Number(pDx.value), Number(pDy.value), Number(pDz.value));

  boxEdges = parallelepipedFromPoints(pointA, pointB, pointC, pointD);
  volumeOutput.textContent = `Volume: ${boxEdges.volume.toFixed(3)}`;
}

[pAx, pAy, pAz, pBx, pBy, pBz, pCx, pCy, pCz, pDx, pDy, pDz]
  .forEach(input => input.addEventListener('input', applyPointParameters));

function drawTriangle3D(v1, v2, v3, fillColour, strokeColour = null, baseX = 0, baseY = 0, baseZ = 0) {
  push();
  if (strokeColour) {
    stroke(strokeColour);
    strokeWeight(1.5);
  } else {
    noStroke();
  }
  fill(fillColour);

  beginShape(TRIANGLES);
  vertex(baseX + v1.x, baseY + v1.y, baseZ + (v1.z ?? 0));
  vertex(baseX + v2.x, baseY + v2.y, baseZ + (v2.z ?? 0));
  vertex(baseX + v3.x, baseY + v3.y, baseZ + (v3.z ?? 0));
  endShape(CLOSE);
  pop();
}

function drawParallelepiped(a, b, c, colour, baseX = 0, baseY = 0, baseZ = 0) {
  // 8 vertices of the parallelepiped, relative to the base point
  const verts = [
    { x: 0, y: 0, z: 0 },                                   // 0: origin
    { x: a.x, y: a.y, z: a.z ?? 0 },                         // 1: a
    { x: b.x, y: b.y, z: b.z ?? 0 },                         // 2: b
    { x: c.x, y: c.y, z: c.z ?? 0 },                         // 3: c
    { x: a.x + b.x, y: a.y + b.y, z: (a.z ?? 0) + (b.z ?? 0) },             // 4: a+b
    { x: a.x + c.x, y: a.y + c.y, z: (a.z ?? 0) + (c.z ?? 0) },             // 5: a+c
    { x: b.x + c.x, y: b.y + c.y, z: (b.z ?? 0) + (c.z ?? 0) },             // 6: b+c
    { x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: (a.z ?? 0) + (b.z ?? 0) + (c.z ?? 0) } // 7: a+b+c
  ];

  // 12 edges, as pairs of vertex indices
  const edges = [
    [0, 1], [0, 2], [0, 3],   // from origin
    [1, 4], [1, 5],           // from a
    [2, 4], [2, 6],           // from b
    [3, 5], [3, 6],           // from c
    [4, 7], [5, 7], [6, 7]    // to the far corner
  ];

  push();
  strokeCap(ROUND);
  stroke(colour);
  strokeWeight(1.5);
  noFill();

  for (const [i, j] of edges) {
    const p1 = verts[i];
    const p2 = verts[j];
    line(
      baseX + p1.x, baseY + p1.y, baseZ + p1.z,
      baseX + p2.x, baseY + p2.y, baseZ + p2.z
    );
  }
  pop();
}

// Optional: fills each of the 6 faces of the parallelepiped semi-transparently,
// using drawTriangle3D twice per face. Call after drawParallelepiped for a
// solid look, or instead of it if you don't want the wireframe.
function fillParallelepipedFaces(a, b, c, fillColour, baseX = 0, baseY = 0, baseZ = 0) {
  const az = a.z ?? 0, bz = b.z ?? 0, cz = c.z ?? 0;
  const O  = { x: 0, y: 0, z: 0 };
  const A_ = { x: a.x, y: a.y, z: az };
  const B_ = { x: b.x, y: b.y, z: bz };
  const C_ = { x: c.x, y: c.y, z: cz };
  const AB = { x: a.x + b.x, y: a.y + b.y, z: az + bz };
  const AC = { x: a.x + c.x, y: a.y + c.y, z: az + cz };
  const BC = { x: b.x + c.x, y: b.y + c.y, z: bz + cz };
  const ABC = { x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: az + bz + cz };

  const faces = [
    [O, A_, AB, B_],   // bottom (spanned by a, b)
    [C_, AC, ABC, BC], // top (offset by c)
    [O, A_, AC, C_],   // front (spanned by a, c)
    [B_, AB, ABC, BC], // back
    [O, B_, BC, C_],   // left (spanned by b, c)
    [A_, AB, ABC, AC]  // right
  ];

  for (const [p1, p2, p3, p4] of faces) {
    drawTriangle3D(p1, p2, p3, fillColour, null, baseX, baseY, baseZ);
    drawTriangle3D(p1, p3, p4, fillColour, null, baseX, baseY, baseZ);
  }
}

function parallelepipedFromPoints(A, B, C, D) {
  const AB = createVector(B.x - A.x, B.y - A.y, B.z - A.z);
  const AC = createVector(C.x - A.x, C.y - A.y, C.z - A.z);
  const AD = createVector(D.x - A.x, D.y - A.y, D.z - A.z);

  // Scalar triple product: AB . (AC x AD)
  const cross = p5.Vector.cross(AC, AD);
  const volume = Math.abs(AB.dot(cross));

  return { AB, AC, AD, volume };
}

addSlideBtn.addEventListener('click', function () {
  const slide = document.createElement('div');
  slide.classList.add('blank-slide');
  documentBody.append(slide);

})

observerA.addEventListener('change', (event) => {
  if (event.target.checked) {
    observerB.checked = false;
    ABase = [A.x, A.y];
    B = B.mult(-1);
  } else {
    ABase = [];
  }
});
observerB.addEventListener('change', (event) => {
  if (event.target.checked) {
    observerA.checked = false;
    BBase = [B.x, B.y];
    A = A.mult(-1);
  } else {
    BBase = [];
  }
});
previousBtn.addEventListener('mouseenter', function () {
  previousBtn.style.opacity = '0.67';
});

// Restore full opacity when mouse moves away
previousBtn.addEventListener('mouseleave', function () {
  previousBtn.style.opacity = '0.1';
});

function loadSavedEntry(entryIndex) {
  const entry = saved[entryIndex];
  if (!entry) {
    return;
  }

  index = entryIndex;

  vector1Heading.value = entry[0][0];
  vector1Length.value = entry[0][1];
  vector1Z.value = entry[0][2] ?? 0;
  vector2Heading.value = entry[1][0];
  vector2Length.value = entry[1][1];
  vector2Z.value = entry[1][2] ?? 0;

  const hasVector3 = Array.isArray(entry[2]);
  const vector3 = hasVector3 ? entry[2] : [1, 200, 0];
  vector3Heading.value = vector3[0];
  vector3Length.value = vector3[1];
  vector3Z.value = vector3[2] ?? 0;

  A = angleDrawer(entry[0][0], entry[0][1], entry[0][2] ?? 0);
  B = angleDrawer(entry[1][0], entry[1][1], entry[1][2] ?? 0);
  C = angleDrawer(vector3[0], vector3[1], vector3[2] ?? 0);

  // Only draw Vector C for entries that actually have vector3 data saved.
  showVectorC = hasVector3;

  const metadataIndex = hasVector3 ? 3 : 2;
  questionTextbox.innerText = entry[metadataIndex] ?? 'No saved entries';

  operation = entry[metadataIndex + 1] ?? 0;
  R = null;
  projVector = null;
  crossVector = null;

  const savedPoints = entry[metadataIndex + 2];
  if (Array.isArray(savedPoints) && savedPoints.length === 4) {
    const pointInputs = [
      [pAx, pAy, pAz],
      [pBx, pBy, pBz],
      [pCx, pCy, pCz],
      [pDx, pDy, pDz]
    ];
    pointInputs.forEach((inputs, pointIndex) => {
      inputs.forEach((input, coordinateIndex) => {
        input.value = savedPoints[pointIndex][coordinateIndex];
      });
    });
    // Recompute boxEdges/volume from the restored points so the display
    // always matches what's actually loaded, rather than trusting a
    // separately-stored number that could drift out of sync.
    applyPointParameters();
  } else {
    // This entry has no saved parallelepiped data — clear the stale display
    // instead of leaving the previous entry's volume showing.
    boxEdges = null;
    volumeOutput.textContent = 'Volume: —';
  }

  if (operation === 1) {
    addVector();
  } else if (operation === 2) {
    dotVectorOperation();
  } else if (operation === 3) {
    crossVectorOperation();
  }
}

previousBtn.addEventListener('click', function () {
  if (index > 0) {
    loadSavedEntry(index - 1);
  }
});

forwardBtn.addEventListener('mouseenter', function () {
  forwardBtn.style.opacity = '0.67';
});

// Restore full opacity when mouse moves away
forwardBtn.addEventListener('mouseleave', function () {
  forwardBtn.style.opacity = '0.1';
});

forwardBtn.addEventListener('click', function () {
  if (index < saved.length - 1) {
    loadSavedEntry(index + 1);
  } else {
    applyCurrentOperation();
  }
});

saved = JSON.parse(localStorage.getItem('saved')) ?? [];
console.log(saved);
// sync from Firestore, falling back to whatever's cached locally
if (window.firebaseFns) {
  window.firebaseFns.loadAll().then((remoteSaved) => {
    console.log('retrieved from firebase');
    if (remoteSaved.length > 0) {
      saved = remoteSaved;
      console.log(saved);
      localStorage.setItem('saved', JSON.stringify(saved));
    }
  });
}

saveBtn.addEventListener('click', function () {
  saved.push([
    [Number(vector1Heading.value), Number(vector1Length.value), Number(vector1Z.value)],
    [Number(vector2Heading.value), Number(vector2Length.value), Number(vector2Z.value)],
    [Number(vector3Heading.value), Number(vector3Length.value), Number(vector3Z.value)],
    questionTextbox.innerText,
    operation ?? 0,
    [
      [Number(pAx.value), Number(pAy.value), Number(pAz.value)],
      [Number(pBx.value), Number(pBy.value), Number(pBz.value)],
      [Number(pCx.value), Number(pCy.value), Number(pCz.value)],
      [Number(pDx.value), Number(pDy.value), Number(pDz.value)]
    ],
    boxEdges?.volume ?? 0
  ]);
  index = saved.length - 1;

  try {
    localStorage.setItem('saved', JSON.stringify(saved));
    operation = 0;
  } catch (error) {
    console.error(error);
  }

  if (window.firebaseFns) {
    window.firebaseFns.saveAll(saved);
  }
});

function createStuff(stuff) {
  const createElement = document.createElement('h1');
  createElement.textContent = stuff.length;
  DisplayList.append(createElement);

}

keyFrameBtn.addEventListener('click', function () {
  animatedList.push([...targetCoordinates]); // shallow copy, not a reference
  console.log(animatedList);
  createStuff(animatedList.at(-1));
});
cameraX.addEventListener('input', function () {
  targetCoordinates[0] = Number(cameraX.value);
  animateCameraTo({ x: targetCoordinates[0], y: targetCoordinates[1], z: targetCoordinates[2] }, { x: lastYaw, y: lastPitch, z: lastRoll }, 1);
  // console.log(targetCoordinates);
});

cameraY.addEventListener('input', function () {
  targetCoordinates[1] = Number(cameraY.value);
  animateCameraTo({ x: targetCoordinates[0], y: targetCoordinates[1], z: targetCoordinates[2] }, { x: lastYaw, y: lastPitch, z: lastRoll }, 1);
  // console.log(targetCoordinates);
});

cameraZ.addEventListener('input', function () {
  targetCoordinates[2] = Number(cameraZ.value);
  animateCameraTo({ x: targetCoordinates[0], y: targetCoordinates[1], z: targetCoordinates[2] }, { x: lastYaw, y: lastPitch, z: lastRoll }, 1);
  //console.log(targetCoordinates);
});

function angleDrawer(angleDeg, length = 200, zIndex = 0) {
  let rad = radians(angleDeg);
  let x = Math.sin(rad) * length;
  let y = -Math.cos(rad) * length;
  return createVector(x, y, zIndex);
}
function nearestAxis(bearing) {
  // Snaps to the axis at the START of the bearing's quadrant
  // 0-89 -> North(0), 90-179 -> East(90), 180-269 -> South(180), 270-359 -> West(270)
  return Math.floor(((bearing % 360) + 360) % 360 / 90) * 90;
}


// Store per-vector animation state (position along the line, 0 to 1)
let vectorDots = {};

function drawVector(v, colour, offsetX = 0, offsetY = 0, textt = '', angle = 0, velocity = 1, dotId = textt, baseX = 0, baseY = 0, baseZ = 0) {

  // --- Manim-style label: slightly larger, no stroke, soft weight ---
  //push();
  // noStroke();
  //  fill('#FFFF00'); // Manim yellow reads better than deeppink on dark bg
  //  textSize(16);
  //  textFont(font); // serif reads closer to LaTeX than default sans
  // text(textt, baseX + v.x + offsetX, baseY + v.y + offsetY);
  // pop();

  // --- Glow pass behind the main line (Manim's soft-highlight look) ---
  //  push();
  //  strokeCap(ROUND);
  //  for (let i = 3; i > 0; i--) {
  //    stroke(red(color(colour)), green(color(colour)), blue(color(colour)), 25);
  //   strokeWeight(i * 5);
  //   line(baseX, baseY, baseZ, baseX + v.x, baseY + v.y, baseZ + v.z);
  // }
  // pop();

  // --- Crisp main line ---
  push();
  strokeCap(ROUND);
  stroke(colour);
  strokeWeight(2.5);
  smooth();
  line(baseX, baseY, baseZ, baseX + v.x, baseY + v.y, baseZ + v.z);
  pop();

  // --- Filled triangular arrowhead (not open lines) ---
  // push();
  // translate(baseX + v.x, baseY + v.y);
  // rotate(v.heading());
  // noStroke();
  // fill(colour);
  // triangle(0, 0, -12, -5, -12, 5);
  // pop();

  // --- Angle arc (thin, pastel, slightly glowing) ---
  push();
  translate(baseX, baseY);
  noFill();
  smooth();
  strokeCap(ROUND);
  let axis = nearestAxis(angle);
  let a1 = radians(axis - 90);
  let a2 = radians(angle - 90);
  let start = Math.min(a1, a2);
  let stop = Math.max(a1, a2);

  stroke(red(color(colour)), green(color(colour)), blue(color(colour)), 60);
  strokeWeight(3);
  arc(0, 0, 22, 22, start, stop);

  stroke(colour);
  strokeWeight(1);
  arc(0, 0, 20, 20, start, stop);
  pop();

  // --- Animated dot moving along the vector's heading ---
  // if (!vectorDots[dotId]) {
  //   vectorDots[dotId] = 0;
  // }

  // let heading = v.heading();
  // let length = v.mag();

  // vectorDots[dotId] += velocity;
  // if (vectorDots[dotId] > length) {
  //   vectorDots[dotId] = 0;
  // }
  //
  // let dist = vectorDots[dotId];
  // let dotX = baseX + cos(heading) * dist;
  // let dotY = baseY + sin(heading) * dist;

  // glowing traveling dot (Manim loves this pulsing-particle effect)
  //  push();
  // noStroke();
  //  fill(red(color(colour)), green(color(colour)), blue(color(colour)), 60);
  // circle(dotX, dotY, 16);
  // fill(colour);
  // circle(dotX, dotY, 7);
  //  pop();
}
let canvas;
let mathDiv;
function preload() {
  font = loadFont('assets/Typographica-Blp5.ttf');
  myModel = loadModel('assets/cup_lp.obj', true); // true = normalize size
}

function setup() {
  canvas = createCanvas(windowWidth - 145, windowHeight, WEBGL);
  const canvasContainer = document.getElementById('canvas-container') || document.body;
  canvas.parent(canvasContainer);

    applyVectorParameters();
  applyPointParameters();
  // create one reusable overlay div, absolutely positioned
  mathDiv = createDiv('');
  mathDiv.parent(canvasContainer);
  mathDiv.style('position', 'absolute');
  mathDiv.style('pointer-events', 'none');
  //canvas width 1536, 775
  applyVectorParameters();

  mainCam = createCamera();
  mainCam.setPosition(0, 0, 500);
  mainCam.lookAt(0, 0, 0);
  setCamera(mainCam);
}


let R;
let RHeading;
function addVector() {
  operation = 1;
  R = p5.Vector.add(A, B);
  const radians = Math.atan2(R.y, R.x);

  // 2. Convert radians to degrees
  const degrees = radians * (180 / Math.PI);

  RHeading = degrees * -1;
  console.log(degrees);
}
addBtn.addEventListener('click', addVector);

function applyVectorParameters() {
  A = angleDrawer(vector1Heading.value, vector1Length.value, Number(vector1Z.value));
  B = angleDrawer(vector2Heading.value, vector2Length.value, Number(vector2Z.value));
    C = angleDrawer(vector3Heading.value, vector3Length.value, Number(vector3Z.value));
}

function applyCurrentOperation() {
  applyVectorParameters();

  if (operation === 1) {
    addVector();
  } else if (operation === 2) {
    dotVectorOperation();
  } else if (operation === 3) {
    crossVectorOperation();
  }
}

vector1Heading.addEventListener('input', applyVectorParameters);
vector1Length.addEventListener('input', applyVectorParameters);
vector1Z.addEventListener('input', applyVectorParameters);
vector2Heading.addEventListener('input', applyVectorParameters);
vector2Length.addEventListener('input', applyVectorParameters);
vector2Z.addEventListener('input', applyVectorParameters);
vector3Heading.addEventListener('input', applyVectorParameters);
vector3Length.addEventListener('input', applyVectorParameters);
vector3Z.addEventListener('input', applyVectorParameters);

resetBtn.addEventListener('click', function () {
  vector1Heading.value = 0;
  vector1Length.value = 0;
  vector1Z.value = 0;
  vector2Heading.value = 0;
  vector2Length.value = 0;
  vector2Z.value = 0;
  vector3Heading.value = 0;
  vector3Length.value = 0;
  vector3Z.value = 0;
  observerA.checked = false;
  observerB.checked = false;
  ABase = [];
  BBase = [];
  operation = 0;
  R = null;
  projVector = null;
  crossVector = null;
  index = -1;
  showVectorC = true;
  applyVectorParameters();
    pAx.value = 0; pAy.value = 0; pAz.value = 0;
  pBx.value = 1; pBy.value = 0; pBz.value = 0;
  pCx.value = 0; pCy.value = 1; pCz.value = 0;
  pDx.value = 0; pDy.value = 0; pDz.value = 1;
  applyPointParameters();
});

let projVector;

function dotVectorOperation() {
  operation = 2;
  let dot = p5.Vector.dot(A, B);
  projVector = B.copy().mult(dot / B.magSq());
}
dotproductBtn.addEventListener('click', dotVectorOperation);

let crossVector;

function crossVectorOperation() {
  operation = 3;
  crossVector = p5.Vector.cross(A.copy(), B.copy());
  console.log(crossVector);
}
crossProductBtn.addEventListener('click', crossVectorOperation);
function addText(textGG, color, offsetX, offsetY, fontSize = 30) {
  if (!canvas) return; // Guard against canvas not being initialized yet
  const canvasBounds = canvas.elt.getBoundingClientRect();
  katex.render(textGG, mathDiv.elt, { throwOnError: false });
  mathDiv.style('left', canvasBounds.left + canvasBounds.width / 2 + offsetX + 'px');
  mathDiv.style('top', canvasBounds.top + canvasBounds.height / 2 + offsetY + 'px');
  mathDiv.style('color', color);
  mathDiv.style('font-size', fontSize + 'px');
}

deleteBtn.addEventListener('click', function () {
  if (index < 0 || !saved[index]) return; // nothing loaded to delete

  saved.splice(index, 1);

  try {
    localStorage.setItem('saved', JSON.stringify(saved));
  } catch (error) {
    console.error(error);
  }

  if (window.firebaseFns) {
    window.firebaseFns.saveAll(saved);
  }

  if (saved.length === 0) {
    index = -1;
    questionTextbox.innerText = 'No saved entries';
    operation = 0;
    R = null;
    projVector = null;
    crossVector = null;
    boxEdges = null;
    volumeOutput.textContent = 'Volume: —';
    showVectorC = true;
  } else {
    // load the entry that now sits at the same position, or the new last one
    index = Math.min(index, saved.length - 1);
    loadSavedEntry(index);
  }
});

function addLine(x1, y1, z1, x2, y2, z2, scale) {
  push();
  strokeCap(ROUND);
  stroke(color(0, 255, 0));
  strokeWeight(0.5);
  smooth();
  line(x1 * scale, y1 * scale, z1, x2 * scale, y2 * scale, z2);
  pop();
}

let isShiftPressed = false;
let panX = 0;
let panY = 0;

function mouseDragged() {
  // Update pan position based on mouse movement
  panX += mouseX - pmouseX;
  panY += mouseY - pmouseY;
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Shift') {
    isShiftPressed = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'Shift') {
    isShiftPressed = false;
  }
});

function draw() {
  background(0);

  // Only let the user orbit when no scripted animation is running,
  // otherwise orbitControl() will overwrite the camera we're animating.
  if (!camAnim) {
    if (isShiftPressed) {

      orbitControl();
    }
    else {
      orbitControl(0, 0, 1);
      translate(panX * 0.4, panY * 0.4, 0);
    }

  } else {
    updateCameraAnimation();
  }

  //  lights();
  // normalMaterial();
  //model(myModel);

  // addLine (1,4,3,3,3,0, 10);
  drawGround(0, 0, 0, 30);
  drawAxis(0, 0, 0, 200);

  // let R = p5.Vector.add(A, B);

  //  drawVector(A, color(255, 0, 0), 50, 50, '20deg', 20);

  // Keep the original B at the origin
  // drawVector(B, color(0, 255, 0, 150), 20, 0, 'B', 240, 1, 'B-original');

  // Draw a connected copy of B starting at the tip of A
  // drawVector(B, color(0, 255, 0), 20, 0, 'B-connected', 240, 1, 'B-connected', A.x, A.y);

  //  drawVector(R, color(0, 0, 255));

  if (A != null) {
    drawVector(A, color(255, 0, 0), 250, 700, '120kmh', vector1Heading.value, 1, 'A-connected', BBase[0], BBase[1]);
  }
  if (B != null) {
    drawVector(B, color(0, 0, 255), 0, 0, 'neg 50kmh', vector2Heading.value, 1, 'B-connected', ABase[0], ABase[1]);
  }
  if (R != null) {
    drawVector(R, color(0, 255, 0), 0, 0, 'Resultant', RHeading);
  }
  if (projVector != null) {
    drawVector(projVector, color(0, 255, 0), 0, 0, '20deg', 20);
  }
  if (crossVector != null) {
    drawVector(crossVector, color(255, 255, 0), 0, 0, 'cross', 20, 1, 'cross', 0, 0, 0);
  }
  // Only render Vector C when the current state (live edits or a loaded
  // saved entry) actually has vector3 parameters.
  if (C != null && showVectorC) {
    drawVector(C, color(255, 165, 0), 0, 0, 'C', vector3Heading.value, 1, 'C-connected', 0, 0, 0);
  }
const SCALE = 60;

if (boxEdges != null) {
  const scaledAB = p5.Vector.mult(boxEdges.AB, SCALE);
  const scaledAC = p5.Vector.mult(boxEdges.AC, SCALE);
  const scaledAD = p5.Vector.mult(boxEdges.AD, SCALE);
  const base = p5.Vector.mult(pointA, SCALE);

  drawParallelepiped(scaledAB, scaledAC, scaledAD, color(0, 255, 255), base.x, base.y, base.z);
  fillParallelepipedFaces(scaledAB, scaledAC, scaledAD, color(0, 255, 255, 40), base.x, base.y, base.z);
}
  getCameraOrientation();
}

// ---- Camera animation ----

function animateCameraTo(newPos, newTarget, duration = 1000) {
  camAnim = {
    startPos: { x: mainCam.eyeX, y: mainCam.eyeY, z: mainCam.eyeZ },
    endPos: newPos,                                    // {x, y, z}
    startTarget: { x: mainCam.centerX, y: mainCam.centerY, z: mainCam.centerZ },
    endTarget: newTarget,                                 // {x, y, z}
    startTime: millis(),
    duration
  };
}

function updateCameraAnimation() {
  const t = constrain((millis() - camAnim.startTime) / camAnim.duration, 0, 1);
  const te = easeInOutQuad(t);

  const pos = camAnim.startPos, endPos = camAnim.endPos;
  const tgt = camAnim.startTarget, endTgt = camAnim.endTarget;

  mainCam.setPosition(
    lerp(pos.x, endPos.x, te),
    lerp(pos.y, endPos.y, te),
    lerp(pos.z, endPos.z, te)
  );

  mainCam.lookAt(
    lerp(tgt.x, endTgt.x, te),
    lerp(tgt.y, endTgt.y, te),
    lerp(tgt.z, endTgt.z, te)
  );

  if (t >= 1) camAnim = null; // done — hand control back to orbitControl()
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

playBtn.addEventListener('click', function () {
  const duration = 1200;

  for (let i = 0; i < animatedList.length; i++) {
    setTimeout(function () {
      animateCameraTo(
        { x: animatedList[i][0], y: animatedList[i][1], z: animatedList[i][2] },
        { x: animatedList[i][3], y: animatedList[i][4], z: 0 },
        duration
      );
    }, i * duration);
  }
});

function drawGround(x, y, z, length) {
  // push();
  // stroke(50);

  // for (let i = -250; i <= 250; i += 25) {

  //-250, 0, 0, 250,0 ,0;
  // line(x + length, -y, z, x - length, -y, z); //special line
  //     line(i, 0, -250, i, 0, 250);
  //  line(-250, 0, i, 250, 0, i);

  // }
  // pop();
  // Grid lines
  stroke(80);

  for (let i = -500; i <= 500; i += 25) {
    //0, 250, 0, 0, -250, 0


    //make function for perpendicular 

    //line(x, -(y + length), z, x, -(y - length), z); //special-line
    line(i, -500, 0, i, 500, 0);   // vertical lines
    line(-500, i, 0, 500, i, 0);   // horizontal lines

  }

}

function drawAxis(x, y, z, length) {
  stroke(200);
  line(x + length, -y, z, x - length, -y, z); //special line
  line(x, -(y + length), z, x, -(y - length), z); //special-line
}

function getCameraOrientation() {
  // Forward vector (already normalized-ish via atan2, but we need actual normalized version for roll)
  const dx = mainCam.centerX - mainCam.eyeX;
  const dy = mainCam.centerY - mainCam.eyeY;
  const dz = mainCam.centerZ - mainCam.eyeZ;

  const yaw = Math.atan2(dx, dz);
  const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

  // --- Roll ---
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const fx = dx / len, fy = dy / len, fz = dz / len; // normalized forward

  // World up, projected to be perpendicular to forward (Gram-Schmidt)
  const worldUp = { x: 0, y: 1, z: 0 };
  const dot = worldUp.x * fx + worldUp.y * fy + worldUp.z * fz;
  const expectedUp = {
    x: worldUp.x - dot * fx,
    y: worldUp.y - dot * fy,
    z: worldUp.z - dot * fz
  };
  const expLen = Math.sqrt(expectedUp.x ** 2 + expectedUp.y ** 2 + expectedUp.z ** 2);
  expectedUp.x /= expLen; expectedUp.y /= expLen; expectedUp.z /= expLen;

  // Camera's actual up vector
  const actualUp = { x: mainCam.upX, y: mainCam.upY, z: mainCam.upZ };

  // Signed angle between expectedUp and actualUp, around the forward axis
  // cross product magnitude/direction gives sign, dot product gives cosine
  const cross = {
    x: expectedUp.y * actualUp.z - expectedUp.z * actualUp.y,
    y: expectedUp.z * actualUp.x - expectedUp.x * actualUp.z,
    z: expectedUp.x * actualUp.y - expectedUp.y * actualUp.x
  };
  const crossDotForward = cross.x * fx + cross.y * fy + cross.z * fz;
  const dotUp = expectedUp.x * actualUp.x + expectedUp.y * actualUp.y + expectedUp.z * actualUp.z;

  const roll = Math.atan2(crossDotForward, dotUp);

  // --- Change detection ---
  const epsilon = 0.0001;
  const changed =
    lastYaw === null ||
    Math.abs(yaw - lastYaw) > epsilon ||
    Math.abs(pitch - lastPitch) > epsilon ||
    Math.abs(roll - lastRoll) > epsilon;

  if (changed) {
    targetCoordinates[3] = yaw;
    targetCoordinates[4] = pitch;
    targetCoordinates[5] = roll;
    // console.log(yaw, pitch, roll);
    lastYaw = yaw;
    lastPitch = pitch;
    lastRoll = roll;
  }

  return { yaw, pitch, roll, changed };
}