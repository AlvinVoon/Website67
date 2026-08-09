let A, B;
let mainCam;
let camAnim = null; // holds active animation state, or null when idle
let font;
let targetCoordinates = [0, 0, 0];

let lastYaw = null;
let lastPitch = null;
let lastRoll = null;

let animatedList = [];
const cameraX = document.querySelector('#cameraX');
const cameraY = document.querySelector('#cameraY');
const cameraZ = document.querySelector('#cameraZ');
const keyFrameBtn = document.querySelector('#keyframe');
const playBtn = document.querySelector('#play');

const DisplayList = document.querySelector('.list');

function createStuff(stuff) {
  const createElement = document.createElement('h1');
  createElement.textContent = stuff;
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
  console.log(targetCoordinates);
});

cameraY.addEventListener('input', function () {
  targetCoordinates[1] = Number(cameraY.value);
  animateCameraTo({ x: targetCoordinates[0], y: targetCoordinates[1], z: targetCoordinates[2] }, { x: lastYaw, y: lastPitch, z: lastRoll }, 1);
  console.log(targetCoordinates);
});

cameraZ.addEventListener('input', function () {
  targetCoordinates[2] = Number(cameraZ.value);
  animateCameraTo({ x: targetCoordinates[0], y: targetCoordinates[1], z: targetCoordinates[2] }, { x: lastYaw, y: lastPitch, z: lastRoll }, 1);
  console.log(targetCoordinates);
});

function angleDrawer(angleDeg, length = 200) {
  let rad = radians(angleDeg);
  let x = Math.sin(rad) * length;   // sin instead of cos
  let y = -Math.cos(rad) * length;  // -cos instead of sin, negative = up on screen
  return createVector(x, y);
}

function drawVector(v, colour) {

    stroke(colour);
    strokeWeight(3);

    line(0,0,v.x,v.y);

    // Arrowhead
    push();

    translate(v.x,v.y);
    rotate(v.heading());

    line(0,0,-12,-5);
    line(0,0,-12,5);

    pop();
}

function preload() {
  font = loadFont('assets/Typographica-Blp5.ttf');
}
function setup() {
  createCanvas(800, 600, WEBGL);
  //canvas width 1536, 775
  A = angleDrawer(0, 200);
  B = angleDrawer(90, 200);

  mainCam = createCamera();
  mainCam.setPosition(0, 0, 800);
  mainCam.lookAt(0, 0, 0);
  setCamera(mainCam);
}

function draw() {
  background(30);

  // Only let the user orbit when no scripted animation is running,
  // otherwise orbitControl() will overwrite the camera we're animating.
  if (!camAnim) {
    orbitControl();
  } else {
    updateCameraAnimation();
  }

  drawGround();

  let R = p5.Vector.add(A, B);

  drawVector(A, color(255, 0, 0))

  drawVector(B, color(0,255,0));

  drawVector(R, color(0, 0, 255))
  
  
  getCameraOrientation();
  fill('deeppink');
  textFont(font);
  textSize(30);
  text('test', 0, 50);
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

function drawGround() {
  push();
  stroke(50);

  for (let i = -250; i <= 250; i += 25) {

    line(i, 0, -250, i, 0, 250);
    line(-250, 0, i, 250, 0, i);

  }
  pop();
  // Grid lines
  stroke(50);

  for (let i = -250; i <= 250; i += 25) {

    line(i, -250, 0, i, 250, 0);   // vertical lines
    line(-250, i, 0, 250, i, 0);   // horizontal lines

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
    console.log(yaw, pitch, roll);
    lastYaw = yaw;
    lastPitch = pitch;
    lastRoll = roll;
  }

  return { yaw, pitch, roll, changed };
}