const mongoose = require('mongoose');
const { chat } = require('./agent');
require('dotenv').config({ quiet: true });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n--- Question 1 ---');
  const r1 = await chat('What are the most critical security threats right now?');
  console.log(r1.text);

  console.log('\n--- Question 2 ---');
  const r2 = await chat('What should I do about the brute force attacks?');
  console.log(r2.text);

  mongoose.disconnect();
}

test().catch(console.error);
