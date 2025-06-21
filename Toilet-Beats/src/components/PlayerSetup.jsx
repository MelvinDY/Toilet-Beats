import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerSetup.css'; // create this CSS file

const PlayerSetup = () => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(
      'players',
      JSON.stringify({ player1, player2, scores: { [player1]: 0, [player2]: 0 } })
    );
    navigate('/dashboard');
  };

  return (
    <div className="player-setup-container">
      <div className="setup-card">
        <h1>💩 Welcome to Toilet Trouble 💩</h1>
        <p>Enter your names to flush your way to glory! 🧻</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="text"
            placeholder="Player 1 Name"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Player 2 Name"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            required
          />
          <button type="submit">🚽 Start Game</button>
        </form>
      </div>
    </div>
  );
};

export default PlayerSetup;