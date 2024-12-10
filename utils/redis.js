import { createClient } from "redis";
class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(error);
    });
  }
  isAlive() {
    this.client.ping((err, res) => {
      if (err || res !== 'PONG') return false;
    });
    return true;
  }
  async get(key) {
    const myKey = await this.client.get(key);
    return myKey;
  }
  async set(key, value, duration) {
    await this.client.set(key, value, {EX: duration});
  }
  async del(key) {
    await this.client.del(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
