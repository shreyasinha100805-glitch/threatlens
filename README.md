# 🔐 ThreatLens

> AI-Powered Security Intelligence Agent

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://threatlens-496915.web.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-purple)](https://cloud.google.com/vertex-ai)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)

ThreatLens is a conversational AI security intelligence agent that lets security teams query MongoDB logs in plain English using Google Gemini — detect threats, check IP reputation, and get remediation plans in seconds.

---

## 🌐 Live Demo
**[threatlens-496915.web.app](https://threatlens-496915.web.app)**

## 🎥 Demo Video
**[Watch on YouTube](https://youtu.be/twSpWMyYzes)**

## 🏆 Built For
Google Cloud Rapid Agent Hackathon 2026 — MongoDB Track

---

## 🎯 What It Does

| Question | What happens |
|---|---|
| *"What are the critical threats right now?"* | Queries MongoDB for critical/high severity events |
| *"Check IP 192.168.1.105"* | Returns full risk score and event history |
| *"What should I do about the ransomware?"* | Returns step-by-step remediation plan |
| *"Any suspicious logins at odd hours?"* | Runs semantic vector search across all logs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Agent | Google Gemini 2.0 Flash |
| MCP Integration | MongoDB MCP Protocol Server |
| Database | MongoDB Atlas |
| Vector Search | MongoDB Atlas Vector Search |
| Embeddings | Vertex AI text-embedding-004 |
| Backend | Node.js + Express on Google Cloud Run |
| Frontend | React + TypeScript on Firebase Hosting |

---

## 🔧 4 Agent Tools

| Tool | Description | When Used |
|---|---|---|
| `query_logs` | Filter logs by severity and event type | "Show me critical events" |
| `semantic_search` | Vector similarity search using AI embeddings | "Any brute force attacks?" |
| `get_ip_reputation` | Risk scoring for any IP address | "Check IP 10.0.0.5" |
| `suggest_remediation` | Step-by-step response plans | "What should I do about ransomware?" |

---

## 📡 MongoDB MCP Server

ThreatLens integrates MongoDB's MCP protocol with 4 tools:

- `find_documents` — find MongoDB documents with filters
- `aggregate_documents` — run aggregation pipelines
- `count_documents` — count matching documents
- `get_collections` — list all collections

MCP endpoints:
```
GET  /mcp/tools      — list all available MCP tools
POST /mcp/execute    — execute a tool with parameters
```

---

## 🏗️ Architecture

```
User Question
     ↓
React Chat UI (Firebase Hosting)
     ↓
Node.js Backend (Google Cloud Run)
     ↓
Gemini 2.0 Flash Agent
     ↓ picks one of 4 tools
┌─────────────────────────────────────┐
│ query_logs  │  semantic_search      │
│ get_ip_rep  │  suggest_remediation  │
└─────────────────────────────────────┘
     ↓
MongoDB MCP Server
     ↓
MongoDB Atlas + Vector Search
     ↓
Plain English Answer
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

## 🔌 API Endpoints

```
GET  /health          — health check
POST /chat            — send message to AI agent
GET  /threats/recent  — get recent high severity events
GET  /mcp/tools       — list MongoDB MCP tools
POST /mcp/execute     — execute MongoDB MCP tool
```

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
