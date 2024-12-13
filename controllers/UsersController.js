const dbClient = require('../utils/db');
const crypto = require("crypto");

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
          return res.status(400).json({ error: "Already exists" });
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
}

module.exports = UsersController;

