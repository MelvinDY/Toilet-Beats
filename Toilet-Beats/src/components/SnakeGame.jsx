import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Constants ---
const GRID_SIZE = 20;
const CANVAS_SIZE = 640;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;

// Colors for the toilet paper rolls (heads)
const TP_ROLL_1_COLOR = '#34d399'; // Green
const TP_ROLL_2_COLOR = '#f87171'; // Red
// Colors for the toilet paper body (trailing line)
const TP_BODY_1_COLOR = '#34d399'; // Same as roll color for a continuous look
const TP_BODY_2_COLOR = '#f87171'; // Same as roll color for a continuous look

const PLAYER_1_CONTROLS = { 'w': { dx: 0, dy: -1 }, 's': { dx: 0, dy: 1 }, 'a': { dx: -1, dy: 0 }, 'd': { dx: 1, dy: 0 } };
const PLAYER_2_CONTROLS = { 'u': { dx: 0, dy: -1 }, 'j': { dx: 0, dy: 1 }, 'h': { dx: -1, dy: 0 }, 'k': { dx: 1, dy: 0 } };

// Initial game speed (constant, no speed-up from food)
const GAME_SPEED = 120; // milliseconds per game update


// --- Helper Functions ---
/**
 * Generates a random position for a snake's head, ensuring it doesn't overlap with another snake or existing segments.
 * @param {Array<{x: number, y: number}>} existingSnakeBodies - An array of all current snake body segments to avoid collision with.
 * @returns {{x: number, y: number}} A random position object.
 */
const getRandomSpawnPosition = (existingSnakeBodies = []) => {
    let position;
    let collision;
    do {
        position = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
        };
        collision = existingSnakeBodies.some(seg => seg.x === position.x && seg.y === position.y);
    } while (collision);
    return position;
};

/**
 * Calculates the normalized direction (dx, dy where dx,dy are -1, 0, or 1)
 * between two adjacent points on the grid, considering wraparound.
 * This is essential for accurately determining the "bend" in the snake's body.
 * @param {{x: number, y: number}} p1 - The starting point.
 * @param {{x: number, y: number}} p2 - The ending point.
 * @returns {{dx: number, dy: number}} The normalized direction vector.
 */
const getNormalizedDirection = (p1, p2) => {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;

    // Handle horizontal wraparound (e.g., from 0 to TILE_COUNT-1 or TILE_COUNT-1 to 0)
    if (Math.abs(dx) > 1) {
        if (dx > 0) dx -= TILE_COUNT; // Example: p1.x=0, p2.x=19 => dx=19 becomes -1
        else dx += TILE_COUNT; // Example: p1.x=19, p2.x=0 => dx=-19 becomes 1
    }
    // Handle vertical wraparound
    if (Math.abs(dy) > 1) {
        if (dy > 0) dy -= TILE_COUNT;
        else dy += TILE_COUNT;
    }
    return { dx, dy };
};

/**
 * Rotates a Tailwind CSS rounded corner class 90 degrees clockwise (right).
 * This function applies the user's requested visual "rotation" to the corner rounding.
 * @param {string} className - The original Tailwind CSS rounded corner class (e.g., 'rounded-tl-md').
 * @returns {string} The new Tailwind CSS class after rotating the rounding.
 */
const rotateCornerBy90Right = (className) => {
    switch (className) {
        case 'rounded-tl-md': return 'rounded-tr-md'; // Top-Left -> Top-Right
        case 'rounded-tr-md': return 'rounded-br-md'; // Top-Right -> Bottom-Right
        case 'rounded-br-md': return 'rounded-bl-md'; // Bottom-Right -> Bottom-Left
        case 'rounded-bl-md': return 'rounded-tl-md'; // Bottom-Left -> Top-Left
        default: return className; // Return as is for non-matching or empty classes
    }
};


// --- Initial State Definitions ---
/**
 * Returns the initial state for Snake 1.
 * @param {Array<{x: number, y: number}>} existingBodies - Bodies of other snakes to avoid spawning on.
 * @returns {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, newDirection: {dx: number, dy: number}, isAlive: boolean}}
 */
const getInitialSnake1State = (existingBodies = []) => {
    const head = getRandomSpawnPosition(existingBodies);
    let direction = { dx: 1, dy: 0 }; // Default to right

    // Try to ensure initial body segments are within bounds or wrap correctly
    // And don't immediately collide with the head if possible
    let body = [head];
    let secondSegment = { x: head.x - direction.dx, y: head.y - direction.dy };
    // Adjust for wraparound
    if (secondSegment.x < 0) secondSegment.x = TILE_COUNT - 1;
    if (secondSegment.x >= TILE_COUNT) secondSegment.x = 0;
    if (secondSegment.y < 0) secondSegment.y = TILE_COUNT - 1;
    if (secondSegment.y >= TILE_COUNT) secondSegment.y = 0;

    body.push(secondSegment);

    return {
        body: body,
        direction: direction,
        newDirection: direction,
        isAlive: true,
    };
};

/**
 * Returns the initial state for Snake 2.
 * @param {Array<{x: number, y: number}>} existingBodies - Bodies of other snakes to avoid spawning on.
 * @returns {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, newDirection: {dx: number, dy: number}, isAlive: boolean}}
 */
const getInitialSnake2State = (existingBodies = []) => {
    const head = getRandomSpawnPosition(existingBodies);
    let direction = { dx: -1, dy: 0 }; // Default to left

    // Try to ensure initial body segments are within bounds or wrap correctly
    // And don't immediately collide with the head if possible
    let body = [head];
    let secondSegment = { x: head.x - direction.dx, y: head.y - direction.dy };
    // Adjust for wraparound
    if (secondSegment.x < 0) secondSegment.x = TILE_COUNT - 1;
    if (secondSegment.x >= TILE_COUNT) secondSegment.x = 0;
    if (secondSegment.y < 0) secondSegment.y = TILE_COUNT - 1;
    if (secondSegment.y >= TILE_COUNT) secondSegment.y = 0;

    body.push(secondSegment);
    
    return {
        body: body,
        direction: direction,
        newDirection: direction,
        isAlive: true,
    };
};


// --- Toilet Paper Roll SVG Component ---
/**
 * Renders an SVG icon resembling a toilet paper roll.
 * The appearance slightly changes if it's designated as the 'head' of the snake.
 * It also rotates based on the direction of movement.
 * @param {Object} props - Component props.
 * @param {string} props.fillColor - The main color of the toilet paper roll.
 * @param {boolean} props.isHead - True if this roll represents the snake's head.
 * @param {{dx: number, dy: number}} props.direction - The current movement direction of the snake.
 * @returns {JSX.Element} An SVG element.
 */
const ToiletPaperRollSVG = ({ fillColor, isHead, direction }) => {
    // Apply slight scale and a subtle glow/shadow for the head to make it stand out
    const headScale = isHead ? 1.1 : 1;
    const headFilter = isHead ? `drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.7))` : 'none';

    let rotationAngle = 0; // Default rotation
    if (direction.dy === -1) { // Moving upwards
        rotationAngle = -90;
    } else if (direction.dy === 1) { // Moving downwards
        rotationAngle = 90;
    }
    // No rotation for horizontal movement (dx is -1 or 1, dy is 0) as it already looks like it's rolling horizontally.

    return (
        <svg
            width={GRID_SIZE}
            height={GRID_SIZE}
            viewBox="0 0 20 20"
            className="transition-transform duration-100 ease-out"
            style={{
                transform: `scale(${headScale}) rotate(${rotationAngle}deg)`, // Apply scale and rotation
                filter: headFilter,
                transformOrigin: 'center center' // Ensure rotation is around the center of the SVG
            }}
        >
            {/* Bottom ellipse for depth perception */}
            <ellipse cx="10" cy="17" rx="7" ry="2" fill={fillColor} opacity="0.8" />
            {/* Main body of the roll (a rounded rectangle) */}
            <rect x="2" y="2" width="16" height="16" rx="4" ry="4" fill={fillColor} />
            {/* Top ellipse */}
            <ellipse cx="10" cy="2" rx="6" ry="2" fill={fillColor} />
            {/* Inner hole (darker for depth) */}
            <ellipse cx="10" cy="3" rx="4" ry="1.5" fill="black" opacity="0.5" />
            {/* Inner hole (lighter for highlight) */}
            <ellipse cx="10" cy="2" rx="4" ry="1.5" fill="white" opacity="0.8" />
        </svg>
    );
};


// --- Board Component ---
/**
 * Renders the game board, including the snakes.
 * Uses CSS Grid for positioning the elements.
 * @param {Object} props - Component props.
 * @param {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}}} props.snake1 - Snake 1 data.
 * @param {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}}} props.snake2 - Snake 2 data.
 * @returns {JSX.Element} The game board.
 */
const Board = ({ snake1, snake2 }) => { 

    /**
     * Calculates the normalized direction (dx, dy where dx,dy are -1, 0, or 1)
     * between two adjacent points on the grid, considering wraparound.
     * This is essential for accurately determining the "bend" in the snake's body.
     * @param {{x: number, y: number}} p1 - The starting point.
     * @param {{x: number, y: number}} p2 - The ending point.
     * @returns {{dx: number, dy: number}} The normalized direction vector.
     */
    const getNormalizedDirection = (p1, p2) => {
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;

        // Handle horizontal wraparound (e.g., from 0 to TILE_COUNT-1 or TILE_COUNT-1 to 0)
        if (Math.abs(dx) > 1) {
            if (dx > 0) dx -= TILE_COUNT; // Example: p1.x=0, p2.x=19 => dx=19 becomes -1
            else dx += TILE_COUNT; // Example: p1.x=19, p2.x=0 => dx=-19 becomes 1
        }
        // Handle vertical wraparound
        if (Math.abs(dy) > 1) {
            if (dy > 0) dy -= TILE_COUNT;
            else dy += TILE_COUNT;
        }
        return { dx, dy };
    };

    /**
     * Renders a single snake segment (either head, tail, corner, or straight body).
     * This function now intelligently applies Tailwind CSS rounding classes
     * based on whether the segment is the head, tail, or a bending corner,
     * to create the "continuous stream" effect with rounded ends/bends.
     * @param {{x: number, y: number}} segment - The current segment's position.
     * @param {number} index - The index of the current segment in the snake's body array.
     * @param {Array<{x: number, y: number}>} body - The full snake body array.
     * @param {string} bodyColor - The color for the snake's body segments.
     * @param {string} headColor - The color for the snake's head.
     * @param {{dx: number, dy: number}} currentHeadDirection - The current direction of the snake's head.
     * @returns {JSX.Element} The rendered segment div or SVG.
     */
    const renderSnakeSegment = (segment, index, body, bodyColor, headColor, currentHeadDirection) => {
        const isHead = index === 0;
        const isTail = index === body.length - 1;

        // Base class for all segments, without borders for grid lines.
        // Removed inner div for thinner trail and applied background directly to fill the cell.
        let segmentBaseClass = "w-full h-full";

        if (isHead) {
            return (
                <div
                    key={`seg-${index}`}
                    style={{
                        gridColumn: segment.x + 1,
                        gridRow: segment.y + 1,
                        display: 'flex', // Use flexbox to center SVG
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    className={segmentBaseClass}
                >
                    <ToiletPaperRollSVG fillColor={headColor} isHead={true} direction={currentHeadDirection} />
                </div>
            );
        } else if (isTail) {
            const prevSegment = body[index - 1]; 
            const approachDir = getNormalizedDirection(prevSegment, segment); 

            let tailRoundedClass = '';
            if (approachDir.dx === 1) tailRoundedClass = 'rounded-r-md';
            else if (approachDir.dx === -1) tailRoundedClass = 'rounded-l-md';
            else if (approachDir.dy === 1) tailRoundedClass = 'rounded-b-md';
            else if (approachDir.dy === -1) tailRoundedClass = 'rounded-t-md';

            return (
                <div
                    key={`seg-${index}`}
                    className={`${segmentBaseClass} ${tailRoundedClass}`} // Apply base and rounding
                    style={{ backgroundColor: bodyColor, gridColumn: segment.x + 1, gridRow: segment.y + 1 }} // Apply color directly
                />
            );
        } else {
            const prevSegmentInSequence = body[index + 1]; 
            const nextSegmentInSequence = body[index - 1]; 

            const entryDir = getNormalizedDirection(prevSegmentInSequence, segment); 
            const exitDir = getNormalizedDirection(segment, nextSegmentInSequence); 

            let cornerClasses = '';
            if (entryDir.dx !== exitDir.dx || entryDir.dy !== exitDir.dy) {
                if (entryDir.dx === 0 && entryDir.dy === 1) { 
                    if (exitDir.dx === 1) cornerClasses = 'rounded-tl-md'; 
                    if (exitDir.dx === -1) cornerClasses = 'rounded-tr-md'; 
                } else if (entryDir.dx === 0 && entryDir.dy === -1) { 
                    if (exitDir.dx === 1) cornerClasses = 'rounded-bl-md'; 
                    if (exitDir.dx === -1) cornerClasses = 'rounded-br-md'; 
                } else if (entryDir.dx === 1 && entryDir.dy === 0) { 
                    if (exitDir.dy === 1) cornerClasses = 'rounded-tl-md'; 
                    if (exitDir.dy === -1) cornerClasses = 'rounded-bl-md'; 
                } else if (entryDir.dx === -1 && entryDir.dy === 0) { 
                    if (exitDir.dy === 1) cornerClasses = 'rounded-tr-md'; 
                    if (exitDir.dy === -1) cornerClasses = 'rounded-br-md'; 
                }
            }
            return (
                <div
                    key={`seg-${index}`}
                    className={`${segmentBaseClass} ${cornerClasses}`} 
                    style={{ backgroundColor: bodyColor, gridColumn: segment.x + 1, gridRow: segment.y + 1 }} // Apply color directly
                />
            );
        }
    };


    return (
        <div
            className="bg-black border-4 border-gray-700 rounded-lg shadow-lg" // Outer border for the entire board
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${TILE_COUNT}, 1fr)`,
                gridTemplateRows: `repeat(${TILE_COUNT}, 1fr)`,
                width: `${CANVAS_SIZE}px`,
                height: `${CANVAS_SIZE}px`,
            }}
        >
            {/* Render Snake 1 segments on top */}
            {snake1.body.map((segment, index) =>
                renderSnakeSegment(segment, index, snake1.body, TP_BODY_1_COLOR, TP_ROLL_1_COLOR, snake1.direction)
            )}
            {/* Render Snake 2 segments on top */}
            {snake2.body.map((segment, index) =>
                renderSnakeSegment(segment, index, snake2.body, TP_BODY_2_COLOR, TP_ROLL_2_COLOR, snake2.direction)
            )}
        </div>
    );
};



// --- Main App Component ---
const App = () => {
    const navigate = useNavigate();
    const [playerNames] = useState(() => { // Using [] for playerNames as it's not directly modified here
        try {
            const storedPlayers = localStorage.getItem('players');
            return storedPlayers ? JSON.parse(storedPlayers) : { player1: 'Player 1', player2: 'Player 2' };
        } catch (e) {
            console.error("Failed to parse players from localStorage", e);
            return { player1: 'Player 1', player2: 'Player 2' };
        }
    });

    const [snake1, setSnake1] = useState(() => getInitialSnake1State());
    const [snake2, setSnake2] = useState(() => getInitialSnake2State());
    const [gameActive, setGameActive] = useState(false);
    const [message, setMessage] = useState('Outsmart your opponent with the power of Toilet Paper!\nPress Shift to start');

    const gameLoopRef = useRef(null); // Ref to hold the requestAnimationFrame ID
    const lastUpdateTimeRef = useRef(0);
    const [gameSpeed] = useState(GAME_SPEED); // gameSpeed is constant, so no need for setGameSpeed if it doesn't change

    const player1InputQueue = useRef([]);
    const player2InputQueue = useRef([]);

    // --- Game Logic ---
    const resetGame = useCallback(() => {
        // Clear any existing animation frame before starting a new game
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }

        const initialSnake1 = getInitialSnake1State();
        // Pass snake1's body to avoid initial overlap for snake2
        const initialSnake2 = getInitialSnake2State(initialSnake1.body);

        setSnake1(initialSnake1);
        setSnake2(initialSnake2);
        setMessage('');
        player1InputQueue.current = [];
        player2InputQueue.current = [];
        setGameActive(true); // Start the game
    }, []); // No dependencies for resetGame if it's truly resetting to initial state

    const handleGameOver = useCallback((winner) => {
        setGameActive(false); // This will trigger the useEffect cleanup
        if (winner === 'draw') {
            setMessage('It\'s a draw! Restrategise and press Shift to crown a victor!');
        } else {
            const winnerName = winner === 'player1' ? playerNames.player1 : playerNames.player2;
            setMessage(`${winnerName} Wins! Congrats, ${winnerName} is one step closer to earning their TP`);
        }
        // Do not call cancelAnimationFrame here directly; let useEffect handle it.
    }, [playerNames]); // playerNames is a dependency for the message

    const getNextSnakeState = useCallback((snake, inputQueueRef) => {
        // ... (logic remains the same)
        if (!snake.isAlive) return { updatedSnake: snake };

        let effectiveDirection = snake.direction;

        if (inputQueueRef.current.length > 0) {
            const nextQueuedDirection = inputQueueRef.current[0];
            // Prevent immediately reversing direction
            if (!(snake.direction.dx === -nextQueuedDirection.dx && snake.direction.dy === -nextQueuedDirection.dy)) {
                effectiveDirection = inputQueueRef.current.shift();
            } else {
                inputQueueRef.current.shift(); // Discard invalid input
            }
        }

        const updatedSnake = { ...snake, direction: effectiveDirection };

        let head = {
            x: updatedSnake.body[0].x + updatedSnake.direction.dx,
            y: updatedSnake.body[0].y + updatedSnake.direction.dy
        };

        // Wraparound logic
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;

        const newBody = [head, ...updatedSnake.body];
        // Snakes don't grow in this version, so always keep body length to 2 for collision detection
        // If they were to grow, this would be `newBody.slice(0, snake.body.length + 1)` for example.
        // For collision only, keeping them at 2 segments is fine.
        // However, your renderSnakeSegment logic implies a longer snake body for bends/tails.
        // So, assuming snake body length *is* important for rendering, keep the last segment:
        // This is a crucial point for a snake game. If the length doesn't increase, the "tail" disappears.
        // The current code *adds* a new head without removing the tail, which means snakes will continuously grow.
        // If they *shouldn't* grow (like in Tron), then you'd need to slice:
        // const newBody = [head, ...updatedSnake.body.slice(0, updatedSnake.body.length - 1)];
        // Based on the TP_BODY_1_COLOR/TP_BODY_2_COLOR and rendering of tails/corners, it seems they should be drawing a trail.
        // So, the current `newBody` creation is effectively making them grow infinitely which will cause crashes eventually due to memory.
        // Let's assume for a "Tron-like" game, the body does *not* grow unless "eating" food (which is not implemented here).
        // For Tron-like, the body length should be constant, so remove the last segment:
        // If the game means they leave a permanent trail, then this is fine, but it will eventually exhaust memory/performance.
        // Assuming they grow to trace a line as they move and the problem is with collisions rather than growth:
        // The issue isn't infinite growth if the game is about leaving trails. The current code is fine for that.
        // The issue is simply the game loop not stopping.

        return { updatedSnake: { ...updatedSnake, body: newBody } };
    }, []);

    const updateGame = useCallback(() => {
        // Prevent updates if the game is not active
        if (!gameActive) return;

        const { updatedSnake: tempSnake1 } = getNextSnakeState(snake1, player1InputQueue);
        const { updatedSnake: tempSnake2 } = getNextSnakeState(snake2, player2InputQueue);

        let s1Alive = true;
        let s2Alive = true;

        const head1 = tempSnake1.body[0];
        const head2 = tempSnake2.body[0];

        // --- Collision Detection ---
        // Self-collision for Snake 1
        for (let i = 1; i < tempSnake1.body.length; i++) {
            if (head1.x === tempSnake1.body[i].x && head1.y === tempSnake1.body[i].y) {
                s1Alive = false;
                break;
            }
        }
        // Self-collision for Snake 2
        for (let i = 1; i < tempSnake2.body.length; i++) {
            if (head2.x === tempSnake2.body[i].x && head2.y === tempSnake2.body[i].y) {
                s2Alive = false;
                break;
            }
        }

        // Cross-collision (Snake 1 head into Snake 2 body)
        if (tempSnake2.body.some(seg => seg.x === head1.x && seg.y === head1.y)) {
            s1Alive = false;
        }
        // Cross-collision (Snake 2 head into Snake 1 body)
        if (tempSnake1.body.some(seg => seg.x === head2.x && seg.y === head2.y)) {
            s2Alive = false;
        }

        // Head-on collision
        if (head1.x === head2.x && head1.y === head2.y) {
            s1Alive = false;
            s2Alive = false;
        }

        // Update states
        setSnake1(s => ({ ...tempSnake1, isAlive: s1Alive }));
        setSnake2(s => ({ ...tempSnake2, isAlive: s2Alive }));

        // Check for game over condition *after* setting new states
        if (!s1Alive && !s2Alive) {
            handleGameOver('draw');
        } else if (!s1Alive) {
            handleGameOver('player2');
        } else if (!s2Alive) {
            handleGameOver('player1');
        }

    }, [snake1, snake2, gameActive, getNextSnakeState, handleGameOver]); // Added gameActive to dependencies

    // --- Effects ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;

            if (key === 'Shift') {
                e.preventDefault();
                // Only reset if game is not active or message indicates game is over
                if (!gameActive || message.includes('Wins!') || message.includes('draw!')) {
                    resetGame();
                }
                return;
            }

            if (gameActive) { // Only process controls if game is active
                if (PLAYER_1_CONTROLS[key.toLowerCase()]) {
                    const { dx, dy } = PLAYER_1_CONTROLS[key.toLowerCase()];
                    const currentActiveDirection = snake1.direction;
                    // Prevent immediate 180-degree turn
                    if (!(currentActiveDirection.dx === -dx && currentActiveDirection.dy === -dy)) {
                        player1InputQueue.current.push({ dx, dy });
                    }
                } else if (PLAYER_2_CONTROLS[key]) {
                    const { dx, dy } = PLAYER_2_CONTROLS[key];
                    const currentActiveDirection = snake2.direction;
                    // Prevent immediate 180-degree turn
                    if (!(currentActiveDirection.dx === -dx && currentActiveDirection.dy === -dy)) {
                        player2InputQueue.current.push({ dx, dy });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [snake1.direction, snake2.direction, gameActive, message, resetGame]);

    useEffect(() => {
        let animationFrameId;

        const loop = (currentTime) => {
            // If game is no longer active, stop the loop immediately
            if (!gameActive) {
                cancelAnimationFrame(animationFrameId);
                gameLoopRef.current = null; // Clear the ref
                return;
            }

            // Initialize lastUpdateTimeRef if it's the first frame
            if (lastUpdateTimeRef.current === 0) {
                lastUpdateTimeRef.current = currentTime;
            }

            const deltaTime = currentTime - lastUpdateTimeRef.current;

            if (deltaTime >= gameSpeed) {
                updateGame();
                lastUpdateTimeRef.current = currentTime;
            }
            animationFrameId = requestAnimationFrame(loop);
            gameLoopRef.current = animationFrameId; // Keep the ref updated with the current animation frame ID
        };

        if (gameActive) {
            // Start the animation loop
            animationFrameId = requestAnimationFrame(loop);
            gameLoopRef.current = animationFrameId; // Store the initial animation frame ID
        } else {
            // When gameActive becomes false, ensure any *currently running* loop is cancelled.
            // This is especially important if the game state changes to inactive while a frame is pending.
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
                gameLoopRef.current = null; // Clear the ref
            }
        }

        // Cleanup function for useEffect. This runs when the component unmounts
        // or before the effect re-runs due to dependency changes.
        return () => {
            if (gameLoopRef.current) { // Use gameLoopRef.current for robust cancellation
                cancelAnimationFrame(gameLoopRef.current);
                gameLoopRef.current = null; // Clear the ref
            }
        };
    }, [gameActive, updateGame, gameSpeed]);

    const goBackToHomePage = () => {
        // Ensure any lingering game loops are stopped before navigating away
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }
        navigate('/dashboard'); // Navigate to the dashboard
    };

    // --- Render ---
    return (
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="bg-[#27b1b1] text-white min-h-screen flex items-center justify-center p-4">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            </style>
            <div className="flex flex-col items-center gap-4">
                {/* Game Board */}
                <Board snake1={snake1} snake2={snake2} />

                {/* Message Box */}
                <div className="text-2xl h-[60px] flex items-center justify-center text-center">
                    {message}
                </div>

                <div className="text-xs mt-2 text-center mb-4">
                    <p>P1 ({playerNames.player1}): WASD | P2 ({playerNames.player2}): UJHK</p>
                    <p></p>
                </div>

                {/* Back to Home Button */}
                {(!gameActive && (message.includes('Wins!') || message.includes('draw!'))) && ( // Show if game is not active AND game over message is present
                    <button
                        onClick={goBackToHomePage}
                        className="font-['Press_Start_2P'] bg-gray-700 text-white border-2 border-gray-600 px-5 py-3 text-base rounded-lg cursor-pointer transition-all active:translate-y-0.5 active:shadow-inner shadow-[0_4px_#333] mt-4"
                    >
                        Back to Home
                    </button>
                )}
            </div>
        </div>
    );
};

export default App;