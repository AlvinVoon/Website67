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

let index = 0;

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

addSlideBtn.addEventListener('click', function(){
  const slide = document.createElement('div');
  slide.classList.add('blank-slide');
  const img = document.createElement('img');
  img.src = "question8.jpg";
  const cross = document.createElement('button');
  cross.textContent = "x";
  cross.classList.add('cross-button');
  cross.addEventListener('click', function(){
    slide.remove();
  })
  slide.appendChild(img);
  slide.appendChild(cross);
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
    index++;
    B = angleDrawer(saved[index][0][0], saved[index][0][1], saved[index][0][2] ?? 0);
    A = angleDrawer(saved[index][1][0], saved[index][1][1], saved[index][1][2] ?? 0);

    if (saved[index][2] != null){
    questionTextbox.innerText = saved[index][2];
    }else{
      questionTextbox.innerText = 'No saved entries';
    }

  } else {
    console.log('max entries');
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
    questionTextbox.innerText
  ]);

  try {
    localStorage.setItem('saved', JSON.stringify(saved));
    const savedTools = JSON.parse(localStorage.getItem('saved'));
    console.log(savedTools);
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
  createCanvas(windowWidth - 145, windowHeight, WEBGL);
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
})

vector1Heading.addEventListener('input', function () {
  A = angleDrawer(vector1Heading.value, vector1Length.value, Number(vector1Z.value));
  console.log(A);
})

vector1Length.addEventListener('input', function () {
  A = angleDrawer(vector1Heading.value, vector1Length.value, Number(vector1Z.value));
})

vector1Z.addEventListener('input', function () {
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
  pBx.value = 0; pBy.value = 0; pBz.value = 0;
  pCx.value = 0; pCy.value = 0; pCz.value = 0;
  pDx.value = 0; pDy.value = 0; pDz.value = 0;
  applyPointParameters();
});

let projVector;

dotproductBtn.addEventListener('click', function () {
  let dot = p5.Vector.dot(A, B);
  projVector = B.copy().mult(dot / B.magSq());
}
dotproductBtn.addEventListener('click', dotVectorOperation);

let crossVector;
crossProductBtn.addEventListener('click', function () {
  crossVector = p5.Vector.cross(A.copy(), B.copy());
  console.log(crossVector);
})

function connectVector() {

}


function draw() {
  background(0);

  // Only let the user orbit when no scripted animation is running,
  // otherwise orbitControl() will overwrite the camera we're animating.
  if (!camAnim) {
    orbitControl();
  } else {
    updateCameraAnimation();
  }

  //  lights();
  // normalMaterial();
  //model(myModel);

  const scale = 50;
  //drawTriangle3D(createVector(2*scale, 1*scale, 1*scale), createVector(3*scale, -1*scale, 1*scale), createVector(1*scale, -1*scale, 1*scale), color(255, 255, 255, 50));
  // addLine (1,4,3,3,3,0, 10);
  drawGround(0, 0, 0, 30);
  // drawGround(50, 200, 0, 30);

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
    drawVector(crossVector, color(255, 255, 0), 50, 50, 'cross', 20, 1, 'cross', 0, 0, 0);
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