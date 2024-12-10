import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(error)
    });

    // Promisify methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.pingAsync = promisify(this.client.ping).bind(this.client);
  }
  isAlive() {
    if (this.client.connected) return true;
    return false;
  }

  async get(key) {
    try {
      return await this.getAsync(key);
    } catch {
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch {
      return null;
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch {
      return false;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;

