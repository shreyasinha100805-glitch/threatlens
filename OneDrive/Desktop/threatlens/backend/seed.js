const mongoose = require('mongoose');
const Log = require('./logSchema');
const { sampleLogs } = require('./sampleLogs');
require('dotenv').config({ quiet: true });

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Log.deleteMany({});
  await Log.insertMany(sampleLogs.map(({ _id, ...log }) => log));
  console.log(`Seeded ${sampleLogs.length} security logs`);
  mongoose.disconnect();
}

seed().catch(console.error);
