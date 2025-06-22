const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

let latestWinner = null; // stores either "p1" or "p2"

// Middleware
app.use(cors());
app.use(express.json());

// React sends winner data here
app.post('/dispense', (req, res) => {
  const { winner } = req.body;

  if (winner === 'p1' || winner === 'p2') {
    latestWinner = winner;
    console.log(`✅ Winner received: ${winner}`);
    res.status(200).json({ message: 'Winner registered' });
  } else {
    res.status(400).json({ error: 'Invalid winner value' });
  }
});

// ESP32 polls this endpoint
app.get('/status', (req, res) => {
  if (latestWinner) {
    res.json({ winner: latestWinner });

    // Optional: clear after sending once (acts like a one-time trigger)
    latestWinner = null;
  } else {
    res.json({ winner: null });
  }
});

// Start server
app.listen(PORT, '0.0.0.0',  () => {
  console.log(`🚀 Toilet server running on http://10.4.39.232:${PORT}`);
});