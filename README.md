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
