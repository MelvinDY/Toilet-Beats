import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import poopMusic from '../assets/PooPoo.mp3';
import './Dashboard.css';
const Dashboard = () => {
  const data = JSON.parse(localStorage.getItem('players')) || {
    player1: 'Player 1',
    player2: 'Player 2',
    scores: { 'Player 1': 0, 'Player 2': 0 }
  };

  const { player1, player2, scores } = data;

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay blocked:', err);
        });
      }
    }
  }, []);

  return (
    <div className="dashboard">
      <audio ref={audioRef} src={poopMusic} loop />

      <h1>🚽 Toilet Trouble Tournament 💩</h1>
      <h2>🧼 Who Will Win the Golden Roll? 🧻</h2>

      <div className="players">
        <p><strong>{player1}</strong>: {scores[player1] ?? 0} points</p>
        <p><strong>{player2}</strong>: {scores[player2] ?? 0} points</p>
      </div>

      <div className="game-links">
        <h2>Choose a Poop Game:</h2>
        <ul>
          <li><Link to="/RPS">✊💩 Toilet RPS</Link></li>
          <li><Link to="/Rhythm">💩 TemPoop</Link></li>
          <li><Link to="/game/game3">🧻 Game 3</Link></li>
          <li><Link to="/game/game4">🪠 Game 4</Link></li>
        </ul>
      </div>

      <Link to="/winner">
        <button className="finish-btn">See Who Wins the Toilet Paper 🧻</button>
      </Link>
    </div>
  );
};

export default Dashboard;