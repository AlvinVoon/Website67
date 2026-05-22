const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const frames = [];
const FRAME_COUNT = 2;

for (let i = 0; i < FRAME_COUNT; i++) {
  const img = new Image();
  img.src = `./frames/frame${i}.png`;
  frames.push(img);
}

let frame = 0;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frames[frame], 0, 0);

  frame = (frame + 1) % frames.length;

  console.log(frame);
}

setInterval(animate, 100); // 10 FPS