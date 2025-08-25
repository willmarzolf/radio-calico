const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class TestDatabase {
  constructor() {
    this.db = null;
  }

  async setup() {
    // Create in-memory database for testing
    this.db = new sqlite3.Database(':memory:');
    
    // Promisify database methods
    this.db.runAsync = promisify(this.db.run.bind(this.db));
    this.db.getAsync = promisify(this.db.get.bind(this.db));
    this.db.allAsync = promisify(this.db.all.bind(this.db));

    // Initialize the test database schema
    await this.db.runAsync(`CREATE TABLE IF NOT EXISTS track_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(track_id, user_id)
    )`);

    return this.db;
  }

  async teardown() {
    if (this.db) {
      await promisify(this.db.close.bind(this.db))();
      this.db = null;
    }
  }

  async seedData() {
    // Add some test data
    const testData = [
      { track_id: 'track1', user_id: 'user1', rating: 1 },
      { track_id: 'track1', user_id: 'user2', rating: -1 },
      { track_id: 'track1', user_id: 'user3', rating: 1 },
      { track_id: 'track2', user_id: 'user1', rating: -1 },
    ];

    for (const data of testData) {
      await this.db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        [data.track_id, data.user_id, data.rating]
      );
    }
  }

  getDatabase() {
    return this.db;
  }
}

module.exports = TestDatabase;