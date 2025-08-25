// Mock responses for metadata API
const mockMetadataResponses = {
  validTrack: {
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    prev_title_1: 'Previous Song 1',
    prev_artist_1: 'Previous Artist 1',
    prev_title_2: 'Previous Song 2',
    prev_artist_2: 'Previous Artist 2',
  },
  
  emptyTrack: {
    title: '',
    artist: '',
    album: ''
  },
  
  nullTrack: {
    title: null,
    artist: null,
    album: null
  },
  
  multipleRecentTracks: {
    title: 'Current Song',
    artist: 'Current Artist',
    album: 'Current Album',
    prev_title_1: 'Recent 1',
    prev_artist_1: 'Artist 1',
    prev_title_2: 'Recent 2',
    prev_artist_2: 'Artist 2',
    prev_title_3: 'Recent 3',
    prev_artist_3: 'Artist 3',
    prev_title_4: 'Recent 4',
    prev_artist_4: 'Artist 4',
    prev_title_5: 'Recent 5',
    prev_artist_5: 'Artist 5',
  }
};

const mockApiResponses = {
  ratings: {
    noRatings: { thumbsUp: 0, thumbsDown: 0 },
    someRatings: { thumbsUp: 5, thumbsDown: 2 },
    manyRatings: { thumbsUp: 15, thumbsDown: 8 }
  },
  
  userRating: {
    noRating: { rating: null },
    thumbsUp: { rating: 1 },
    thumbsDown: { rating: -1 }
  },
  
  submitRating: {
    success: { success: true, trackId: 'test-track', rating: 1 },
    error: { error: 'Rating failed' }
  }
};

module.exports = {
  mockMetadataResponses,
  mockApiResponses
};