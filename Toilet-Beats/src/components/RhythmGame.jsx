import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import music from '../assets/Rhythem1.mp3';

const DIRECTIONS = ['up', 'left', 'down', 'right'];
const PLAYER_KEYS = {
  p1: { w: 'up', a: 'left', s: 'down', d: 'right' },
  p2: { u: 'up', h: 'left', j: 'down', k: 'right' },
};

const HIT_WINDOW = 100; // ms for perfect hit
const FALL_TIME = 2000; // 2 seconds for note to fall
const BPM = 128;
const BEAT_INTERVAL = 60000 / BPM; // ~469ms

const RhythmGame = () => {
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [hitFeedback, setHitFeedback] = useState({ p1: '', p2: '' });
  const [gameWinner, setGameWinner] = useState(null);
  const [gameActive, setGameActive] = useState(true);
  const noteId = useRef(0);
  const gameStartTime = useRef(Date.now());
  const navigate = useNavigate();

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

  const WIN_SCORE = 4000;

  // Spawn notes at regular intervals
  useEffect(() => {
    if (!gameActive) return;
    
    const spawnInterval = setInterval(() => {
      const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
      const spawnTime = Date.now();
      
      const newNotes = [
        { 
          id: noteId.current++, 
          player: 'p1', 
          direction: dir, 
          spawnTime,
          hitTime: spawnTime + FALL_TIME,
          active: true 
        },
        { 
          id: noteId.current++, 
          player: 'p2', 
          direction: dir, 
          spawnTime,
          hitTime: spawnTime + FALL_TIME,
          active: true 
        },
      ];
      setNotes((prev) => [...prev, ...newNotes]);
    }, BEAT_INTERVAL);

    return () => clearInterval(spawnInterval);
  }, [gameActive]);

  // Clean up old notes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setNotes((prev) => prev.filter(note => 
        note.active && (now - note.spawnTime < FALL_TIME + 1000)
      ));
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle key presses
  useEffect(() => {
    if (!gameActive) return;
    
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const now = Date.now();

      const player = Object.keys(PLAYER_KEYS).find((p) => key in PLAYER_KEYS[p]);
      if (!player) return;

      const direction = PLAYER_KEYS[player][key];
      
      // Find the closest note for this player and direction
      const matchingNotes = notes.filter(
        (note) =>
          note.player === player &&
          note.direction === direction &&
          note.active
      );

      if (matchingNotes.length === 0) return;

      // Find the note closest to its hit time
      const closestNote = matchingNotes.reduce((closest, note) => {
        const noteDiff = Math.abs(now - note.hitTime);
        const closestDiff = Math.abs(now - closest.hitTime);
        return noteDiff < closestDiff ? note : closest;
      });

      const timeDiff = Math.abs(now - closestNote.hitTime);
      
      // Check if within hit window (expanded for easier gameplay)
      if (timeDiff <= HIT_WINDOW * 3) {
        let points = 0;
        let feedback = 'Miss';

        if (timeDiff <= HIT_WINDOW) {
          points = 300;
          feedback = 'Perfect!';
        } else if (timeDiff <= HIT_WINDOW * 2) {
          points = 200;
          feedback = 'Great!';
        } else if (timeDiff <= HIT_WINDOW * 3) {
          points = 100;
          feedback = 'Good!';
        }

        setScore((prev) => ({ ...prev, [player]: prev[player] + points }));
        setHitFeedback((prev) => ({ ...prev, [player]: feedback }));

        setTimeout(() => {
          setHitFeedback((prev) => ({ ...prev, [player]: '' }));
        }, 800);

        // Deactivate the hit note
        setNotes((prev) => 
          prev.map(note => 
            note.id === closestNote.id 
              ? { ...note, active: false }
              : note
          )
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, gameActive]);

  // Check for winner
  useEffect(() => {
    if (score.p1 >= WIN_SCORE && !gameWinner) {
      setGameWinner('Player 1');
      setGameActive(false);
    } else if (score.p2 >= WIN_SCORE && !gameWinner) {
      setGameWinner('Player 2');
      setGameActive(false);
    }
  }, [score, gameWinner]);

  const resetGame = () => {
    setScore({ p1: 0, p2: 0 });
    setNotes([]);
    setHitFeedback({ p1: '', p2: '' });
    setGameWinner(null);
    setGameActive(true);
    noteId.current = 0;
  };

  const getCurrentPosition = (note) => {
    const now = Date.now();
    const elapsed = now - note.spawnTime;
    const progress = elapsed / FALL_TIME;
    return Math.min(progress * 100, 100);
  };

  const goBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="game-container">
      <audio ref={audioRef} src={music} loop />
      <style>{`
        .game-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 2rem;
          gap: 4rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          font-family: 'Arial', sans-serif;
        }

        .winner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          color: white;
          text-align: center;
        }

        .winner-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .winner-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .winner-score {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .winner-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .winner-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .scoreboard {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 1rem 2rem;
          border-radius: 15px;
          text-align: center;
          font-weight: bold;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .player-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .player-title {
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .controls {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          text-align: center;
        }

        .game-column {
          position: relative;
          width: 200px;
          height: 500px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .hit-zone {
          position: absolute;
          bottom: 60px;
          width: 100%;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border: 3px dashed rgba(255, 255, 255, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          border-radius: 10px;
          margin: 0 10px;
          width: calc(100% - 20px);
        }

        .hit-zone-label {
          font-size: 1.5rem;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          font-weight: bold;
        }

        .note {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 5;
          transition: top 0.1s linear;
        }

        .note.up { color: #00b894; }
        .note.left { color: #0984e3; }
        .note.down { color: #e17055; }
        .note.right { color: #6c5ce7; }

        .feedback {
          min-height: 30px;
          font-size: 1.1rem;
          font-weight: bold;
          color: #ffeaa7;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          text-align: center;
          margin-top: 1rem;
        }

        .instructions {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 1rem 2rem;
          border-radius: 10px;
          text-align: center;
          font-size: 0.9rem;
        }
      `}</style>

      <div className="scoreboard">
        <div>Player 1: {score.p1}</div>
        <div>Player 2: {score.p2}</div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
          First to {WIN_SCORE} wins!
        </div>
      </div>

      {gameWinner && (
        <div className="winner-overlay">
          <div className="winner-content">
            <div className="winner-title">🎉 {gameWinner} Wins! 🎉</div>
            <div className="winner-score">
              Final Score: Player 1: {score.p1} | Player 2: {score.p2}
            </div>
            <button className="winner-button" onClick={resetGame}>
              🎵 Play Again
            </button>
          </div>
        </div>
      )}

      <div className="player-section">
        <div className="player-title">Player 1</div>
        <div className="controls">W A S D</div>
        <div className="game-column">
          <div className="hit-zone">
            <div className="hit-zone-label">↑ ← ↓ →</div>
          </div>
          {notes
            .filter((note) => note.player === 'p1' && note.active)
            .map((note) => {
              const position = getCurrentPosition(note);
              return (
                <div
                  key={note.id}
                  className={`note ${note.direction}`}
                  style={{ 
                    top: `${position * 3.5}px`,
                    opacity: position > 90 ? Math.max(0, 1 - (position - 90) / 10) : 1
                  }}
                >
                  {note.direction === 'up' && '↑'}
                  {note.direction === 'left' && '←'}
                  {note.direction === 'down' && '↓'}
                  {note.direction === 'right' && '→'}
                </div>
              );
            })}
        </div>
        <div className="feedback">{hitFeedback.p1}</div>
      </div>

      <div className="player-section">
        <div className="player-title">Player 2</div>
        <div className="controls">U H J K</div>
        <div className="game-column">
          <div className="hit-zone">
            <div className="hit-zone-label">↑ ← ↓ →</div>
          </div>
          {notes
            .filter((note) => note.player === 'p2' && note.active)
            .map((note) => {
              const position = getCurrentPosition(note);
              return (
                <div
                  key={note.id}
                  className={`note ${note.direction}`}
                  style={{ 
                    top: `${position * 3.5}px`,
                    opacity: position > 90 ? Math.max(0, 1 - (position - 90) / 10) : 1
                  }}
                >
                  {note.direction === 'up' && '↑'}
                  {note.direction === 'left' && '←'}
                  {note.direction === 'down' && '↓'}
                  {note.direction === 'right' && '→'}
                </div>
              );
            })}
        </div>
        <div className="feedback">{hitFeedback.p2}</div>
      </div>
      <div className="instructions">
        <button className="toilet-button" onClick={goBackToDashboard}>
          Go back
        </button>
        <div className="instructionsText">
          Hit the arrows when they reach the dashed line!<br/>
          Player 1: W (↑) A (←) S (↓) D (→) | Player 2: U (↑) H (←) J (↓) K (→)
        </div>
      </div>
    </div>
  );
};

export default RhythmGame;