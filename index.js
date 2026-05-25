import * as Combinatorics from 'https://cdn.jsdelivr.net/npm/js-combinatorics@2.1.2/combinatorics.min.js';
import generateMotionMachine from './motionMachine.js';

let gameMode = false;

document.addEventListener('DOMContentLoaded', () => {

    const generateBtn = document.querySelector('.generate-btn');
    const toggleBtn = document.querySelector('.toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    const switchToggle = document.querySelector('.switch-toggle');
    const conditionBoX = document.querySelector('.condition-box');
    const stickTogetherBtn = document.querySelector('.stickTogether');
    const inspector = document.querySelector('.right-content');
    const gameBtn = document.querySelector('.game-btn');

    const boyInput = document.querySelector('#boy-input');
    const blueInput = document.querySelector('#blue-input');
    const table = document.createElement('canvas');
    table.classList.add('table');
    const demo = document.querySelector('.demoPlatlet');

    const tableBtn = document.querySelector('.table-btn');
    const animateBtn = document.querySelector('.animate-btn');

    const startWithBtn = document.querySelector('.startWith');
    const endWithBtn = document.querySelector('.endWith');

    const calculationStep = document.querySelector('.calculation-step');

    const conditionInputNum = document.querySelector('#condition-input');
    const conditionInputBtn = document.querySelector('.conditionInputBtn');

    const lineBox = document.querySelector('#line');
    const circleBox = document.querySelector('#circle');

    const individualSwitch = document.querySelector('#ind-switch');

    let isPermutation = true;

    let startWithCondition;
    let endWithCondition;

    let conditionData;

    let result;

    const actorElements = {}; // keyed by alphabet letter for easy lookup

    const counter = document.createElement('h3');

    let allSeatingArrangements;

    const generateActor = (number) => {
        counter.style.position = 'absolute';
        counter.style.right = '20px';
        counter.style.top = '20px';
        counter.style.fontSize = '50px';
        counter.textContent = '0';
        counter.style.color = 'white';

        container.appendChild(counter);

        const frameSources = [
            'frames/boy.png',
            'frames/blue.png'
        ];

        const motionMachine = generateMotionMachine(table, 250, parseInt(boyInput.value) + parseInt(blueInput.value));

        const originpoint = document.createElement('div');
        originpoint.style.left = `${motionMachine.tableOriginX}px`;
        originpoint.style.top = `${motionMachine.tableOriginY}px`;
        originpoint.classList.add('origin-point');
        container.appendChild(originpoint);

        const alphabet = [...Array(parseInt(blueInput.value) + parseInt(boyInput.value))].map((_, i) => String.fromCharCode(i + 97));

        const positions = motionMachine.positions;

        // Create boy actors
        for (let i = 0; i < number - parseInt(blueInput.value); i++) {
            const actor = document.createElement('div');
            const selector = document.createElement('input');
            selector.type = 'checkbox';
            selector.classList.add('actor-selector');
            selector.style.position = 'absolute';
            actor.appendChild(selector);
            const hue = (i * 360 / number) % 360;
            actor.style.backgroundImage = `url(${frameSources[0]})`;
            actor.classList.add('actor');
            actor.style.filter = `hue-rotate(${hue}deg)`;
            actor.id = alphabet[i];
            container.appendChild(actor);
            actorElements[alphabet[i]] = actor;
        }

        // Create blue actors
        for (let j = parseInt(boyInput.value); j < number; j++) {
            const actor = document.createElement('div');
            const selector = document.createElement('input');
            selector.type = 'checkbox';
            selector.style.position = 'absolute';
            selector.classList.add('actor-selector');
            actor.appendChild(selector);
            const hue = (j * 360 / number) % 360
            actor.style.backgroundImage = `url(${frameSources[1]})`
            actor.classList.add('actor');
            actor.style.filter = `hue-rotate(${hue}deg)`;
            actor.id = alphabet[j];
            container.appendChild(actor);
            actorElements[alphabet[j]] = actor;
        }



        // Compute circular permutations
        const firstElement = alphabet[0];
        const remaining = alphabet.slice(1);
        const c = new Combinatorics.Permutation(remaining, remaining.length);
        allSeatingArrangements = c.toArray().map(val =>
            [firstElement, ...val].map((letter, index) => ({
                actor: letter,
                position: positions[index]
            }))
        );

        console.log(allSeatingArrangements);
        displayResult(allSeatingArrangements.length);
        // console.log("Total arrangements:", allSeatingArrangements.length);
    };


    const duplicateCheck = (input) => {
        console.log(input);
        if (input != undefined) {
            let temp;

            temp = input.split('');
            // Count occurrences of each character
            const frequencyMap = {};
            temp.forEach((element) => {
                frequencyMap[element] = (frequencyMap[element] || 0) + 1;
            });

            const duplicateArray = [];
            // Filter to only actual duplicates (count > 1)
            for (const [value, count] of Object.entries(frequencyMap)) {
                if (count > 1) {
                    duplicateArray.push({ value, count });
                }
            }
            return duplicateArray.map(({ count }) => `${count}!`).join('');

        }
    }

    document.addEventListener('input', function (e) {
        if (e.target.matches('.actor-selector')) {
            const actorDiv = e.target.parentElement;
            if (e.target.checked) {
                actorDiv.style.opacity = '0.5';
                selectedConditions.add(actorDiv.id);
                console.log(selectedConditions);
                logSelected();
            } else {
                actorDiv.style.opacity = '1';
            }
        }
    })

    animateBtn.addEventListener('click', () => {
        animateActor(allSeatingArrangements);
    })

    // Toggle sidebar
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Generate combinations or permutations (reads inputs)
    const dataInput = document.querySelector('#data-input');
    const sizeInput = document.querySelector('#size-input');

    dataInput.addEventListener('input', (e) => {
        calculationStepFunction();
    });

    sizeInput.addEventListener('input', (e) => {
        calculationStepFunction();
    })

    let dupArray;

    generateBtn.addEventListener('click', () => {

        if (lineBox.checked == true) {
            container.innerHTML = '';

            const dataStr = (dataInput && dataInput.value.trim()) ? dataInput.value.trim() : 'abcdefg';
            const arr = dataStr.split('');
            const k = (sizeInput && parseInt(sizeInput.value, 10)) || 4;

            conditionSelector(arr);

            if (isPermutation) {
                result = new Combinatorics.Permutation(arr, k).toArray();
                if (individualSwitch.checked == true) {
                    console.log(result);
                    result =
                        result.filter((arr, index) =>
                            result.findIndex(a => JSON.stringify(a) === JSON.stringify(arr)) === index
                        );
                }
                console.log(result);
                displayResult(result.length);
            } else {
                result = new Combinatorics.Combination(arr, k).toArray();
                displayResult(result.length);
            }


            if (result.length > 5000) {
                container.innerHTML = 'Result Too Big';
                container.style.color = 'white';
                return
            }
            else {
                result.forEach(combo => {
                    const boxElement = createBox(combo);
                    container.appendChild(boxElement);
                });
            }
        }
        else if (circleBox.checked == true) {

            //Table
            container.appendChild(table);
            table.innerHTML = '';
            generateActor(parseInt(boyInput.value) + parseInt(blueInput.value));

        }

        dupArray = duplicateCheck(dataInput.value);

        calculationStepFunction();
    });

    const displayResult = (resultx) => {
        const title = document.createElement('h3');
        title.textContent = `Result "${resultx}"`;
        inspector.appendChild(title);

    }

    const createBox = (combination) => {
        const box = document.createElement('div');
        box.classList.add('box');

        combination.forEach(item => {
            const boxlet = createBoxlet(item);
            box.appendChild(boxlet);
        });

        return box;
    };

    let _dragged = null;
    const selectedConditions = new Set(); // Track selected condition items

    // Helper to log and display selected conditions
    const logSelected = () => {
        const selected = Array.from(selectedConditions);
        // conditionData = selected.join("");
        // console.log(selected);
        console.log(selected);
        if (circleBox.checked == true && !selected.includes('a') || lineBox.checked == true) {
            console.log('its this');

            conditionData = new Combinatorics.Permutation(selected, selected.length).toArray().map(arr => arr.join(''));
        }
        else {
            conditionData = selected.join("");
        }
        demoPlatlet(conditionData);
        console.log('Selected Conditions:', conditionData);
        // console.log('Count:', selected.length);
        return selected;
    };

    const conditionSelector = (combination) => {
        // clear previous condition boxlets and recreate structure
        conditionBoX.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = 'Conditions';
        conditionBoX.appendChild(title);

        const chips = document.createElement('div');
        chips.classList.add('condition-chips');
        conditionBoX.appendChild(chips);

        // drag reordering helper
        const getDragAfterElement = (container, x) => {
            const draggableElements = [...container.querySelectorAll('.boxlets.condition-boxlet:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element || null;
        };

        chips.addEventListener('dragover', (e) => {
            e.preventDefault();
            const after = getDragAfterElement(chips, e.clientX);
            if (!_dragged) return;
            if (after == null) {
                chips.appendChild(_dragged);
            } else {
                chips.insertBefore(_dragged, after);
            }
        });

        combination.forEach(item => {
            const b = createBoxlet(item);
            b.classList.add('condition-boxlet');
            b.setAttribute('draggable', 'true');

            b.addEventListener('dragstart', (ev) => {
                _dragged = b;
                b.classList.add('dragging');
                try { ev.dataTransfer.setData('text/plain', 'drag'); } catch (e) { }
            });

            b.addEventListener('dragend', () => {
                _dragged = null;
                b.classList.remove('dragging');
            });

            // Toggle selection on click
            b.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                b.classList.toggle('selected');

                // Track selection state
                if (b.classList.contains('selected')) {
                    selectedConditions.add(item);
                    console.log(`✓ Added to selection: ${item}`);
                } else {
                    selectedConditions.delete(item);
                    console.log(`✗ Removed from selection: ${item}`);
                }

                // Log current state
                logSelected();
            });

            chips.appendChild(b);
        });
    }



    const createBoxlet = (item) => {
        const boxlet = document.createElement('div');
        boxlet.classList.add('boxlets');

        const title = document.createElement('h3');
        title.textContent = item;

        boxlet.appendChild(title);
        return boxlet;
    };

    const createDemo = (item) => {
        const boxlet = document.createElement('div');
        boxlet.classList.add('demo-boxlets');

        const title = document.createElement('h3');
        title.textContent = item;

        boxlet.appendChild(title);
        return boxlet;
    };

    const demoPlatlet = (conditionData) => {
        if (!result || result.length === 0) {
            console.log('Please generate combinations/permutations first');
            return;
        }

        demo.innerHTML = '';
        const demoBox = document.createElement('div');
        demoBox.classList.add('demo-box');
        demo.appendChild(demoBox);

        let hehehaw;

        console.log(conditionData);

        // Separate items into condition and non-condition
        const conditionItems = [];
        const nonConditionItems = [];

        for (let i = 0; i < result[0].length; i++) {
            hehehaw = result[i];
            const item = hehehaw[i];

            if (conditionData && conditionData.includes(item)) {
                conditionItems.push(item);
            } else {
                nonConditionItems.push(item);
            }
        }

        // Display condition items first (grouped together)
        conditionItems.forEach(item => {
            const boxElement = createDemo(item);
            boxElement.classList.add('condition-highlighted');
            demoBox.appendChild(boxElement);
        });

        // Then display non-condition items
        nonConditionItems.forEach(item => {
            const boxElement = createDemo(item);
            demoBox.appendChild(boxElement);
        });
    };


    const SlideShow = () => {
        if (!result || result.length === 0) {
            console.log('Please generate combinations/permutations first');
            return;
        }

        container.innerHTML = '';
        let currentIndex = 0;
        const fadeDelay = 1500; // Total time for fade out + fade in (1.5 seconds)
        const fadeDuration = 600; // Individual fade transition duration

        const showSlide = (index) => {
            container.innerHTML = '';
            const boxElement = createBox(result[index]);
            boxElement.classList.add('slideshow-box');
            container.appendChild(boxElement);
        };

        const nextSlide = () => {
            // Fade out current slide
            const currentBox = container.querySelector('.slideshow-box');
            if (currentBox) {
                currentBox.style.opacity = '0';
                currentBox.style.transition = `opacity ${fadeDuration}ms ease-out`;
            }

            // Wait for fade out, then show next slide and fade in
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % result.length;
                showSlide(currentIndex);
                const newBox = container.querySelector('.slideshow-box');
                newBox.style.opacity = '0';
                newBox.style.transition = `opacity ${fadeDuration}ms ease-in`;

                // Trigger fade in
                setTimeout(() => {
                    newBox.style.opacity = '1';
                }, 10);
            }, fadeDuration);
        };

        // Show first slide
        showSlide(currentIndex);
        const firstBox = container.querySelector('.slideshow-box');
        firstBox.style.opacity = '1';
        firstBox.style.transition = `opacity ${fadeDuration}ms ease-in`;

        // Set up interval to show next slides
        const slideshowInterval = setInterval(nextSlide, fadeDelay);
    };

    const animateActor = (allSeatingArrangements) => {
        if (allSeatingArrangements != undefined) {
            let currentIndex = 0;

            const showArrangement = (seating) => {
                seating.forEach(({ actor, position }) => {
                    counter.textContent = `Arrangement ${currentIndex + 1} / ${allSeatingArrangements.length}`;
                    const el = actorElements[actor];

                    el.style.position = 'absolute';
                    el.style.marginLeft = '0%';
                    el.style.marginTop = '0%';
                    // Enable smooth walking transition for position + fade in
                    el.style.transition = 'left 1s ease-in-out, top 1s ease-in-out, opacity 0.5s ease';
                    el.style.left = `${position.x}px`;
                    el.style.top = `${position.y}px`;
                    el.style.opacity = '1';
                });

            };

            const interval = setInterval(() => {
                showArrangement(allSeatingArrangements[currentIndex]);
                currentIndex = (currentIndex + 1) % allSeatingArrangements.length;
            }, 2500);

            // Show the first arrangement immediately
            showArrangement(allSeatingArrangements[0]);
            currentIndex = 1;
        }
        else {
            SlideShow();
        }
    }

    const calculationStepFunction = () => {
        let type;
        if (isPermutation == true) {
            type = 'P';
        }
        else if (isPermutation == false) {
            type = 'C';
        }
        if (sizeInput.value == dataInput.value.length) {
            console.log("Factorial case");
            calculationStep.innerHTML = `\\( ${dataInput.value.length}! \\)`;
        }
        else {
            if (selectedConditions && selectedConditions.size > 0 && lineBox.checked == true) {
                console.log(selectedConditions.size);
                let newSet = dataInput.value.length - (selectedConditions.size);
                let newSelection = sizeInput.value - selectedConditions.size;
                let order = sizeInput.value - selectedConditions.size + 1;
                calculationStep.innerHTML = `\\( _${newSet}${type}_{${newSelection}} \\times ${selectedConditions.size}! \\times ${order}\\)`;

            } else {
                calculationStep.innerHTML = `\\( _${dataInput.value.length}${type}_${sizeInput.value} \\)`;
            }
            if (selectedConditions && selectedConditions.size > 0 && circleBox.checked == true) {
                let total = parseInt(blueInput.value) + parseInt(boyInput.value) - 1;
                calculationStep.innerHTML = `\\((${total}-1)! \\times 2\\)`;
            }

        }
        if (startWithCondition > 0) {
            calculationStep.innerHTML += `<br>\\(_${startWithCondition}${type}_1 \\)`;
        }
        if (individualSwitch.checked == true) {
            if (dupArray != undefined) {
                console.log(dupArray);
                calculationStep.innerHTML = `\\( \\frac{${dataInput.value.length}!}{${dupArray}} \\)`;
            }
            else {
                calculationStep.innerHTML = `Please generate first`;
            }

        }
        MathJax.typesetPromise([calculationStep]);
    }


    let stickTogether = false;

    stickTogetherBtn.addEventListener('click', () => {
        stickTogetherBtn.classList.toggle('active');

        let indexs = 0;

        if (allSeatingArrangements != undefined) {
            console.log(conditionData);
            if (circleBox == true && !selected.includes('a')) {
                const filtered = allSeatingArrangements.filter(arrangement =>
                    conditionData.some(condition =>
                        arrangement.map(a => a.actor).join('').includes(condition)
                    )
                );
            } else {
                const filtered = allSeatingArrangements.filter(arrangement =>
                    arrangement.map(a => a.actor).join('').includes(conditionData)
                );

                const mirrored = filtered.map(arrangement => {
                    const chars = conditionData.split('');
                    const firstIdx = arrangement.findIndex(a => a.actor === chars[0]);
                    const secondIdx = arrangement.findIndex(a => a.actor === chars[1]);

                    if (firstIdx === -1 || secondIdx === -1) return arrangement;

                    const swapped = arrangement.map(a => ({ ...a, position: { ...a.position } }));

                    // Swap array positions
                    [swapped[firstIdx], swapped[secondIdx]] = [swapped[secondIdx], swapped[firstIdx]];

                    // Swap x/y back so each actor carries the other's coordinates
                    const tempX = swapped[firstIdx].position.x;
                    const tempY = swapped[firstIdx].position.y;
                    swapped[firstIdx].position.x = swapped[secondIdx].position.x;
                    swapped[firstIdx].position.y = swapped[secondIdx].position.y;
                    swapped[secondIdx].position.x = tempX;
                    swapped[secondIdx].position.y = tempY;

                    return swapped;
                });

                allSeatingArrangements = [...filtered, ...mirrored];

                console.log(allSeatingArrangements);
                displayResult(allSeatingArrangements.length);
            }

        }

        if (result != undefined && lineBox.checked == true) {
            container.innerHTML = '';

            console.log(conditionData);
            result = result.filter(item =>
                conditionData.some(condition => item.join('').includes(condition))
            );

            result.forEach((item, index) => {
                indexs++;
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                console.log(`Condition "${conditionData}" found in results. "${item}" with id "${index}"`);
            });

            displayResult(result.length);
        }

        calculationStepFunction();
        stickTogether = !stickTogether;
        console.log(stickTogether);
    });

    startWithBtn.addEventListener('click', () => {
        startWithCondition = selectedConditions.size;

        if (result != undefined) {

            container.innerHTML = '';
            let conditions = [...conditionData];
            conditions = conditions[0].split('');
            console.log(conditions);
            result = result.filter(item => conditions.some(condition => item[0].includes(condition)));
            result.forEach((item, index) => {
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                // console.log(`Condition "${conditionData}" found in results. "${item}" with id "${index}"`);
            });

            displayResult(result.length);
        }

        calculationStepFunction();
    })

    endWithBtn.addEventListener('click', () => {

        console.log(selectedConditions);

        if (result != undefined) {

            container.innerHTML = '';
            let conditions = [...conditionData];
            conditions = conditions[0].split('');
            console.log(conditions);
            result = result.filter(item => conditions.some(condition => item[item.length - 1].includes(condition)));
            result.forEach((item, index) => {
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                console.log(`Condition "${conditionData}" found in results. "${item}" with id "${index}"`);
            });

            displayResult(result.length);
        }

        calculationStepFunction();
    })

    conditionInputBtn.addEventListener('click', () => {
        console.log(conditionData[0]);
        console.log(conditionInputNum.value);
        if (result != undefined) {

            container.innerHTML = '';

            result = result.filter(item => {
                const matchCount = item.filter(element => element.includes(conditionData[0])).length;
                return matchCount >= conditionInputNum.value;
            });

            result.forEach((item, index) => {
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                console.log(`Condition "${conditionData[0]}" with min count "${conditionInputNum.value}" found in results. "${item}" with id "${index}"`);
            });

            displayResult(result.length);
        }

        calculationStepFunction();
    });

    // Toggle between combination and permutation
    switchToggle.addEventListener('click', () => {
        isPermutation = !isPermutation;
        if (isPermutation) {
            switchToggle.textContent = 'Permutation';
        } else {
            switchToggle.textContent = 'Combination';
        }
        calculationStepFunction();
    });


    lineBox.addEventListener('change', () => {
        circleBox.checked = false;
    })

    circleBox.addEventListener('change', () => {
        lineBox.checked = false;
    })
























    gameBtn.addEventListener('click', () => {
        gameMode = !gameMode;
        if (gameMode) {
            initGameBoard(5, 4);
        } else {
            container.innerHTML = '';
        }
    });

    // Game board state
    const GAME_DEFAULT_ROWS = 5;
    const GAME_DEFAULT_COLS = 4;
    let gameRowEls = [];
    let currentGameRow = 0;
    let currentGameCol = 0;
    const question = "ABCD"

    const initGameBoard = (rows = GAME_DEFAULT_ROWS, cols = GAME_DEFAULT_COLS) => {
        container.innerHTML = '';
        gameRowEls = [];
        currentGameRow = 0;
        currentGameCol = 0;

        for (let r = 0; r < rows; r++) {
            const rowEl = document.createElement('div');
            rowEl.classList.add('box', 'game-row');
            rowEl.dataset.row = String(r);

            for (let c = 0; c < cols; c++) {
                const boxlet = createBoxlet('');
                boxlet.classList.add('game-boxlet');
                boxlet.dataset.row = String(r);
                boxlet.dataset.col = String(c);
                rowEl.appendChild(boxlet);
            }

            container.appendChild(rowEl);
            gameRowEls.push(rowEl);
        }
    };

    const getGameBoxlet = (row, col) => {
        const rowEl = gameRowEls[row];
        if (!rowEl) return null;
        return rowEl.querySelector(`.game-boxlet[data-col="${col}"]`);
    };

    const setGameBoxlet = (row, col, value) => {
        const boxlet = getGameBoxlet(row, col);
        if (!boxlet) return;
        const title = boxlet.querySelector('h3');
        if (title) title.textContent = value;
    };

    const setGameBoxletClass = (row, col, value) => {
        const boxlet = getGameBoxlet(row, col);
        if (!boxlet) return;
        boxlet.classList.add(value);
    };

    const checkAnswer = (input) => {
        //  console.log('Checking answer:', input);
        for (let i = 0; i < input.length; i++) {
            //   console.log(question.includes(input[i]));
            if (input[i] !== question[i]) {
                if (question.includes(input[i])) {
                    setGameBoxletClass(currentGameRow, i, 'misplaced');
                }
                else {
                    setGameBoxletClass(currentGameRow, i, 'wrong');
                }
            }
            else if (input[i] === question[i]) {
                setGameBoxletClass(currentGameRow, i, 'correct');
            }

        }
    };

    let input = [];

    // Keyboard handling for game mode
    document.addEventListener('keydown', function (event) {
        if (!gameMode) return;

        const eventKey = event.key;
        const key = eventKey.toUpperCase();

        //  console.log(key);

        //   console.log("Current column", currentGameCol);
        //  console.log("Current row", currentGameRow);

        // Handle Backspace
        if (key === 'Backspace' || key === 'BACKSPACE') {
            event.preventDefault();
            if (currentGameCol > 0) {
                input.pop();
                currentGameCol--;
                setGameBoxlet(currentGameRow, currentGameCol, '');
            }
            return;
        }

        // Handle Enter: move to next row if current row filled
        if (key === 'ENTER') {
            event.preventDefault();
            if (currentGameCol >= GAME_DEFAULT_COLS) {
                checkAnswer(input);
                if (currentGameRow < (gameRowEls.length - 1)) {
                    currentGameRow++;
                    //  console.log(currentGameRow);
                    currentGameCol = 0;
                }
                input = [];
            }
            return;
        }

        // Only accept single-letter A-Z
        if (key.length === 1 && /[a-zA-Z]/.test(key)) {
            event.preventDefault();
            if (currentGameCol < GAME_DEFAULT_COLS) {
                input.push(key.toUpperCase());
                setGameBoxlet(currentGameRow, currentGameCol, key.toUpperCase());
                currentGameCol++;
            }
        }
    });
});
