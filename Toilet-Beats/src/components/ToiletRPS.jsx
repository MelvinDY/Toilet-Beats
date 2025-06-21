import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    return 'Player 1';
  }
  return 'Player 2';
};

export default function ToiletRPS() {
  const [p1Choice, setP1Choice] = useState(null);
  const [p2Choice, setP2Choice] = useState(null);
  const [result, setResult] = useState('');
  const [wins, setWins] = useState({ p1: 0, p2: 0 });

  const players = JSON.parse(localStorage.getItem('players')) || {
    player1: 'Player 1',
    player2: 'Player 2',
    scores: { 'Player 1': 0, 'Player 2': 0 }
  };

  const handleWin = (winner) => {
    if (winner === 'Player 1') {
      setWins((prev) => ({ ...prev, p1: prev.p1 + 1 }));
    } else if (winner === 'Player 2') {
      setWins((prev) => ({ ...prev, p2: prev.p2 + 1 }));
    }
  };

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
      if (outcome !== 'Draw') handleWin(outcome);
      setResult(`${outcome === 'Draw' ? 'Draw!' : `${outcome} Wins!`}`);
    }
  }, [p1Choice, p2Choice]);

  const navigate = useNavigate();

  useEffect(() => {
    const checkScoreUpdate = () => {
      if (wins.p1 === 3 || wins.p2 === 3) {
        const winner = wins.p1 === 3 ? players.player1 : players.player2;

        // Update localStorage
        const data = { ...players };
        data.scores[winner] = (data.scores[winner] || 0) + 1;
        localStorage.setItem('players', JSON.stringify(data));

        alert(`${winner} wins this match and gets 1 toilet paper! 🧻`);

        if (data.scores[winner] >= 3) {
          navigate('/winner');
          return;
        }

        setWins({ p1: 0, p2: 0 });
      }
    };

    checkScoreUpdate();
  }, [wins, players, navigate]);

  const resetRound = () => {
    setP1Choice(null);
    setP2Choice(null);
    setResult('');
  };

  const goBackToDashboard = () => {
    setWins({ p1: 0, p2: 0 });
    navigate('/dashboard');
  };

  return (
    <div className="toilet-rps-container">
      <h2 className="toilet-title">🚽 Toilet RPS: Wipe vs Flush vs Plunge</h2>

      <p className="toilet-subtitle">🎯 First to 3 wins gets 1 toilet paper!</p>

      <div className="toilet-graph">
        <div className="toilet-node toilet-node-wipe">🧻</div>
        <div className="toilet-node toilet-node-flush">🚽</div>
        <div className="toilet-node toilet-node-plunge">🪠</div>

        <div className="toilet-arrow toilet-arrow-wipe-plunge">➤</div>
        <div className="toilet-arrow toilet-arrow-plunge-flush">➤</div>
        <div className="toilet-arrow toilet-arrow-flush-wipe">➤</div>
      </div>

      <p className="toilet-status">
        {players.player1}: {p1Choice ? '✅ Chosen' : '⏳ Waiting...'} (Wins: {wins.p1})
      </p>
      <p className="toilet-status">
        {players.player2}: {p2Choice ? '✅ Chosen' : '⏳ Waiting...'} (Wins: {wins.p2})
      </p>

      {result && (
        <div className="toilet-result-box">
          <p>{players.player1} chose: {EMOJIS[p1Choice]} {p1Choice}</p>
          <p>{players.player2} chose: {EMOJIS[p2Choice]} {p2Choice}</p>
          <p><strong>{result}</strong></p>
        </div>
      )}

      {(p1Choice && p2Choice) && (
        <button className="toilet-button" onClick={resetRound}>Play Next Round</button>
      )}
      <button className="toilet-button" onClick={goBackToDashboard}>
        🚽 I’m flushed… Take me back to the bowl
      </button>
    </div>
  );
}