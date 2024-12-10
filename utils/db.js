const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const dbName = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.db = null;
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      //console.log('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('Error connecting to database:', error);
    }
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    if (!this.isConnected) throw new Error('Database not connected');
    try {
      return await this.db.collection('users').countDocuments();
    } catch (error) {
      console.error('Error fetching user count:', error);
      throw error;
    }
  }

  async nbFiles() {
    if (!this.isConnected) throw new Error('Database not connected');
    try {
      return await this.db.collection('files').countDocuments();
    } catch (error) {
      console.error('Error fetching file count:', error);
      throw error;
    }
  }
}

// Export the instance
const dbClient = new DBClient();
module.exports = dbClient;

