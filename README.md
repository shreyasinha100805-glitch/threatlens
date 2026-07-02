# 🔐 ThreatLens

> AI-Powered Security Intelligence Agent

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://threatlens-496915.web.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

ThreatLens is a conversational AI security agent that lets teams query MongoDB security logs in plain English using Google Gemini and MongoDB Atlas Vector Search.

## 🌐 Live Demo
**[threatlens-496915.web.app](https://threatlens-496915.web.app)**

## 🎥 Demo Video
**[Watch on YouTube](https://youtu.be/twSpWMyYzes)**

## 🎯 What It Does

Ask questions like:
- *"What are the critical threats right now?"*
- *"Check IP 192.168.1.105"*
- *"What should I do about the ransomware on 192.168.1.20?"*

Get instant AI-powered answers backed by real MongoDB data.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Agent | Google Gemini 2.0 Flash |
| MCP Server | MongoDB MCP Protocol |
| Database | MongoDB Atlas + Vector Search |
| Backend | Node.js + Express on Google Cloud Run |
| Frontend | React + TypeScript on Firebase Hosting |
| Embeddings | Vertex AI text-embedding-004 |

## 🔧 4 Agent Tools

| Tool | Description |
|---|---|
| `query_logs` | Filter logs by severity and event type |
| `semantic_search` | Vector similarity search using AI embeddings |
| `get_ip_reputation` | Risk scoring for any IP address |
| `suggest_remediation` | Step-by-step response plans |

## 📡 MongoDB MCP Server

Live MCP endpoint:
| Layer | Technology |
|---|---|
| AI Agent | Google Gemini 2.0 Flash |
| MCP Server | MongoDB MCP Protocol |
| Database | MongoDB Atlas + Vector Search |
| Backend | Node.js + Express on Google Cloud Run |
| Frontend | React + TypeScript on Firebase Hosting |
| Embeddings | Vertex AI text-embedding-004 |

## 🔧 4 Agent Tools

| Tool | Description |
|---|---|
| `query_logs` | Filter logs by severity and event type |
| `semantic_search` | Vector similarity search using AI embeddings |
| `get_ip_reputation` | Risk scoring for any IP address |
| `suggest_remediation` | Step-by-step response plans |

## 📡 MongoDB MCP Server
Available MCP tools:
- `find_documents` — find MongoDB documents with filters
- `aggregate_documents` — run aggregation pipelines
- `count_documents` — count matching documents
- `get_collections` — list all collections

---

## 🏗️ Architecture
```
threatlens/
├── backend/
│   ├── agent.js          # Gemini agent with tool definitions
│   ├── tools.js          # 4 agent tools implementation
│   ├── mongoMCP.js       # MongoDB MCP server
│   ├── logSchema.js      # MongoDB schema
│   ├── genaiClient.js    # Google Gen AI client
│   ├── seed.js           # Sample security log data
│   ├── embedLogs.js      # Generate vector embeddings
│   ├── Dockerfile        # Cloud Run deployment
│   └── index.js          # Express server + endpoints
└── frontend/
    └── src/
        └── App.tsx       # React chat UI
```
---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud account
- Gemini API key

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
node index.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/threatlens
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-001
GEMINI_EMBEDDING_MODEL=text-embedding-004
PORT=8080
```

---

## 📁 Project Structure
threatlens/
├── backend/
│   ├── agent.js          # Gemini agent with tool definitions
│   ├── tools.js          # 4 agent tools implementation
│   ├── mongoMCP.js       # MongoDB MCP server
│   ├── logSchema.js      # MongoDB schema
│   ├── genaiClient.js    # Google Gen AI client
│   ├── seed.js           # Sample security log data
│   ├── embedLogs.js      # Generate vector embeddings
│   ├── Dockerfile        # Cloud Run deployment
│   └── index.js          # Express server + endpoints
└── frontend/
└── src/
└── App.tsx       # React chat UI
---

## 🔌 API Endpoints
GET  /health          — health check
POST /chat            — send message to AI agent
GET  /threats/recent  — get recent high severity events
GET  /mcp/tools       — list MongoDB MCP tools
POST /mcp/execute     — execute MongoDB MCP tool

---

## 📊 Sample Security Events

ThreatLens comes pre-seeded with 15 realistic security log events including:
- Authentication failures and brute force attacks
- Privilege escalation attempts
- Malware detections
- Data exfiltration incidents
- Anomalous access patterns

---

## 🌍 Deployment

### Backend (Google Cloud Run)
```bash
gcloud run deploy threatlens-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
npx firebase-tools deploy --only hosting
```

---

## 📄 License
MIT — see [LICENSE](LICENSE)

## 👤 Author
**Shreya Sinha**
- GitHub: [@shreyasinha100805-glitch](https://github.com/shreyasinha100805-glitch)
- Project: [ThreatLens](https://github.com/shreyasinha100805-glitch/threatlens)
