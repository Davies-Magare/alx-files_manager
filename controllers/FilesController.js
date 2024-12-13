const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');  // Using UUID for file naming
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');

class FilesController {
  static postUpload(req, res) {
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }
    if (!type || (type !== 'file' && type !== 'folder' && type !== 'image')) {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: "Missing data" });
    }

    const files = dbClient.client.db(dbClient.database).collection("files");

    // Parent validation (asynchronous)
    if (parentId) {
      files.findOne({ _id: new ObjectId(parentId) }).then((result) => {
        if (!result) {
          return res.status(400).json({ error: "Parent not found" });
        }
        if (result.type !== 'folder') {
          return res.status(400).json({ error: "Parent is not a folder" });
        }

        // Token validation (asynchronous)
        const token = req.headers['x-token'];
        if (!token) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        redisClient.get(`auth_${token}`).then((userId) => {
          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
          }

          // Determine the storage folder path
          const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
          const uploadDir = path.join(folderPath);

          // Ensure the upload directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // Decode the base64 file data
          const fileBuffer = Buffer.from(data, 'base64');
          const fileName = `${uuidv4()}`; // Generate UUID for the filename
          const filePath = path.join(uploadDir, fileName);

          // Write the file to disk
          fs.writeFile(filePath, fileBuffer, (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Error saving file to disk' });
            }

            // Prepare the file data for MongoDB insertion
            const fileData = {
              name,
              type,
              isPublic,
              parentId,
              userId: userId, // Assuming result is the user ID from Redis
              localPath: filePath  // Absolute file path
            };

            // Insert file data into MongoDB
            files.insertOne(fileData).then((insertResult) => {
              return res.status(201).json(insertResult.ops[0]);
            }).catch((error) => {
              console.error(error); // For debugging purposes
              return res.status(500).json({ error: "Error saving file in database" });
            });
          });
        }).catch((error) => {
          console.error(error); // For debugging purposes
          return res.status(500).json({ error: "Server error" });
        });
      }).catch((error) => {
        console.error(error); // For debugging purposes
        return res.status(500).json({ error: "Internal server error" });
      });
    } else {
      // If there's no parentId, proceed directly to token validation and file creation
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      redisClient.get(`auth_${token}`).then((userId) => {
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Determine the storage folder path
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const uploadDir = path.join(folderPath);

        // Ensure the upload directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Decode the base64 file data
        const fileBuffer = Buffer.from(data, 'base64');
        const fileName = `${uuidv4()}`; // Generate UUID for the filename
        const filePath = path.join(uploadDir, fileName);

        // Write the file to disk
        fs.writeFile(filePath, fileBuffer, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error saving file to disk' });
          }

          // Prepare the file data for MongoDB insertion
          const fileData = {
            name,
            type,
            isPublic,
            parentId,
            userId: userId, // Assuming result is the user ID from Redis
            //localPath: filePath  // Absolute file path
          };

          // Insert file data into MongoDB
          files.insertOne(fileData).then((insertResult) => {
            return res.status(201).json(insertResult.ops[0]);
          }).catch((error) => {
            console.error(error); // For debugging purposes
            return res.status(500).json({ error: "Error saving file in database" });
          });
        });
      }).catch((error) => {
        console.error(error); // For debugging purposes
        return res.status(500).json({ error: "Server error" });
      });
    }
  }
}

module.exports = FilesController;

