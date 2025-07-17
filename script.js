const boardElement = document.getElementById('board');
const bombCounter = document.getElementById('bombCounter');
const messageElement = document.getElementById('message');
const restartButton = document.getElementById('restart');
const difficultySelect = document.getElementById('difficulty');
const toggleFlagButton = document.getElementById('toggle-flag');

let board = [];
let rows, cols, bombCount, cellsRevealed, flagsPlaced;
let gameOver = false;
let flagMode = false;

const difficultySettings = {
  easy: { rows: 8, cols: 8, bombs: 10, reveals: 3 },
  medium: { rows: 12, cols: 12, bombs: 20, reveals: 5 },
  hard: { rows: 16, cols: 16, bombs: 40, reveals: 7 }
};

function initGame() {
  const { rows: r, cols: c, bombs, reveals } = difficultySettings[difficultySelect.value];
  rows = r;
  cols = c;
  bombCount = bombs;
  cellsRevealed = 0;
  flagsPlaced = 0;
  gameOver = false;
  flagMode = false;
  updateFlagButton();
  messageElement.textContent = '';

  board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      bomb: false,
      revealed: false,
      flagged: false,
      value: 0
    }))
  );

  placeBombs();
  computeValues();
  renderBoard();
  updateBombCounter();
  autoReveal(reveals);
}

function placeBombs() {
  let placed = 0;
  while (placed < bombCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].bomb) {
      board[r][c].bomb = true;
      placed++;
    }
  }
}

function computeValues() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].bomb) continue;
      let distances = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (board[i][j].bomb) {
            let distSq = (i - r) ** 2 + (j - c) ** 2;
            distances.push(distSq);
          }
        }
      }
      distances.sort((a, b) => a - b);
      board[r][c].value = distances[0] * distances[1]; // Product of 2 smallest distances
    }
  }
}

function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  boardElement.style.gridTemplateRows = `repeat(${rows}, 30px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      updateCellDisplay(cell, board[r][c]);
      cell.addEventListener('click', handleClick);
      cell.addEventListener('contextmenu', handleRightClick);
      boardElement.appendChild(cell);
    }
  }
}

function updateCellDisplay(cellElement, cellData) {
  cellElement.textContent = '';
  cellElement.className = 'cell';
  if (cellData.revealed) {
    cellElement.classList.add('revealed');
    if (cellData.bomb) {
      cellElement.textContent = '💣';
    } else if (cellData.value !== 0) {
      cellElement.textContent = cellData.value;
    }
  } else if (cellData.flagged) {
    cellElement.classList.add('flagged');
    cellElement.textContent = '🚩';
  }
}

function handleClick(e) {
  if (gameOver) return;
  const r = +e.currentTarget.dataset.row;
  const c = +e.currentTarget.dataset.col;
  const cell = board[r][c];

  if (cell.revealed) return;

  if (flagMode || (e.pointerType === 'touch' && flagMode)) {
    toggleFlag(r, c);
  } else {
    revealCell(r, c);
  }
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameOver) return;
  const r = +e.currentTarget.dataset.row;
  const c = +e.currentTarget.dataset.col;
  toggleFlag(r, c);
}

function toggleFlag(r, c) {
  const cell = board[r][c];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  updateBombCounter();
  updateCellDisplay(getCellElement(r, c), cell);
}

function revealCell(r, c) {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  updateCellDisplay(getCellElement(r, c), cell);
  cellsRevealed++;

  if (cell.bomb) {
    endGame(false);
    return;
  }

  if (cellsRevealed === rows * cols - bombCount) {
    endGame(true);
  }
}

function updateBombCounter() {
  bombCounter.textContent = `Bombs left: ${bombCount - flagsPlaced}`;
}

function getCellElement(r, c) {
  return boardElement.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

function endGame(won) {
  gameOver = true;
  messageElement.textContent = won ? '🎉 You won!' : '💥 Game over!';
  // Reveal all bombs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.bomb) {
        cell.revealed = true;
        updateCellDisplay(getCellElement(r, c), cell);
      }
    }
  }
}

function autoReveal(count) {
  let revealed = 0;
  while (revealed < count) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const cell = board[r][c];
    if (!cell.revealed && !cell.bomb) {
      revealCell(r, c);
      revealed++;
    }
  }
}

function updateFlagButton() {
  toggleFlagButton.textContent = `Flag Mode: ${flagMode ? 'ON' : 'OFF'}`;
}

toggleFlagButton.addEventListener('click', () => {
  flagMode = !flagMode;
  updateFlagButton();
});

restartButton.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);

initGame();
