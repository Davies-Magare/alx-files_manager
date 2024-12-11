const dbClient = require('../utils/db.js');
const crypto = require('crypto');
const redisClient = require('../utils/redis.js');

const postNew = function(req, res) {
  const {email, password} = req.body;
  if (!email) {
    res.status(400).json({error: 'Missing email'});
  } else if (!password) {
      res.status(400).json({error: 'Missing password'});
  } else {
    dbClient.db.collection('users').findOne({'email': email}, (err, user) => {
      if (err) throw err;
      if (user) {
        res.status(400).json({error: 'Already exist'});
      }
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const userData = {email: email, password: hashedPassword};
      dbClient.db.collection('users').insertOne(userData, (err, result) => {
        if (err) console.log(err);
        else res.status(201).json({id: result.insertedId, email: email});
      });
    });
  }
}

module.exports = { postNew };

