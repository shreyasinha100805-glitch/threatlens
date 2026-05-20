const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { chat } = require('./agent');
const Log = require('./logSchema');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ThreatLens backend running' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const result = await chat(message, history || []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Recent threats endpoint
app.get('/threats/recent', async (req, res) => {
  try {
    const logs = await Log.find({ severity: { $in: ['critical', 'high'] } })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-embedding');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
