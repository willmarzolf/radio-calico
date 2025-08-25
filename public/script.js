class RadioPlayer {
    constructor() {
        this.streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
        this.audio = document.getElementById('radioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.streamStatus = document.getElementById('streamStatus');
        this.playIcon = document.querySelector('.play-icon');
        this.pauseIcon = document.querySelector('.pause-icon');
        this.elapsedTime = document.getElementById('elapsedTime');
        this.currentTrack = document.getElementById('currentTrack');
        this.recentTracks = document.getElementById('recentTracks');
        this.currentAlbumArt = document.getElementById('currentAlbumArt');
        this.thumbsUpBtn = document.getElementById('thumbsUpBtn');
        this.thumbsDownBtn = document.getElementById('thumbsDownBtn');
        this.thumbsUpCount = document.getElementById('thumbsUpCount');
        this.thumbsDownCount = document.getElementById('thumbsDownCount');
        this.ratingStatus = document.getElementById('ratingStatus');
        this.hls = null;
        this.startTime = null;
        this.elapsedInterval = null;
        this.metadataInterval = null;
        this.metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
        this.albumArtUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg';
        this.currentTrackId = null;
        this.userId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateVolumeDisplay();
        this.updateElapsedTime();
        this.startMetadataUpdates();
        
        // Setup HLS after ensuring library is loaded
        this.waitForHLS().then(() => {
            this.setupHLS();
        });
    }
    
    waitForHLS() {
        return new Promise((resolve) => {
            if (typeof Hls !== 'undefined') {
                resolve();
            } else {
                const checkHLS = () => {
                    if (typeof Hls !== 'undefined') {
                        resolve();
                    } else {
                        setTimeout(checkHLS, 50);
                    }
                };
                checkHLS();
            }
        });
    }
    
    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        
        this.thumbsUpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Thumbs up clicked');
            this.rateTrack(1);
        });
        this.thumbsDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Thumbs down clicked');
            this.rateTrack(-1);
        });
        
        this.audio.addEventListener('loadstart', () => this.updateStatus('Loading...', 'loading'));
        this.audio.addEventListener('canplay', () => this.updateStatus('Ready to play', ''));
        this.audio.addEventListener('playing', () => this.updateStatus('Playing live stream', 'playing'));
        this.audio.addEventListener('pause', () => this.updateStatus('Paused', ''));
        this.audio.addEventListener('waiting', () => this.updateStatus('Buffering...', 'loading'));
        this.audio.addEventListener('error', () => this.handleError());
        
        this.audio.addEventListener('play', () => {
            this.updatePlayButton(true);
            this.startElapsedTimer();
        });
        this.audio.addEventListener('pause', () => {
            this.updatePlayButton(false);
            this.stopElapsedTimer();
        });
    }
    
    setupHLS() {
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            
            this.hls.loadSource(this.streamUrl);
            this.hls.attachMedia(this.audio);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed, ready to play');
                this.updateStatus('Stream loaded, ready to play', '');
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                this.handleHLSError(data);
            });
            
        } else if (this.audio.canPlayType('application/vnd.apple.mpegurl')) {
            this.audio.src = this.streamUrl;
            this.updateStatus('Native HLS support detected', '');
        } else {
            this.updateStatus('HLS not supported in this browser', 'error');
            console.error('HLS is not supported');
        }
    }
    
    togglePlayPause() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
    
    async play() {
        try {
            await this.audio.play();
        } catch (error) {
            console.error('Play failed:', error);
            this.updateStatus('Playback failed - click to retry', 'error');
        }
    }
    
    pause() {
        this.audio.pause();
    }
    
    updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audio.volume = volume;
        this.updateVolumeDisplay();
    }
    
    updateVolumeDisplay() {
        const volumePercent = Math.round(this.audio.volume * 100);
        this.volumeValue.textContent = `${volumePercent}%`;
        this.volumeSlider.value = volumePercent;
    }
    
    updatePlayButton(isPlaying) {
        if (isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'inline';
        } else {
            this.playIcon.style.display = 'inline';
            this.pauseIcon.style.display = 'none';
        }
    }
    
    updateStatus(message, className = '') {
        this.streamStatus.textContent = message;
        this.streamStatus.className = `status ${className}`;
    }
    
    handleError() {
        console.error('Audio error occurred');
        this.updateStatus('Stream error - check your connection', 'error');
        this.updatePlayButton(false);
    }
    
    handleHLSError(data) {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error('Fatal network error, trying to recover...');
                    this.updateStatus('Network error, attempting to reconnect...', 'loading');
                    this.hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error('Fatal media error, trying to recover...');
                    this.updateStatus('Media error, attempting to recover...', 'loading');
                    this.hls.recoverMediaError();
                    break;
                default:
                    console.error('Fatal error, cannot recover');
                    this.updateStatus('Fatal error occurred', 'error');
                    this.hls.destroy();
                    break;
            }
        } else {
            console.warn('Non-fatal HLS error:', data);
        }
    }
    
    startElapsedTimer() {
        this.startTime = Date.now();
        this.elapsedInterval = setInterval(() => {
            this.updateElapsedTime();
        }, 1000);
    }
    
    stopElapsedTimer() {
        if (this.elapsedInterval) {
            clearInterval(this.elapsedInterval);
            this.elapsedInterval = null;
        }
    }
    
    updateElapsedTime() {
        if (this.startTime && !this.audio.paused) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.elapsedTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.elapsedTime.textContent = '00:00';
        }
    }
    
    async fetchMetadata() {
        try {
            const response = await fetch(this.metadataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const metadata = await response.json();
            this.updateTrackInfo(metadata);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
            this.updateCurrentTrack('Error loading track info', '-', '-');
        }
    }
    
    updateTrackInfo(metadata) {
        const newTrackId = this.generateTrackId(metadata.title, metadata.artist);
        const trackChanged = newTrackId !== this.currentTrackId;
        
        this.updateCurrentTrack(
            metadata.title || 'Unknown Title',
            metadata.artist || 'Unknown Artist',
            metadata.album || 'Unknown Album'
        );
        
        this.updateAlbumArt();
        
        if (trackChanged) {
            this.currentTrackId = newTrackId;
            this.loadTrackRatings();
        }
        
        const previousTracks = [];
        for (let i = 1; i <= 5; i++) {
            const title = metadata[`prev_title_${i}`];
            const artist = metadata[`prev_artist_${i}`];
            if (title && artist) {
                previousTracks.push({
                    title: title,
                    artist: artist,
                    album: ''
                });
            }
        }
        
        this.updateRecentTracks(previousTracks);
    }
    
    updateCurrentTrack(title, artist, album) {
        const titleEl = this.currentTrack.querySelector('.track-title');
        const artistEl = this.currentTrack.querySelector('.track-artist');
        const albumEl = this.currentTrack.querySelector('.track-album');
        
        if (titleEl) titleEl.textContent = title;
        if (artistEl) artistEl.textContent = artist;
        if (albumEl) albumEl.textContent = album;
    }
    
    updateAlbumArt() {
        if (this.currentAlbumArt) {
            this.currentAlbumArt.src = this.albumArtUrl + '?t=' + Date.now();
            this.currentAlbumArt.style.display = 'block';
            
            this.currentAlbumArt.onerror = () => {
                this.currentAlbumArt.style.display = 'none';
            };
        }
    }
    
    updateRecentTracks(tracks) {
        this.recentTracks.innerHTML = '';
        
        tracks.slice(0, 5).forEach(track => {
            const trackEl = document.createElement('div');
            trackEl.className = 'recent-track';
            trackEl.innerHTML = `
                <div class="recent-track-title">${track.title || 'Unknown Title'}</div>
                <div class="recent-track-artist">${track.artist || 'Unknown Artist'}</div>
                <div class="recent-track-album">${track.album || 'Unknown Album'}</div>
            `;
            this.recentTracks.appendChild(trackEl);
        });
    }
    
    startMetadataUpdates() {
        this.fetchMetadata();
        this.metadataInterval = setInterval(() => {
            this.fetchMetadata();
        }, 30000);
    }
    
    stopMetadataUpdates() {
        if (this.metadataInterval) {
            clearInterval(this.metadataInterval);
            this.metadataInterval = null;
        }
    }
    
    
    generateTrackId(title, artist) {
        return btoa(encodeURIComponent((title + '|' + artist).toLowerCase())).replace(/[^a-zA-Z0-9]/g, '');
    }
    
    async rateTrack(rating) {
        console.log('Rating track:', this.currentTrackId, 'with rating:', rating);
        
        if (!this.currentTrackId) {
            this.updateRatingStatus('No track available to rate');
            return;
        }
        
        // Check current rating state before making the API call
        const previousRating = this.thumbsUpBtn.classList.contains('active') ? 1 : 
                              this.thumbsDownBtn.classList.contains('active') ? -1 : null;
        
        this.updateRatingStatus('Submitting vote...');
        
        try {
            console.log('Sending rating request...');
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackId: this.currentTrackId,
                    rating: rating
                })
            });
            
            console.log('Rating response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Rating submitted successfully:', result);
                
                // Reload ratings to get updated counts and user state
                await this.loadTrackRatings();
                
                // Show appropriate message based on whether this was a rating change
                if (previousRating === rating) {
                    this.updateRatingStatus(rating === 1 ? 'Thanks for your vote! 👍' : 'Thanks for your vote! 👎');
                } else if (previousRating !== null && previousRating !== rating) {
                    this.updateRatingStatus(rating === 1 ? 'Changed to thumbs up! 👍' : 'Changed to thumbs down! 👎');
                } else {
                    this.updateRatingStatus(rating === 1 ? 'Thanks for your vote! 👍' : 'Thanks for your vote! 👎');
                }
                setTimeout(() => this.updateRatingStatus(''), 3000);
            } else {
                const errorText = await response.text();
                console.error('Rating failed with status:', response.status, 'Response:', errorText);
                throw new Error(`Rating failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error rating track:', error);
            this.updateRatingStatus('Error: ' + error.message);
            setTimeout(() => this.updateRatingStatus(''), 3000);
        }
    }
    
    async loadTrackRatings() {
        if (!this.currentTrackId) {
            console.log('No current track ID to load ratings for');
            // Reset to default state
            this.thumbsUpCount.textContent = '0';
            this.thumbsDownCount.textContent = '0';
            this.thumbsUpBtn.classList.remove('active', 'disabled');
            this.thumbsDownBtn.classList.remove('active', 'disabled');
            return;
        }
        
        console.log('Loading ratings for track:', this.currentTrackId);
        
        try {
            const [ratingsResponse, userRatingResponse] = await Promise.all([
                fetch(`/api/ratings/${this.currentTrackId}`),
                fetch(`/api/user-rating/${this.currentTrackId}`)
            ]);

            console.log('Response statuses:', ratingsResponse.status, userRatingResponse.status);
            
            if (ratingsResponse.ok && userRatingResponse.ok) {
                const ratings = await ratingsResponse.json();
                const userRating = await userRatingResponse.json();
                
                console.log('Loaded ratings:', ratings);
                console.log('User rating:', userRating);
                
                // Update counts
                this.thumbsUpCount.textContent = ratings.thumbsUp || 0;
                this.thumbsDownCount.textContent = ratings.thumbsDown || 0;
                
                // Reset all button states first
                this.thumbsUpBtn.classList.remove('active', 'disabled');
                this.thumbsDownBtn.classList.remove('active', 'disabled');
                
                // Set states based on user's vote - both buttons remain enabled for rating changes
                if (userRating.rating === 1) {
                    // User voted thumbs up
                    this.thumbsUpBtn.classList.add('active');
                    this.thumbsDownBtn.classList.remove('active');
                } else if (userRating.rating === -1) {
                    // User voted thumbs down
                    this.thumbsDownBtn.classList.add('active');
                    this.thumbsUpBtn.classList.remove('active');
                } else {
                    // No rating - remove active states
                    this.thumbsUpBtn.classList.remove('active');
                    this.thumbsDownBtn.classList.remove('active');
                }
                
            } else {
                console.error('Failed to load ratings. Status codes:', ratingsResponse.status, userRatingResponse.status);
                // Reset to safe state on error
                this.thumbsUpCount.textContent = '0';
                this.thumbsDownCount.textContent = '0';
                this.thumbsUpBtn.classList.remove('active', 'disabled');
                this.thumbsDownBtn.classList.remove('active', 'disabled');
            }
        } catch (error) {
            console.error('Error loading track ratings:', error);
            // Reset to safe state on error
            this.thumbsUpCount.textContent = '0';
            this.thumbsDownCount.textContent = '0';
            this.thumbsUpBtn.classList.remove('active', 'disabled');
            this.thumbsDownBtn.classList.remove('active', 'disabled');
        }
    }
    
    updateRatingStatus(message) {
        this.ratingStatus.textContent = message;
    }
    
    destroy() {
        this.stopElapsedTimer();
        this.stopMetadataUpdates();
        if (this.hls) {
            this.hls.destroy();
        }
    }
}

function initializePlayer() {
    const player = new RadioPlayer();
    
    window.addEventListener('beforeunload', () => {
        player.destroy();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}