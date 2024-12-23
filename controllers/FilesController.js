const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }
    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: "Missing data" });
    }

    const files = dbClient.client.db(dbClient.database).collection("files");

    try {
      // Get userId from Redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // ParentId validation
      if (parentId !== 0) {
        const parentFile = await files.findOne({ _id: ObjectId(parentId) });
        
        if (!parentFile) {
          return res.status(400).json({ error: "Parent not found" });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: "Parent is not a folder" });
        }
      }

      let fileData;
      if (type === 'folder') {
        // Insert folder directly into MongoDB
        fileData = { name, type, parentId, isPublic, userId };
        const insertResult = await files.insertOne(fileData);
        const savedFile = await files.findOne({ _id: insertResult.insertedId });

        return res.status(201).json({
          id: savedFile._id,
          userId,
          name,
          type,
          isPublic,
          parentId
        });
      } else {
        // Handle file upload to disk
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileBuffer = Buffer.from(data, 'base64');
        const fileName = `${uuidv4()}`;
        const filePath = path.join(folderPath, fileName);

        // Ensure the directory exists
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Write the file to disk
        fs.writeFileSync(filePath, fileBuffer);

        // Insert file metadata into MongoDB
        fileData = {
          name,
          type,
          parentId,
          isPublic,
          userId,
          localPath: filePath
        };

        const insertResult = await files.insertOne(fileData);
        const savedFile = await files.findOne({ _id: insertResult.insertedId });

        // Return response (exclude localPath)
        return res.status(201).json({
          id: savedFile._id,
          userId,
          name,
          type,
          isPublic,
          parentId
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }
}

module.exports = FilesController;

