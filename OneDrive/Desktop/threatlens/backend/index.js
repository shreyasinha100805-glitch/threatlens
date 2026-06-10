const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { findLogs, getDataSource } = require('./logRepository');
const { MongoDBMCPServer } = require('./mongoMCP');
require('dotenv').config({ quiet: true });

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

function getClientError(err) {
  const providerMessage = err?.message || '';

  if (err?.status === 403 || /api key|permission_denied|credentials/i.test(providerMessage)) {
    return {
      status: 503,
      body: {
        error: 'ThreatLens AI credentials are not available. Remove any leaked API key from the backend environment and deploy with Vertex AI service account access, or set a newly rotated GEMINI_API_KEY.'
      }
    };
  }

  return {
    status: 500,
    body: { error: providerMessage || 'Internal server error' }
  };
}

let mongoStatus = 'disconnected';
let mongoError = null;
let mongoConnectPromise = null;
const MONGO_RETRY_MS = 30000;

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    mongoStatus = 'missing MONGODB_URI';
    mongoError = 'MONGODB_URI is not set; using bundled sample logs.';
    console.error('MONGODB_URI is not set');
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoConnectPromise) {
    return mongoConnectPromise;
  }

  try {
    mongoStatus = 'connecting';
    mongoConnectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    await mongoConnectPromise;
    mongoStatus = 'connected';
    mongoError = null;
    console.log('MongoDB connected');

    // Initialize MongoDB MCP Server
    const mcpServer = new MongoDBMCPServer();
    mcpServer.connect().catch(console.error);
    app.locals.mcpServer = mcpServer;
  } catch (err) {
    mongoStatus = 'error';
    mongoError = err.message;
    console.error('MongoDB error:', err);
    setTimeout(connectMongo, MONGO_RETRY_MS);
  } finally {
    mongoConnectPromise = null;
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
    mongoError,
    dataSource: getDataSource()
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
    const result = await chat(message, history || [], req.app.locals.mcpServer);
    res.json(result);
  } catch (err) {
    console.error(err);
    const clientError = getClientError(err);
    res.status(clientError.status).json(clientError.body);
  }
});

// Recent threats endpoint
app.get('/threats/recent', async (req, res) => {
  try {
    const logs = await findLogs(
      { severity: { $in: ['critical', 'high'] } },
      { sort: { timestamp: -1 }, limit: 20 }
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MCP endpoint
app.post('/mcp/execute', async (req, res) => {
  try {
    const { tool, params } = req.body;
    const mcpServer = req.app.locals.mcpServer;
    const result = await mcpServer.executeTool(tool, params);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MCP tools list endpoint
app.get('/mcp/tools', (req, res) => {
  const mcpServer = req.app.locals.mcpServer;
  res.json({ tools: mcpServer.getToolDefinitions() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  connectMongo();
});
