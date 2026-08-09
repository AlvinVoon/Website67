export function smoothAnimation(oriCoord, finalCoord, duration = 1000) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const start = [...oriCoord];

        function step(now) {
            const t = Math.min((now - startTime) / duration, 1); // 0 -> 1

            oriCoord[0] = start[0] + (finalCoord[0] - start[0]) * t;
            oriCoord[1] = start[1] + (finalCoord[1] - start[1]) * t;

            console.log(oriCoord[0], oriCoord[1]);

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                resolve(oriCoord);
            }
        }

        requestAnimationFrame(step);
    });
}