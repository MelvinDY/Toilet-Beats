import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PlayerSetup from './components/PlayerSetup';
import RPS from './components/ToiletRPS';
import Rhythm from './components/RhythmGame';
import SNP from './components/SlipNPong';
import ToiletPaperWinner from './components/ToiletPaperWinner';
import './App.css';

const AppWrapper = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSpaceReset = (e) => {
      if (e.code === 'Space') {
        localStorage.setItem('players', JSON.stringify({
          player1: 'Player 1',
          player2: 'Player 2',
          scores: {
            'Player 1': 0,
            'Player 2': 0
          }
        }));
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleSpaceReset);
    return () => window.removeEventListener('keydown', handleSpaceReset);
  }, [navigate]);

  return (
    <div className="app-main-body">
      <Routes>
        <Route path="/" element={<PlayerSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/RPS" element={<RPS />} />
        <Route path="/Rhythm" element={<Rhythm />} />
        <Route path="/SNP" element={<SNP />} />
        <Route path="/winner" element={<ToiletPaperWinner />} />

      </Routes>
    </div>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
