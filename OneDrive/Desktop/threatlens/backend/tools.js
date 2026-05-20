const Log = require('./logSchema');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ quiet: true });

const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global';
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

const ai = new GoogleGenAI({ 
  enterprise: true, 
  project: process.env.GOOGLE_CLOUD_PROJECT, 
  location: LOCATION,
  apiVersion: 'v1'
});

// Tool 1: Query logs by filters
async function queryLogs({ severity, event_type, limit = 10 }) {
  const filter = {};
  if (severity) filter.severity = severity;
  if (event_type) filter.event_type = event_type;
  
  const logs = await Log.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-embedding');
  
  return logs;
}

// Tool 2: Semantic search using vector embeddings
async function semanticSearch(question) {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: question
  });
  const queryEmbedding = response.embeddings[0].values;

  const logs = await Log.find({});
  
  // Calculate cosine similarity
  const scored = logs.map(log => {
    const dot = log.embedding.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0);
    const magA = Math.sqrt(log.embedding.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    const similarity = dot / (magA * magB);
    return { log, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, 5).map(s => ({ ...s.log.toObject(), similarity: s.similarity, embedding: undefined }));
}

// Tool 3: Get IP reputation
async function getIpReputation(ip) {
  const logs = await Log.find({ ip }).select('-embedding').sort({ timestamp: -1 });
  
  if (logs.length === 0) return { ip, status: 'unknown', events: [] };

  const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
  const totalScore = logs.reduce((sum, log) => sum + (severityScore[log.severity] || 0), 0);
  const avgScore = totalScore / logs.length;

  let risk;
  if (avgScore >= 3.5) risk = 'critical';
  else if (avgScore >= 2.5) risk = 'high';
  else if (avgScore >= 1.5) risk = 'medium';
  else risk = 'low';

  return { ip, risk, total_events: logs.length, events: logs };
}

// Tool 4: Suggest remediation
async function suggestRemediation(event_type) {
  const remediations = {
    auth_failure: [
      'Enable multi-factor authentication immediately',
      'Block the source IP after 5 failed attempts',
      'Review and rotate compromised credentials',
      'Enable account lockout policy'
    ],
    port_scan: [
      'Block the scanning IP at firewall level',
      'Review and close unnecessary open ports',
      'Enable IDS/IPS rules for port scan detection',
      'Check for any successful connections from this IP'
    ],
    privilege_escalation: [
      'Immediately revoke elevated privileges for the user',
      'Audit all actions taken during the escalation window',
      'Patch the vulnerability used for escalation',
      'Review sudo and admin access policies'
    ],
    malware_detected: [
      'Isolate the affected system immediately',
      'Run a full system scan with updated definitions',
      'Check for lateral movement to other systems',
      'Restore from clean backup if necessary'
    ],
    data_exfiltration: [
      'Block outbound connections to the destination IP',
      'Identify and revoke the compromised account',
      'Audit what data was accessed and exfiltrated',
      'Notify affected parties per data breach regulations'
    ],
    anomalous_access: [
      'Verify the user identity through secondary channel',
      'Temporarily suspend the account pending review',
      'Check for credential theft or account compromise',
      'Review access logs for the past 30 days'
    ]
  };

  return {
    event_type,
    steps: remediations[event_type] || ['Investigate the event thoroughly', 'Escalate to security team']
  };
}

module.exports = { queryLogs, semanticSearch, getIpReputation, suggestRemediation };
