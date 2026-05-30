const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const Log = require('./logSchema');
const { sampleLogs } = require('./sampleLogs');

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function getDataSource() {
  return isMongoReady() ? 'mongodb' : 'sample';
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object') {
    if (Array.isArray(expected.$in)) {
      return expected.$in.includes(actual);
    }

    if (typeof expected.$size === 'number') {
      return Array.isArray(actual) && actual.length === expected.$size;
    }
  }

  return actual === expected;
}

function matchesFilter(log, filter = {}) {
  return Object.entries(filter).every(([field, expected]) => matchesValue(log[field], expected));
}

function stripEmbedding(log) {
  const { embedding, ...rest } = log.toObject ? log.toObject() : log;
  return rest;
}

function sortLogs(logs, sort = {}) {
  const [[field, direction] = []] = Object.entries(sort);
  if (!field) return logs;

  return [...logs].sort((a, b) => {
    const left = new Date(a[field]).getTime();
    const right = new Date(b[field]).getTime();
    return direction < 0 ? right - left : left - right;
  });
}

async function findLogs(filter = {}, options = {}) {
  const { sort = { timestamp: -1 }, limit, includeEmbedding = false } = options;

  if (isMongoReady()) {
    try {
      let query = Log.find(filter).sort(sort).maxTimeMS(5000);
      if (limit) query = query.limit(limit);
      if (!includeEmbedding) query = query.select('-embedding');
      return await query.exec();
    } catch (err) {
      console.warn(`MongoDB log query failed; using sample logs instead: ${err.message}`);
    }
  }

  let logs = sampleLogs.filter(log => matchesFilter(log, filter));
  logs = sortLogs(logs, sort);
  if (limit) logs = logs.slice(0, limit);
  return includeEmbedding ? logs : logs.map(stripEmbedding);
}

module.exports = { findLogs, getDataSource, isMongoReady };
