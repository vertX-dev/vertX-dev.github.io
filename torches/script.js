const canvasSize = 500;
let cells = 2;
const colors = ["yellow", "blue", "green", "red", "purple", "orange", "white", "black"];
const multipliers = [0.1, 0.15, 0.2, 0.25, 0.3, 1 / 3, 0.4, 0.5, 0.6, 2 / 3, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 2, 3, 4, 5, 6, 7, 8, 10];
let maxClicks = 10;

function randomizeMultipliers(torchesContainer) {
    colors.forEach((color) => {
        let torches = torchesContainer[color].torches;
        let availableMultipliers = multipliers.filter((m) => {
            // Check if the result is a whole number (allowing for floating point precision)
            let result = torches.length / m;
            return Math.abs(result - Math.round(result)) < 0.0001 && result <= maxClicks;
        });
        let randomMultiplier = availableMultipliers[Math.floor(Math.random() * availableMultipliers.length)];
        torchesContainer[color].multiplier = randomMultiplier;
        torchesContainer[color].required = torches.length / randomMultiplier;
    });
}

let allTorches = 0;

function generateRandomTorches() {
    const torchesContainer = {
        yellow: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        blue: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        green: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        red: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        purple: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        orange: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        white: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
        black: {
            torches: [],
            multiplier: 1,
            presses: 0,
            required: 0,
        },
    };

    let canvasContainer = [];
    for (let i = 0; i < cells; i++) {
        canvasContainer[i] = [];
        for (let j = 0; j < cells; j++) {
            canvasContainer[i][j] = randomTorch(torchesContainer);
        }
    }

    randomizeMultipliers(torchesContainer);

    return { canvasContainer, torchesContainer };
}

function randomTorch(torchesContainer) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    torchesContainer[color].torches.push({ id: allTorches++ });
    return { color, id: allTorches - 1 };
}

window.onload = () => {
    document.getElementById("difficulty").addEventListener("input", (event) => {
        document.getElementById("difficultyValue").textContent = "Difficulty: " + event.target.value;
    });
    cells = parseInt(document.getElementById("difficulty").value);
    maxClicks = Math.floor(cells * cells * 0.3);
    document.getElementById("difficultyValue").textContent = "Difficulty: " + cells;
    let { canvasContainer, torchesContainer } = generateRandomTorches();
    const canvasElement = document.getElementById("torchCanvas");
    const ctx = canvasElement.getContext("2d");
    let cellSize = canvasSize / cells;

    // Draw the torches on the canvas
    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            const torch = canvasContainer[i][j];
            ctx.fillStyle = torch.color;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    colors.forEach((color) => {
        const button = document.getElementById(`${color}TorchButton`);
        button.style.backgroundColor = color;
        button.textContent = `(x${torchesContainer[color].multiplier.toFixed(2)})`;
        button.addEventListener("click", () => {
            torchesContainer[color].presses++;
        });
    });

    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", () => {
        cells = parseInt(document.getElementById("difficulty").value);
        maxClicks = Math.floor(cells * cells * 0.3);
        cellSize = canvasSize / cells;
        document.getElementById("difficultyValue").textContent = "Difficulty: " + cells;
        ({ canvasContainer, torchesContainer } = generateRandomTorches());
        console.log(torchesContainer, canvasContainer);
        // Redraw the torches on the canvas
        for (let i = 0; i < cells; i++) {
            for (let j = 0; j < cells; j++) {
                const torch = canvasContainer[i][j];
                ctx.fillStyle = torch.color;
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
        colors.forEach((color) => {
            const button = document.getElementById(`${color}TorchButton`);
            button.style.backgroundColor = color;
            button.textContent = `(x${torchesContainer[color].multiplier.toFixed(2)})`;
            torchesContainer[color].presses = 0;
        });
    });

    let mistakeCount = 0;
    const powerOnButton = document.getElementById("powerOn");
    powerOnButton.addEventListener("click", () => {
        let allCorrect = true;
        colors.forEach((color) => {
            const torchData = torchesContainer[color];
            if (torchData.presses !== torchData.torches.length / torchData.multiplier) {
                allCorrect = false;
            }
        });
        if (allCorrect) {
            alert("All torches activated correctly! Puzzle solved.");
            cells = Math.min(parseInt(document.getElementById("difficulty").value++) + 1, 15);
            cellSize = canvasSize / cells;
            maxClicks = Math.floor(cells * cells * 0.3);
            document.getElementById("difficultyValue").textContent = "Difficulty: " + cells;
            ({ canvasContainer, torchesContainer } = generateRandomTorches());
            mistakeCount = 0;
            // Redraw the torches on the canvas
            for (let i = 0; i < cells; i++) {
                for (let j = 0; j < cells; j++) {
                    const torch = canvasContainer[i][j];
                    ctx.fillStyle = torch.color;
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                    ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
            colors.forEach((color) => {
                const button = document.getElementById(`${color}TorchButton`);
                button.style.backgroundColor = color;
                button.textContent = `(x${torchesContainer[color].multiplier.toFixed(2)})`;
                torchesContainer[color].presses = 0;
            });
        } else {
            alert("Incorrect torch activations. Try again.");
            mistakeCount++;
        }
        if (mistakeCount >= 3) {
            alert("Too many mistakes! Puzzle reset.");
            cells = parseInt(document.getElementById("difficulty").value);
            cellSize = canvasSize / cells;
            maxClicks = Math.floor(cells * cells * 0.3);
            document.getElementById("difficultyValue").textContent = "Difficulty: " + cells;
            ({ canvasContainer, torchesContainer } = generateRandomTorches());
            mistakeCount = 0;
            // Redraw the torches on the canvas
            for (let i = 0; i < cells; i++) {
                for (let j = 0; j < cells; j++) {
                    const torch = canvasContainer[i][j];
                    ctx.fillStyle = torch.color;
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                    ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
            colors.forEach((color) => {
                const button = document.getElementById(`${color}TorchButton`);
                button.style.backgroundColor = color;
                button.textContent = `(x${torchesContainer[color].multiplier.toFixed(2)})`;
                torchesContainer[color].presses = 0;
            });
        }
        console.log(torchesContainer);
    });

    console.log(torchesContainer, canvasContainer);
};
