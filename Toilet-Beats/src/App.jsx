import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PlayerSetup from './components/PlayerSetup';
import RPS from './components/ToiletRPS';
import ToiletPaperWinner from './components/ToiletPaperWinner';

// import your other components...

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
    <>
      <main className="main-body">
        <Routes>
          <Route path="/" element={<PlayerSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/RPS" element={<RPS />} />
          <Route path="/winner" element={<ToiletPaperWinner />} />
          {/* other game routes here */}
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
