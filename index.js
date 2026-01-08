import * as Combinatorics from 'https://cdn.jsdelivr.net/npm/js-combinatorics@2.1.2/combinatorics.min.js';

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
    const demo = document.querySelector('.demoPlatlet');
    const testBtn = document.querySelector('.test-btn');
    const demoBtn = document.querySelector('.demo-btn');
    const gameBtn = document.querySelector('.game-btn');
    const modeSwitch = document.querySelector('.modeSwitch');

    let isPermutation = false;

    let conditionData;

    let result;

    // Toggle sidebar
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Generate combinations or permutations (reads inputs)
    const dataInput = document.querySelector('#data-input');
    const sizeInput = document.querySelector('#size-input');

    generateBtn.addEventListener('click', () => {
        container.innerHTML = '';

        const dataStr = (dataInput && dataInput.value.trim()) ? dataInput.value.trim() : 'abcdefg';
        const arr = dataStr.split('');
        const k = (sizeInput && parseInt(sizeInput.value, 10)) || 4;

        conditionSelector(arr);

        if (!isPermutation) {
            result = new Combinatorics.Permutation(arr, k).toArray();
            generateResult(result.length);
        } else {
            result = new Combinatorics.Combination(arr, k).toArray();
            generateResult(result.length);
        }


        result.forEach(combo => {
            const boxElement = createBox(combo);
            container.appendChild(boxElement);
        });
    });

    const generateResult = (resultx) => {
        inspector.innerHTML = '';
        const title = document.createElement('h3');
        title.textContent = `Result "${resultx}"`;
        inspector.appendChild(title);

        const calculationStep = document.createElement('h3');
        calculationStep.textContent = `${dataInput.value.length} P ${sizeInput.value}`;
        inspector.appendChild(calculationStep);

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
        conditionData = selected.join("");
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

    const demoPlatlet = () => {
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


    testBtn.addEventListener('click', () => {
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

        // Allow clicking test button again to stop slideshow
        testBtn.onclick = () => {
            clearInterval(slideshowInterval);
            container.innerHTML = '';
            testBtn.onclick = null;
        };
    });

    // Demo button event listener
    demoBtn.addEventListener('click', () => {
        demoPlatlet();
    });


    let stickTogether = false;

    stickTogetherBtn.addEventListener('click', () => {
        stickTogetherBtn.classList.toggle('active');

        container.innerHTML = '';

        let indexs = 0;

        result.forEach((item, index) => {
            if (item.join('').includes(conditionData)) {
                indexs++;
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                generateResult(indexs);
                console.log(`Condition "${conditionData}" found in results. "${item}" with id "${index}}"`);
            }
        });

        stickTogether = !stickTogether;
        console.log(stickTogether);
    });


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

    // Toggle between combination and permutation
    switchToggle.addEventListener('click', () => {
        isPermutation = !isPermutation;
        if (isPermutation) {
            switchToggle.textContent = 'Combination';
            switchToggle.classList.add('permutation');
            switchToggle.classList.remove('combination');
        } else {
            switchToggle.textContent = 'Permutation';
            switchToggle.classList.add('combination');
            switchToggle.classList.remove('permutation');
        }
    });

    let input = [];

    const createCircle = () => {
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container', 'rotating');
        container.appendChild(circleContainer);

        let number = result[0].length;

        for (let i = 0; i < number; i++) {
            const angle = (i / number) * (2 * Math.PI);
            const x = 200 + 150 * Math.cos(angle);
            const y = 165 + 150 * Math.sin(angle);  
            console.log(x, y);

            const circleBoxlet = document.createElement('div');
            const title = document.createElement('h3');
            const icon = document.createElement('img');
            icon.src = './asset/chair.png';
            icon.style.width = '40px';
            icon.style.height = '40px';
            icon.style.position = 'absolute';
            circleBoxlet.appendChild(icon);
            title.textContent = result[0][i];

            
            circleBoxlet.appendChild(title);
            circleBoxlet.classList.add('boxlets', 'circle-boxlet', 'rotating-boxlet');
            circleBoxlet.style.position = 'absolute';
            circleBoxlet.style.left = `${x}px`;
            circleBoxlet.style.top = `${y}px`;
            circleContainer.appendChild(circleBoxlet);
        }

    }


    modeSwitch.addEventListener('click', () => {
        container.innerHTML = '';
            createCircle();  
    });

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
