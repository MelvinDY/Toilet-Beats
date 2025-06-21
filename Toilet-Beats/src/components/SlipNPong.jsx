import React, { useEffect, useRef, useState } from 'react';

export default function SlipNPong() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    // Game Objects
    let paddleHeight = 80;
    let paddleWidth = 10;
    let ballRadius = 10;

    let leftPaddle = { x: 100, y: canvas.height / 2 - paddleHeight / 2 };
    let rightPaddle = { x: canvas.width - 110, y: canvas.height / 2 - paddleHeight / 2 };
    let ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: 3 * (Math.random() > 0.5 ? 1 : -1)
    };

    const keys = {};
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    const blockWidth = 6;
    const blockHeight = 40;
    const blockGap = 5;

    // Create single layer of blocks
    let leftBlocks = [];
    let rightBlocks = [];
    for (let y = 0; y < canvas.height; y += blockHeight + blockGap) {
      leftBlocks.push({ x: 40, y });
      rightBlocks.push({ x: canvas.width - 46, y });
    }

    function drawDecoration(blocks) {
      ctx.fillStyle = 'gray';
      blocks.forEach(block => {
        ctx.fillRect(block.x, block.y, blockWidth, blockHeight);
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw decorations
      drawDecoration(leftBlocks);
      drawDecoration(rightBlocks);

      // Draw paddles
      ctx.fillStyle = 'white';
      ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }

    function increaseBallSpeed(multiplier = 1.05) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const angle = Math.atan2(ball.vy, ball.vx);
      const newSpeed = speed * multiplier;
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
          if (overlapX < overlapY) {
            ball.vx *= -1;
          } else {
            ball.vy *= -1;
          }
          increaseBallSpeed();
        } else {
          newBlocks.push(block);
        }
      }
      return newBlocks;
    }

    function update() {
      // Move paddles
      if (keys['w'] && leftPaddle.y > 0) leftPaddle.y -= 6;
      if (keys['s'] && leftPaddle.y < canvas.height - paddleHeight) leftPaddle.y += 6;
      if (keys['u'] && rightPaddle.y > 0) rightPaddle.y -= 6;
      if (keys['j'] && rightPaddle.y < canvas.height - paddleHeight) rightPaddle.y += 6;

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce off top/bottom
      if (ball.y - ballRadius < 0 || ball.y + ballRadius > canvas.height) {
        ball.vy *= -1;
      }

      // Bounce off paddles
      if (
        ball.vx < 0 &&
        ball.x - ballRadius < leftPaddle.x + paddleWidth &&
        ball.x > leftPaddle.x &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + paddleHeight
      ) {
        ball.vx *= -1;
        increaseBallSpeed();
      }

      if (
        ball.vx > 0 &&
        ball.x + ballRadius > rightPaddle.x &&
        ball.x < rightPaddle.x + paddleWidth &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + paddleHeight
      ) {
        ball.vx *= -1;
        increaseBallSpeed();
      }

      // Remove hit blocks and bounce
      leftBlocks = checkBlockCollision(leftBlocks);
      rightBlocks = checkBlockCollision(rightBlocks);

      // Check win condition
      if (ball.x < 0) {
        setWinner('Player 2 Wins!');
        setRunning(false);
      } else if (ball.x > canvas.width) {
        setWinner('Player 1 Wins!');
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

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold">SlipN Pong</h1>
      <canvas ref={canvasRef} className="border border-white bg-black" />
      {winner && <h2 className="text-xl text-green-400 font-semibold">{winner}</h2>}
      <p>Controls: W/S (Left) | U/J (Right)</p>
    </div>
  );
}
