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
let audioContext = null;

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
    initAudio();

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
    initAudio();
    state = startGame(state);
    ensureTickLoop();
    render();
  });

  pauseButton.addEventListener("click", () => {
    initAudio();
    state = togglePause(state);
    render();
  });

  restartButton.addEventListener("click", () => {
    initAudio();
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
      initAudio();
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
    const previousState = state;
    const nextState = stepGame(state);
    state = nextState;
    handleSoundEffects(previousState, nextState);
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

function initAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function handleSoundEffects(previousState, nextState) {
  if (nextState.score > previousState.score) {
    playEatSound();
  }

  if (!previousState.isGameOver && nextState.isGameOver) {
    playGameOverSound();
  }
}

function playEatSound() {
  playTone(659.25, 0.08, "square", 0.05);
  playTone(880, 0.1, "square", 0.04, 0.08);
}

function playGameOverSound() {
  playTone(392, 0.14, "sawtooth", 0.05);
  playTone(293.66, 0.18, "sawtooth", 0.045, 0.14);
  playTone(196, 0.24, "sawtooth", 0.04, 0.3);
}

function playTone(frequency, duration, type, volume, delay = 0) {
  if (!audioContext) {
    return;
  }

  const startAt = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
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
  pauseButton.textContent = state.isPaused ? "继续" : "暂停";

  const overlayMessage = getOverlayMessage();
  overlayElement.textContent = overlayMessage;
  overlayElement.classList.toggle("hidden", !overlayMessage);
}

function getStatusLabel() {
  if (state.isGameOver) {
    return "游戏结束";
  }

  if (state.isPaused) {
    return "已暂停";
  }

  if (state.isRunning) {
    return "进行中";
  }

  return "准备开始";
}

function getOverlayMessage() {
  if (state.isGameOver) {
    return `游戏结束，最终分数：${state.score}。点击“重新开始”再试一次。`;
  }

  if (state.isPaused) {
    return "已暂停";
  }

  if (!state.isRunning) {
    return "点击开始游戏";
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
