const generateMotionMachine = (table, minDistance, num) => {
const parentRect =
  table.offsetParent.getBoundingClientRect();

const rectTable =
  table.getBoundingClientRect();

const tableOriginX =
  rectTable.left - parentRect.left +
  rectTable.width / 2;

const tableOriginY =
  rectTable.top - parentRect.top +
  rectTable.height / 2;

    //const rectActor = actor[i].getBoundingClientRect();
   // const actorOriginX = rectActor.left + rectActor.width / 2;
   // const actorOriginY = rectActor.top + rectActor.height / 2;

    //const actorNum = actor.length;

    const radius =
    minDistance / (2 * Math.sin(Math.PI / num));

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

    return {tableOriginX, tableOriginY, positions };
};

export default generateMotionMachine; 