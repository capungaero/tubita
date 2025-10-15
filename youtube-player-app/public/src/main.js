// Import YouTube API utilities
import { getVideoDetails, extractVideoId } from './utils/youtubeApi.js';

// Load settings and video list from localStorage
let videoList = JSON.parse(localStorage.getItem('videoList')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    timeLimit: 30,
    password: 'admin123',
    warningTime: 5,
    maxVideosPerSession: 3  // NEW: max videos anak bisa pilih
};

// Session data
let currentUser = null;
let selectedVideos = [];
let currentVideoIndex = 0;
let player = null;
let watchTimer = null;
let watchedTime = 0;
let warningShown = false;
let sessionActive = false;

// Mouse lock feature
let mouseLocked = true;
let mouseUnlockKey = 'F2';

// DOM Elements
const videoContainer = document.getElementById('video-container');
const loginPopup = document.getElementById('login-popup');
const playConfirmationModal = document.getElementById('play-confirmation-modal');
const confirmPlayBtn = document.getElementById('confirm-play-btn');
const changePlaylistBtn = document.getElementById('change-playlist-btn');
const playlistPreview = document.getElementById('playlist-preview');
const endSessionModal = document.getElementById('end-session-modal');
const usernameInput = document.getElementById('username');
const videoSelectionGrid = document.getElementById('video-selection');
const startWatchingBtn = document.getElementById('start-watching');
const selectedCountSpan = document.getElementById('selected-count');
const maxVideosSpans = document.querySelectorAll('#max-videos, #max-videos-2');
const unlockPasswordInput = document.getElementById('unlock-password');
const unlockBtn = document.getElementById('unlock-btn');
const unlockError = document.getElementById('unlock-error');

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Auto-load playlist from URL if enabled
    await autoLoadPlaylistFromUrl();
    
    initializeApp();
    
    // Check if there's a saved playlist in cache
    const savedPlaylist = JSON.parse(localStorage.getItem('selectedPlaylist')) || null;
    const savedUser = localStorage.getItem('currentUser') || null;
    
    if (savedPlaylist && savedPlaylist.length > 0 && savedUser) {
        // User has saved playlist, show play confirmation
        showPlayConfirmation(savedUser, savedPlaylist);
    } else {
        // No saved playlist, show video selection
        loadAvailableVideos();
    }
});

// Auto-load playlist from URL
async function autoLoadPlaylistFromUrl() {
    const autoLoadSettings = JSON.parse(localStorage.getItem('autoLoadSettings') || '{}');
    
    // If auto-load is disabled, skip
    if (!autoLoadSettings.enabled) {
        return;
    }

    let url = autoLoadSettings.url || 'capung.web.id/tubita/tubita.txt';
    
    // Add https:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // Use AllOrigins CORS proxy
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const proxiedUrl = corsProxy + encodeURIComponent(url);
    
    console.log('Auto-loading playlist from:', url);
    
    // Show loading status
    showPlaylistLoadingStatus('🔄 Loading playlist dari URL...', 'loading');

    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            console.error('Failed to load playlist:', response.status);
            showPlaylistLoadingStatus('❌ Gagal load playlist dari URL', 'error');
            return;
        }

        const text = await response.text();
        const videos = await parsePlaylistText(text);
        
        if (videos.length > 0) {
            videoList = videos;
            localStorage.setItem('videoList', JSON.stringify(videoList));
            console.log(`Auto-loaded ${videos.length} videos from URL`);
            showPlaylistLoadingStatus(`✅ Berhasil load ${videos.length} video dari URL!`, 'success');
            
            // Hide status after 2 seconds
            setTimeout(() => {
                hidePlaylistLoadingStatus();
            }, 2000);
        }
    } catch (error) {
        console.error('Error auto-loading playlist:', error);
        showPlaylistLoadingStatus('❌ Error loading playlist: ' + error.message, 'error');
    }
}

// Parse playlist text content
async function parsePlaylistText(text) {
    const lines = text.split('\n');
    const videos = [];

    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Parse line - format: URL or ID or ID|Title
        let videoId = null;
        let customTitle = null;

        if (trimmed.includes('|')) {
            const parts = trimmed.split('|');
            videoId = extractVideoId(parts[0].trim());
            customTitle = parts[1].trim();
        } else {
            videoId = extractVideoId(trimmed);
        }

        if (videoId) {
            // Add video with basic info (thumbnail will load later)
            videos.push({
                id: videoId,
                title: customTitle || `Video ${videoId}`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                channelTitle: 'YouTube'
            });
        }
    }

    return videos;
}

// Request fullscreen function
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

// Show playlist loading status
function showPlaylistLoadingStatus(message, type) {
    const statusDiv = document.getElementById('playlist-loading');
    const messageP = statusDiv.querySelector('.status-message');
    
    if (statusDiv && messageP) {
        messageP.textContent = message;
        statusDiv.className = 'import-status status-' + type;
        statusDiv.style.display = 'block';
    }
}

// Hide playlist loading status
function hidePlaylistLoadingStatus() {
    const statusDiv = document.getElementById('playlist-loading');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

// Show play confirmation with saved playlist
function showPlayConfirmation(username, playlist) {
    currentUser = username;
    selectedVideos = playlist;
    
    // Hide login popup
    if (loginPopup) {
        loginPopup.classList.remove('active');
    }
    
    // Show play confirmation modal
    if (playConfirmationModal) {
        playConfirmationModal.classList.add('active');
        
        // Update message
        const message = document.getElementById('play-confirmation-message');
        if (message) {
            message.textContent = `Halo ${username}! Kamu punya ${playlist.length} video di playlist.`;
        }
        
        // Show playlist preview
        if (playlistPreview) {
            playlistPreview.innerHTML = `
                <h3>📋 Playlist Kamu:</h3>
                <ul>
                    ${playlist.map((video, index) => `
                        <li>
                            <i class="fas fa-play-circle"></i>
                            <span>${index + 1}. ${video.title}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }
}

// Monitor fullscreen changes and re-enable if user exits
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && sessionActive) {
        // If user exits fullscreen during session, re-enter
        setTimeout(() => {
            requestFullscreen();
        }, 500);
    }
});

// Add keyboard shortcut for fullscreen (F11 alternative)
document.addEventListener('keydown', (e) => {
    // F11 to toggle fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            requestFullscreen();
        }
    }
});

// Initialize the application
function initializeApp() {
    // DON'T enable mouse lock yet - only after user confirms play
    // Setup mouse unlock listener for Ctrl+F2
    setupMouseUnlockListener();
    
    // Setup event listeners
    setupLoginListeners();
    
    // Setup confirm play button
    if (confirmPlayBtn) {
        confirmPlayBtn.addEventListener('click', confirmAndStartPlaying);
    }
    
    // Setup change playlist button
    if (changePlaylistBtn) {
        changePlaylistBtn.addEventListener('click', () => {
            // Clear saved playlist
            localStorage.removeItem('selectedPlaylist');
            localStorage.removeItem('currentUser');
            selectedVideos = [];
            currentUser = null;
            
            // Hide play confirmation modal
            if (playConfirmationModal) {
                playConfirmationModal.classList.remove('active');
            }
            
            // Show login popup
            if (loginPopup) {
                loginPopup.classList.add('active');
            }
            
            // Load available videos
            loadAvailableVideos();
        });
    }
    
    // Setup fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            } else {
                requestFullscreen();
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
            }
        });
    }
    
    // Update button icon on fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (fullscreenBtn) {
            if (document.fullscreenElement) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
            } else {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            }
        }
    });
}

// Show login popup
function showLoginPopup() {
    loginPopup.classList.add('active');
    loadAvailableVideos();
    updateMaxVideosDisplay();
}

// Load available videos for selection
function loadAvailableVideos() {
    console.log('loadAvailableVideos called');
    console.log('videoList:', videoList);
    console.log('videoList.length:', videoList.length);
    
    if (videoList.length === 0) {
        videoSelectionGrid.innerHTML = '<p style="text-align:center; padding: 20px;">Tidak ada video. Silakan tambahkan video di Admin Panel.</p>';
        return;
    }
    
    videoSelectionGrid.innerHTML = '';
    
    videoList.forEach((video, index) => {
        console.log('Creating card for video:', video);
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card-select';
        videoCard.dataset.index = index;
        videoCard.dataset.videoId = video.id;
        
        videoCard.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
            <div class="video-info">
                <div class="video-title">${video.title}</div>
            </div>
            <div class="check-mark"><i class="fas fa-check"></i></div>
        `;
        
        videoCard.addEventListener('click', () => toggleVideoSelection(videoCard, video));
        videoSelectionGrid.appendChild(videoCard);
    });
}

// Toggle video selection
function toggleVideoSelection(card, video) {
    const isSelected = card.classList.contains('selected');
    const maxVideos = settings.maxVideosPerSession || 3;
    
    if (isSelected) {
        // Deselect
        card.classList.remove('selected');
        selectedVideos = selectedVideos.filter(v => v.id !== video.id);
    } else {
        // Check if max limit reached
        if (selectedVideos.length >= maxVideos) {
            alert(`Maksimal hanya ${maxVideos} video yang bisa dipilih!`);
            return;
        }
        
        // Select
        card.classList.add('selected');
        selectedVideos.push(video);
    }
    
    updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
    const maxVideos = settings.maxVideosPerSession || 3;
    selectedCountSpan.textContent = selectedVideos.length;
    
    // Enable/disable start button
    startWatchingBtn.disabled = selectedVideos.length === 0 || !usernameInput.value.trim();
    
    // Disable unselected videos if max reached
    const allCards = document.querySelectorAll('.video-card-select');
    allCards.forEach(card => {
        if (!card.classList.contains('selected') && selectedVideos.length >= maxVideos) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

// Update max videos display
function updateMaxVideosDisplay() {
    const maxVideos = settings.maxVideosPerSession || 3;
    maxVideosSpans.forEach(span => {
        span.textContent = maxVideos;
    });
}

// Setup login event listeners
function setupLoginListeners() {
    // Username input
    usernameInput.addEventListener('input', () => {
        updateSelectedCount();
    });
    
    // Start watching button
    startWatchingBtn.addEventListener('click', startWatchingSession);
    
    // Unlock button
    unlockBtn.addEventListener('click', unlockSession);
    
    // Enter key on password
    unlockPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            unlockSession();
        }
    });
}

// Confirm and start playing from saved playlist
function confirmAndStartPlaying() {
    if (!selectedVideos || selectedVideos.length === 0) {
        alert('Tidak ada video di playlist!');
        return;
    }
    
    // Hide play confirmation modal
    if (playConfirmationModal) {
        playConfirmationModal.classList.remove('active');
    }
    
    // Set session as active
    sessionActive = true;
    currentVideoIndex = 0;
    watchedTime = 0;
    
    // DON'T request fullscreen here - will be done when user clicks play button
    // This avoids "not initiated by user gesture" error
    
    // Start loading player immediately
    initializePlayer();
}

// Start watching session
function startWatchingSession() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Masukkan nama kamu!');
        return;
    }
    
    if (selectedVideos.length === 0) {
        alert('Pilih minimal 1 video!');
        return;
    }
    
    // Save session data to cache
    currentUser = username;
    localStorage.setItem('currentUser', username);
    localStorage.setItem('selectedPlaylist', JSON.stringify(selectedVideos));
    
    // Show confirmation message
    alert(`Playlist kamu sudah disimpan! Kamu bisa langsung putar video kapan saja.`);
    
    // Redirect to show play confirmation instead of starting immediately
    loginPopup.classList.remove('active');
    showPlayConfirmation(username, selectedVideos);
}

// Initialize YouTube Player API
function onYouTubeIframeAPIReady() {
    // Will be called when player is ready
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Initialize the player
function initializePlayer() {
    if (selectedVideos.length === 0) {
        return;
    }
    
    loadVideo(currentVideoIndex);
}

// Load and play video
function loadVideo(index) {
    if (index < 0 || index >= selectedVideos.length) {
        // All videos finished
        endWatchingSession('Semua video dalam playlist telah selesai diputar!');
        return;
    }
    
    currentVideoIndex = index;
    const video = selectedVideos[currentVideoIndex];
    
    // Create player container
    videoContainer.innerHTML = `
        <div class="video-player-wrapper">
            <div id="player" class="youtube-player-container"></div>
            <div class="video-details">
                <h2>${video.title}</h2>
                ${video.channelTitle ? `<p class="channel-name"><i class="fas fa-user-circle"></i> ${video.channelTitle}</p>` : ''}
                <div class="video-controls">
                    <p class="current-user"><i class="fas fa-user"></i> ${currentUser}</p>
                    <p class="playlist-info">Video ${currentVideoIndex + 1} dari ${selectedVideos.length}</p>
                </div>
                <div class="watch-time-info">
                    <p><i class="fas fa-clock"></i> Waktu menonton: <span id="watchTime">0:00</span> / ${settings.timeLimit}:00</p>
                    <div class="progress-bar">
                        <div id="progressBar" class="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize YouTube Player
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: video.id,
        playerVars: {
            'autoplay': 0,  // Disable autoplay - wait for user click
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'iv_load_policy': 3,
            'cc_load_policy': 0,
            'enablejsapi': 1,
            'origin': window.location.origin,
            'playsinline': 1,
            'widget_referrer': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Player ready event
function onPlayerReady(event) {
    console.log('onPlayerReady called');
    
    // Show big play button popup
    showBigPlayButtonPopup();
}

// Show big play button as popup
function showBigPlayButtonPopup() {
    // Remove any existing popup
    const existingPopup = document.getElementById('big-play-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'big-play-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(10px);
    `;
    
    // Create play button
    const playButton = document.createElement('div');
    playButton.className = 'big-play-button';
    playButton.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 120px; margin-bottom: 20px;">
                <i class="fas fa-play-circle"></i>
            </div>
            <div style="font-size: 32px; font-weight: bold; color: white; font-family: 'Comic Sans MS', cursive;">
                🎬 Klik untuk Mulai Menonton! 🎬
            </div>
        </div>
    `;
    playButton.style.cssText = `
        cursor: pointer;
        transition: transform 0.3s ease;
        color: #ff6b9d;
        text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    `;
    
    // Hover effect
    playButton.addEventListener('mouseenter', () => {
        playButton.style.transform = 'scale(1.1)';
    });
    playButton.addEventListener('mouseleave', () => {
        playButton.style.transform = 'scale(1)';
    });
    
    // Click handler
    playButton.addEventListener('click', () => {
        console.log('Big play button clicked!');
        
        // Remove popup
        popup.remove();
        
        // Request fullscreen
        requestFullscreen();
        
        // Play video
        if (player) {
            player.playVideo();
            startWatchTimer();
        }
        
        // Lock mouse after 3 seconds
        console.log('Mouse will be locked in 3 seconds...');
        showMouseLockCountdown(3);
        
        setTimeout(() => {
            console.log('Locking mouse now...');
            enableMouseLock();
        }, 3000);
        
        // Block YouTube links
        setTimeout(() => {
            blockYouTubeLinks();
        }, 1000);
    });
    
    popup.appendChild(playButton);
    document.body.appendChild(popup);
    
    console.log('Big play button popup shown');
}

// Block all YouTube links
function blockYouTubeLinks() {
    const iframe = document.querySelector('#player iframe');
    if (iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                const ytLinks = iframeDoc.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');
                ytLinks.forEach(link => {
                    link.style.pointerEvents = 'none';
                    link.style.display = 'none';
                });
            }
        } catch (e) {
            console.log('Cross-origin restriction');
        }
    }
}

// Player state change event
function onPlayerStateChange(event) {
    const customPlayBtn = document.getElementById('customPlayButton');
    
    if (event.data === YT.PlayerState.PLAYING) {
        if (!watchTimer) {
            startWatchTimer();
        }
        if (customPlayBtn) customPlayBtn.style.display = 'none';
        
        // Fallback mouse lock: Enable after 10 seconds of playing
        if (!mouseLocked) {
            console.log('Video is playing, will enable mouse lock in 10 seconds...');
            
            // Show countdown notification
            showMouseLockCountdown(10);
            
            setTimeout(() => {
                if (!mouseLocked) {
                    console.log('Fallback: Enabling mouse lock after 10 seconds of playback');
                    enableMouseLock();
                }
            }, 10000);
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        pauseWatchTimer();
        if (customPlayBtn) {
            customPlayBtn.style.display = 'flex';
            customPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        // Auto play next video in playlist
        if (currentVideoIndex < selectedVideos.length - 1) {
            loadVideo(currentVideoIndex + 1);
        } else {
            // All videos finished
            endWatchingSession('Semua video dalam playlist telah selesai diputar!');
        }
    }
}

// Start watch timer
function startWatchTimer() {
    if (watchTimer) return;
    
    watchTimer = setInterval(() => {
        watchedTime++;
        updateWatchTimeDisplay();
        
        const timeLimit = settings.timeLimit * 60;
        const warningTime = settings.warningTime * 60;
        
        // Check if time limit reached
        if (watchedTime >= timeLimit) {
            endWatchingSession('Waktu menonton telah habis!');
        } else if (watchedTime >= timeLimit - warningTime && !warningShown) {
            showTimeWarning();
        }
    }, 1000);
}

// Pause watch timer
function pauseWatchTimer() {
    if (watchTimer) {
        clearInterval(watchTimer);
        watchTimer = null;
    }
}

// Update watch time display
function updateWatchTimeDisplay() {
    const watchTimeSpan = document.getElementById('watchTime');
    if (watchTimeSpan) {
        const minutes = Math.floor(watchedTime / 60);
        const seconds = watchedTime % 60;
        watchTimeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const timeLimit = settings.timeLimit * 60;
        const percentage = (watchedTime / timeLimit) * 100;
        progressBar.style.width = `${percentage}%`;
        
        // Change color based on time
        if (percentage > 80) {
            progressBar.style.background = '#ff0000';
        } else if (percentage > 60) {
            progressBar.style.background = '#ff6600';
        } else {
            progressBar.style.background = '#00ff00';
        }
    }
}

// Show time warning
function showTimeWarning() {
    warningShown = true;
    const remainingMinutes = settings.warningTime;
    
    // Simple alert (you can customize this)
    if (confirm(`⏰ Perhatian!\n\nWaktu menonton tinggal \${remainingMinutes} menit lagi.\nSiapkan diri untuk selesai ya!`)) {
        // Continue watching
    }
}

// End watching session
function endWatchingSession(message) {
    // Stop timer
    pauseWatchTimer();
    
    // Stop player
    if (player) {
        player.stopVideo();
    }
    
    // Lock session
    sessionActive = false;
    document.body.classList.add('session-locked');
    
    // Show end modal
    document.getElementById('end-message').textContent = message;
    endSessionModal.classList.add('active');
    
    // Clear password input
    unlockPasswordInput.value = '';
    unlockError.textContent = '';
}

// Unlock session
function unlockSession() {
    const password = unlockPasswordInput.value;
    
    if (password === settings.password) {
        // Correct password - reset session
        endSessionModal.classList.remove('active');
        document.body.classList.remove('session-locked');
        
        // Reset data
        selectedVideos = [];
        currentUser = null;
        watchedTime = 0;
        warningShown = false;
        currentVideoIndex = 0;
        
        // Disable mouse lock untuk login popup
        disableMouseLock();
        
        // Show login popup again
        usernameInput.value = '';
        const allCards = document.querySelectorAll('.video-card-select');
        allCards.forEach(card => card.classList.remove('selected', 'disabled'));
        updateSelectedCount();
        
        showLoginPopup();
    } else {
        // Wrong password
        unlockError.textContent = '❌ Password salah! Coba lagi.';
        unlockPasswordInput.value = '';
        unlockPasswordInput.focus();
    }
}

// Mouse lock functions
function enableMouseLock() {
    mouseLocked = true;
    document.body.style.cursor = 'not-allowed';
    document.body.classList.add('mouse-locked');
    
    showLockIndicator();
    
    const overlay = document.createElement('div');
    overlay.id = 'mouse-lock-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 999999;
        cursor: not-allowed;
        pointer-events: all;
    `;
    
    overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
    
    overlay.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
    
    document.body.appendChild(overlay);
}

function disableMouseLock() {
    mouseLocked = false;
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-locked');
    
    const overlay = document.getElementById('mouse-lock-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    showUnlockNotification();
}

// Show mouse lock countdown
function showMouseLockCountdown(seconds) {
    const existingCountdown = document.getElementById('mouse-lock-countdown');
    if (existingCountdown) {
        existingCountdown.remove();
    }
    
    const countdown = document.createElement('div');
    countdown.id = 'mouse-lock-countdown';
    countdown.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 107, 157, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 20px;
        font-size: 24px;
        z-index: 999998;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        text-align: center;
        font-family: 'Comic Sans MS', cursive;
        border: 4px solid white;
    `;
    countdown.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
        <div>Mouse akan dikunci dalam</div>
        <div style="font-size: 64px; font-weight: bold; margin: 10px 0;" id="countdown-number">${seconds}</div>
        <div style="font-size: 18px;">detik...</div>
    `;
    
    document.body.appendChild(countdown);
    
    let remaining = seconds;
    const countdownInterval = setInterval(() => {
        remaining--;
        const numberEl = document.getElementById('countdown-number');
        if (numberEl) {
            numberEl.textContent = remaining;
        }
        
        if (remaining <= 0 || mouseLocked) {
            clearInterval(countdownInterval);
            countdown.remove();
        }
    }, 1000);
}

function showLockIndicator() {
    const existingIndicator = document.getElementById('lock-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'lock-indicator';
    indicator.innerHTML = '🔒';
    indicator.style.cssText = `
        position: fixed;
        top: 15px;
        right: 15px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 12px 15px;
        border-radius: 50%;
        font-size: 24px;
        z-index: 1000000;
        box-shadow: 0 3px 15px rgba(0,0,0,0.4);
        cursor: not-allowed;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        animation: blink 2s ease-in-out infinite;
    `;
    document.body.appendChild(indicator);
    
    if (!document.getElementById('blink-animation')) {
        const style = document.createElement('style');
        style.id = 'blink-animation';
        style.innerHTML = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showUnlockNotification() {
    const lockIndicator = document.getElementById('lock-indicator');
    if (lockIndicator) {
        lockIndicator.remove();
    }
}

function setupMouseUnlockListener() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'F2') {
            e.preventDefault();
            
            if (mouseLocked) {
                disableMouseLock();
            } else {
                enableMouseLock();
            }
        }
    });
}
