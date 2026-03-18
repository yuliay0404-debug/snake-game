export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";
export const TICK_MS = 140;

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialState(random = Math.random) {
  const snake = [
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];

  return {
    gridSize: GRID_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: spawnFood(snake, GRID_SIZE, random),
    score: 0,
    isGameOver: false,
    isRunning: false,
    isPaused: false,
  };
}

export function queueDirection(state, requestedDirection) {
  if (!DIRECTION_VECTORS[requestedDirection]) {
    return state;
  }

  if (requestedDirection === state.direction) {
    return state;
  }

  if (requestedDirection === OPPOSITE_DIRECTIONS[state.direction] && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    nextDirection: requestedDirection,
  };
}

export function stepGame(state, random = Math.random) {
  if (state.isGameOver || !state.isRunning || state.isPaused) {
    return state;
  }

  const direction = state.nextDirection;
  const vector = DIRECTION_VECTORS[direction];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  if (hitsWall(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      isGameOver: true,
      isRunning: false,
    };
  }

  const ateFood = positionsEqual(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];

  if (!ateFood) {
    nextSnake.pop();
  }

  if (hitsSnake(nextHead, nextSnake)) {
    return {
      ...state,
      direction,
      isGameOver: true,
      isRunning: false,
    };
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
    food: ateFood ? spawnFood(nextSnake, state.gridSize, random) : state.food,
    score: ateFood ? state.score + 1 : state.score,
  };
}

export function startGame(state) {
  if (state.isGameOver) {
    return {
      ...createInitialState(),
      isRunning: true,
    };
  }

  return {
    ...state,
    isRunning: true,
    isPaused: false,
  };
}

export function togglePause(state) {
  if (!state.isRunning || state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function restartGame(random = Math.random) {
  return {
    ...createInitialState(random),
    isRunning: true,
  };
}

export function spawnFood(snake, gridSize, random = Math.random) {
  const occupied = new Set(snake.map((segment) => toKey(segment)));
  const availableCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * availableCells.length);
  return availableCells[index];
}

export function positionsEqual(left, right) {
  if (!left || !right) {
    return false;
  }

  return left.x === right.x && left.y === right.y;
}

function hitsWall(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

function hitsSnake(head, snake) {
  return snake.slice(1).some((segment) => positionsEqual(segment, head));
}

function toKey(position) {
  return `${position.x},${position.y}`;
}
