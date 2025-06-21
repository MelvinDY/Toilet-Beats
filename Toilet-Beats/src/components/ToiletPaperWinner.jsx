import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './ToiletPaperWinner.css';

export default function ToiletPaperWinner() {
  const { player1, player2, scores } = JSON.parse(localStorage.getItem('players'));
  const winner = scores[player1] >= 3 ? player1 : player2;

  useEffect(() => {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    // Left side burst
    confetti({
      particleCount: 5,
      spread: 70,
      origin: { y: 0.6, x: 0.0 }
    });

    // Right side burst
    confetti({
      particleCount: 5,
      spread: 70,
      origin: { y: 0.6, x: 1.0 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}, []);

  return (
    <div className="toilet-winner-page">
      <h2>🎉 Congratulations, {winner}!</h2>
      <h2>🧻 You win the Golden Toilet Paper! 🧻</h2>
      <p>Thanks for flushing the competition 💩</p>
    </div>
  );
}