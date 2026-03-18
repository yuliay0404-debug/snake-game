# Snake

Minimal classic Snake built as a dependency-free static app.

## Run locally

Because this repo does not include an existing app scaffold or package tooling, serve the files with Python:

```bash
cd /Users/xinyuyang/Desktop/Yulia/chatgpt
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html`: app shell and controls
- `styles.css`: minimal board and layout styling
- `src/gameLogic.js`: deterministic core game logic
- `src/app.js`: rendering, timer loop, and controls

## Manual verification

- Start the game and confirm the snake moves one cell at a time on a fixed grid.
- Use arrow keys and `WASD` to steer; on smaller screens, verify the on-screen buttons work.
- Eat food and confirm the score increments and the snake grows by one segment.
- Confirm the snake cannot reverse directly into itself in one move.
- Hit a wall or the snake body and confirm game-over appears.
- Pause and resume during play.
- Restart after game-over and confirm score and board state reset cleanly.
