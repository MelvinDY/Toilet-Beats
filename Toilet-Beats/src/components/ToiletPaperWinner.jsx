import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './ToiletPaperWinner.css';

export default function ToiletPaperWinner() {
  const data = JSON.parse(localStorage.getItem('players')) || {
    player1: 'Player 1',
    player2: 'Player 2',
    scores: { 'Player 1': 0, 'Player 2': 0 }
  };

  const { player1, player2, scores } = data;

  const winnerKey =
    player1 && scores[player1] >= 3 ? 'p1' :
    player2 && scores[player2] >= 3 ? 'p2' :
    null;

  const winnerName =
    winnerKey === 'p1' ? player1 :
    winnerKey === 'p2' ? player2 :
    'Unknown Player';

  useEffect(() => {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 5, spread: 70, origin: { y: 0.6, x: 0.0 } });
    confetti({ particleCount: 5, spread: 70, origin: { y: 0.6, x: 1.0 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  const postWinner = () => {
    fetch('http://192.168.11.109:3001/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner: winnerKey })
    }).then(() => {
      console.log('🧻 Dispenser notified');
    }).catch((err) => {
      console.error('🧻 Failed to notify dispenser:', err);
    });
  };

  if (winnerKey) {
      postWinner(winnerKey);
      console.log(`🏆 Winner set to ${winnerKey} - will stay for 5 seconds...`);
      
      // After 5 seconds, reset to null
      const resetTimeout = setTimeout(() => {
        console.log('🔄 Winner reset to null');
      }, 5000);
      
      // Clean up timeout on component unmount
      return () => clearTimeout(resetTimeout);
  }
}, [winnerKey]);

  return (
    <div className="toilet-winner-page">
      <h2>🎉 Congratulations, {winnerName}!</h2>
      <h2>🧻 You win the Golden Toilet Paper! 🧻</h2>
      <p>Thanks for flushing the competition 💩</p>
    </div>
  );
}