class VideoPlayer {
    constructor(videoId, timeLimit) {
        this.videoId = videoId;
        this.timeLimit = timeLimit;
        this.elapsedTime = 0;
        this.player = null;
        this.interval = null;
    }

    initPlayer() {
        this.player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: this.videoId,
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this)
            }
        });
    }

    onPlayerReady(event) {
        this.startTimer();
    }

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.startTimer();
        } else {
            this.stopTimer();
        }
    }

    startTimer() {
        this.interval = setInterval(() => {
            this.elapsedTime += 1;
            if (this.elapsedTime >= this.timeLimit) {
                this.stopTimer();
                this.showWarning();
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.interval);
    }

    showWarning() {
        // Logic to display the warning modal
        const warningModal = new WarningModal();
        warningModal.show();
    }
}

export default VideoPlayer;