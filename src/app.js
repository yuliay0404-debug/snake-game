import {
  GRID_SIZE,
  TICK_MS,
  createInitialState,
  queueDirection,
  restartGame,
  startGame,
  stepGame,
  togglePause,
} from "./gameLogic.js";

const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const overlayElement = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const speedSelect = document.querySelector("#speed-select");
const controlButtons = document.querySelectorAll("[data-direction]");

let state = createInitialState();
let tickHandle = null;
let tickMs = TICK_MS;
const cells = [];

buildBoard();
render();
attachEvents();

function buildBoard() {
  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    boardElement.appendChild(cell);
    cells.push(cell);
  }
}

function attachEvents() {
  document.addEventListener("keydown", (event) => {
    const direction = mapKeyToDirection(event.key);
    if (!direction) {
      return;
    }

    event.preventDefault();

    if (!state.isRunning && !state.isGameOver) {
      state = startGame(state);
      ensureTickLoop();
    }

    state = queueDirection(state, direction);
    render();
  });

  startButton.addEventListener("click", () => {
    state = startGame(state);
    ensureTickLoop();
    render();
  });

  pauseButton.addEventListener("click", () => {
    state = togglePause(state);
    render();
  });

  restartButton.addEventListener("click", () => {
    state = restartGame();
    ensureTickLoop();
    render();
  });

  speedSelect.addEventListener("change", () => {
    tickMs = Number(speedSelect.value);
    restartTickLoop();
  });

  controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { direction } = button.dataset;
      if (!state.isRunning && !state.isGameOver) {
        state = startGame(state);
        ensureTickLoop();
      }

      state = queueDirection(state, direction);
      render();
    });
  });
}

function ensureTickLoop() {
  if (tickHandle !== null) {
    return;
  }

  tickHandle = window.setInterval(() => {
    const nextState = stepGame(state);
    state = nextState;
    render();

    if (state.isGameOver) {
      stopTickLoop();
    }
  }, tickMs);
}

function stopTickLoop() {
  if (tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function restartTickLoop() {
  if (tickHandle === null) {
    return;
  }

  stopTickLoop();
  ensureTickLoop();
}

function render() {
  for (const cell of cells) {
    cell.className = "cell";
  }

  for (let index = state.snake.length - 1; index >= 0; index -= 1) {
    const segment = state.snake[index];
    const cell = cells[toIndex(segment.x, segment.y)];
    if (!cell) {
      continue;
    }

    cell.classList.add("snake");
    if (index === 0) {
      cell.classList.add("head");
    }
  }

  if (state.food) {
    const foodCell = cells[toIndex(state.food.x, state.food.y)];
    foodCell?.classList.add("food");
  }

  scoreElement.textContent = String(state.score);
  statusElement.textContent = getStatusLabel();
  pauseButton.textContent = state.isPaused ? "Resume" : "Pause";

  const overlayMessage = getOverlayMessage();
  overlayElement.textContent = overlayMessage;
  overlayElement.classList.toggle("hidden", !overlayMessage);
}

function getStatusLabel() {
  if (state.isGameOver) {
    return "Game Over";
  }

  if (state.isPaused) {
    return "Paused";
  }

  if (state.isRunning) {
    return "Playing";
  }

  return "Ready";
}

function getOverlayMessage() {
  if (state.isGameOver) {
    return `Game over. Final score: ${state.score}. Press Restart to try again.`;
  }

  if (state.isPaused) {
    return "Paused";
  }

  if (!state.isRunning) {
    return "Press Start to play";
  }

  return "";
}

function mapKeyToDirection(key) {
  const normalized = key.toLowerCase();
  const keyMap = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
  };

  return keyMap[normalized] ?? null;
}

function toIndex(x, y) {
  return y * GRID_SIZE + x;
}
