import React, { useState, useEffect, useCallback, useRef } from 'react';

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
const FOOD_COLOR = '#f87171'; // Red

const PLAYER_1_CONTROLS = { 'w': { dx: 0, dy: -1 }, 's': { dx: 0, dy: 1 }, 'a': { dx: -1, dy: 0 }, 'd': { dx: 1, dy: 0 } };
const PLAYER_2_CONTROLS = { 'ArrowUp': { dx: 0, dy: -1 }, 'ArrowDown': { dx: 0, dy: 1 }, 'ArrowLeft': { dx: -1, dy: 0 }, 'ArrowRight': { dx: 1, dy: 0 } };

// Initial game speed and minimum speed
const INITIAL_GAME_SPEED = 120; // milliseconds per game update
const MIN_GAME_SPEED = 50; // Minimum speed the game can reach
const SPEED_INCREMENT_PER_FOOD = 2; // How much to decrease gameSpeed by when food is eaten


// --- Helper Functions ---
/**
 * Generates a random position for food, ensuring it doesn't overlap with either snake's body.
 * @param {Array<{x: number, y: number}>} snake1Body - The body segments of snake 1.
 * @param {Array<{x: number, y: number}>} snake2Body - The body segments of snake 2.
 * @returns {{x: number, y: number}} A random position object.
 */
const getRandomPosition = (snake1Body = [], snake2Body = []) => {
    let position;
    do {
        position = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
        };
    } while (
        snake1Body.some(seg => seg.x === position.x && seg.y === position.y) ||
        snake2Body.some(seg => seg.x === position.x && seg.y === position.y)
    );
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
 * Determines the Tailwind CSS class for rounding the *inner* corner of a snake bend.
 * @param {{dx: number, dy: number}} entryDir - Direction vector from the previous segment into the current segment.
 * @param {{dx: number, dy: number}} exitDir - Direction vector from the current segment to the next segment.
 * @returns {string} The Tailwind CSS class for the inner rounded corner (e.g., 'rounded-tl-md').
 */
const getInnerCornerClass = (entryDir, exitDir) => {
    // Came from Top (moving Down), turning Right/Left
    if (entryDir.dx === 0 && entryDir.dy === 1) {
        if (exitDir.dx === 1) return 'rounded-tl-md'; // Down -> Right: Inner corner is Top-Left
        if (exitDir.dx === -1) return 'rounded-tr-md'; // Down -> Left: Inner corner is Top-Right
    }
    // Came from Bottom (moving Up), turning Right/Left
    else if (entryDir.dx === 0 && entryDir.dy === -1) {
        if (exitDir.dx === 1) return 'rounded-bl-md'; // Up -> Right: Inner corner is Bottom-Left
        if (exitDir.dx === -1) return 'rounded-br-md'; // Up -> Left: Inner corner is Bottom-Right
    }
    // Came from Left (moving Right), turning Down/Up
    else if (entryDir.dx === 1 && entryDir.dy === 0) {
        if (exitDir.dy === 1) return 'rounded-tl-md'; // Right -> Down: Inner corner is Top-Left
        if (exitDir.dy === -1) return 'rounded-bl-md'; // Right -> Up: Inner corner is Bottom-Left
    }
    // Came from Right (moving Left), turning Down/Up
    else if (entryDir.dx === -1 && entryDir.dy === 0) {
        if (exitDir.dy === 1) return 'rounded-tr-md'; // Left -> Down: Inner corner is Top-Right
        if (exitDir.dy === -1) return 'rounded-br-md'; // Left -> Up: Inner corner is Bottom-Right
    }
    return ''; // Not a valid bend for rounding (e.g., straight segment)
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
 * @returns {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, newDirection: {dx: number, dy: number}, isAlive: boolean}}
 */
const getInitialSnake1State = () => ({
    body: [{ x: 5, y: 10 }],
    direction: { dx: 1, dy: 0 }, // Initial direction: right
    newDirection: { dx: 1, dy: 0 }, // Stored for direction change
    isAlive: true,
});

/**
 * Returns the initial state for Snake 2.
 * @returns {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, newDirection: {dx: number, dy: number}, isAlive: boolean}}
 */
const getInitialSnake2State = () => ({
    body: [{ x: TILE_COUNT - 6, y: 10 }],
    direction: { dx: -1, dy: 0 }, // Initial direction: left
    newDirection: { dx: -1, dy: 0 }, // Stored for direction change
    isAlive: true,
});

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
            <ellipse cx="10" cy="18" rx="8" ry="2" fill={fillColor} opacity="0.8" />
            {/* Main body of the roll (a rounded rectangle) */}
            <rect x="2" y="2" width="16" height="16" rx="4" ry="4" fill={fillColor} />
            {/* Top ellipse */}
            <ellipse cx="10" cy="2" rx="8" ry="2" fill={fillColor} />
            {/* Inner hole (darker for depth) */}
            <ellipse cx="10" cy="3" rx="4" ry="1.5" fill="black" opacity="0.5" />
            {/* Inner hole (lighter for highlight) */}
            <ellipse cx="10" cy="2" rx="4" ry="1.5" fill="white" opacity="0.8" />
        </svg>
    );
};


// --- Board Component ---
/**
 * Renders the game board, including the snakes and food.
 * Uses CSS Grid for positioning the elements.
 * @param {Object} props - Component props.
 * @param {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}}} props.snake1 - Snake 1 data.
 * @param {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}}} props.snake2 - Snake 2 data.
 * @param {{x: number, y: number}} props.food - Food position.
 * @returns {JSX.Element} The game board.
 */
const Board = ({ snake1, snake2, food }) => {

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

        if (isHead) {
            // Render the Toilet Paper Roll SVG for the snake's head
            return (
                <div
                    key={`seg-${index}`}
                    style={{
                        gridColumn: segment.x + 1,
                        gridRow: segment.y + 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ToiletPaperRollSVG fillColor={headColor} isHead={true} direction={currentHeadDirection} />
                </div>
            );
        } else if (isTail) {
            // Tail segment: apply rounding on the side opposite to the direction of approach (i.e., towards the very end of the tail)
            const prevSegment = body[index - 1]; // Segment just before the tail (closer to head)
            const approachDir = getNormalizedDirection(prevSegment, segment); // Direction *into* the tail segment

            let tailRoundedClass = '';
            // If the snake approached from left (moving right), round the right side of the tail.
            if (approachDir.dx === 1) tailRoundedClass = 'rounded-r-md';
            // If the snake approached from right (moving left), round the left side of the tail.
            else if (approachDir.dx === -1) tailRoundedClass = 'rounded-l-md';
            // If the snake approached from top (moving down), round the bottom side of the tail.
            else if (approachDir.dy === 1) tailRoundedClass = 'rounded-b-md';
            // If the snake approached from bottom (moving up), round the top side of the tail.
            else if (approachDir.dy === -1) tailRoundedClass = 'rounded-t-md';

            return (
                <div
                    key={`seg-${index}`}
                    className={`w-full h-full ${tailRoundedClass}`}
                    style={{ backgroundColor: bodyColor, gridColumn: segment.x + 1, gridRow: segment.y + 1 }}
                />
            );
        } else {
            // Middle body segment: check if it's a corner
            const prevSegmentInSequence = body[index + 1]; // Segment "behind" current one (closer to tail)
            const nextSegmentInSequence = body[index - 1]; // Segment "in front" of current one (closer to head)

            const entryDir = getNormalizedDirection(prevSegmentInSequence, segment); // Direction from previous to current
            const exitDir = getNormalizedDirection(segment, nextSegmentInSequence); // Direction from current to next

            let cornerClasses = '';
            // If entry and exit directions are different, it's a corner (a bend in the snake)
            if (entryDir.dx !== exitDir.dx || entryDir.dy !== exitDir.dy) {
                // Determine which corner to round to create the "inner" smooth curve
                if (entryDir.dx === 0 && entryDir.dy === 1) { // Entered from top (moving Down)
                    if (exitDir.dx === 1) cornerClasses = 'rounded-tl-md'; // Down -> Right: Inner corner is Top-Left
                    if (exitDir.dx === -1) cornerClasses = 'rounded-tr-md'; // Down -> Left: Inner corner is Top-Right
                } else if (entryDir.dx === 0 && entryDir.dy === -1) { // Entered from bottom (moving Up)
                    if (exitDir.dx === 1) cornerClasses = 'rounded-bl-md'; // Up -> Right: Inner corner is Bottom-Left
                    if (exitDir.dx === -1) cornerClasses = 'rounded-br-md'; // Up -> Left: Inner corner is Bottom-Right
                } else if (entryDir.dx === 1 && entryDir.dy === 0) { // Entered from left (moving Right)
                    if (exitDir.dy === 1) cornerClasses = 'rounded-tl-md'; // Right -> Down: Inner corner is Top-Left
                    if (exitDir.dy === -1) cornerClasses = 'rounded-bl-md'; // Right -> Up: Inner corner is Bottom-Left
                } else if (entryDir.dx === -1 && entryDir.dy === 0) { // Entered from right (moving Left)
                    if (exitDir.dy === 1) cornerClasses = 'rounded-tr-md'; // Left -> Down: Inner corner is Top-Right
                    if (exitDir.dy === -1) cornerClasses = 'rounded-br-md'; // Left -> Up: Inner corner is Bottom-Right
                }
            }
            // For straight segments or non-rounded parts of corners, apply no specific rounding
            return (
                <div
                    key={`seg-${index}`}
                    className={`w-full h-full ${cornerClasses}`}
                    style={{ backgroundColor: bodyColor, gridColumn: segment.x + 1, gridRow: segment.y + 1 }}
                />
            );
        }
    };


    return (
        <div
            className="bg-black border-4 border-gray-700 rounded-lg shadow-lg"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${TILE_COUNT}, 1fr)`,
                gridTemplateRows: `repeat(${TILE_COUNT}, 1fr)`,
                width: `${CANVAS_SIZE}px`,
                height: `${CANVAS_SIZE}px`,
            }}
        >
            {/* Render Snake 1 segments */}
            {snake1.body.map((segment, index) =>
                renderSnakeSegment(segment, index, snake1.body, TP_BODY_1_COLOR, TP_ROLL_1_COLOR, snake1.direction)
            )}
            {/* Render Snake 2 segments */}
            {snake2.body.map((segment, index) =>
                renderSnakeSegment(segment, index, snake2.body, TP_BODY_2_COLOR, TP_ROLL_2_COLOR, snake2.direction)
            )}
            {/* Render Food as a glowing circle */}
            <div
                key="food" // Unique key for the food item
                className="rounded-full"
                style={{
                    gridColumn: food.x + 1,
                    gridRow: food.y + 1,
                    backgroundColor: FOOD_COLOR,
                    boxShadow: `0 0 10px ${FOOD_COLOR}` // Glowing effect for food
                }}
            />
        </div>
    );
};


// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [snake1, setSnake1] = useState(getInitialSnake1State());
    const [snake2, setSnake2] = useState(getInitialSnake2State());
    // Initialize food, ensuring it's not on initial snake positions
    const [food, setFood] = useState(() => getRandomPosition(getInitialSnake1State().body, getInitialSnake2State().body));
    const [gameActive, setGameActive] = useState(false);
    const [scores, setScores] = useState({ player1: 0, player2: 0 });
    const [message, setMessage] = useState('Press Start to Play!');

    // Using useRef for game loop to prevent re-renders from affecting the interval
    const gameLoopRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);
    // gameSpeed is now a state variable
    const [gameSpeed, setGameSpeed] = useState(INITIAL_GAME_SPEED);

    // --- Input Queues ---
    // Using useRef for input queues to prevent unnecessary re-renders when inputs are added/removed.
    const player1InputQueue = useRef([]);
    const player2InputQueue = useRef([]);


    // --- Game Logic ---
    /**
     * Resets the game to its initial state.
     */
    const resetGame = useCallback(() => {
        setGameActive(false);
        const initialSnake1 = getInitialSnake1State();
        const initialSnake2 = getInitialSnake2State();
        setSnake1(initialSnake1);
        setSnake2(initialSnake2);
        // Reset game speed to initial
        setGameSpeed(INITIAL_GAME_SPEED);
        // Clear input queues on reset
        player1InputQueue.current = [];
        player2InputQueue.current = [];
        // Regenerate food position after resetting snakes
        setFood(getRandomPosition(initialSnake1.body, initialSnake2.body));
        setMessage('Press Start to Play!'); // Reset message
    }, []);

    /**
     * Handles game over logic, setting the message and updating scores.
     * @param {'player1' | 'player2' | 'draw'} winner - The winner of the round.
     */
    const handleGameOver = useCallback((winner) => {
        setGameActive(false);
        cancelAnimationFrame(gameLoopRef.current); // Stop the animation loop
        if (winner === 'draw') {
            setMessage('Draw!');
        } else {
            const winnerName = winner === 'player1' ? 'Player 1' : 'Player 2';
            setMessage(`${winnerName} Wins!`);
            // Update the score for the winning player
            setScores(prevScores => ({ ...prevScores, [winner]: prevScores[winner] + 1 }));
        }
    }, []);

    /**
     * Updates the state of a single snake for the next frame.
     * Handles movement, food eating, and boundary wraparound.
     * Now processes inputs from an input queue.
     * @param {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, isAlive: boolean}} snake - The snake object to update.
     * @param {Object} currentFood - The current food position.
     * @param {Function} setFoodCallback - Callback to update food position if eaten.
     * @param {Array<{x: number, y: number}>} otherSnakeBody - The body of the other snake (for food generation).
     * @param {React.MutableRefObject<Array<{dx: number, dy: number}>>} inputQueueRef - The ref to the player's input queue.
     * @param {Function} setGameSpeedCallback - Callback to update game speed.
     * @returns {{body: Array<{x: number, y: number}>, direction: {dx: number, dy: number}, isAlive: boolean}} The updated snake object.
     */
    const getNextSnakeState = useCallback((snake, currentFood, setFoodCallback, otherSnakeBody, inputQueueRef, setGameSpeedCallback) => {
        if (!snake.isAlive) return snake; // If snake is not alive, no update needed

        let effectiveDirection = snake.direction;

        // Process input queue: prioritize queued inputs
        if (inputQueueRef.current.length > 0) {
            const nextQueuedDirection = inputQueueRef.current[0]; // Peek at the next direction
            // Prevent immediate reversal if the queued input is a direct opposite of the current active direction
            if (!(snake.direction.dx === -nextQueuedDirection.dx && snake.direction.dy === -nextQueuedDirection.dy)) {
                effectiveDirection = inputQueueRef.current.shift(); // Use and remove from queue
            } else {
                // If the next queued input is an immediate reversal, discard it
                inputQueueRef.current.shift();
                // We still want to use the current effectiveDirection (which hasn't changed)
            }
        }
        
        // Update snake state with the determined effective direction
        const updatedSnake = { ...snake, direction: effectiveDirection };

        // Calculate new head position
        let head = {
            x: updatedSnake.body[0].x + updatedSnake.direction.dx,
            y: updatedSnake.body[0].y + updatedSnake.direction.dy
        };

        // --- WRAPAROUND LOGIC ---
        // If head goes off board, wrap it around to the other side
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;

        const newBody = [head, ...updatedSnake.body];

        // Check if food is eaten
        if (head.x === currentFood.x && head.y === currentFood.y) {
            // Food eaten, generate new food and don't pop tail
            setFoodCallback(getRandomPosition(newBody, otherSnakeBody));
            // Decrease game speed, but not below MIN_GAME_SPEED
            setGameSpeedCallback(prevSpeed => Math.max(MIN_GAME_SPEED, prevSpeed + SPEED_INCREMENT_PER_FOOD));
        } else {
            // Food not eaten, pop tail to simulate movement
            newBody.pop();
        }
        return { ...updatedSnake, body: newBody };
    }, [TILE_COUNT]);

    /**
     * Main game update function, called repeatedly by the game loop.
     * Updates both snakes' positions and handles food eating, and collision detection.
     */
    const updateGame = useCallback(() => {
        // Calculate the next states of the snakes based on inputs and movement rules
        // IMPORTANT: The second snake's food generation needs to consider the *first* snake's NEW body
        const updatedSnake1 = getNextSnakeState(snake1, food, (newFoodPos) => setFood(newFoodPos), snake2.body, player1InputQueue, setGameSpeed);
        const updatedSnake2 = getNextSnakeState(snake2, food, (newFoodPos) => setFood(newFoodPos), updatedSnake1.body, player2InputQueue, setGameSpeed);

        // --- Collision Detection for the NEXT states ---
        let s1Alive = true;
        let s2Alive = true;

        const head1 = updatedSnake1.body[0];
        const head2 = updatedSnake2.body[0];

        // Self-collision (check against its own body, excluding head)
        for (let i = 1; i < updatedSnake1.body.length; i++) {
            if (head1.x === updatedSnake1.body[i].x && head1.y === updatedSnake1.body[i].y) {
                s1Alive = false;
                break;
            }
        }
        for (let i = 1; i < updatedSnake2.body.length; i++) {
            if (head2.x === updatedSnake2.body[i].x && head2.y === updatedSnake2.body[i].y) {
                s2Alive = false;
                break;
            }
        }

        // Cross-collision (head vs. other snake's body)
        // Check if snake 1's head lands on any part of snake 2's *new* body (including its head)
        if (updatedSnake2.body.some(seg => seg.x === head1.x && seg.y === head1.y)) {
            s1Alive = false;
        }
        // Check if snake 2's head lands on any part of snake 1's *new* body (including its head)
        if (updatedSnake1.body.some(seg => seg.x === head2.x && seg.y === head2.y)) {
            s2Alive = false;
        }

        // Head-on collision (both heads land on the exact same tile)
        // This is explicitly handled by the cross-collision checks too, but good to be explicit
        if (head1.x === head2.x && head1.y === head2.y) {
            s1Alive = false;
            s2Alive = false;
        }

        // Update states only after determining all collision outcomes for this frame
        setSnake1(s => ({ ...updatedSnake1, isAlive: s1Alive }));
        setSnake2(s => ({ ...updatedSnake2, isAlive: s2Alive }));

        // Determine winner or draw based on the calculated aliveness for this frame
        if (!s1Alive && !s2Alive) {
            handleGameOver('draw');
        } else if (!s1Alive) {
            handleGameOver('player2');
        } else if (!s2Alive) {
            handleGameOver('player1');
        }

    }, [food, snake1, snake2, getNextSnakeState, setGameSpeed, handleGameOver]); // Dependencies for useCallback

    // --- Effects ---
    // Keyboard listener for player controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;

            // Player 1 controls (WASD)
            if (PLAYER_1_CONTROLS[key.toLowerCase()]) { // Use toLowerCase for case-insensitive WASD
                const { dx, dy } = PLAYER_1_CONTROLS[key.toLowerCase()];
                // Only queue if it's a new direction or not an immediate reversal of the *currently active* direction,
                // or if the queue is empty. This prevents queueing redundant inputs or invalid reversals too early.
                const currentActiveDirection = snake1.direction;
                if (!(currentActiveDirection.dx === -dx && currentActiveDirection.dy === -dy) || player1InputQueue.current.length === 0) {
                    player1InputQueue.current.push({ dx, dy });
                }
            }
            // Player 2 controls (Arrow Keys)
            else if (PLAYER_2_CONTROLS[key]) {
                const { dx, dy } = PLAYER_2_CONTROLS[key];
                 // Only queue if it's a new direction or not an immediate reversal of the *currently active* direction,
                // or if the queue is empty.
                const currentActiveDirection = snake2.direction;
                if (!(currentActiveDirection.dx === -dx && currentActiveDirection.dy === -dy) || player2InputQueue.current.length === 0) {
                    player2InputQueue.current.push({ dx, dy });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Cleanup function to remove event listener
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [snake1.direction, snake2.direction]); // Depend on snake directions to correctly check for reversals against *current* direction

    // Main Game Loop Effect using requestAnimationFrame for smoother animation
    useEffect(() => {
        let animationFrameId;

        const loop = (currentTime) => {
            if (!gameActive) return; // Stop the loop if game is no longer active

            // Initialize lastUpdateTimeRef on the first call
            if (lastUpdateTimeRef.current === 0) {
                lastUpdateTimeRef.current = currentTime;
            }

            const deltaTime = currentTime - lastUpdateTimeRef.current;

            // Update game state only after gameSpeed milliseconds have passed
            if (deltaTime >= gameSpeed) { // Use the state variable gameSpeed
                updateGame();
                lastUpdateTimeRef.current = currentTime; // Reset timer for the next update
            }
            animationFrameId = requestAnimationFrame(loop); // Continue the loop
        };

        if (gameActive) {
            animationFrameId = requestAnimationFrame(loop); // Start the loop
        } else {
            // If game is not active, ensure any pending animation frames are cancelled
            cancelAnimationFrame(gameLoopRef.current);
        }

        // Cleanup function: cancel the animation frame when component unmounts or gameActive changes
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [gameActive, updateGame, gameSpeed]); // Add gameSpeed to dependencies so the loop reacts to speed changes


    // --- Render ---
    return (
        // Changed background color to #27b1b1
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="bg-[#27b1b1] text-white min-h-screen flex items-center justify-center p-4">
            {/* Import Google Font for retro style */}
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            </style>
            <div className="flex flex-col items-center gap-4">
                {/* Score Board */}
                <div className="flex justify-between w-full max-w-[640px] px-4">
                    <div className="text-xl" style={{ color: TP_ROLL_1_COLOR }}>P1: {scores.player1}</div>
                    <div className="text-xl" style={{ color: TP_ROLL_2_COLOR }}>P2: {scores.player2}</div>
                </div>

                {/* Game Board */}
                <Board snake1={snake1} snake2={snake2} food={food} />

                {/* Message Box */}
                <div className="text-2xl h-[60px] flex items-center justify-center text-center">
                    {message}
                </div>

                {/* Start/Restart Game Button */}
                <button
                    onClick={() => {
                        resetGame(); // Reset game state
                        setGameActive(true); // Start the game
                        setMessage(''); // Clear any previous messages
                    }}
                    // Tailwind classes for styling, including shadow and active states for a button press effect
                    className="font-['Press_Start_2P'] bg-gray-700 text-white border-2 border-gray-600 px-5 py-3 text-base rounded-lg cursor-pointer transition-all active:translate-y-0.5 active:shadow-inner shadow-[0_4px_#333]"
                >
                    {/* Button text changes based on game state */}
                    {gameActive || message.includes('Wins') || message.includes('Draw') ? 'Restart Game' : 'Start Game'}
                </button>
                <div className="text-xs mt-2 text-center mb-4">
                    <p>P1: WASD | P2: Arrow Keys</p>
                </div>
            </div>
        </div>
    );
};

export default App;
