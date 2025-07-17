const boardElement = document.getElementById("board");
const bombCounter = document.getElementById("bomb-counter");
const restartBtn = document.getElementById("restart");
const difficultySelect = document.getElementById("difficulty");

let board = [];
let rows = 10;
let cols = 10;
let numBombs = 10;
let bombsLeft = 0;
let gameOver = false;
let rev = 4;

function getSettings() {
  const difficulty = difficultySelect.value;
  if (difficulty === "easy") return { rows: 8, cols: 8, bombs: 10, rev: 4 };
  if (difficulty === "medium") return { rows: 12, cols: 12, bombs: 24, rev: 7 };
  return { rows: 16, cols: 16, bombs: 45, rev: 10 };
}

function initGame() {
  boardElement.innerHTML = "";
  const settings = getSettings();
  rows = settings.rows;
  cols = settings.cols;
  numBombs = settings.bombs;
  bombsLeft = numBombs;
  gameOver = false;
  board = [];

  boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

  // Create empty board
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cell = {
        row: r,
        col: c,
        isBomb: false,
        revealed: false,
        flagged: false,
        value: 0,
        element: document.createElement("div"),
      };
      cell.element.classList.add("cell");

      // Event listeners
      cell.element.addEventListener("click", () => handleClick(cell));
      cell.element.addEventListener("contextmenu", e => {
        e.preventDefault();
        toggleFlag(cell);
      });

      // Add long tap support
      let touchTimer = null;
      cell.element.addEventListener("touchstart", e => {
        e.preventDefault();
        touchTimer = setTimeout(() => {
          toggleFlag(cell);
          touchTimer = null;
        }, 500); // Long press duration
      });

      cell.element.addEventListener("touchend", () => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
      });

      cell.element.addEventListener("touchmove", () => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
      });

      boardElement.appendChild(cell.element);
      row.push(cell);
    }
    board.push(row);
  }

  // Place bombs
  let placed = 0;
  while (placed < numBombs) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const cell = board[r][c];
    if (!cell.isBomb) {
      cell.isBomb = true;
      placed++;
    }
  }

  // Compute values: product of squared Euclidean distances to 2 nearest bombs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isBomb) continue;

      const distances = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (board[i][j].isBomb) {
            const distSq = (i - r) ** 2 + (j - c) ** 2;
            distances.push(distSq);
          }
        }
      }

      distances.sort((a, b) => a - b);
      cell.value = distances.length >= 2 ? distances[0] * distances[1] : distances[0] || 0;
    }
  }

  updateBombCounter();
  revealRandomCellsBeforeClick(settings.rev);
}

function revealCell(cell) {
  if (cell.revealed || cell.flagged || gameOver) return;
  cell.revealed = true;
  cell.element.classList.add("revealed");

  if (cell.isBomb) {
    cell.element.classList.add("bomb");
    endGame(false);
  } else if (cell.value > 0) {
    cell.element.textContent = cell.value;
  } else {
    // Flood reveal
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = cell.row + dr;
        const nc = cell.col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          revealCell(board[nr][nc]);
        }
      }
    }
  }

  checkWin();
}

function handleClick(cell) {
  if (gameOver) return;
  revealCell(cell);
}

function toggleFlag(cell) {
  if (cell.revealed || gameOver) return;
  cell.flagged = !cell.flagged;
  cell.element.classList.toggle("flagged");
  bombsLeft += cell.flagged ? -1 : 1;
  updateBombCounter();
}

function updateBombCounter() {
  bombCounter.textContent = `Bombs left: ${bombsLeft}`;
}

function endGame(win) {
  gameOver = true;
  board.flat().forEach(cell => {
    if (cell.isBomb) {
      cell.element.classList.add("revealed", "bomb");
    }
  });
  setTimeout(() => {
    alert(win ? "You win!" : "Game over!");
  }, 100);
}

function checkWin() {
  const allSafeRevealed = board.flat().every(cell =>
    (cell.isBomb && !cell.revealed) || (!cell.isBomb && cell.revealed)
  );
  if (allSafeRevealed) {
    endGame(true);
  }
}

function revealRandomCellsBeforeClick(count = 4) {
  const safeCells = board.flat().filter(cell => !cell.isBomb && !cell.revealed);
  for (let i = 0; i < count && safeCells.length > 0; i++) {
    const idx = Math.floor(Math.random() * safeCells.length);
    const cell = safeCells.splice(idx, 1)[0];
    console.log(`Revealing cell at (${cell.row}, ${cell.col}) before first click.`);
    revealCell(cell);
  }
}

restartBtn.addEventListener("click", initGame);
difficultySelect.addEventListener("change", initGame);

document.addEventListener("DOMContentLoaded", () => {
  initGame();
});
