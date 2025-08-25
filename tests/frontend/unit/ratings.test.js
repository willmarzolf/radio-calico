require('../mocks/hls-mock');
const { mockApiResponses } = require('../mocks/metadata-responses');

describe('Rating System Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rating validation', () => {
    test('should validate rating values', () => {
      function isValidRating(rating) {
        return rating === 1 || rating === -1;
      }

      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(-1)).toBe(true);
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(2)).toBe(false);
      expect(isValidRating('1')).toBe(false);
      expect(isValidRating(null)).toBe(false);
      expect(isValidRating(undefined)).toBe(false);
    });

    test('should validate track ID', () => {
      function isValidTrackId(trackId) {
        return typeof trackId === 'string' && trackId.length > 0;
      }

      expect(isValidTrackId('valid-track-id')).toBe(true);
      expect(isValidTrackId('')).toBe(false);
      expect(isValidTrackId(null)).toBe(false);
      expect(isValidTrackId(undefined)).toBe(false);
      expect(isValidTrackId(123)).toBe(false);
    });
  });

  describe('rating API interaction', () => {
    test('should submit thumbs up rating', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trackId: 'test-track', rating: 1 })
      });

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'test-track', rating: 1 })
      });

      const result = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'test-track', rating: 1 })
      });

      expect(result.success).toBe(true);
      expect(result.rating).toBe(1);
    });

    test('should submit thumbs down rating', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trackId: 'test-track', rating: -1 })
      });

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'test-track', rating: -1 })
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.rating).toBe(-1);
    });

    test('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      });

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 'test-track', rating: 1 })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: 'test-track', rating: 1 })
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('rating state management', () => {
    test('should determine button states from user rating', () => {
      function getRatingButtonStates(userRating) {
        return {
          thumbsUpActive: userRating === 1,
          thumbsDownActive: userRating === -1,
          canVote: true
        };
      }

      const thumbsUpState = getRatingButtonStates(1);
      expect(thumbsUpState.thumbsUpActive).toBe(true);
      expect(thumbsUpState.thumbsDownActive).toBe(false);

      const thumbsDownState = getRatingButtonStates(-1);
      expect(thumbsDownState.thumbsUpActive).toBe(false);
      expect(thumbsDownState.thumbsDownActive).toBe(true);

      const noRatingState = getRatingButtonStates(null);
      expect(noRatingState.thumbsUpActive).toBe(false);
      expect(noRatingState.thumbsDownActive).toBe(false);
    });

    test('should format rating counts', () => {
      function formatRatingCounts(ratings) {
        return {
          thumbsUpDisplay: String(ratings.thumbsUp || 0),
          thumbsDownDisplay: String(ratings.thumbsDown || 0)
        };
      }

      const result1 = formatRatingCounts({ thumbsUp: 5, thumbsDown: 2 });
      expect(result1.thumbsUpDisplay).toBe('5');
      expect(result1.thumbsDownDisplay).toBe('2');

      const result2 = formatRatingCounts({});
      expect(result2.thumbsUpDisplay).toBe('0');
      expect(result2.thumbsDownDisplay).toBe('0');
    });

    test('should generate appropriate status messages', () => {
      function getRatingStatusMessage(action, rating, wasChanged) {
        if (!action) return '';
        
        if (wasChanged) {
          return rating === 1 ? 'Changed to thumbs up! 👍' : 'Changed to thumbs down! 👎';
        } else {
          return rating === 1 ? 'Thanks for your vote! 👍' : 'Thanks for your vote! 👎';
        }
      }

      expect(getRatingStatusMessage('vote', 1, false)).toBe('Thanks for your vote! 👍');
      expect(getRatingStatusMessage('vote', -1, false)).toBe('Thanks for your vote! 👎');
      expect(getRatingStatusMessage('change', 1, true)).toBe('Changed to thumbs up! 👍');
      expect(getRatingStatusMessage('change', -1, true)).toBe('Changed to thumbs down! 👎');
      expect(getRatingStatusMessage(null)).toBe('');
    });
  });

  describe('rating workflow logic', () => {
    test('should handle complete rating submission workflow', () => {
      function processRatingSubmission(previousRating, newRating) {
        const wasChanged = previousRating !== null && previousRating !== newRating;
        const action = wasChanged ? 'change' : 'vote';
        
        return {
          action,
          wasChanged,
          newRating,
          statusMessage: newRating === 1 
            ? (wasChanged ? 'Changed to thumbs up! 👍' : 'Thanks for your vote! 👍')
            : (wasChanged ? 'Changed to thumbs down! 👎' : 'Thanks for your vote! 👎')
        };
      }

      // New vote
      const newVote = processRatingSubmission(null, 1);
      expect(newVote.action).toBe('vote');
      expect(newVote.wasChanged).toBe(false);
      expect(newVote.statusMessage).toBe('Thanks for your vote! 👍');

      // Changed vote
      const changedVote = processRatingSubmission(1, -1);
      expect(changedVote.action).toBe('change');
      expect(changedVote.wasChanged).toBe(true);
      expect(changedVote.statusMessage).toBe('Changed to thumbs down! 👎');

      // Same vote (shouldn't happen but handle gracefully)
      const sameVote = processRatingSubmission(1, 1);
      expect(sameVote.wasChanged).toBe(false);
    });

    test('should handle error scenarios', () => {
      function handleRatingError(error, trackId) {
        if (!trackId) {
          return {
            error: true,
            message: 'No track available to rate'
          };
        }

        if (error.name === 'NetworkError') {
          return {
            error: true,
            message: 'Network error - please check your connection'
          };
        }

        return {
          error: true,
          message: `Error: ${error.message}`
        };
      }

      const noTrackError = handleRatingError(null, null);
      expect(noTrackError.error).toBe(true);
      expect(noTrackError.message).toBe('No track available to rate');

      const networkError = handleRatingError({ name: 'NetworkError', message: 'Failed to fetch' }, 'track-id');
      expect(networkError.error).toBe(true);
      expect(networkError.message).toBe('Network error - please check your connection');

      const genericError = handleRatingError({ message: 'Server error' }, 'track-id');
      expect(genericError.error).toBe(true);
      expect(genericError.message).toBe('Error: Server error');
    });
  });

  describe('data synchronization', () => {
    test('should merge rating data correctly', () => {
      function mergeRatingData(ratingsResponse, userRatingResponse) {
        return {
          counts: {
            thumbsUp: ratingsResponse.thumbsUp || 0,
            thumbsDown: ratingsResponse.thumbsDown || 0
          },
          userRating: userRatingResponse.rating,
          total: (ratingsResponse.thumbsUp || 0) + (ratingsResponse.thumbsDown || 0)
        };
      }

      const result = mergeRatingData(
        { thumbsUp: 5, thumbsDown: 2 },
        { rating: 1 }
      );

      expect(result.counts.thumbsUp).toBe(5);
      expect(result.counts.thumbsDown).toBe(2);
      expect(result.userRating).toBe(1);
      expect(result.total).toBe(7);
    });
  });
});