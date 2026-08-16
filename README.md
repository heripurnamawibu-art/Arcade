# Mini Game Arcade Collection

A cohesive, retro-styled web arcade featuring six classic and modern mini-games built with Vanilla JavaScript, HTML5 Canvas, and CSS3.

## Features

- **6 Playable Games**: Snake, Pong, Breakout, Flappy, Reaction, and Memory.
- **Unified Arcade HUD**: Consistent score tracking and navigation across all games.
- **Persistent High Scores**: LocalStorage saves your best scores automatically.
- **Synthesized Audio**: Web Audio API generates bleeps and bloops with zero external asset dependencies.
- **Retro Aesthetic**: Neon colors, scanlines, and pixel fonts create an authentic arcade feel.
- **Responsive**: Adapts to different screen sizes.

## Games Included

1. **Snake**: Classic grid-based action. Eat the neon apples to grow, don't hit the walls or yourself. (Controls: Arrow Keys / WASD)
2. **Pong**: Deflect the ball past the AI opponent. The AI gets faster as you score. (Controls: Up/Down Arrows / W/S)
3. **Breakout**: Smash the neon bricks without letting the ball fall. (Controls: Left/Right Arrows / A/D)
4. **Flappy**: Fly through the glowing pipes. (Controls: Spacebar / Click)
5. **Reaction**: Test your reflexes. Wait for the screen to turn GREEN, then click as fast as possible. (Controls: Click)
6. **Memory**: Match the hidden symbols in the fewest moves possible. (Controls: Click)

## Technologies Used

- **HTML5**: Semantic structure and Canvas element.
- **CSS3**: Custom properties (variables), grid/flexbox layouts, CSS 3D transforms (for card flips), animations, and retro styling.
- **Vanilla JavaScript (ES6)**: Object-oriented classes for game logic, module management, and DOM manipulation. No external frameworks used.
- **Web Audio API**: Real-time sound synthesis for game effects.
- **LocalStorage API**: For saving user progress and settings.

## How to Run Locally

Since this project uses no external dependencies or build tools, running it is incredibly simple:

1. Clone or download the repository.
2. Open `index.html` in any modern web browser.
*(Note: Some browsers restrict the Web Audio API until the user interacts with the page. Clicking any button will enable sound.)*

## Project Structure

```
/
├── index.html          # Main HTML structure, overlays, and game containers
├── style.css           # Global styles, retro theme variables, animations
├── README.md           # This file
└── js/
    ├── app.js          # Core arcade manager (UI transitions, routing)
    ├── storage.js      # LocalStorage wrapper
    ├── audio.js        # Synthesized sound effects using Web Audio API
    └── games/
        ├── snake.js    # Snake game logic (Canvas)
        ├── pong.js     # Pong game logic (Canvas)
        ├── breakout.js # Breakout game logic (Canvas)
        ├── flappy.js   # Flappy game logic (Canvas)
        ├── reaction.js # Reaction game logic (DOM)
        └── memory.js   # Memory game logic (DOM)
```

## Future Improvements

- Add mobile touch controls (on-screen D-pad) for Snake, Pong, and Breakout.
- Add more particle effects for block breaking or game over states.
- Implement a global leaderboard backend (e.g., Firebase).
- Add background music using a tracker format or generative synth sequences.

## Credits

Created as a portfolio project demonstrating senior-level front-end architecture, game loop implementation, and UI/UX design.
