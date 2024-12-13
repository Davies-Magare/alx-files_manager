const dbClient = require('../utils/db');
const crypto = require('crypto');

class UsersController {
  static postNew(req, res) {
    if (!req.body) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const db = dbClient.client.db(dbClient.database);
    const usersCollection = db.collection('users');

    usersCollection.findOne({ email }).then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = { email, password: hashedPassword };

      usersCollection.insertOne(newUser).then((result) => {
        const user = { id: result.insertedId, email };
        res.status(201).json(user);
      }).catch((error) => {
        console.error('Error inserting user:', error);
        res.status(500).json({ error: 'Internal server error' });
      });
    }).catch((error) => {
      console.error('Error finding user:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }
}

module.exports = UsersController;

