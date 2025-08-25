// Add TextEncoder/TextDecoder polyfills for Node.js < 18
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Frontend test setup with jsdom
const { JSDOM } = require('jsdom');

// Create a basic DOM structure for tests
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>Radio Calico Test</title>
</head>
<body>
  <div id="app">
    <audio id="radioPlayer"></audio>
    <button id="playPauseBtn">
      <span class="play-icon">▶</span>
      <span class="pause-icon" style="display: none;">⏸</span>
    </button>
    <input type="range" id="volumeSlider" min="0" max="100" value="50">
    <span id="volumeValue">50%</span>
    <div id="streamStatus" class="status"></div>
    <div id="elapsedTime">00:00</div>
    
    <div id="currentTrack">
      <div class="track-title">Unknown Title</div>
      <div class="track-artist">Unknown Artist</div>
      <div class="track-album">Unknown Album</div>
    </div>
    
    <div id="recentTracks"></div>
    <img id="currentAlbumArt" style="display: none;">
    
    <div class="rating-controls">
      <button id="thumbsUpBtn" class="rating-btn">
        👍 <span id="thumbsUpCount">0</span>
      </button>
      <button id="thumbsDownBtn" class="rating-btn">
        👎 <span id="thumbsDownCount">0</span>
      </button>
      <div id="ratingStatus"></div>
    </div>
  </div>
</body>
</html>
`, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global DOM
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLAudioElement = dom.window.HTMLAudioElement;
global.Event = dom.window.Event;

// Mock fetch globally
global.fetch = jest.fn();

// Mock btoa for track ID generation
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// Reset DOM and mocks before each test
beforeEach(() => {
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset DOM elements to initial state if they exist
  const thumbsUpBtn = document.getElementById('thumbsUpBtn');
  const thumbsDownBtn = document.getElementById('thumbsDownBtn');
  const thumbsUpCount = document.getElementById('thumbsUpCount');
  const thumbsDownCount = document.getElementById('thumbsDownCount');
  const ratingStatus = document.getElementById('ratingStatus');
  
  if (thumbsUpBtn) thumbsUpBtn.classList.remove('active', 'disabled');
  if (thumbsDownBtn) thumbsDownBtn.classList.remove('active', 'disabled');
  if (thumbsUpCount) thumbsUpCount.textContent = '0';
  if (thumbsDownCount) thumbsDownCount.textContent = '0';
  if (ratingStatus) ratingStatus.textContent = '';
});