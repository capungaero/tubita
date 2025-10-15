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
    // Auto fullscreen on first load
    requestFullscreen();
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
    
    console.log('Auto-loading playlist from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to load playlist:', response.status);
            return;
        }

        const text = await response.text();
        const videos = await parsePlaylistText(text);
        
        if (videos.length > 0) {
            videoList = videos;
            localStorage.setItem('videoList', JSON.stringify(videoList));
            console.log(`Auto-loaded ${videos.length} videos from URL`);
        }
    } catch (error) {
        console.error('Error auto-loading playlist:', error);
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
    // DON'T enable mouse lock yet - only after video starts
    // Setup mouse unlock listener for Ctrl+F2
    setupMouseUnlockListener();
    
    // Setup event listeners
    setupLoginListeners();
    
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
            alert(`Maksimal hanya \${maxVideos} video yang bisa dipilih!`);
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
    
    // Save session data
    currentUser = username;
    sessionActive = true;
    currentVideoIndex = 0;
    watchedTime = 0;
    
    // Hide login popup
    loginPopup.classList.remove('active');
    
    // Start playing videos
    initializePlayer();
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
            <div id="player" class="youtube-player-container">
                <div id="customPlayButton" class="custom-play-button">
                    <i class="fas fa-play"></i>
                </div>
            </div>
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
            'autoplay': 1,
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
    
    // Setup custom play button overlay
    setTimeout(() => {
        const customBtn = document.getElementById('customPlayButton');
        if (customBtn) {
            customBtn.addEventListener('click', () => {
                if (player) {
                    player.playVideo();
                    customBtn.style.display = 'none';
                }
            });
        }
    }, 100);
}

// Player ready event
function onPlayerReady(event) {
    event.target.playVideo();
    startWatchTimer();
    
    // Enable mouse lock when video starts playing
    enableMouseLock();
    
    const customPlayBtn = document.getElementById('customPlayButton');
    if (customPlayBtn) {
        customPlayBtn.style.display = 'none';
    }
    
    setTimeout(() => {
        blockYouTubeLinks();
    }, 1000);
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
