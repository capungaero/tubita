export function startTimer(duration, onTimeUp) {
    let timer = duration, minutes, seconds;
    const interval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        // Display the time left (optional)
        console.log(`Time left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);

        if (--timer < 0) {
            clearInterval(interval);
            onTimeUp();
        }
    }, 1000);
}

export function checkTimeLimit(elapsedTime, timeLimit) {
    return elapsedTime >= timeLimit;
}