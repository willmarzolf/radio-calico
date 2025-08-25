const TestDatabase = require('../helpers/test-db');

describe('Database Operations', () => {
  let testDb;
  let db;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe('Database setup', () => {
    test('should create track_ratings table', async () => {
      const tables = await db.allAsync("SELECT name FROM sqlite_master WHERE type='table'");
      expect(tables.map(t => t.name)).toContain('track_ratings');
    });

    test('should have correct table schema', async () => {
      const schema = await db.allAsync("PRAGMA table_info(track_ratings)");
      const columnNames = schema.map(col => col.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('track_id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('rating');
      expect(columnNames).toContain('created_at');
    });
  });

  describe('Rating operations', () => {
    test('should insert new rating', async () => {
      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'test-user', 1]
      );

      const result = await db.getAsync(
        'SELECT * FROM track_ratings WHERE track_id = ? AND user_id = ?',
        ['test-track', 'test-user']
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(1);
    });

    test('should update existing rating with INSERT OR REPLACE', async () => {
      // Insert initial rating
      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'test-user', 1]
      );

      // Update rating using INSERT OR REPLACE
      await db.runAsync(
        'INSERT OR REPLACE INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'test-user', -1]
      );

      const result = await db.getAsync(
        'SELECT * FROM track_ratings WHERE track_id = ? AND user_id = ?',
        ['test-track', 'test-user']
      );

      expect(result.rating).toBe(-1);
    });

    test('should maintain unique constraint on track_id and user_id', async () => {
      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'test-user', 1]
      );

      // This should not create a duplicate due to unique constraint
      await expect(
        db.runAsync(
          'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
          ['test-track', 'test-user', -1]
        )
      ).rejects.toThrow();
    });

    test('should allow same user to rate different tracks', async () => {
      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['track-1', 'test-user', 1]
      );

      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['track-2', 'test-user', -1]
      );

      const results = await db.allAsync(
        'SELECT * FROM track_ratings WHERE user_id = ?',
        ['test-user']
      );

      expect(results).toHaveLength(2);
    });

    test('should allow different users to rate same track', async () => {
      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'user-1', 1]
      );

      await db.runAsync(
        'INSERT INTO track_ratings (track_id, user_id, rating) VALUES (?, ?, ?)',
        ['test-track', 'user-2', -1]
      );

      const results = await db.allAsync(
        'SELECT * FROM track_ratings WHERE track_id = ?',
        ['test-track']
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('Rating aggregation', () => {
    beforeEach(async () => {
      await testDb.seedData();
    });

    test('should correctly count thumbs up and down for a track', async () => {
      const results = await db.allAsync(`
        SELECT rating, COUNT(*) as count 
        FROM track_ratings 
        WHERE track_id = ? 
        GROUP BY rating
      `, ['track1']);

      const ratings = { thumbsUp: 0, thumbsDown: 0 };
      results.forEach(row => {
        if (row.rating === 1) ratings.thumbsUp = row.count;
        if (row.rating === -1) ratings.thumbsDown = row.count;
      });

      expect(ratings.thumbsUp).toBe(2);
      expect(ratings.thumbsDown).toBe(1);
    });

    test('should return empty result for non-existent track', async () => {
      const results = await db.allAsync(`
        SELECT rating, COUNT(*) as count 
        FROM track_ratings 
        WHERE track_id = ? 
        GROUP BY rating
      `, ['non-existent']);

      expect(results).toHaveLength(0);
    });
  });
});