// Import YouTube API utilities
import { 
    getVideoDetails, 
    searchVideos, 
    extractVideoId, 
    formatDuration, 
    formatViewCount 
} from './utils/youtubeApi.js';

// Data dummy video YouTube untuk anak-anak (fallback)
const dummyVideos = [
    {
        id: 'XqZsoesa55w',
        title: 'Baby Shark Dance | Sing and Dance! | Animal Songs | PINKFONG Songs',
        thumbnail: 'https://img.youtube.com/vi/XqZsoesa55w/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=XqZsoesa55w',
        channelTitle: 'Pinkfong! Kids\' Songs & Stories',
        duration: 'PT2M17S'
    },
    {
        id: 'kUj5JNJCpDs',
        title: 'Peppa Pig Official Channel | Peppa Pig Full Episodes',
        thumbnail: 'https://img.youtube.com/vi/kUj5JNJCpDs/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=kUj5JNJCpDs',
        channelTitle: 'Peppa Pig Official Channel',
        duration: 'PT47M32S'
    },
    {
        id: '_UR-l3QI2nE',
        title: 'CoComelon Nursery Rhymes & Kids Songs | Educational Videos for Toddlers',
        thumbnail: 'https://img.youtube.com/vi/_UR-l3QI2nE/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=_UR-l3QI2nE',
        channelTitle: 'Cocomelon - Nursery Rhymes',
        duration: 'PT3M2S'
    },
    {
        id: 'gIOyB9ZXn8s',
        title: 'Disney\'s Frozen - Let It Go',
        thumbnail: 'https://img.youtube.com/vi/gIOyB9ZXn8s/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=gIOyB9ZXn8s',
        channelTitle: 'Disney UK',
        duration: 'PT3M44S'
    },
    {
        id: 'a3pP0XAiVfs',
        title: 'PAW Patrol Full Episodes! Ultimate Rescues',
        thumbnail: 'https://img.youtube.com/vi/a3pP0XAiVfs/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=a3pP0XAiVfs',
        channelTitle: 'PAW Patrol Official & Friends',
        duration: 'PT22M23S'
    },
    {
        id: 'YbgnlkJPga4',
        title: 'Wheels on the Bus | CoComelon Nursery Rhymes & Kids Songs',
        thumbnail: 'https://img.youtube.com/vi/YbgnlkJPga4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=YbgnlkJPga4',
        channelTitle: 'Cocomelon - Nursery Rhymes',
        duration: 'PT2M43S'
    },
    {
        id: 'KYniUCGPGLs',
        title: 'Masha and the Bear 2024 🎬 Best episodes cartoon collection 🎥',
        thumbnail: 'https://img.youtube.com/vi/KYniUCGPGLs/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=KYniUCGPGLs',
        channelTitle: 'Masha and The Bear',
        duration: 'PT1H2M15S'
    },
    {
        id: 'D0CWIRrAKzE',
        title: 'Thomas & Friends™ | Best of Thomas | Kids Cartoon',
        thumbnail: 'https://img.youtube.com/vi/D0CWIRrAKzE/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=D0CWIRrAKzE',
        channelTitle: 'Thomas & Friends',
        duration: 'PT44M12S'
    }
];

// Initialize video list from localStorage or use dummy data
let videoList = JSON.parse(localStorage.getItem('videoList')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    timeLimit: 30,
    password: 'admin123',
    warningTime: 5,
    maxVideosPerSession: 3
};

// Load dummy videos with API data on first run
async function initializeDummyVideos() {
    if (videoList.length === 0) {
        console.log('Loading dummy videos...');
        const loadedVideos = [];
        
        for (const video of dummyVideos) {
            try {
                const details = await getVideoDetails(video.id);
                loadedVideos.push({
                    id: details.id,
                    title: details.title,
                    thumbnail: details.thumbnail,
                    url: details.url,
                    channelTitle: details.channelTitle,
                    duration: details.duration,
                    viewCount: details.viewCount
                });
            } catch (error) {
                console.error(`Error loading video ${video.id}:`, error);
                // Use fallback data if API fails
                loadedVideos.push(video);
            }
        }
        
        videoList = loadedVideos;
        saveToLocalStorage();
    }
}

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const videoCount = document.getElementById('videoCount');
const addVideoForm = document.getElementById('addVideoForm');
const videoUrlInput = document.getElementById('videoUrl');
const videoTitleInput = document.getElementById('videoTitle');
const statusMessage = document.getElementById('statusMessage');
const timeLimitInput = document.getElementById('timeLimitMinutes');
const adminPasswordInput = document.getElementById('adminPassword');
const warningTimeInput = document.getElementById('warningTime');
const maxVideosInput = document.getElementById('maxVideosPerSession');

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected section
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
    });
});

// Show status message
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} active`;
    
    setTimeout(() => {
        statusMessage.classList.remove('active');
    }, 3000);
}

// Render video grid
function renderVideoGrid() {
    videoGrid.innerHTML = '';
    
    if (videoList.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video-slash"></i>
                <h3>Belum ada video</h3>
                <p>Tambahkan video YouTube untuk memulai playlist</p>
            </div>
        `;
        videoCount.textContent = '0';
        return;
    }
    
    videoList.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        // Format duration if available
        const durationText = video.duration ? formatDuration(video.duration) : '';
        const viewCountText = video.viewCount ? formatViewCount(video.viewCount) + ' views' : '';
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumbnail'">
                <div class="video-duration">
                    ${durationText ? `<i class="far fa-clock"></i> ${durationText}` : '<i class="fab fa-youtube"></i>'}
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                ${video.channelTitle ? `<p class="video-channel"><i class="fas fa-user-circle"></i> ${video.channelTitle}</p>` : ''}
                ${viewCountText ? `<p class="video-stats"><i class="fas fa-eye"></i> ${viewCountText}</p>` : ''}
                <p class="video-id">ID: ${video.id}</p>
                <div class="video-actions">
                    <button class="btn-action btn-play" onclick="playVideo('${video.id}')" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteVideo(${index})" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-action btn-move-up" onclick="moveVideo(${index}, 'up')" title="Pindah ke atas" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-action btn-move-down" onclick="moveVideo(${index}, 'down')" title="Pindah ke bawah" ${index === videoList.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
        `;
        videoGrid.appendChild(card);
    });
    
    videoCount.textContent = videoList.length;
}

// Add video to playlist
addVideoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = videoUrlInput.value.trim();
    const customTitle = videoTitleInput.value.trim();
    
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        showStatus('URL YouTube tidak valid!', 'error');
        return;
    }
    
    // Check if video already exists
    if (videoList.some(v => v.id === videoId)) {
        showStatus('Video sudah ada di playlist!', 'error');
        return;
    }
    
    // Show loading status
    showStatus('Mengambil informasi video dari YouTube...', 'info');
    
    try {
        // Fetch video details from YouTube API
        const details = await getVideoDetails(videoId);
        
        const newVideo = {
            id: details.id,
            title: customTitle || details.title,
            thumbnail: details.thumbnail,
            url: details.url,
            channelTitle: details.channelTitle,
            duration: details.duration,
            viewCount: details.viewCount,
            description: details.description
        };
        
        videoList.push(newVideo);
        saveToLocalStorage();
        renderVideoGrid();
        
        // Reset form
        addVideoForm.reset();
        
        showStatus('Video berhasil ditambahkan ke playlist!', 'success');
    } catch (error) {
        console.error('Error adding video:', error);
        showStatus('Gagal mengambil informasi video. Pastikan URL valid dan API key aktif.', 'error');
    }
});

// Delete video
window.deleteVideo = function(index) {
    if (confirm('Apakah Anda yakin ingin menghapus video ini?')) {
        const deletedVideo = videoList.splice(index, 1)[0];
        saveToLocalStorage();
        renderVideoGrid();
        showStatus(`"${deletedVideo.title}" berhasil dihapus`, 'success');
    }
};

// Move video position
window.moveVideo = function(index, direction) {
    if (direction === 'up' && index > 0) {
        [videoList[index], videoList[index - 1]] = [videoList[index - 1], videoList[index]];
    } else if (direction === 'down' && index < videoList.length - 1) {
        [videoList[index], videoList[index + 1]] = [videoList[index + 1], videoList[index]];
    }
    saveToLocalStorage();
    renderVideoGrid();
};

// Play video (redirect to player)
window.playVideo = function(videoId) {
    window.location.href = `index.html?v=${videoId}`;
};

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
    settings.timeLimit = parseInt(timeLimitInput.value) || 30;
    settings.warningTime = parseInt(warningTimeInput.value) || 5;
    settings.maxVideosPerSession = parseInt(maxVideosInput.value) || 3;
    
    const newPassword = adminPasswordInput.value.trim();
    if (newPassword) {
        settings.password = newPassword;
    }
    
    localStorage.setItem('settings', JSON.stringify(settings));
    showStatus('Pengaturan berhasil disimpan!', 'success');
    
    // Clear password input
    adminPasswordInput.value = '';
});

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = adminPasswordInput;
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// Reset form
document.getElementById('resetForm').addEventListener('click', () => {
    addVideoForm.reset();
});

// Load settings to form
function loadSettings() {
    timeLimitInput.value = settings.timeLimit;
    warningTimeInput.value = settings.warningTime;
    maxVideosInput.value = settings.maxVideosPerSession || 3;
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('videoList', JSON.stringify(videoList));
}

// Initialize app
async function initialize() {
    loadSettings();
    await initializeDummyVideos();
    renderVideoGrid();
    setupImportPlaylistHandlers();
    loadAutoLoadSettings();
}

// ==================== IMPORT PLAYLIST FUNCTIONS ====================

// Setup import playlist event handlers
function setupImportPlaylistHandlers() {
    const loadFromUrlBtn = document.getElementById('loadFromUrl');
    const loadFromFileBtn = document.getElementById('loadFromFile');
    const playlistFileInput = document.getElementById('playlistFile');
    const saveAutoLoadBtn = document.getElementById('saveAutoLoadSettings');

    if (loadFromUrlBtn) {
        loadFromUrlBtn.addEventListener('click', loadPlaylistFromUrl);
    }

    if (loadFromFileBtn && playlistFileInput) {
        loadFromFileBtn.addEventListener('click', () => {
            if (playlistFileInput.files.length > 0) {
                loadPlaylistFromFile(playlistFileInput.files[0]);
            } else {
                showImportStatus('Pilih file terlebih dahulu', 'error');
            }
        });
    }

    if (saveAutoLoadBtn) {
        saveAutoLoadBtn.addEventListener('click', saveAutoLoadSettings);
    }
}

// Load playlist from URL
async function loadPlaylistFromUrl() {
    const urlInput = document.getElementById('playlistUrl');
    let url = urlInput.value.trim();

    if (!url) {
        showImportStatus('Masukkan URL terlebih dahulu', 'error');
        return;
    }

    // Add https:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Use AllOrigins CORS proxy
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const proxiedUrl = corsProxy + encodeURIComponent(url);

    showImportStatus('Loading playlist dari URL...', 'loading');

    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        await processPlaylistText(text);
    } catch (error) {
        showImportStatus(`Error loading dari URL: ${error.message}`, 'error');
    }
}

// Load playlist from local file
function loadPlaylistFromFile(file) {
    showImportStatus('Reading file...', 'loading');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        await processPlaylistText(text);
    };
    reader.onerror = () => {
        showImportStatus('Error reading file', 'error');
    };
    reader.readAsText(file);
}

// Process playlist text content
async function processPlaylistText(text) {
    const lines = text.split('\n');
    const videos = [];
    let processed = 0;
    let errors = 0;

    showImportStatus(`Processing ${lines.length} lines...`, 'loading');

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
            try {
                const details = await getVideoDetails(videoId);
                videos.push({
                    id: details.id,
                    title: customTitle || details.title,
                    thumbnail: details.thumbnail,
                    url: details.url,
                    channelTitle: details.channelTitle
                });
                processed++;
                showImportStatus(`Processed ${processed} videos...`, 'loading');
            } catch (error) {
                errors++;
                console.error(`Error processing video ${videoId}:`, error);
            }
        }
    }

    if (videos.length > 0) {
        videoList = videos;
        saveToLocalStorage();
        renderVideoGrid();
        showImportStatus(
            `✅ Successfully imported ${processed} videos!\n` +
            (errors > 0 ? `⚠️ ${errors} videos failed to load` : ''),
            'success'
        );
    } else {
        showImportStatus('No valid videos found in file', 'error');
    }
}

// Show import status message
function showImportStatus(message, type = 'info') {
    const statusDiv = document.getElementById('importStatus');
    const contentDiv = document.getElementById('importStatusContent');
    
    if (statusDiv && contentDiv) {
        statusDiv.style.display = 'block';
        contentDiv.className = `status-${type}`;
        contentDiv.textContent = message;
    }
}

// Save auto-load settings
function saveAutoLoadSettings() {
    const enableAutoLoad = document.getElementById('enableAutoLoad').checked;
    const autoLoadUrl = document.getElementById('autoLoadUrl').value.trim();

    const autoLoadSettings = {
        enabled: enableAutoLoad,
        url: autoLoadUrl
    };

    localStorage.setItem('autoLoadSettings', JSON.stringify(autoLoadSettings));
    showStatusMessage('Auto-load settings saved!', 'success');
}

// Load auto-load settings
function loadAutoLoadSettings() {
    const autoLoadSettings = JSON.parse(localStorage.getItem('autoLoadSettings') || '{}');
    
    const enableCheckbox = document.getElementById('enableAutoLoad');
    const urlInput = document.getElementById('autoLoadUrl');

    if (enableCheckbox && autoLoadSettings.enabled !== undefined) {
        enableCheckbox.checked = autoLoadSettings.enabled;
    }

    if (urlInput && autoLoadSettings.url) {
        urlInput.value = autoLoadSettings.url;
    }
}

// Start the app
initialize();