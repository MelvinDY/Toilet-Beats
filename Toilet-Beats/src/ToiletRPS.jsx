import React, { useEffect, useState } from 'react';
import './ToiletRPS.css';

const EMOJIS = {
  Wipe: '🧻',
  Flush: '🚽',
  Plunge: '🪠',
};

const getResult = (p1, p2) => {
  if (p1 === p2) return 'Draw';
  if (
    (p1 === 'Wipe' && p2 === 'Plunge') ||
    (p1 === 'Flush' && p2 === 'Wipe') ||
    (p1 === 'Plunge' && p2 === 'Flush')
  ) {
    return 'Player 1 Wins!';
  }
  return 'Player 2 Wins!';
};

export default function ToiletRPS() {
  const [p1Choice, setP1Choice] = useState(null);
  const [p2Choice, setP2Choice] = useState(null);
  const [result, setResult] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (p1Choice && p2Choice) return;

      const key = e.key.toLowerCase();

      if (!p1Choice && ['a', 'w', 'd'].includes(key)) {
        const p1Input = { a: 'Wipe', w: 'Flush', d: 'Plunge' }[key];
        setP1Choice(p1Input);
      } else if (!p2Choice && ['h', 'u', 'k'].includes(key)) {
        const p2Input = { h: 'Wipe', u: 'Flush', k: 'Plunge' }[key];
        setP2Choice(p2Input);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [p1Choice, p2Choice]);

  useEffect(() => {
    if (p1Choice && p2Choice) {
      const outcome = getResult(p1Choice, p2Choice);
      setResult(outcome);
    }
  }, [p1Choice, p2Choice]);

  const resetGame = () => {
    setP1Choice(null);
    setP2Choice(null);
    setResult('');
  };

  return (
    <div className="toilet-container">
      <h2>🚽 Toilet RPS: Wipe vs Flush vs Plunge</h2>

      {/* Visual Relationship Graph */}
      <div className="graph-triangle">
        <div className="graph-node node-wipe">🧻</div>
        <div className="graph-node node-flush">🚽</div>
        <div className="graph-node node-plunge">🪠</div>

        <div className="arrow arrow-wipe-plunge">➤</div>
        <div className="arrow arrow-plunge-flush">➤</div>
        <div className="arrow arrow-flush-wipe">➤</div>
      </div>


      <p className="player-status">
        Player 1: {p1Choice ? '✅ Has chosen' : '⏳ Waiting...'}
      </p>
      <p className="player-status">
        Player 2: {p2Choice ? '✅ Has chosen' : '⏳ Waiting...'}
      </p>

      {result && (
        <div className="result-box">
          <p>Player 1 chose: {EMOJIS[p1Choice]} {p1Choice}</p>
          <p>Player 2 chose: {EMOJIS[p2Choice]} {p2Choice}</p>
          <p><strong>{result}</strong></p>
        </div>
      )}

      {(p1Choice && p2Choice) && (
        <button onClick={resetGame}>Play Again</button>
      )}
    </div>
  );
}
