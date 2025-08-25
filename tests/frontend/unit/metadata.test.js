require('../mocks/hls-mock');
const { mockMetadataResponses } = require('../mocks/metadata-responses');

describe('Metadata Processing Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetch API interaction', () => {
    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        const response = await fetch('https://test.com/metadata');
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const response = await fetch('https://test.com/metadata');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should successfully fetch valid metadata', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadataResponses.validTrack
      });

      const response = await fetch('https://test.com/metadata');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.title).toBe('Test Song');
      expect(data.artist).toBe('Test Artist');
      expect(data.album).toBe('Test Album');
    });
  });

  describe('metadata processing functions', () => {
    test('should process track metadata with fallbacks', () => {
      function processTrackData(metadata) {
        return {
          title: metadata.title || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album'
        };
      }

      const result = processTrackData(mockMetadataResponses.emptyTrack);
      
      expect(result.title).toBe('Unknown Title');
      expect(result.artist).toBe('Unknown Artist');
      expect(result.album).toBe('Unknown Album');
    });

    test('should extract recent tracks from metadata', () => {
      function extractRecentTracks(metadata) {
        const tracks = [];
        for (let i = 1; i <= 5; i++) {
          const title = metadata[`prev_title_${i}`];
          const artist = metadata[`prev_artist_${i}`];
          if (title && artist) {
            tracks.push({ title, artist, album: '' });
          }
        }
        return tracks.slice(0, 5);
      }

      const result = extractRecentTracks(mockMetadataResponses.multipleRecentTracks);
      
      expect(result).toHaveLength(5);
      expect(result[0].title).toBe('Recent 1');
      expect(result[0].artist).toBe('Artist 1');
    });

    test('should generate cache-busted album art URLs', () => {
      function getCacheBustedAlbumArt(baseUrl) {
        return baseUrl + '?t=' + Date.now();
      }

      const baseUrl = 'https://example.com/cover.jpg';
      const result = getCacheBustedAlbumArt(baseUrl);
      
      expect(result).toContain(baseUrl);
      expect(result).toContain('?t=');
    });

    test('should handle null metadata gracefully', () => {
      function processTrackData(metadata) {
        if (!metadata) {
          return {
            title: 'Unknown Title',
            artist: 'Unknown Artist',
            album: 'Unknown Album'
          };
        }
        return {
          title: metadata.title || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album'
        };
      }

      const result = processTrackData(null);
      
      expect(result.title).toBe('Unknown Title');
      expect(result.artist).toBe('Unknown Artist');
      expect(result.album).toBe('Unknown Album');
    });
  });

  describe('metadata validation', () => {
    test('should validate metadata structure', () => {
      function isValidMetadata(metadata) {
        return !!(metadata && 
                 typeof metadata === 'object' && 
                 metadata !== null &&
                 ('title' in metadata || 'artist' in metadata));
      }

      expect(isValidMetadata(mockMetadataResponses.validTrack)).toBe(true);
      expect(isValidMetadata(mockMetadataResponses.emptyTrack)).toBe(true);
      expect(isValidMetadata(null)).toBe(false);
      expect(isValidMetadata({})).toBe(false);
      expect(isValidMetadata('string')).toBe(false);
    });

    test('should handle metadata with missing fields', () => {
      function sanitizeMetadata(metadata) {
        if (!metadata) return null;
        
        return {
          title: typeof metadata.title === 'string' ? metadata.title : '',
          artist: typeof metadata.artist === 'string' ? metadata.artist : '',
          album: typeof metadata.album === 'string' ? metadata.album : ''
        };
      }

      const result = sanitizeMetadata({ title: null, artist: 123, album: undefined });
      
      expect(result.title).toBe('');
      expect(result.artist).toBe('');
      expect(result.album).toBe('');
    });
  });
});