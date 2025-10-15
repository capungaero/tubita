// YouTube Data API v3 Configuration
const YOUTUBE_API_KEY = 'AIzaSyC7Ou0iVZZyf3hu1UmQYBdOwqCjVPbl4n8';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch video details from YouTube Data API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
export async function getVideoDetails(videoId) {
    try {
        const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            throw new Error('Video tidak ditemukan');
        }
        
        const video = data.items[0];
        const snippet = video.snippet;
        const statistics = video.statistics;
        const contentDetails = video.contentDetails;
        
        return {
            id: videoId,
            title: snippet.title,
            description: snippet.description,
            thumbnail: snippet.thumbnails.maxres?.url || 
                       snippet.thumbnails.high?.url || 
                       snippet.thumbnails.medium?.url,
            channelTitle: snippet.channelTitle,
            publishedAt: snippet.publishedAt,
            duration: contentDetails.duration,
            viewCount: statistics.viewCount,
            likeCount: statistics.likeCount,
            url: `https://www.youtube.com/watch?v=${videoId}`
        };
    } catch (error) {
        console.error('Error fetching video details:', error);
        throw error;
    }
}

/**
 * Search videos from YouTube Data API
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of video results
 */
export async function searchVideos(query, maxResults = 10) {
    try {
        const url = `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}&safeSearch=strict`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || 
                       item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
    } catch (error) {
        console.error('Error searching videos:', error);
        throw error;
    }
}

/**
 * Get videos by channel ID
 * @param {string} channelId - YouTube channel ID
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of video results
 */
export async function getChannelVideos(channelId, maxResults = 10) {
    try {
        const url = `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || 
                       item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
    } catch (error) {
        console.error('Error fetching channel videos:', error);
        throw error;
    }
}

/**
 * Format ISO 8601 duration to readable format
 * @param {string} duration - ISO 8601 duration (e.g., PT1H2M10S)
 * @returns {string} Formatted duration (e.g., 1:02:10)
 */
export function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    const parts = [];
    if (hours) parts.push(hours);
    parts.push(minutes.padStart(2, '0') || '00');
    parts.push(seconds.padStart(2, '0') || '00');
    
    return parts.join(':');
}

/**
 * Format view count to readable format
 * @param {string|number} count - View count
 * @returns {string} Formatted count (e.g., 1.2M, 5.3K)
 */
export function formatViewCount(count) {
    const num = parseInt(count);
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
}

/**
 * Extract video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * Validate YouTube API Key
 * @returns {Promise<boolean>} True if API key is valid
 */
export async function validateApiKey() {
    try {
        const url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        return response.ok;
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
}
