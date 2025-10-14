// Application State
let player;
let currentVideoIndex = 0;
let videoList = [];
let timeLimit = 30; // minutes
let startTime = null;
let timerInterval = null;
let adminPassword = 'admin123'; // default password

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateUI();
    setupEventListeners();
});

// YouTube API ready callback
function onYouTubeIframeAPIReady() {
    if (videoList.length > 0) {
        initPlayer();
    }
}

// Initialize YouTube Player
function initPlayer() {
    if (videoList.length === 0) return;

    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoList[currentVideoIndex].id,
        playerVars: {
            'controls': 0,  // Hide controls
            'disablekb': 1, // Disable keyboard controls
            'fs': 0,        // Hide fullscreen button
            'modestbranding': 1, // Hide YouTube logo
            'rel': 0,       // Don't show related videos
            'showinfo': 0,  // Hide video info
            'iv_load_policy': 3 // Hide annotations
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Player ready callback
function onPlayerReady(event) {
    startTimer();
    updatePlaylist();
}

// Player state change callback
function onPlayerStateChange(event) {
    // Update play/pause button
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (event.data === YT.PlayerState.PLAYING) {
        playPauseBtn.textContent = '⏸️ Pause';
    } else if (event.data === YT.PlayerState.PAUSED) {
        playPauseBtn.textContent = '▶️ Play';
    } else if (event.data === YT.PlayerState.ENDED) {
        // Auto play next video
        nextVideo();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Player controls
    document.getElementById('prevBtn').addEventListener('click', prevVideo);
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('nextBtn').addEventListener('click', nextVideo);

    // Admin button
    document.getElementById('adminBtn').addEventListener('click', showAdminLogin);

    // Admin panel actions
    document.getElementById('saveTimeLimit').addEventListener('click', saveTimeLimit);
    document.getElementById('changePassword').addEventListener('click', changePassword);
    document.getElementById('addVideo').addEventListener('click', addVideo);
    document.getElementById('closeAdmin').addEventListener('click', closeAdminPanel);

    // Time warning modal
    document.getElementById('continueWatching').addEventListener('click', handleContinueWatching);
    document.getElementById('stopWatching').addEventListener('click', handleStopWatching);

    // Admin login modal
    document.getElementById('adminLogin').addEventListener('click', handleAdminLogin);
    document.getElementById('cancelAdminLogin').addEventListener('click', closeAdminLoginModal);

    // Allow Enter key for password inputs
    document.getElementById('continuePassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleContinueWatching();
    });
    document.getElementById('adminLoginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });
}

// Video Controls
function prevVideo() {
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        loadVideo();
    }
}

function nextVideo() {
    if (currentVideoIndex < videoList.length - 1) {
        currentVideoIndex++;
        loadVideo();
    }
}

function togglePlayPause() {
    if (!player) return;
    
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function loadVideo() {
    if (!player || videoList.length === 0) return;
    
    player.loadVideoById(videoList[currentVideoIndex].id);
    updatePlaylist();
    updateControlButtons();
}

function updateControlButtons() {
    document.getElementById('prevBtn').disabled = currentVideoIndex === 0;
    document.getElementById('nextBtn').disabled = currentVideoIndex === videoList.length - 1;
}

// Playlist Management
function updatePlaylist() {
    const playlistItems = document.getElementById('playlistItems');
    playlistItems.innerHTML = '';

    videoList.forEach((video, index) => {
        const li = document.createElement('li');
        li.textContent = video.title;
        li.className = index === currentVideoIndex ? 'active' : '';
        li.addEventListener('click', () => {
            currentVideoIndex = index;
            loadVideo();
        });
        playlistItems.appendChild(li);
    });

    updateControlButtons();
}

// Timer Management
function startTimer() {
    if (startTime === null) {
        startTime = Date.now();
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!startTime) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
    const remaining = timeLimit - elapsed;

    if (remaining <= 0) {
        showTimeWarning();
        return;
    }

    const minutes = Math.floor(remaining);
    const seconds = Math.floor((remaining - minutes) * 60);
    
    document.getElementById('timeDisplay').textContent = 
        `Waktu tersisa: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showTimeWarning() {
    if (player) {
        player.pauseVideo();
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    document.getElementById('timeWarningModal').style.display = 'flex';
}

function handleContinueWatching() {
    const password = document.getElementById('continuePassword').value;
    const errorMsg = document.getElementById('passwordError');

    if (password === adminPassword) {
        // Reset timer
        startTime = Date.now();
        startTimer();
        
        // Close modal
        document.getElementById('timeWarningModal').style.display = 'none';
        document.getElementById('continuePassword').value = '';
        errorMsg.style.display = 'none';

        // Resume playing
        if (player) {
            player.playVideo();
        }
    } else {
        errorMsg.style.display = 'block';
    }
}

function handleStopWatching() {
    if (player) {
        player.pauseVideo();
    }
    
    document.getElementById('timeWarningModal').style.display = 'none';
    document.getElementById('continuePassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
}

// Admin Panel Management
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
}

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminLoginPassword').value = '';
    document.getElementById('adminLoginError').style.display = 'none';
}

function handleAdminLogin() {
    const password = document.getElementById('adminLoginPassword').value;
    const errorMsg = document.getElementById('adminLoginError');

    if (password === adminPassword) {
        closeAdminLoginModal();
        showAdminPanel();
    } else {
        errorMsg.style.display = 'block';
    }
}

function showAdminPanel() {
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('playerSection').style.display = 'none';
    
    // Update admin panel values
    document.getElementById('timeLimitInput').value = timeLimit;
    updateAdminVideoList();
}

function closeAdminPanel() {
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('playerSection').style.display = 'block';
}

function saveTimeLimit() {
    const newLimit = parseInt(document.getElementById('timeLimitInput').value);
    if (newLimit > 0) {
        timeLimit = newLimit;
        saveSettings();
        alert('Batas waktu berhasil disimpan!');
    } else {
        alert('Masukkan nilai yang valid!');
    }
}

function changePassword() {
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;

    if (currentPwd === adminPassword) {
        if (newPwd.length >= 4) {
            adminPassword = newPwd;
            saveSettings();
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            alert('Password berhasil diubah!');
        } else {
            alert('Password baru minimal 4 karakter!');
        }
    } else {
        alert('Password saat ini salah!');
    }
}

function addVideo() {
    const videoId = document.getElementById('videoIdInput').value.trim();
    const videoTitle = document.getElementById('videoTitleInput').value.trim();

    if (!videoId || !videoTitle) {
        alert('Mohon lengkapi ID dan judul video!');
        return;
    }

    // Check if video already exists
    if (videoList.some(v => v.id === videoId)) {
        alert('Video sudah ada dalam daftar!');
        return;
    }

    videoList.push({ id: videoId, title: videoTitle });
    saveSettings();
    
    document.getElementById('videoIdInput').value = '';
    document.getElementById('videoTitleInput').value = '';
    
    updateAdminVideoList();
    updateUI();
    
    alert('Video berhasil ditambahkan!');
}

function deleteVideo(index) {
    if (confirm('Yakin ingin menghapus video ini?')) {
        videoList.splice(index, 1);
        
        // Adjust current index if needed
        if (currentVideoIndex >= videoList.length) {
            currentVideoIndex = Math.max(0, videoList.length - 1);
        }
        
        saveSettings();
        updateAdminVideoList();
        updateUI();
        
        alert('Video berhasil dihapus!');
    }
}

function updateAdminVideoList() {
    const adminVideoList = document.getElementById('adminVideoList');
    adminVideoList.innerHTML = '';

    if (videoList.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Belum ada video';
        li.style.justifyContent = 'center';
        adminVideoList.appendChild(li);
        return;
    }

    videoList.forEach((video, index) => {
        const li = document.createElement('li');
        
        const span = document.createElement('span');
        span.textContent = `${index + 1}. ${video.title} (ID: ${video.id})`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Hapus';
        deleteBtn.addEventListener('click', () => deleteVideo(index));
        
        li.appendChild(span);
        li.appendChild(deleteBtn);
        adminVideoList.appendChild(li);
    });
}

// UI Update
function updateUI() {
    const noVideos = document.getElementById('noVideos');
    const videoContainer = document.getElementById('videoContainer');
    const controls = document.querySelector('.controls');
    const playlist = document.getElementById('playlist');

    if (videoList.length === 0) {
        noVideos.style.display = 'block';
        videoContainer.style.display = 'none';
        controls.style.display = 'none';
        playlist.style.display = 'none';
    } else {
        noVideos.style.display = 'none';
        videoContainer.style.display = 'block';
        controls.style.display = 'flex';
        playlist.style.display = 'block';
        
        // Reinitialize player if needed
        if (!player && typeof YT !== 'undefined' && YT.Player) {
            initPlayer();
        } else if (player) {
            updatePlaylist();
        }
    }
}

// Local Storage Management
// WARNING: This is a simple client-side implementation for home use with young children.
// Passwords are stored in plain text in localStorage, which is not secure for sensitive data.
// This is acceptable for parental controls with young children who don't know about browser dev tools.
// For production use with sensitive data, implement proper server-side authentication.
function saveSettings() {
    const settings = {
        videoList: videoList,
        timeLimit: timeLimit,
        adminPassword: adminPassword
    };
    localStorage.setItem('tubita-settings', JSON.stringify(settings));
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('tubita-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            videoList = settings.videoList || [];
            timeLimit = settings.timeLimit || 30;
            adminPassword = settings.adminPassword || 'admin123';
        }
    } catch (error) {
        console.error('Error loading settings from localStorage:', error);
        // Reset to defaults if corrupted
        videoList = [];
        timeLimit = 30;
        adminPassword = 'admin123';
    }
}
