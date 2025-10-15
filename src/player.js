const videoList = []; // Array to hold the list of videos
let currentVideoIndex = 0; // Index of the currently playing video
let timeLimit = 0; // Time limit in minutes
let elapsedTime = 0; // Elapsed time in seconds
let timer; // Timer reference

// Function to load the video from the list
function loadVideo() {
    if (videoList.length > 0) {
        const videoId = videoList[currentVideoIndex];
        const player = document.getElementById('youtube-player');
        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        startTimer();
    }
}

// Function to start the timer
function startTimer() {
    elapsedTime = 0;
    clearInterval(timer);
    timer = setInterval(() => {
        elapsedTime++;
        if (elapsedTime >= timeLimit * 60) {
            clearInterval(timer);
            showWarning();
        }
    }, 1000);
}

// Function to show the warning modal
function showWarning() {
    const warningModal = new WarningModal();
    warningModal.show();
}

// Function to set the video list and time limit
function setVideoListAndTime(videos, limit) {
    videoList.push(...videos);
    timeLimit = limit;
    loadVideo();
}

// Function to handle password submission
function handlePasswordSubmission(password) {
    const correctPassword = "your_password"; // Set your password here
    if (password === correctPassword) {
        startTimer(); // Restart the timer
        loadVideo(); // Load the current video again
    } else {
        alert("Incorrect password. You cannot continue watching.");
    }
}

// Event listener for password submission
document.getElementById('password-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const password = event.target.elements.password.value;
    handlePasswordSubmission(password);
});

// Export functions for use in other modules
export { setVideoListAndTime };