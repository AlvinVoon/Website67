let tableOriginX;
let tableOriginY;
let radius;

const normalizeAngle = (angle) => {
  const twoPi = 2 * Math.PI;
  return ((angle % twoPi) + twoPi) % twoPi;
};

const shortestAngleDelta = (fromAngle, toAngle) => {
  const from = normalizeAngle(fromAngle);
  const to = normalizeAngle(toAngle);
  let delta = to - from;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
};

const generateMotionMachine = (table, minDistance, num) => {
  const parentRect = table.offsetParent.getBoundingClientRect();
  const rectTable = table.getBoundingClientRect();

  tableOriginX = rectTable.left - parentRect.left + rectTable.width / 2;
  tableOriginY = rectTable.top - parentRect.top + rectTable.height / 2;

  radius = minDistance / (2 * Math.sin(Math.PI / num));

  const positions = [];

  for (let i = 0; i < num; i++) {
    const angle = (2 * Math.PI * i) / num;
    const x = tableOriginX + radius * Math.cos(angle);
    const y = tableOriginY + radius * Math.sin(angle);

    positions.push({
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      angle
    });
  }

  console.log(positions);

  return { tableOriginX, tableOriginY, positions };
};

const transition = (original, target, t = 1) => {
  const delta = shortestAngleDelta(original.angle, target.angle);
  const angle = original.angle + delta * t;
  const x = tableOriginX + radius * Math.cos(angle);
  const y = tableOriginY + radius * Math.sin(angle);
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    angle: normalizeAngle(angle)
  };
};

export {generateMotionMachine, transition}; 