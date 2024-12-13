// utils/db.js
const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;

    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.database = database;
    this.connected = false;

    this.client.connect().then(() => {
      this.connected = true;
      console.log('MongoDB client connected');
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const usersCollection = db.collection('users');
      return await usersCollection.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const filesCollection = db.collection('files');
      return await filesCollection.countDocuments();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

