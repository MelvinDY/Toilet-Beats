import React, { useEffect, useRef, useState } from "react";

export default function SlipNPong() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [winner, setWinner] = useState(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 400;

    // Game Objects
    let paddleHeight = 80;
    let paddleWidth = 10;
    let ballRadius = 10;
    const maxBallSpeed = 12; // Cap ball speed to prevent collision skipping

    let leftPaddle = { x: 100, y: canvas.height / 2 - paddleHeight / 2 };
    let rightPaddle = {
      x: canvas.width - 110,
      y: canvas.height / 2 - paddleHeight / 2,
    };
    let ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: 3 * (Math.random() > 0.5 ? 1 : -1),
    };

    // Game state tracking
    let ballLastFrameX = ball.x;
    let goalScored = false;

    const keys = {};
    window.addEventListener("keydown", (e) => (keys[e.key] = true));
    window.addEventListener("keyup", (e) => (keys[e.key] = false));

    const blockWidth = 12;
    const blockHeight = 40;
    const blockGap = 20;

    // Create single layer of blocks
    let leftBlocks = [];
    let rightBlocks = [];
    for (let y = 0; y < canvas.height; y += blockHeight + blockGap) {
      leftBlocks.push({ x: 40, y });
      rightBlocks.push({ x: canvas.width - 46, y });
    }

    function resetBall() {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
      goalScored = false;
      ballLastFrameX = ball.x;
    }

    function drawDecoration(blocks) {
      ctx.fillStyle = "#333";
      blocks.forEach((block) => {
        ctx.fillRect(block.x, block.y, blockWidth, blockHeight);
      });
    }

    function drawTileBackground() {
      const tileSize = 40;
      const puddleOpacity = 0.3;
      
      // Draw white tiles
      for (let x = 0; x < canvas.width + tileSize; x += tileSize) {
        for (let y = 0; y < canvas.height + tileSize; y += tileSize) {
          // Tile background
          ctx.fillStyle = "#f8f8f8";
          ctx.fillRect(x, y, tileSize - 2, tileSize - 2);
          
          // Tile border/grout
          ctx.fillStyle = "#e0e0e0";
          ctx.fillRect(x + tileSize - 2, y, 2, tileSize);
          ctx.fillRect(x, y + tileSize - 2, tileSize, 2);
        }
      }
      
      // Add some random blue water puddles
      const puddles = [
        { x: 120, y: 80, radius: 25 },
        { x: 350, y: 150, radius: 18 },
        { x: 450, y: 300, radius: 22 },
        { x: 680, y: 120, radius: 20 },
        { x: 200, y: 320, radius: 15 },
        { x: 600, y: 250, radius: 28 },
        { x: 50, y: 200, radius: 12 },
        { x: 750, y: 350, radius: 16 }
      ];
      
      puddles.forEach(puddle => {
        ctx.fillStyle = `rgba(100, 150, 255, ${puddleOpacity})`;
        ctx.beginPath();
        ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add smaller highlight for water effect
        ctx.fillStyle = `rgba(150, 200, 255, ${puddleOpacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(puddle.x - 5, puddle.y - 5, puddle.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function draw() {
      // Draw tiled bathroom floor background
      drawTileBackground();

      // Draw game area with semi-transparent overlay
      ctx.fillStyle = "rgba(26, 26, 46, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center line
      ctx.strokeStyle = "#16213e";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw decorations
      drawDecoration(leftBlocks);
      drawDecoration(rightBlocks);

      // Draw paddles with glow effect
      ctx.fillStyle = "#0f3460";
      ctx.shadowColor = "#16213e";
      ctx.shadowBlur = 10;
      ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

      // Draw ball with glow effect
      ctx.shadowColor = "#e94560";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#e94560";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      
      // Reset shadow
      ctx.shadowBlur = 0;
    }

    function capBallSpeed() {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > maxBallSpeed) {
        const angle = Math.atan2(ball.vy, ball.vx);
        ball.vx = maxBallSpeed * Math.cos(angle);
        ball.vy = maxBallSpeed * Math.sin(angle);
      }
    }

    function increaseBallSpeed(multiplier = 1.1) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const angle = Math.atan2(ball.vy, ball.vx);
      const newSpeed = Math.min(speed * multiplier, maxBallSpeed);
      ball.vx = newSpeed * Math.cos(angle);
      ball.vy = newSpeed * Math.sin(angle);
    }

    function checkBlockCollision(blocks) {
      let newBlocks = [];
      for (let block of blocks) {
        const collided =
          ball.x + ballRadius > block.x &&
          ball.x - ballRadius < block.x + blockWidth &&
          ball.y + ballRadius > block.y &&
          ball.y - ballRadius < block.y + blockHeight;
        if (collided) {
          const overlapX = Math.min(
            ball.x + ballRadius - block.x,
            block.x + blockWidth - (ball.x - ballRadius)
          );
          const overlapY = Math.min(
            ball.y + ballRadius - block.y,
            block.y + blockHeight - (ball.y - ballRadius)
          );
          if (overlapX < overlapY) {
            ball.vx *= -1;
          } else {
            ball.vy *= -1;
          }
          increaseBallSpeed(1.08);
        } else {
          newBlocks.push(block);
        }
      }
      return newBlocks;
    }

    function checkPaddleCollision(paddle, isLeft) {
      const paddleTop = paddle.y;
      const paddleBottom = paddle.y + paddleHeight;
      const paddleLeft = paddle.x;
      const paddleRight = paddle.x + paddleWidth;

      // Check if ball is in vertical range of paddle
      if (ball.y >= paddleTop && ball.y <= paddleBottom) {
        if (isLeft) {
          // Left paddle collision (ball moving left)
          if (ball.vx < 0 && 
              ball.x - ballRadius <= paddleRight && 
              ball.x - ballRadius >= paddleLeft - 5) {
            ball.vx = Math.abs(ball.vx); // Always bounce right
            ball.x = paddleRight + ballRadius; // Prevent sticking
            
            // Add spin based on where ball hits paddle
            const hitPosition = (ball.y - paddleTop) / paddleHeight;
            ball.vy += (hitPosition - 0.5) * 2;
            
            increaseBallSpeed(1.03);
            return true;
          }
        } else {
          // Right paddle collision (ball moving right)
          if (ball.vx > 0 && 
              ball.x + ballRadius >= paddleLeft && 
              ball.x + ballRadius <= paddleRight + 5) {
            ball.vx = -Math.abs(ball.vx); // Always bounce left
            ball.x = paddleLeft - ballRadius; // Prevent sticking
            
            // Add spin based on where ball hits paddle
            const hitPosition = (ball.y - paddleTop) / paddleHeight;
            ball.vy += (hitPosition - 0.5) * 2;
            
            increaseBallSpeed(1.03);
            return true;
          }
        }
      }
      return false;
    }

    function update() {
      if (goalScored) return;

      // Store last frame position for trajectory checking
      ballLastFrameX = ball.x;

      // Move paddles
      if (keys["w"] && leftPaddle.y > 0) leftPaddle.y -= 6;
      if (keys["s"] && leftPaddle.y < canvas.height - paddleHeight)
        leftPaddle.y += 6;
      if (keys["ArrowUp"] && rightPaddle.y > 0) rightPaddle.y -= 6;
      if (keys["ArrowDown"] && rightPaddle.y < canvas.height - paddleHeight)
        rightPaddle.y += 6;

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Cap ball speed to prevent collision skipping
      capBallSpeed();

      // Bounce off top/bottom
      if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y + ballRadius > canvas.height) {
        ball.y = canvas.height - ballRadius;
        ball.vy = -Math.abs(ball.vy);
      }

      // Check paddle collisions
      checkPaddleCollision(leftPaddle, true);
      checkPaddleCollision(rightPaddle, false);

      // Remove hit blocks and bounce
      leftBlocks = checkBlockCollision(leftBlocks);
      rightBlocks = checkBlockCollision(rightBlocks);

      // Immediate win condition - single goal elimination
      const goalMargin = 50; // How far past the paddle the ball needs to go
      
      if (ball.x < leftPaddle.x - goalMargin && ball.vx < 0) {
        // Player 1 loses, Player 2 wins
        goalScored = true;
        setWinner("Player 2 Wins!");
        setRunning(false);
      } else if (ball.x > rightPaddle.x + paddleWidth + goalMargin && ball.vx > 0) {
        // Player 2 loses, Player 1 wins
        goalScored = true;
        setWinner("Player 1 Wins!");
        setRunning(false);
      }
    }

    function loop() {
      if (!running) return;
      update();
      draw();
      requestAnimationFrame(loop);
    }

    loop();
    return () => setRunning(false);
  }, [running]);

  const goToDashboard = () => {
    // In a real app, this would use React Router or similar
    alert("Returning to dashboard... (In a real app, this would navigate to the dashboard)");
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      background: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundImage: `
        repeating-linear-gradient(
          0deg,
          #e8e8e8,
          #e8e8e8 2px,
          transparent 2px,
          transparent 40px
        ),
        repeating-linear-gradient(
          90deg,
          #e8e8e8,
          #e8e8e8 2px,
          transparent 2px,
          transparent 40px
        )
      `,
      backgroundSize: '40px 40px'
    }}>
      <style>{`
        .game-canvas {
          border: 3px solid #333;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }
        
        .game-title {
          color: #333;
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          font-weight: bold;
        }
        
        .instructions {
          color: #333;
          margin-top: 1rem;
          font-size: 1.1rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .game-winner {
          color: #e94560;
          font-size: 2rem;
          margin: 1rem 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          animation: pulse 1s infinite;
          background: rgba(255, 255, 255, 0.9);
          padding: 1rem 2rem;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .game-button {
          background: linear-gradient(45deg, #4CAF50, #45a049);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          margin: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .game-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      
      <h1 className="game-title">🚿 Slip-n-Pong</h1>
      
      <canvas ref={canvasRef} className="game-canvas" />
      
      {winner && <h2 className="game-winner">🎉 {winner} 🎉</h2>}
      
      <p className="instructions">
        Controls: W/S (Player 1) | ↑/↓ (Player 2)<br/>
        💧 Watch out for those slippery bathroom puddles!
      </p>
      
      {winner && (
        <button onClick={goToDashboard} className="game-button">
          🚪 Back to Dashboard
        </button>
      )}
    </div>
  );
}