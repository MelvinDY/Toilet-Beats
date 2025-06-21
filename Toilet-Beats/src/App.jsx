import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PlayerSetup from './components/PlayerSetup';
import RPS from './components/ToiletRPS';
import Rhythm from './components/RhythmGame';
import ToiletPaperWinner from './components/ToiletPaperWinner';
import './App.css';

const AppWrapper = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSpaceReset = (e) => {
      if (e.code === 'Space') {
        localStorage.removeItem('players');
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleSpaceReset);

    return () => {
      window.removeEventListener('keydown', handleSpaceReset);
    };
  }, [navigate]);

  return (
    <div className="app-main-body">
      <Routes>
        <Route path="/" element={<PlayerSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/RPS" element={<RPS />} />
        <Route path="/Rhythm" element={<Rhythm />} />
        <Route path="/winner" element={<ToiletPaperWinner />} />
        <Route path="/Snake" element={<Snake />} />
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
