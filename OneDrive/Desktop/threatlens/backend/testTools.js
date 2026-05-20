const mongoose = require('mongoose');
const { queryLogs, semanticSearch, getIpReputation, suggestRemediation } = require('./tools');
require('dotenv').config({ quiet: true });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n--- Test 1: Query high severity logs ---');
  const highLogs = await queryLogs({ severity: 'high', limit: 3 });
  console.log(JSON.stringify(highLogs, null, 2));

  console.log('\n--- Test 2: Semantic search ---');
  const similar = await semanticSearch('brute force login attack');
  console.log(similar.map(l => `${l.event_type} - ${l.ip} (${l.similarity.toFixed(3)})`));

  console.log('\n--- Test 3: IP Reputation ---');
  const rep = await getIpReputation('192.168.1.105');
  console.log(`IP: ${rep.ip}, Risk: ${rep.risk}, Events: ${rep.total_events}`);

  console.log('\n--- Test 4: Remediation ---');
  const rem = await suggestRemediation('auth_failure');
  console.log(rem.steps);

  mongoose.disconnect();
}

test().catch(console.error);
