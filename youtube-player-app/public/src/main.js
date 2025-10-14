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

// DOM Elements
const videoContainer = document.getElementById('video-container');
const warningModal = document.getElementById('warning-modal');
const passwordPrompt = document.getElementById('password-prompt');

// Initialize YouTube Player API
function onYouTubeIframeAPIReady() {
    initializePlayer();
}

// Make function globally available for YouTube API
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

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
            <div id="player"></div>
            <div class="video-details">
                <h2>${video.title}</h2>
                ${video.channelTitle ? `<p class="channel-name"><i class="fas fa-user-circle"></i> ${video.channelTitle}</p>` : ''}
                <div class="video-controls">
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
            'controls': 1,
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
}

// Player ready event
function onPlayerReady(event) {
    event.target.playVideo();
    startWatchTimer();
    
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
    if (event.data === YT.PlayerState.PLAYING) {
        if (!watchTimer) {
            startWatchTimer();
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        pauseWatchTimer();
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