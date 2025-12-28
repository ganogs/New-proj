const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './database.db';
const db = new sqlite3.Database(path.join(__dirname, dbPath));

function initDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          image_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

function createPost(text, imagePath) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (text, image_path) VALUES (?, ?)',
      [text, imagePath],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, text, image_path: imagePath });
        }
      }
    );
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM posts WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

module.exports = { initDB, createPost, getPostById, db };
