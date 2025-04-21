var score = 0;
var scoreboard = JSON.parse(localStorage.getItem('breakoutScoreboard')) || [];

function initScore() {
    updateScoreDisplay();
}

function updateScore(points) {
    score += points;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('tocke').textContent = score;
}

function resetScore() {
    score = 0;
    updateScoreDisplay();
}

function addToScoreboard() {
    scoreboard.push({
        score: score,
        level: level,
        time: getFormattedTime(),
        date: new Date().toLocaleDateString()
    });
    scoreboard.sort((a, b) => b.score - a.score);
    scoreboard = scoreboard.slice(0, 10);
    localStorage.setItem('breakoutScoreboard', JSON.stringify(scoreboard));
}

function showScoreboard() {
    let html = '<div class="scoreboard"><h2>TOP SCORES</h2><ol>';
    if (scoreboard.length === 0) {
        html += '<li>No scores yet!</li>';
    } else {
        scoreboard.forEach((entry, index) => {
            html += `<li>${index + 1}. ${entry.score} pts (Level ${entry.level})</li>`;
        });
    }
    html += '</ol></div>';
    
    Swal.fire({
        title: 'SCOREBOARD',
        html: html,
        confirmButtonText: 'CLOSE',
        background: '#333'
    });
}