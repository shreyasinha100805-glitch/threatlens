const { findLogs } = require('./logRepository');
const { createGoogleGenAI } = require('./genaiClient');
require('dotenv').config({ quiet: true });

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

let ai;

function getAi() {
  if (!ai) {
    ai = createGoogleGenAI();
  }

  return ai;
}

// Tool 1: Query logs by filters
async function queryLogs({ severity, event_type, limit = 10 }) {
  const filter = {};
  if (severity) filter.severity = severity;
  if (event_type) filter.event_type = event_type;
  
  return findLogs(filter, { sort: { timestamp: -1 }, limit });
}

function keywordSearchLogs(question, logs) {
  const words = question.toLowerCase().split(/\W+/).filter(Boolean);

  return logs
    .map(log => {
      const haystack = [log.event_type, log.ip, log.user, log.location, log.severity, log.details]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
      return { log, similarity: words.length ? score / words.length : 0 };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(({ log, similarity }) => ({ ...log, similarity, embedding: undefined }));
}

// Tool 2: Semantic search using vector embeddings
async function semanticSearch(question) {
  const logs = await findLogs({}, { includeEmbedding: true });
  const searchableLogs = logs.filter(log => Array.isArray(log.embedding) && log.embedding.length);

  if (searchableLogs.length === 0) {
    return keywordSearchLogs(question, logs);
  }

  let queryEmbedding;
  try {
    const response = await getAi().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: question
    });
    queryEmbedding = response.embeddings[0].values;
  } catch (error) {
    console.warn(`Embedding search unavailable. Using keyword search: ${error.message}`);
    return keywordSearchLogs(question, logs);
  }
  
  // Calculate cosine similarity
  const scored = searchableLogs.map(log => {
    const dot = log.embedding.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0);
    const magA = Math.sqrt(log.embedding.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    const similarity = dot / (magA * magB);
    return { log, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, 5).map(s => ({
    ...(s.log.toObject ? s.log.toObject() : s.log),
    similarity: s.similarity,
    embedding: undefined
  }));
}

// Tool 3: Get IP reputation
async function getIpReputation(ip) {
  const logs = await findLogs({ ip }, { sort: { timestamp: -1 } });
  
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
