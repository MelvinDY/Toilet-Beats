import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function SlipNPong() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [winner, setWinner] = useState(null);

  const storedPlayers = localStorage.getItem('players');
  const [playerNames] = useState(() => {
    try {
      return storedPlayers ? JSON.parse(storedPlayers) : {player1: 'Player 1', player2: 'Player 2'};
    } catch (e) {
      console.error("Failed to parse players from localStorage", e);
      return {player1: 'Player 1', player2: 'Player 2'};
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 400;

    const paddleHeight = 80;
    const paddleWidth = 10;
    const ballRadius = 10;
    const maxBallSpeed = 12;

    const leftPaddle = { x: 100, y: canvas.height / 2 - paddleHeight / 2 };
    const rightPaddle = { x: canvas.width - 110, y: canvas.height / 2 - paddleHeight / 2 };
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: 3 * (Math.random() > 0.5 ? 1 : -1),
    };

    const keys = {};
    window.addEventListener("keydown", (e) => (keys[e.key] = true));
    window.addEventListener("keyup", (e) => (keys[e.key] = false));

    const blockWidth = 12;
    const blockHeight = 40;
    const blockGap = 20;

    let leftBlocks = [];
    let rightBlocks = [];
    for (let y = 0; y < canvas.height; y += blockHeight + blockGap) {
      leftBlocks.push({ x: 40, y });
      rightBlocks.push({ x: canvas.width - 46, y });
    }

    function drawTileBackground() {
      const tileSize = 40;
      const puddleOpacity = 0.3;
      for (let x = 0; x < canvas.width + tileSize; x += tileSize) {
        for (let y = 0; y < canvas.height + tileSize; y += tileSize) {
          ctx.fillStyle = "#f8f8f8";
          ctx.fillRect(x, y, tileSize - 2, tileSize - 2);
          ctx.fillStyle = "#e0e0e0";
          ctx.fillRect(x + tileSize - 2, y, 2, tileSize);
          ctx.fillRect(x, y + tileSize - 2, tileSize, 2);
        }
      }

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

      puddles.forEach(p => {
        ctx.fillStyle = `rgba(100, 150, 255, ${puddleOpacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(150, 200, 255, ${puddleOpacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 5, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawDecoration(blocks) {
      ctx.fillStyle = "#333";
      blocks.forEach(block => {
        ctx.fillRect(block.x, block.y, blockWidth, blockHeight);
      });
    }

    function draw() {
      drawTileBackground();
      ctx.fillStyle = "rgba(26, 26, 46, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#16213e";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDecoration(leftBlocks);
      drawDecoration(rightBlocks);

      ctx.fillStyle = "#0f3460";
      ctx.shadowColor = "#16213e";
      ctx.shadowBlur = 10;
      ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

      if (!winner) {
        ctx.shadowColor = "#e94560";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#e94560";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function capBallSpeed() {
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      if (speed > maxBallSpeed) {
        const angle = Math.atan2(ball.vy, ball.vx);
        ball.vx = maxBallSpeed * Math.cos(angle);
        ball.vy = maxBallSpeed * Math.sin(angle);
      }
    }

    function increaseBallSpeed(mult = 1.1) {
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      const angle = Math.atan2(ball.vy, ball.vx);
      const newSpeed = Math.min(speed * mult, maxBallSpeed);
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
          const overlapX = Math.min(ball.x + ballRadius - block.x, block.x + blockWidth - (ball.x - ballRadius));
          const overlapY = Math.min(ball.y + ballRadius - block.y, block.y + blockHeight - (ball.y - ballRadius));
          if (overlapX < overlapY) ball.vx *= -1;
          else ball.vy *= -1;
          increaseBallSpeed(1.08);
        } else {
          newBlocks.push(block);
        }
      }
      return newBlocks;
    }

    function checkPaddleCollision(paddle, isLeft) {
      const top = paddle.y, bottom = paddle.y + paddleHeight;
      const left = paddle.x, right = paddle.x + paddleWidth;
      if (ball.y >= top && ball.y <= bottom) {
        if (isLeft && ball.vx < 0 && ball.x - ballRadius <= right) {
          ball.vx = Math.abs(ball.vx);
          ball.x = right + ballRadius;
          ball.vy += ((ball.y - top) / paddleHeight - 0.5) * 2;
          increaseBallSpeed(1.03);
        } else if (!isLeft && ball.vx > 0 && ball.x + ballRadius >= left) {
          ball.vx = -Math.abs(ball.vx);
          ball.x = left - ballRadius;
          ball.vy += ((ball.y - top) / paddleHeight - 0.5) * 2;
          increaseBallSpeed(1.03);
        }
      }
    }

    function update() {
      if (winner) return;

      if (keys["w"] && leftPaddle.y > 0) leftPaddle.y -= 6;
      if (keys["s"] && leftPaddle.y < canvas.height - paddleHeight) leftPaddle.y += 6;
      if (keys["ArrowUp"] && rightPaddle.y > 0) rightPaddle.y -= 6;
      if (keys["ArrowDown"] && rightPaddle.y < canvas.height - paddleHeight) rightPaddle.y += 6;

      ball.x += ball.vx;
      ball.y += ball.vy;
      capBallSpeed();

      if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y + ballRadius > canvas.height) {
        ball.y = canvas.height - ballRadius;
        ball.vy = -Math.abs(ball.vy);
      }

      checkPaddleCollision(leftPaddle, true);
      checkPaddleCollision(rightPaddle, false);

      leftBlocks = checkBlockCollision(leftBlocks);
      rightBlocks = checkBlockCollision(rightBlocks);

      const goalMargin = 50;
      if (ball.x < leftPaddle.x - goalMargin && ball.vx < 0) {
        setWinner("Player 2 Wins!");
        setRunning(false);
      } else if (ball.x > rightPaddle.x + paddleWidth + goalMargin && ball.vx > 0) {
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
  }, [running, winner]);

  const goToDashboard = () => {
    if (!winner) return;
    const data = { ...playerNames };
    if (!data.scores) data.scores = {};
    const winnerKey = winner.includes("Player 1") ? data.player1 : data.player2;
    data.scores[winnerKey] = (data.scores[winnerKey] || 0) + 1;
    localStorage.setItem("players", JSON.stringify(data));
    navigate('/dashboard');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem',
      background: '#f0f0f0', minHeight: '100vh',
      backgroundImage: `
        repeating-linear-gradient(0deg,#e8e8e8,#e8e8e8 2px,transparent 2px,transparent 40px),
        repeating-linear-gradient(90deg,#e8e8e8,#e8e8e8 2px,transparent 2px,transparent 40px)
      `,
      backgroundSize: '40px 40px'
    }}>
      <style>{`
        .game-canvas { border: 3px solid #333; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.3); }
        .game-title { color: #333; font-size: 2.5rem; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); font-weight: bold; }
        .instructions { color: #333; margin-top: 1rem; font-size: 1.1rem; text-align: center; background: rgba(255,255,255,0.8); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .game-winner { color: #e94560; font-size: 2rem; margin: 1rem 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); animation: pulse 1s infinite; background: rgba(255,255,255,0.9); padding: 1rem 2rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .game-button { background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border: none; padding: 1rem 2rem; font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer; margin: 0.5rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .game-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        @keyframes pulse { 0%,100% {opacity:1;} 50% {opacity:0.7;} }
      `}</style>

      <h1 className="game-title">🚿 Slip-n-Pong</h1>
      <canvas ref={canvasRef} className="game-canvas" />
      {winner && <h2 className="game-winner">🎉 {winner} 🎉</h2>}
      <p className="instructions">
        Controls: W/S ({playerNames.player1}) | ↑/↓ ({playerNames.player2})<br/>
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
