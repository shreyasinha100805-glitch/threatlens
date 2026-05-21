const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Log = require('./logSchema');
require('dotenv').config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || [
  'https://threatlens-496915.web.app',
  'http://localhost:3000',
  'http://localhost:5173'
].join(','))
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
app.use(express.json());

let mongoStatus = 'disconnected';
let mongoError = null;
const MONGO_RETRY_MS = 30000;

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    mongoStatus = 'missing MONGODB_URI';
    console.error('MONGODB_URI is not set');
    return;
  }

  try {
    mongoStatus = 'connecting';
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    mongoStatus = 'connected';
    mongoError = null;
    console.log('MongoDB connected');
  } catch (err) {
    mongoStatus = 'error';
    mongoError = err.message;
    console.error('MongoDB error:', err);
    setTimeout(connectMongo, MONGO_RETRY_MS);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ThreatLens Backend',
    status: 'running',
    endpoints: {
      health: '/health',
      chat: 'POST /chat',
      recentThreats: '/threats/recent'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ThreatLens backend running',
    mongo: mongoStatus,
    mongoError
  });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const { chat } = require('./agent');
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  connectMongo();
});
