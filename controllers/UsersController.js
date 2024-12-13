const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const crypto = require("crypto");
const { ObjectId } = require('mongodb');

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    const users = dbClient.client.db(dbClient.database).collection("users");

    (async () => {
      try {
        const user = await users.findOne({ email });
        if (user) {
          return res.status(400).json({ error: "Already exist" });
        }

        const hashedPw = crypto.createHash('sha1').update(password).digest("hex");
        const insertResult = await users.insertOne({ email, password: hashedPw });
        
        res.status(201).json({ id: insertResult.insertedId, email });
      } catch (error) {
        console.error("Error in postNew:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    })();
  }
  static getMe(req, res) {
    const token = req.headers['x-token'];
    console.log(req.headers);
    console.log('token: ', token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    redisClient.get(`auth_${token}`).then((userId) => {
      console.log('UserId: ', userId);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const db = dbClient.client.db(dbClient.database);
      const usersCollection = db.collection('users');
      const objectIdUserId = ObjectId(userId);
      usersCollection.findOne({ _id: objectIdUserId }).then((user) => {
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json({ id: user._id, email: user.email });
      }).catch((error) => {
        console.error('Error in getMe:', error);
        res.status(500).json({ error: 'Internal server error' });
      });
    }).catch((error) => {
      console.error('Error in getMe:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }
}



module.exports = UsersController;

