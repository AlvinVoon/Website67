import * as Combinatorics from 'https://cdn.jsdelivr.net/npm/js-combinatorics@2.1.2/combinatorics.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.querySelector('.generate-btn');
    const toggleBtn = document.querySelector('.toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    const switchToggle = document.querySelector('.switch-toggle');
    const conditionBoX = document.querySelector('.condition-box');
    const stickTogetherBtn = document.querySelector('.stickTogether');
    const inspector = document.querySelector('.right-content');
    
    let isPermutation = false;

    let sixseven = hehehaw;
    
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

        inspector.innerHTML = '';


        const dataStr = (dataInput && dataInput.value.trim()) ? dataInput.value.trim() : 'abcdefg';
        const arr = dataStr.split('');
        const k = (sizeInput && parseInt(sizeInput.value, 10)) || 4;

        conditionSelector(arr);




        if (!isPermutation) {
            result = new Combinatorics.Permutation(arr, k).toArray();
                    const title = document.createElement('h3');
        title.textContent = `Result "${result.length}"`;
        inspector.appendChild(title);
            console.log(result);
        } else {
            result = new Combinatorics.Combination(arr, k).toArray();
                    const title = document.createElement('h3');
        title.textContent = `Result "${result.length}"`;
        inspector.appendChild(title);
        }
        
        
        result.forEach(combo => {
            const boxElement = createBox(combo);
            container.appendChild(boxElement);
        });
    });

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

    let stickTogether = false;

    stickTogetherBtn.addEventListener('click', () => {
        stickTogetherBtn.classList.toggle('active');

        container.innerHTML = '';

        result.forEach((item, index) => {
            if (item.join('').includes(conditionData)) {
                const boxElement = createBox(item);
                container.appendChild(boxElement);
                console.log(`Condition "${conditionData}" found in results. "${item}" with id "${index}}"`);
            }
        });

        stickTogether = !stickTogether;
        console.log(stickTogether);
    });

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
});
