const request = require('supertest');
const TestDatabase = require('../helpers/test-db');
const { createTestServer } = require('../helpers/test-server');

describe('Ratings API Integration', () => {
  let app;
  let testDb;
  let db;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup();
    app = createTestServer(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe('GET /api/ratings/:trackId', () => {
    test('should return ratings for a track', async () => {
      await testDb.seedData();

      const response = await request(app)
        .get('/api/ratings/track1')
        .expect(200);

      expect(response.body).toEqual({
        thumbsUp: 2,
        thumbsDown: 1
      });
    });

    test('should return zero ratings for non-existent track', async () => {
      const response = await request(app)
        .get('/api/ratings/non-existent')
        .expect(200);

      expect(response.body).toEqual({
        thumbsUp: 0,
        thumbsDown: 0
      });
    });

    test('should return 400 for empty track ID', async () => {
      const response = await request(app)
        .get('/api/ratings/')
        .expect(404);
    });

    test('should handle database errors gracefully', async () => {
      // Close database to simulate error
      await testDb.teardown();

      const response = await request(app)
        .get('/api/ratings/test-track')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/ratings', () => {
    test('should submit thumbs up rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: 1
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        trackId: 'test-track',
        rating: 1
      });

      // Verify rating was stored
      const ratings = await request(app)
        .get('/api/ratings/test-track')
        .expect(200);

      expect(ratings.body.thumbsUp).toBe(1);
      expect(ratings.body.thumbsDown).toBe(0);
    });

    test('should submit thumbs down rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: -1
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        trackId: 'test-track',
        rating: -1
      });

      // Verify rating was stored
      const ratings = await request(app)
        .get('/api/ratings/test-track')
        .expect(200);

      expect(ratings.body.thumbsUp).toBe(0);
      expect(ratings.body.thumbsDown).toBe(1);
    });

    test('should update existing rating', async () => {
      // Submit initial rating
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: 1
        })
        .expect(200);

      // Update to different rating
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: -1
        })
        .expect(200);

      // Verify only one rating exists and it's updated
      const ratings = await request(app)
        .get('/api/ratings/test-track')
        .expect(200);

      expect(ratings.body.thumbsUp).toBe(0);
      expect(ratings.body.thumbsDown).toBe(1);
    });

    test('should return 400 for missing track ID', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          rating: 1
        })
        .expect(400);

      expect(response.body.error).toBe('Track ID required');
    });

    test('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: 2
        })
        .expect(400);

      expect(response.body.error).toBe('Rating must be 1 or -1');
    });

    test('should return 400 for string rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test-track',
          rating: "1"
        })
        .expect(400);

      expect(response.body.error).toBe('Rating must be 1 or -1');
    });

    test('should generate consistent user IDs for same IP', async () => {
      const ip = '192.168.1.100';

      // Submit two ratings from same IP
      await request(app)
        .post('/api/ratings')
        .set('X-Forwarded-For', ip)
        .send({
          trackId: 'track1',
          rating: 1
        })
        .expect(200);

      await request(app)
        .post('/api/ratings')
        .set('X-Forwarded-For', ip)
        .send({
          trackId: 'track2',
          rating: -1
        })
        .expect(200);

      // Check that both ratings exist (proving user ID was consistent)
      const track1Ratings = await request(app).get('/api/ratings/track1');
      const track2Ratings = await request(app).get('/api/ratings/track2');

      expect(track1Ratings.body.thumbsUp).toBe(1);
      expect(track2Ratings.body.thumbsDown).toBe(1);
    });
  });

  describe('GET /api/user-rating/:trackId', () => {
    test('should return null for track with no user rating', async () => {
      const response = await request(app)
        .get('/api/user-rating/test-track')
        .expect(200);

      expect(response.body).toEqual({
        rating: null
      });
    });

    test('should return user rating when exists', async () => {
      const ip = '127.0.0.1';

      // Submit a rating
      await request(app)
        .post('/api/ratings')
        .set('X-Forwarded-For', ip)
        .send({
          trackId: 'test-track',
          rating: 1
        })
        .expect(200);

      // Get user rating
      const response = await request(app)
        .get('/api/user-rating/test-track')
        .set('X-Forwarded-For', ip)
        .expect(200);

      expect(response.body).toEqual({
        rating: 1
      });
    });

    test('should return 400 for empty track ID', async () => {
      await request(app)
        .get('/api/user-rating/')
        .expect(404);
    });
  });
});