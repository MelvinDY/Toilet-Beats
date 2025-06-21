import React, { useRef, useEffect, useState, useCallback } from 'react';
import './SlipNPong.css';

const SlipNPong = () => {
  const canvasRef = useRef(null);
  const [winner, setWinner] = useState(null); // null, 'player1', or 'player2'
  const [isGamePaused, setIsGamePaused] = useState(false);

  // State to track if the ball is currently in a slowed-down state after spawning
  const [isBallSlowed, setIsBallSlowed] = useState(false);

  // Game configuration constants
  const PADDLE_WIDTH = 100;
  const PADDLE_HEIGHT = 20;
  const BALL_RADIUS = 20;
  const PADDLE_SPEED = 7;
  const INITIAL_BALL_SPEED_Y = 6.25;
  const MAX_BALL_SPEED_X = 6.25;
  const INITIAL_SLOW_MULTIPLIER = 0.5;
  const TUB_HORIZONTAL_PADDING = 20;
  const PADDLE_VERTICAL_OFFSET = 50; // Increased to move feet closer to center

  // Decorative block constants
  const DECORATIVE_BLOCK_HEIGHT = 15;
  const DECORATIVE_BLOCK_GAP = 5; // Smaller gap for a more continuous look
  const DECORATIVE_ROW_VERTICAL_OFFSET = 25; // How far from the top/bottom edge of the tub the row sits
  const NUM_DECORATIVE_BLOCKS_TARGET = 8; // Target number of blocks in a row

  // Using refs for mutable game state that does not trigger re-renders directly
  const player1PaddleXRef = useRef(0);
  const player2PaddleXRef = useRef(0);
  const ballXRef = useRef(0);
  const ballYRef = useRef(0);
  const ballSpeedXRef = useRef(0);
  const ballSpeedYRef = useRef(0);
  const pressedKeysRef = useRef(new Set());
  const animationFrameIdRef = useRef(null);

  /**
   * Resets the ball to the center of the canvas and sets its initial direction.
   * The ball will start at a slower speed.
   */
  const resetBall = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ballXRef.current = canvasWidth / 2;
    ballYRef.current = canvasHeight / 2;

    const randomDirection = Math.random() < 0.5 ? 1 : -1;
    ballSpeedYRef.current = randomDirection * INITIAL_BALL_SPEED_Y * INITIAL_SLOW_MULTIPLIER;
    ballSpeedXRef.current = (Math.random() * 2 - 1) * (MAX_BALL_SPEED_X / 2) * INITIAL_SLOW_MULTIPLIER;

    setIsBallSlowed(true);
  }, [INITIAL_BALL_SPEED_Y, MAX_BALL_SPEED_X, INITIAL_SLOW_MULTIPLIER]);

  /**
   * Ends the game and declares a winner.
   * @param {string} winningPlayer - 'player1' or 'player2'.
   */
  const endGameWithWinner = useCallback((winningPlayer) => {
    setWinner(winningPlayer);
    setIsGamePaused(true); // Pause the game when a winner is declared
  }, []);

  /**
   * Draws all game elements on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   * @param {number} canvasWidth - The current width of the canvas.
   * @param {number} canvasHeight - The current height of the canvas.
   */
  const draw = useCallback((ctx, canvasWidth, canvasHeight) => {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the main background (outside the tub)
    ctx.fillStyle = 'var(--color-bg-dark)'; // Using CSS variable
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // --- Draw the tub background ---
    const tubX = TUB_HORIZONTAL_PADDING;
    const tubY = 0;
    const tubWidth = canvasWidth - (2 * TUB_HORIZONTAL_PADDING);
    const tubHeight = canvasHeight;
    const tubCornerRadius = 30;

    ctx.fillStyle = 'var(--color-tub-light)'; // Light gray/off-white for the tub
    ctx.strokeStyle = 'var(--color-tub-border)'; // Slightly darker gray for tub border
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(tubX + tubCornerRadius, tubY);
    ctx.lineTo(tubX + tubWidth - tubCornerRadius, tubY);
    ctx.arcTo(tubX + tubWidth, tubY, tubX + tubWidth, tubY + tubCornerRadius, tubCornerRadius);
    ctx.lineTo(tubX + tubWidth, tubY + tubHeight - tubCornerRadius);
    ctx.arcTo(tubX + tubWidth, tubY + tubHeight, tubX + tubWidth - tubCornerRadius, tubY + tubHeight, tubCornerRadius);
    ctx.lineTo(tubX + tubCornerRadius, tubY + tubHeight);
    ctx.arcTo(tubX, tubY + tubHeight, tubX, tubY + tubHeight - tubCornerRadius, tubCornerRadius);
    ctx.lineTo(tubX, tubY + tubCornerRadius);
    ctx.arcTo(tubX, tubY, tubX + tubCornerRadius, tubY, tubCornerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw the drain in the middle of the tub
    const drainX = canvasWidth / 2;
    const drainY = canvasHeight / 2;
    const drainRadius = 15;

    ctx.fillStyle = 'var(--color-drain-dark)'; // Dark gray for the drain hole
    ctx.beginPath();
    ctx.arc(drainX, drainY, drainRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'var(--color-drain-grating)'; // Lighter gray for drain grating
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drainX - drainRadius * 0.7, drainY);
    ctx.lineTo(drainX + drainRadius * 0.7, drainY);
    ctx.moveTo(drainX, drainY - drainRadius * 0.7);
    ctx.lineTo(drainX, drainY + drainRadius * 0.7);
    ctx.stroke();
    // --- End of tub drawing ---

    // Draw Player 1's paddle (bottom) - Enormous barefeet emoji rotated 180 degrees
    ctx.save();
    ctx.translate(player1PaddleXRef.current + PADDLE_WIDTH / 2, canvasHeight - PADDLE_HEIGHT - PADDLE_VERTICAL_OFFSET + PADDLE_HEIGHT / 2);
    ctx.rotate(Math.PI);
    ctx.font = `${PADDLE_WIDTH * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦶', 0, 0);
    ctx.restore();

    // Draw Player 2's paddle (top) - Enormous barefeet emoji
    ctx.font = `${PADDLE_WIDTH * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦶', player2PaddleXRef.current + PADDLE_WIDTH / 2, PADDLE_VERTICAL_OFFSET + PADDLE_HEIGHT / 2);

    // Draw the ball - Soap emoji
    ctx.font = `${BALL_RADIUS * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧼', ballXRef.current, ballYRef.current);

    // Draw Decorative Rectangular Blocks
    ctx.fillStyle = 'var(--color-decorative-block)'; // Light gray for the blocks
    ctx.strokeStyle = 'var(--color-decorative-block-border)'; // Border for blocks
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round'; // For rounded corners on stroke if desired

    // Calculate block width to fill the entire tub width
    const totalGapWidth = (NUM_DECORATIVE_BLOCKS_TARGET - 1) * DECORATIVE_BLOCK_GAP;
    const individualBlockWidth = (tubWidth - totalGapWidth) / NUM_DECORATIVE_BLOCKS_TARGET;

    // Calculate startX to ensure blocks are aligned with tubX
    const startX = tubX;

    // Y position for Player 1's (bottom) decorative blocks
    const p1BlockY = canvasHeight - DECORATIVE_ROW_VERTICAL_OFFSET - DECORATIVE_BLOCK_HEIGHT;
    // Y position for Player 2's (top) decorative blocks
    const p2BlockY = DECORATIVE_ROW_VERTICAL_OFFSET;

    for (let i = 0; i < NUM_DECORATIVE_BLOCKS_TARGET; i++) {
      const x = startX + i * (individualBlockWidth + DECORATIVE_BLOCK_GAP);

      // Draw for Player 1's side
      ctx.beginPath();
      ctx.roundRect(x, p1BlockY, individualBlockWidth, DECORATIVE_BLOCK_HEIGHT, 5); // Rounded corners for blocks
      ctx.fill();
      ctx.stroke();

      // Draw for Player 2's side
      ctx.beginPath();
      ctx.roundRect(x, p2BlockY, individualBlockWidth, DECORATIVE_BLOCK_HEIGHT, 5); // Rounded corners for blocks
      ctx.fill();
      ctx.stroke();
    }

    // Display winner message if game has ended
    if (winner) {
      ctx.fillStyle = 'var(--color-text-secondary)'; // Using CSS variable
      ctx.font = '48px var(--font-primary)'; // Using CSS variable for font
      ctx.textAlign = 'center';
      const winnerText = winner === 'player1' ? 'Player 1 Wins!' : 'Player 2 Wins!';
      ctx.fillText(winnerText, canvasWidth / 2, canvasHeight / 2);
    }
  }, [winner, PADDLE_WIDTH, PADDLE_VERTICAL_OFFSET, BALL_RADIUS, TUB_HORIZONTAL_PADDING, DECORATIVE_BLOCK_HEIGHT, DECORATIVE_BLOCK_GAP, DECORATIVE_ROW_VERTICAL_OFFSET, NUM_DECORATIVE_BLOCKS_TARGET]);

  /**
   * Updates the game state for each frame of the game loop.
   * Handles ball movement, collisions, paddle movement, and game ending conditions.
   */
  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isGamePaused) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 1. Update ball position
    ballXRef.current += ballSpeedXRef.current;
    ballYRef.current += ballSpeedYRef.current;

    // 2. Ball collision with top/bottom boundaries (winning condition)
    if (ballYRef.current - BALL_RADIUS < 0) {
      endGameWithWinner('player1'); // Player 1 wins
      return;
    }
    if (ballYRef.current + BALL_RADIUS > canvasHeight) {
      endGameWithWinner('player2'); // Player 2 wins
      return;
    }

    // 3. Ball collision with left/right canvas edges (using horizontal padding)
    if (ballXRef.current - BALL_RADIUS < TUB_HORIZONTAL_PADDING || ballXRef.current + BALL_RADIUS > canvasWidth - TUB_HORIZONTAL_PADDING) {
      ballSpeedXRef.current *= -1; // Reverse horizontal direction
    }

    // 4. Paddle movement based on pressed keys
    const keys = pressedKeysRef.current;
    // Player 1 (bottom paddle) controls: A (left), D (right)
    if (keys.has('a')) {
      player1PaddleXRef.current = Math.max(TUB_HORIZONTAL_PADDING, player1PaddleXRef.current - PADDLE_SPEED);
    }
    if (keys.has('d')) {
      player1PaddleXRef.current = Math.min(canvasWidth - PADDLE_WIDTH - TUB_HORIZONTAL_PADDING, player1PaddleXRef.current + PADDLE_SPEED);
    }
    // Player 2 (top paddle) controls: H (left), K (right)
    if (keys.has('h')) {
      player2PaddleXRef.current = Math.max(TUB_HORIZONTAL_PADDING, player2PaddleXRef.current - PADDLE_SPEED);
    }
    if (keys.has('k')) {
      player2PaddleXRef.current = Math.min(canvasWidth - PADDLE_WIDTH - TUB_HORIZONTAL_PADDING, player2PaddleXRef.current + PADDLE_SPEED);
    }

    // Function to handle ball speed normalization after a paddle hit
    const normalizeBallSpeedAfterHit = () => {
      if (isBallSlowed) {
        ballSpeedYRef.current = Math.sign(ballSpeedYRef.current) * INITIAL_BALL_SPEED_Y;
        setIsBallSlowed(false);
      }
    };

    // 5. Ball collision with Player 1 paddle (bottom)
    const player1PaddleY = canvasHeight - PADDLE_HEIGHT - PADDLE_VERTICAL_OFFSET;
    if (ballSpeedYRef.current > 0 &&
        ballYRef.current + BALL_RADIUS >= player1PaddleY &&
        ballYRef.current + BALL_RADIUS <= player1PaddleY + PADDLE_HEIGHT &&
        ballXRef.current + BALL_RADIUS > player1PaddleXRef.current &&
        ballXRef.current - BALL_RADIUS < player1PaddleXRef.current + PADDLE_WIDTH) {
      ballSpeedYRef.current *= -1;
      const hitPoint = (ballXRef.current - player1PaddleXRef.current) / PADDLE_WIDTH;
      ballSpeedXRef.current = (hitPoint - 0.5) * 2 * MAX_BALL_SPEED_X;
      normalizeBallSpeedAfterHit();
    }

    // 6. Ball collision with Player 2 paddle (top)
    const player2PaddleY = PADDLE_VERTICAL_OFFSET + PADDLE_HEIGHT;
    if (ballSpeedYRef.current < 0 &&
        ballYRef.current - BALL_RADIUS <= player2PaddleY &&
        ballYRef.current - BALL_RADIUS >= PADDLE_VERTICAL_OFFSET &&
        ballXRef.current + BALL_RADIUS > player2PaddleXRef.current &&
        ballXRef.current - BALL_RADIUS < player2PaddleXRef.current + PADDLE_WIDTH) {
      ballSpeedYRef.current *= -1;
      const hitPoint = (ballXRef.current - player2PaddleXRef.current) / PADDLE_WIDTH;
      ballSpeedXRef.current = (hitPoint - 0.5) * 2 * MAX_BALL_SPEED_X;
      normalizeBallSpeedAfterHit();
    }

    // Decorative blocks have no collision detection

    // Redraw everything on the canvas
    draw(canvas.getContext('2d'), canvasWidth, canvasHeight);

    // Request the next animation frame to continue the game loop
    animationFrameIdRef.current = requestAnimationFrame(update);
  }, [isGamePaused, draw, resetBall, isBallSlowed, INITIAL_BALL_SPEED_Y, MAX_BALL_SPEED_X, TUB_HORIZONTAL_PADDING, PADDLE_WIDTH, PADDLE_VERTICAL_OFFSET, BALL_RADIUS, endGameWithWinner]);

  // Effect to set up canvas dimensions and initial game state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const setCanvasDimensions = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        player1PaddleXRef.current = (canvas.width / 2) - (PADDLE_WIDTH / 2);
        player2PaddleXRef.current = (canvas.width / 2) - (PADDLE_WIDTH / 2);

        resetBall();
        draw(ctx, canvas.width, canvas.height);
      }
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    const handleKeyDown = (e) => {
      if (['a', 'd', 'h', 'k'].includes(e.key.toLowerCase())) {
        e.preventDefault(); // Prevent default browser behavior for these keys
      }
      pressedKeysRef.current.add(e.key.toLowerCase());

      if (e.key === 'Escape') {
        setIsGamePaused(prev => !prev);
      }
    };
    const handleKeyUp = (e) => {
      pressedKeysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [draw, resetBall, PADDLE_WIDTH]); // Added PADDLE_WIDTH to dependencies for initial paddle positioning

  // Effect to manage the game loop (start/stop based on isGamePaused and winner)
  useEffect(() => {
    if (!isGamePaused && !winner) { // Only run if not paused and no winner declared
      animationFrameIdRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isGamePaused, update, winner]);

  /**
   * Toggles the game pause state.
   */
  const toggleGame = () => {
    if (!winner) { // If there's no winner, toggle pause
      setIsGamePaused(prev => !prev);
    } else if (isGamePaused) { // If there is a winner and game is paused, hitting "Continue" will reset and start a new game
        resetGame();
    }
  };

  /**
   * Resets the game state (winner, ball position), then resumes the game.
   */
  const resetGame = () => {
    setWinner(null); // Clear the winner
    resetBall(); // Reset ball position and speed
    setIsGamePaused(false); // Game resumes after reset
  };

  return (
    <>
      <style>
        {`
          /* Import Google Font - Inter (if desired) */
          /* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); */

          /* CSS Variables for colors and fonts */
          :root {
            --color-bg-dark: #1a202c; /* Equivalent to bg-gray-900 / bg-gray-800 */
            --color-text-primary: #e2e8f0; /* Equivalent to text-gray-300 */
            --color-text-secondary: #4a5568; /* Equivalent to text-gray-700 / text-gray-800 for winner message */

            --color-tub-light: #f0f4f8; /* Off-white for the tub */
            --color-tub-border: #a0aec0; /* Gray for tub border */
            --color-drain-dark: #4a5568; /* Darker gray for drain */
            --color-drain-grating: #a0aec0; /* Lighter gray for drain grating */

            --color-decorative-block: #cbd5e0; /* Light gray for blocks */
            --color-decorative-block-border: #a0aec0; /* Gray for block border */

            --color-button-primary-base: #2563eb; /* Blue-600 */
            --color-button-primary-hover: #1d4ed8; /* Blue-700 */
            --color-button-primary-gradient-from: #3b82f6; /* Blue-500 */
            --color-button-primary-gradient-to: #2563eb; /* Blue-700 */

            --color-button-secondary-base: #dc2626; /* Red-600 */
            --color-button-secondary-hover: #b91c1c; /* Red-700 */
            --color-button-secondary-gradient-from: #ef4444; /* Red-500 */
            --color-button-secondary-gradient-to: #dc2626; /* Red-700 */

            --font-primary: 'Inter', sans-serif; /* Fallback to sans-serif if Inter is not loaded */
          }

          /* Base styles for the entire app container */
          .slipnpong-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh; /* Full viewport height */
            background-color: var(--color-bg-dark);
            color: var(--color-text-primary);
            font-family: var(--font-primary);
            padding: 1rem; /* Equivalent to p-4 */
            box-sizing: border-box; /* Ensure padding doesn't add to element's total width/height */
          }

          /* Canvas Wrapper Styling */
          .slipnpong-canvas-wrapper {
            position: relative;
            width: 100%;
            max-width: 64rem; /* Equivalent to max-w-4xl */
            height: calc(100vh - 4rem); /* Adjust height for padding and controls */
            background-color: var(--color-bg-dark); /* Equivalent to bg-gray-800 */
            border-radius: 0.5rem; /* Equivalent to rounded-lg */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to shadow-xl */
            overflow: hidden;
            margin-bottom: 1.5rem; /* Space between canvas and controls */
          }

          @media (max-width: 640px) {
            .slipnpong-canvas-wrapper {
              height: calc(100vh - 8rem); /* More space for buttons on small screens */
            }
          }

          /* Canvas itself */
          .slipnpong-canvas {
            width: 100%;
            height: 100%;
            display: block; /* Remove extra space below canvas */
            border-radius: 0.5rem; /* Inherit from wrapper, but explicitly set for good measure */
          }

          /* Game Controls Buttons Container */
          .slipnpong-controls {
            display: flex;
            flex-direction: column; /* Stack buttons on small screens */
            gap: 1rem; /* Space between buttons */
            margin-top: 1.5rem; /* Equivalent to mt-6 */
          }

          @media (min-width: 640px) { /* Equivalent to sm: */
            .slipnpong-controls {
              flex-direction: row; /* Row on larger screens */
              gap: 2rem; /* Equivalent to sm:space-x-8 */
            }
          }

          /* Base button styling */
          .slipnpong-button {
            padding: 0.75rem 2rem; /* Equivalent to px-8 py-3 */
            font-weight: 600; /* Equivalent to font-semibold */
            border-radius: 0.5rem; /* Equivalent to rounded-lg */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
            transition: all 0.3s ease-in-out; /* Equivalent to transition-all duration-300 ease-in-out */
            transform: scale(1);
            outline: none; /* Remove default focus outline */
            position: relative;
            overflow: hidden;
            border: none; /* Remove default button border */
            cursor: pointer;
            color: white; /* Text color for buttons */
          }

          .slipnpong-button:hover {
            transform: scale(1.05); /* Equivalent to hover:scale-105 */
          }

          .slipnpong-button:focus {
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* Focus ring equivalent */
          }

          /* Primary Button Specifics */
          .primary-button {
            background-color: var(--color-button-primary-base); /* Blue-600 */
          }

          .primary-button:hover {
            background-color: var(--color-button-primary-hover); /* Blue-700 */
          }

          .primary-button .button-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom right, var(--color-button-primary-gradient-from), var(--color-button-primary-gradient-to));
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: 0.5rem;
          }

          .primary-button:hover .button-gradient {
            opacity: 1;
          }

          /* Secondary Button Specifics */
          .secondary-button {
            background-color: var(--color-button-secondary-base); /* Red-600 */
          }

          .secondary-button:hover {
            background-color: var(--color-button-secondary-hover); /* Red-700 */
          }

          .secondary-button .button-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom right, var(--color-button-secondary-gradient-from), var(--color-button-secondary-gradient-to));
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: 0.5rem;
          }

          .secondary-button:hover .button-gradient {
            opacity: 1;
          }

          .button-text {
            position: relative;
            z-index: 10;
          }

          /* Overlay for Paused/Winner message */
          .slipnpong-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.75); /* Equivalent to bg-black bg-opacity-75 */
            z-index: 20; /* Ensure it's above the canvas */
            border-radius: 0.5rem; /* Match canvas wrapper */
          }

          .slipnpong-message {
            color: white;
            font-size: 3rem; /* Equivalent to text-5xl */
            font-weight: 700; /* Equivalent to font-bold */
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; /* Equivalent to animate-pulse */
            text-align: center;
            padding: 1rem; /* Ensure text doesn't touch edges */
          }

          /* Pulse animation for the message */
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>

      <div className="slipnpong-container">
        {/* Game Canvas Container */}
        <div className="slipnpong-canvas-wrapper">
          <canvas ref={canvasRef} className="slipnpong-canvas"></canvas>
        </div>

        {/* Game Controls Buttons */}
        <div className="slipnpong-controls">
          <button
            onClick={toggleGame}
            className="slipnpong-button primary-button"
          >
            <span className="button-gradient"></span>
            <span className="button-text">
              {winner ? 'New Game' : (isGamePaused ? 'Resume Game' : 'Pause Game')}
            </span>
          </button>

          <button
            onClick={resetGame}
            className="slipnpong-button secondary-button"
          >
            <span className="button-gradient"></span>
            <span className="button-text">Reset Game</span>
          </button>
        </div>

        {/* Game Paused/Winner Overlay */}
        {isGamePaused && (
          <div className="slipnpong-overlay">
            <p className="slipnpong-message">
              {winner ? (winner === 'player1' ? 'Player 1 Wins!' : 'Player 2 Wins!') : 'Game Paused!'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SlipNPong;
