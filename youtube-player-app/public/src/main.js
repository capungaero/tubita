// Import YouTube API utilities
import { getVideoDetails, extractVideoId } from './utils/youtubeApi.js';

// Load settings and video list from localStorage
let videoList = JSON.parse(localStorage.getItem('videoList')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    timeLimit: 30,
    password: 'admin123',
    warningTime: 5
};

let currentVideoIndex = 0;
let player = null;
let watchTimer = null;
let watchedTime = 0;
let warningShown = false;

// Mouse lock feature
let mouseLocked = true; // Default locked on page load
let mouseUnlockKey = 'F2'; // Ctrl+F2 to unlock

// DOM Elements
const videoContainer = document.getElementById('video-container');
const warningModal = document.getElementById('warning-modal');
const passwordPrompt = document.getElementById('password-prompt');

// Initialize mouse lock on page load
document.addEventListener('DOMContentLoaded', () => {
    enableMouseLock();
    setupMouseUnlockListener();
});

// Initialize YouTube Player API
function onYouTubeIframeAPIReady() {
    initializePlayer();
}

// Make function globally available for YouTube API
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Enable mouse lock - disable all clicks
function enableMouseLock() {
    mouseLocked = true;
    document.body.style.cursor = 'not-allowed';
    document.body.classList.add('mouse-locked');
    
    // Show lock indicator
    showLockIndicator();
    
    // Block all pointer events
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
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 60px;
        pointer-events: all;
    `;
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
            color: white;
            padding: 25px 45px;
            border-radius: 15px;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            text-align: center;
            border: 3px solid rgba(255,255,255,0.3);
            animation: pulse 2s infinite;
        ">
            <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
            <div style="margin-bottom: 5px;">MOUSE TERKUNCI</div>
            <div style="font-size: 14px; font-weight: normal; margin-top: 10px; opacity: 0.9;">
                🎬 Tonton video sampai selesai!<br>
                Video akan otomatis berjalan.
            </div>
            <div style="font-size: 12px; font-weight: normal; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); opacity: 0.8;">
                👨‍👩‍👧 Orang tua: Tekan <kbd style="background: white; color: red; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-family: monospace;">Ctrl + F2</kbd> untuk unlock
            </div>
        </div>
    `;
    
    // Prevent all clicks
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
    
    // Add pulse animation
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.innerHTML = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Disable mouse lock
function disableMouseLock() {
    mouseLocked = false;
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-locked');
    
    // Remove overlay
    const overlay = document.getElementById('mouse-lock-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Show unlock notification
    showUnlockNotification();
}

// Show lock indicator
function showLockIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'lock-indicator';
    indicator.innerHTML = '🔒 Mouse Locked';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(indicator);
}

// Show unlock notification
function showUnlockNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 10px;
        font-size: 24px;
        font-weight: bold;
        z-index: 1000001;
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        text-align: center;
    `;
    notification.innerHTML = '✅ MOUSE UNLOCKED!<br><span style="font-size: 16px;">Kontrol aktif</span>';
    document.body.appendChild(notification);
    
    // Remove lock indicator
    const lockIndicator = document.getElementById('lock-indicator');
    if (lockIndicator) {
        lockIndicator.remove();
    }
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Setup keyboard listener for Ctrl+F2
function setupMouseUnlockListener() {
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl+F2
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

// Initialize the player
async function initializePlayer() {
    if (videoList.length === 0) {
        showEmptyState();
        return;
    }
    
    // Get video ID from URL parameter or use first video
    const urlParams = new URLSearchParams(window.location.search);
    const videoIdParam = urlParams.get('v');
    
    if (videoIdParam) {
        const index = videoList.findIndex(v => v.id === videoIdParam);
        if (index !== -1) {
            currentVideoIndex = index;
        }
    }
    
    loadVideo(currentVideoIndex);
}

// Load and play video
function loadVideo(index) {
    if (index < 0 || index >= videoList.length) {
        showEmptyState();
        return;
    }
    
    currentVideoIndex = index;
    const video = videoList[currentVideoIndex];
    
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
                    <button id="playPauseBtn" class="control-btn">
                        <i class="fas fa-pause"></i> <span id="playPauseText">Pause</span>
                    </button>
                    <button id="prevBtn" class="control-btn" ${currentVideoIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-step-backward"></i> Previous
                    </button>
                    <button id="nextBtn" class="control-btn" ${currentVideoIndex === videoList.length - 1 ? 'disabled' : ''}>
                        Next <i class="fas fa-step-forward"></i>
                    </button>
                    <a href="admin.html" class="control-btn admin-btn">
                        <i class="fas fa-cog"></i> Admin
                    </a>
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
            'controls': 0,  // Disable ALL YouTube controls
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
    
    // Setup navigation buttons
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (currentVideoIndex > 0) {
            loadVideo(currentVideoIndex - 1);
            resetTimer();
        }
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (currentVideoIndex < videoList.length - 1) {
            loadVideo(currentVideoIndex + 1);
            resetTimer();
        }
    });
    
    // Setup custom play/pause button
    document.getElementById('playPauseBtn')?.addEventListener('click', () => {
        togglePlayPause();
    });
    
    // Setup custom play button overlay (for when video loads)
    document.getElementById('customPlayButton')?.addEventListener('click', () => {
        if (player) {
            player.playVideo();
            document.getElementById('customPlayButton').style.display = 'none';
        }
    });
    
    // Click on video to pause/play
    document.getElementById('player')?.addEventListener('click', (e) => {
        if (e.target.id === 'player' || e.target.tagName === 'IFRAME') {
            togglePlayPause();
        }
    });
}

// Toggle play/pause
function togglePlayPause() {
    if (!player) return;
    
    const state = player.getPlayerState();
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseText = document.getElementById('playPauseText');
    const customPlayBtn = document.getElementById('customPlayButton');
    
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i> <span id="playPauseText">Play</span>';
        }
        if (customPlayBtn) {
            customPlayBtn.style.display = 'flex';
            customPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    } else {
        player.playVideo();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> <span id="playPauseText">Pause</span>';
        }
        if (customPlayBtn) {
            customPlayBtn.style.display = 'none';
        }
    }
}

// Player ready event
function onPlayerReady(event) {
    event.target.playVideo();
    startWatchTimer();
    
    // Hide custom play button when video starts
    const customPlayBtn = document.getElementById('customPlayButton');
    if (customPlayBtn) {
        customPlayBtn.style.display = 'none';
    }
    
    // Block clicks on YouTube branding/links
    setTimeout(() => {
        blockYouTubeLinks();
    }, 1000);
}

// Block all YouTube links and branding clicks
function blockYouTubeLinks() {
    const iframe = document.querySelector('#player iframe');
    if (iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                // Block all clicks on YouTube links
                const ytLinks = iframeDoc.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"], .ytp-youtube-button, .ytp-watermark, .ytp-title-link');
                ytLinks.forEach(link => {
                    link.style.pointerEvents = 'none';
                    link.style.display = 'none';
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }, true);
                });
            }
        } catch (e) {
            // Cross-origin restriction, use CSS only
            console.log('Using CSS-only blocking due to cross-origin restrictions');
        }
    }
    
    // Add overlay to block clicks on top area
    const playerWrapper = document.querySelector('.video-player-wrapper');
    if (playerWrapper && !document.querySelector('.yt-click-blocker')) {
        const blocker = document.createElement('div');
        blocker.className = 'yt-click-blocker';
        blocker.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            z-index: 9999;
            pointer-events: auto;
        `;
        blocker.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, true);
        
        const playerDiv = document.getElementById('player');
        if (playerDiv) {
            playerDiv.style.position = 'relative';
            playerDiv.appendChild(blocker);
        }
    }
}

// Player state change event
function onPlayerStateChange(event) {
    const customPlayBtn = document.getElementById('customPlayButton');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (event.data === YT.PlayerState.PLAYING) {
        if (!watchTimer) {
            startWatchTimer();
        }
        // Hide play button, show pause
        if (customPlayBtn) customPlayBtn.style.display = 'none';
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> <span id="playPauseText">Pause</span>';
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        pauseWatchTimer();
        // Show play button
        if (customPlayBtn) {
            customPlayBtn.style.display = 'flex';
            customPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i> <span id="playPauseText">Play</span>';
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        // Auto play next video
        if (currentVideoIndex < videoList.length - 1) {
            loadVideo(currentVideoIndex + 1);
            resetTimer();
        }
    }
}

// Start watch timer
function startWatchTimer() {
    if (watchTimer) return;
    
    watchTimer = setInterval(() => {
        watchedTime++;
        updateWatchTimeDisplay();
        
        const timeLimit = settings.timeLimit * 60; // Convert to seconds
        const warningTime = settings.warningTime * 60;
        
        // Show warning before time limit
        if (!warningShown && watchedTime >= (timeLimit - warningTime)) {
            showWarning();
            warningShown = true;
        }
        
        // Time limit reached
        if (watchedTime >= timeLimit) {
            pauseVideo();
            showPasswordPrompt();
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

// Reset timer
function resetTimer() {
    pauseWatchTimer();
    watchedTime = 0;
    warningShown = false;
    updateWatchTimeDisplay();
}

// Update watch time display
function updateWatchTimeDisplay() {
    const timeElement = document.getElementById('watchTime');
    const progressBar = document.getElementById('progressBar');
    
    if (timeElement) {
        const minutes = Math.floor(watchedTime / 60);
        const seconds = watchedTime % 60;
        timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (progressBar) {
        const timeLimit = settings.timeLimit * 60;
        const percentage = Math.min((watchedTime / timeLimit) * 100, 100);
        progressBar.style.width = percentage + '%';
        
        // Change color when approaching limit
        if (percentage >= 80) {
            progressBar.style.background = '#ff3d00';
        } else if (percentage >= 60) {
            progressBar.style.background = '#ff9800';
        } else {
            progressBar.style.background = '#4caf50';
        }
    }
}

// Pause video
function pauseVideo() {
    if (player) {
        player.pauseVideo();
    }
    pauseWatchTimer();
}

// Resume video
function resumeVideo() {
    if (player) {
        player.playVideo();
    }
    startWatchTimer();
}

// Show warning modal
function showWarning() {
    warningModal.innerHTML = `
        <div class="modal-content">
            <div class="warning-icon">⚠️</div>
            <h2>Peringatan Waktu!</h2>
            <p>Waktu menonton akan segera habis dalam ${settings.warningTime} menit.</p>
            <button onclick="closeWarning()" class="btn-close-warning">OK, Mengerti</button>
        </div>
    `;
    warningModal.classList.add('active');
    warningModal.style.display = 'flex';
}

// Close warning
window.closeWarning = function() {
    warningModal.classList.remove('active');
    warningModal.style.display = 'none';
}

// Show password prompt
function showPasswordPrompt() {
    passwordPrompt.innerHTML = `
        <div class="modal-content">
            <div class="warning-icon">🔒</div>
            <h2>Waktu Habis!</h2>
            <p>Masukkan password untuk melanjutkan menonton</p>
            <input type="password" id="passwordInput" placeholder="Password Admin">
            <div class="password-actions">
                <button onclick="checkPassword()" class="btn-submit-password">Submit</button>
                <button onclick="closePasswordPrompt()" class="btn-cancel">Kembali ke Admin</button>
            </div>
        </div>
    `;
    passwordPrompt.classList.add('active');
    passwordPrompt.style.display = 'flex';
    
    // Focus on password input
    setTimeout(() => {
        document.getElementById('passwordInput')?.focus();
    }, 100);
    
    // Handle Enter key
    document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
}

// Check password
window.checkPassword = function() {
    const input = document.getElementById('passwordInput');
    const password = input?.value || '';
    
    if (password === settings.password) {
        // Reset timer and resume
        watchedTime = 0;
        warningShown = false;
        closePasswordPrompt();
        resumeVideo();
        updateWatchTimeDisplay();
    } else {
        alert('Password salah! Silakan coba lagi.');
        input.value = '';
        input.focus();
    }
}

// Close password prompt
window.closePasswordPrompt = function() {
    passwordPrompt.classList.remove('active');
    passwordPrompt.style.display = 'none';
    window.location.href = 'admin.html';
}

// Show empty state
function showEmptyState() {
    videoContainer.innerHTML = `
        <div class="empty-player-state">
            <i class="fas fa-video-slash"></i>
            <h2>Tidak Ada Video</h2>
            <p>Silakan tambahkan video dari halaman admin terlebih dahulu.</p>
            <a href="admin.html" class="btn-goto-admin">
                <i class="fas fa-cog"></i> Ke Halaman Admin
            </a>
        </div>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}