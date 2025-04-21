var seconds = 0;

function initTimer() {
    resetTimer();
}

function updateTimer() {
    if (gameActive) {
        seconds++;
        displayTime();
    }
}

function displayTime() {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('cas').textContent = `${mins}:${secs}`;
}

function resetTimer() {
    seconds = 0;
    displayTime();
}

function getFormattedTime() {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}