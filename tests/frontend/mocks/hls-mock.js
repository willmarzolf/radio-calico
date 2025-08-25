// Mock HLS.js library for testing
class MockHls {
  constructor(config = {}) {
    this.config = config;
    this.media = null;
    this.eventListeners = {};
  }

  static isSupported() {
    return true;
  }

  loadSource(url) {
    this.sourceUrl = url;
    // Simulate manifest loading
    setTimeout(() => {
      this.trigger(MockHls.Events.MANIFEST_PARSED);
    }, 10);
  }

  attachMedia(media) {
    this.media = media;
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  trigger(event, data = {}) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(event, data));
    }
  }

  startLoad() {
    // Mock recovery
  }

  recoverMediaError() {
    // Mock media error recovery
  }

  destroy() {
    this.eventListeners = {};
    this.media = null;
  }
}

// Mock HLS events
MockHls.Events = {
  MANIFEST_PARSED: 'hlsManifestParsed',
  ERROR: 'hlsError'
};

MockHls.ErrorTypes = {
  NETWORK_ERROR: 'networkError',
  MEDIA_ERROR: 'mediaError',
  OTHER_ERROR: 'otherError'
};

// Make it globally available
global.Hls = MockHls;

module.exports = MockHls;