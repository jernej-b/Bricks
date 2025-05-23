// Sound effects
var sounds = {
    hit: new Audio('sounds/hit.mp3'),
    music: new Audio('sounds/music.mp3')
};

// Main game variables
var canvas, ctx;
var WIDTH = 600, HEIGHT = 400;
var animationId;
var timerInterval;

// Game objects
var ballImg = new Image();
ballImg.src = 'assets/ballGrey.png';
var x = 300, y = 200;
var dx = 3, dy = -3;
var r = 8;

// Paddle
var paddlex, paddleh = 12, paddlew = 80;
var paddleColor = '#666';

// Game state
var gameActive = false;
var seconds = 0; // Timer variable

// Timer functions
function updateTimer() {
    if (gameActive) {
        seconds++;
        displayTime();
    }
}

function displayTime() {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    const timeElement = document.getElementById('cas');
    if (timeElement) timeElement.textContent = `${mins}:${secs}`;
}

function resetTimer() {
    seconds = 0;
    displayTime();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Game initialization
function initSounds() {
    sounds.music.loop = true;
    sounds.music.volume = 0.3;
    sounds.hit.volume = 0.7;
}

function showStartScreen() {
    sounds.music.play();
    Swal.fire({
        title: 'COLOR BREAKOUT',
        html: '<p>Break all the colored bricks!</p><p>Use arrow keys to move</p>',
        confirmButtonText: 'START',
        background: '#333',
        allowOutsideClick: false
    }).then(() => {
        resetGame();
    });
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    initSounds();
    initInput();
    initPaddle();
    initBricks();
    initScore();
    resetTimer();
    
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('scoreboardBtn').addEventListener('click', showScoreboard);
    
    showStartScreen();
}

// Game drawing functions
function draw() {
    if (!gameActive) return;
    
    updatePaddlePosition();
    clear();
    drawBall();
    drawPaddle();
    drawBricks();
    
    handleWallCollisions();
    handlePaddleCollision();
    handleBrickCollisions();
    
    x += dx;
    y += dy;
    
    animationId = requestAnimationFrame(draw);
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function drawBall() {
    ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
}

function initPaddle() {
    paddlex = WIDTH / 2 - paddlew / 2;
}

function drawPaddle() {
    ctx.fillStyle = paddleColor;
    ctx.beginPath();
    ctx.roundRect(paddlex, HEIGHT-paddleh, paddlew, paddleh, 5);
    ctx.fill();
}

// Collision handling
function handleWallCollisions() {
    if (x + dx > WIDTH - r || x + dx < r) {
        dx = -dx;
    }
    if (y + dy < r) {
        dy = -dy;
    }
}

function handlePaddleCollision() {
    if (y + dy > HEIGHT - r - paddleh) {
        if (x > paddlex && x < paddlex + paddlew) {
            dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);
            dy = -dy;
        } else if (y + dy > HEIGHT - r) {
            gameOver();
        }
    }
}

// Game state management
function gameOver() {
    gameActive = false;
    stopTimer();
    cancelAnimationFrame(animationId);
    sounds.music.pause();
    
    Swal.fire({
        title: 'GAME OVER',
        html: `<p>Score: ${score}</p><p>Level: ${level}</p><p>Time: ${getFormattedTime()}</p>`,
        confirmButtonText: 'CLOSE',
        showCancelButton: true,
        cancelButtonText: 'NEW GAME',
        background: '#333'
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            resetGame();
        } else {
            addToScoreboard();
        }
    });
}

function getFormattedTime() {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function resetGame() {
    sounds.music.currentTime = 0;
    sounds.music.play();
    x = WIDTH / 2;
    y = HEIGHT / 2;
    dx = 3;
    dy = -3;
    paddlex = WIDTH / 2 - paddlew / 2;
    level = 1;
    document.getElementById('level').textContent = level;
    initBricks();
    resetScore();
    resetTimer();
    gameActive = true;
    startTimer();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(draw);
}

window.addEventListener('load', init);
