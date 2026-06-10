const mongoose = require('mongoose');
require('dotenv').config();

class MongoDBMCPServer {
  constructor() {
    this.db = null;
  }

  async connect() {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
      });
    }

    this.db = mongoose.connection.db;
    console.log('MongoDB MCP Server connected');
  }

  ensureConnected() {
    if (!this.db) {
      throw new Error('MongoDB MCP Server is not connected');
    }
  }

  async executeTool(toolName, params) {
    this.ensureConnected();

    switch (toolName) {
      case 'find_documents':
        return await this.findDocuments(params);
      case 'aggregate_documents':
        return await this.aggregateDocuments(params);
      case 'count_documents':
        return await this.countDocuments(params);
      case 'get_collections':
        return await this.getCollections();
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async findDocuments({ collection, filter = {}, limit = 10, sort = {} }) {
    const col = this.db.collection(collection);
    const docs = await col.find(filter)
      .sort(sort)
      .limit(limit)
      .project({ embedding: 0 })
      .toArray();
    return docs;
  }

  async aggregateDocuments({ collection, pipeline }) {
    const col = this.db.collection(collection);
    return await col.aggregate(pipeline).toArray();
  }

  async countDocuments({ collection, filter = {} }) {
    const col = this.db.collection(collection);
    const count = await col.countDocuments(filter);
    return { count };
  }

  async getCollections() {
    const collections = await this.db.listCollections().toArray();
    return collections.map(c => c.name);
  }

  getToolDefinitions() {
    return [
      {
        name: 'find_documents',
        description: 'Find documents in a MongoDB collection using MCP protocol',
        parameters: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'Collection name' },
            filter: { type: 'object', description: 'MongoDB filter query' },
            limit: { type: 'number', description: 'Max documents to return' },
            sort: { type: 'object', description: 'Sort order' }
          },
          required: ['collection']
        }
      },
      {
        name: 'aggregate_documents',
        description: 'Run MongoDB aggregation pipeline using MCP protocol',
        parameters: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'Collection name' },
            pipeline: { type: 'array', description: 'Aggregation pipeline stages' }
          },
          required: ['collection', 'pipeline']
        }
      },
      {
        name: 'count_documents',
        description: 'Count documents in a MongoDB collection using MCP protocol',
        parameters: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'Collection name' },
            filter: { type: 'object', description: 'MongoDB filter query' }
          },
          required: ['collection']
        }
      },
      {
        name: 'get_collections',
        description: 'List all collections in the MongoDB database via MCP',
        parameters: { type: 'object', properties: {} }
      }
    ];
  }
}

module.exports = { MongoDBMCPServer };
