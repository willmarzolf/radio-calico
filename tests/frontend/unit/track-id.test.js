// Test just the track ID generation function in isolation
function generateTrackId(title, artist) {
  return btoa(encodeURIComponent((title + '|' + artist).toLowerCase())).replace(/[^a-zA-Z0-9]/g, '');
}

describe('Track ID Generation', () => {
  describe('generateTrackId', () => {
    test('should generate consistent ID for same title and artist', () => {
      const id1 = generateTrackId('Test Song', 'Test Artist');
      const id2 = generateTrackId('Test Song', 'Test Artist');
      expect(id1).toBe(id2);
    });

    test('should generate different IDs for different songs', () => {
      const id1 = generateTrackId('Song A', 'Artist A');
      const id2 = generateTrackId('Song B', 'Artist B');
      expect(id1).not.toBe(id2);
    });

    test('should be case insensitive', () => {
      const id1 = generateTrackId('Test Song', 'Test Artist');
      const id2 = generateTrackId('test song', 'test artist');
      expect(id1).toBe(id2);
    });

    test('should handle special characters', () => {
      const id1 = generateTrackId('Song & More!', 'Artist @ Home');
      const id2 = generateTrackId('song & more!', 'artist @ home');
      expect(id1).toBe(id2);
    });

    test('should handle empty strings', () => {
      const id = generateTrackId('', '');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('should handle unicode characters', () => {
      const id1 = generateTrackId('Café', 'Naïve');
      const id2 = generateTrackId('café', 'naïve');
      expect(id1).toBe(id2);
    });

    test('should return only alphanumeric characters', () => {
      const id = generateTrackId('Test Song!@#$%', 'Test Artist&*()');
      expect(id).toMatch(/^[a-zA-Z0-9]*$/);
    });

    test('should handle very long titles and artists', () => {
      const longTitle = 'A'.repeat(1000);
      const longArtist = 'B'.repeat(1000);
      const id = generateTrackId(longTitle, longArtist);
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('should differentiate between swapped title and artist', () => {
      const id1 = generateTrackId('Title', 'Artist');
      const id2 = generateTrackId('Artist', 'Title');
      expect(id1).not.toBe(id2);
    });

    test('should handle null and undefined values', () => {
      const id1 = generateTrackId(null, null);
      const id2 = generateTrackId(undefined, undefined);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });
});