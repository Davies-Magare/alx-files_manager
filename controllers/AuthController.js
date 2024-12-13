const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = dbClient.client.db(dbClient.database);
    const usersCollection = db.collection('users');
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const user = usersCollection.findOne({ email, password: hashedPassword }).then((user) => {

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      redisClient.set(`auth_${token}`, user._id.toString(), 86400).then(() => {
        res.status(200).json({ token });
      }).catch((error) => {
          return res.status(500).json({error: "Cannot set to Redis"});
      });
    }).catch((error) => {
	  return res.status(500).json({error: "Cannot access database"});
    });
  }

  static getDisconnect(req, res) {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  redisClient.get(`auth_${token}`).then((userId) => {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    redisClient.del(`auth_${token}`).then(() => {
      return res.status(204).end();
    }).catch((error) => {
      return res.status(500).json({ error: 'Internal server error' });
    });
  }).catch((error) => {
    return res.status(500).json({ error: 'Internal server error' });
  });
 }
}


module.exports = AuthController;

