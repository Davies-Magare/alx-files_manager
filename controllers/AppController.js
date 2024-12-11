const dbClient = require('../utils/db.js');
const redisClient = require('../utils/redis.js');

const getStatus = async function(req, res) {
  try {
    const redisAlive = await redisClient.isAlive();
    const dbAlive = await dbClient.isAlive();
    
    res.status(200).send({ redis: redisAlive, db: dbAlive });
  } catch (error) {
    res.status(500).send({ error: 'Unable to check status' });
  }
}

const getStats = async function(req, res) {
  try {
    const userCount = await dbClient.nbUsers();
    const fileCount = await dbClient.nbFiles();

    res.status(200).send({
      users: userCount,
      files: fileCount
    });
  } catch (error) {
    res.status(500).send({ error: 'Unable to fetch stats' });
  }
}

module.exports = { getStatus, getStats };

