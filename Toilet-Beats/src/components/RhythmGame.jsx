import React, { useEffect, useState, useRef } from 'react';
import './RhythmGame.css';

const DIRECTIONS = ['up', 'left', 'down', 'right'];
const PLAYER_KEYS = {
  p1: { w: 'up', a: 'left', s: 'down', d: 'right' },
  p2: { u: 'up', h: 'left', j: 'down', k: 'right' },
};

const HIT_WINDOW = 100;

const RhythmGame = () => {
  const [notes, setNotes] = useState([]); // {id, direction, player, time, active}
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [hitFeedback, setHitFeedback] = useState({ p1: '', p2: '' });
  const noteId = useRef(0);

  useEffect(() => {
    const beatInterval = 60000 / 128; // ~469ms

    const spawnInterval = setInterval(() => {
      const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
      const now = Date.now();
      const newNotes = [
        { id: noteId.current++, player: 'p1', direction: dir, time: now, active: true },
        { id: noteId.current++, player: 'p2', direction: dir, time: now, active: true },
      ];
      setNotes((prev) => [...prev, ...newNotes]);
    }, beatInterval);

    return () => clearInterval(spawnInterval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const now = Date.now();

      const player = Object.keys(PLAYER_KEYS).find((p) => key in PLAYER_KEYS[p]);
      if (!player) return;

      const direction = PLAYER_KEYS[player][key];
      const matchIndex = notes.findIndex(
        (note) =>
          note.player === player &&
          note.direction === direction &&
          note.active &&
          Math.abs(now - note.time - 1000) <= HIT_WINDOW * 2
      );

      if (matchIndex !== -1) {
        const hitNote = notes[matchIndex];
        const diff = Math.abs(now - hitNote.time - 1000);
        let points = 0;
        let feedback = 'Miss';

        if (diff <= HIT_WINDOW) {
          points = 300;
          feedback = 'Perfect!';
        } else if (diff <= HIT_WINDOW * 2) {
          points = 100;
          feedback = 'Great!';
        }

        setScore((prev) => ({ ...prev, [player]: prev[player] + points }));
        setHitFeedback((prev) => ({ ...prev, [player]: feedback }));

        setTimeout(() => {
          setHitFeedback((prev) => ({ ...prev, [player]: '' }));
        }, 1000);

        setNotes((prev) => {
          const newNotes = [...prev];
          newNotes[matchIndex].active = false;
          return newNotes;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes]);

  return (
    <div className="rhythm-game-container">
      <div className="rhythm-scoreboard">
        <p>P1: {score.p1}</p>
        <p>P2: {score.p2}</p>
      </div>

      <div className="rhythm-player-column rhythm-p1">
        <div className="rhythm-hit-zone">
          <div className="rhythm-arrow-label">↑ ← ↓ →</div>
        </div>
        <div className="rhythm-feedback">{hitFeedback.p1}</div>
        {notes
          .filter((n) => n.player === 'p1' && n.active)
          .map((note) => (
            <div
              key={note.id}
              className={`rhythm-note rhythm-${note.direction}`}
              style={{ animationDelay: `${(note.time + 1000 - Date.now()) / 1000}s` }}
            >
              {note.direction === 'up' && '↑'}
              {note.direction === 'left' && '←'}
              {note.direction === 'down' && '↓'}
              {note.direction === 'right' && '→'}
            </div>
          ))}
      </div>

      <div className="rhythm-player-column rhythm-p2">
        <div className="rhythm-hit-zone">
          <div className="rhythm-arrow-label">↑ ← ↓ →</div>
        </div>
        <div className="rhythm-feedback">{hitFeedback.p2}</div>
        {notes
          .filter((n) => n.player === 'p2' && n.active)
          .map((note) => (
            <div
              key={note.id}
              className={`rhythm-note rhythm-${note.direction}`}
              style={{ animationDelay: `${(note.time + 1000 - Date.now()) / 1000}s` }}
            >
              {note.direction === 'up' && '↑'}
              {note.direction === 'left' && '←'}
              {note.direction === 'down' && '↓'}
              {note.direction === 'right' && '→'}
            </div>
          ))}
      </div>
    </div>
  );
};

export default RhythmGame;
