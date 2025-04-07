// Game variables
var x = 250;
var y = 350;
var dx = 0;
var dy = 0;
var WIDTH = 500;
var HEIGHT = 700;
var r = 15;
var ctx;
var paddlex;
var paddleh = 24;
var paddlew = 90;
var rightDown = false;
var leftDown = false;
var canvasMinX;
var canvasMaxX;
var bricks;
var NROWS;
var NCOLS;
var BRICKWIDTH;
var BRICKHEIGHT;
var PADDING;
var score = 0;
var seconds = 0;
var minutes = 0;
var timerInterval;
var gameInterval;
var isPaused = false;
var isGameOver = false;
var level = 1;
var MAX_LEVEL = 3;
var lives = 3;
var bonusBricks = [];
var bonusActive = false;
var highScores = JSON.parse(localStorage.getItem('brickHighScores')) || [];
var particles = [];

// Game images
const brickImg = new Image();
brickImg.src = "imgs/brick.png";
const ballImg = new Image();
ballImg.src = "imgs/ball.png";
const paddleImg = new Image();
paddleImg.src = "imgs/paddle.png";
const bonusImg = new Image();
bonusImg.src = "imgs/bonus.png";

// DOM elements
const scoreElement = document.getElementById("tocke");
const timeElement = document.getElementById("cas");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const startButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const highScoresList = document.getElementById("high-scores");

// Initialize game when images load
window.onload = function() {
    if (brickImg.complete && ballImg.complete && paddleImg.complete && bonusImg.complete) {
        initGame();
    } else {
        brickImg.onload = ballImg.onload = paddleImg.onload = bonusImg.onload = initGame;
    }
};

function initGame() {
    ctx = document.getElementById('canvas').getContext("2d");
    WIDTH = document.getElementById("canvas").width;
    HEIGHT = document.getElementById("canvas").height;
    
    initPaddle();
    initMouse();
    initBricks();
    updateUI();
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
}

function initPaddle() {
    paddlex = (WIDTH / 2) - (paddlew / 2);
}

function initMouse() {
    const canvasRect = document.querySelector("canvas").getBoundingClientRect();
    canvasMinX = canvasRect.left;
    canvasMaxX = canvasRect.right;
}

function initBricks() {
    NROWS = 4 + level;
    NCOLS = 6 + level;
    BRICKWIDTH = Math.floor((WIDTH - (NCOLS + 1) * 5) / NCOLS);
    BRICKHEIGHT = 40;
    PADDING = 5;
    
    bricks = new Array(NROWS);
    for (let i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (let j = 0; j < NCOLS; j++) {
            bricks[i][j] = {
                active: 1,
                alpha: 1.0,
                fading: false
            };
        }
    }
    
    bonusBricks = [];
    const totalBricks = NROWS * NCOLS;
    const bonusCount = Math.max(1, Math.floor(totalBricks * 0.1));
    
    for (let i = 0; i < bonusCount; i++) {
        const row = Math.floor(Math.random() * NROWS);
        const col = Math.floor(Math.random() * NCOLS);
        bonusBricks.push({row, col});
    }
}

function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    updateTimerDisplay();
    renderHighScores();
}

function updateTimerDisplay() {
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    timeElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

function startGame() {
    if (isGameOver) {
        resetGame();
    }
    
    startButton.disabled = true;
    pauseButton.disabled = false;
    isPaused = false;
    isGameOver = false;
    
    const baseSpeed = 2 + (level * 0.5);
    dx = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    dy = baseSpeed;
    
    gameInterval = setInterval(gameLoop, 10);
    seconds = 0;
    minutes = 0;
    timerInterval = setInterval(updateTimer, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    
    if (isPaused) {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
    } else {
        gameInterval = setInterval(gameLoop, 10);
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function updateTimer() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
    }
    updateTimerDisplay();
}

function gameLoop() {
    if (isPaused || isGameOver) return;
    
    clear();
    update();
    updateParticles();
    draw();
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function update() {
    // Update ball position
 x += dx;
    y += dy;
    
    // Ball-wall collision
    if (x + dx > WIDTH - r || x + dx < r) dx = -dx;
    if (y + dy < r) dy = -dy;
    
    // Ball-paddle collision and bottom check
    const paddleTop = HEIGHT - paddleh;
    if (y + dy > paddleTop - r) {
        if (x > paddlex && x < paddlex + paddlew) {
            // Hit paddle
            const hitPosition = (x - (paddlex + paddlew / 2)) / (paddlew / 2);
            dx = hitPosition * 5;
            dy = -Math.abs(dy);
        } else if (y + dy > HEIGHT) {
            // Ball fell below screen
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            loseLife();
            return; // Exit the update function
        }
    }
    
    // Paddle movement
    if (rightDown) paddlex = Math.min(paddlex + 7, WIDTH - paddlew);
    if (leftDown) paddlex = Math.max(paddlex - 7, 0);
    
    // Brick collision
    const brickRowHeight = BRICKHEIGHT + PADDING;
    const brickColWidth = BRICKWIDTH + PADDING;
    const brickRow = Math.floor(y / brickRowHeight);
    const brickCol = Math.floor(x / brickColWidth);
    
    if (y < NROWS * brickRowHeight && brickRow >= 0 && brickCol >= 0 && 
        brickRow < NROWS && brickCol < NCOLS && bricks[brickRow][brickCol].active === 1 && 
        !bricks[brickRow][brickCol].fading) {
        
        const isBonus = bonusBricks.some(b => b.row === brickRow && b.col === brickCol);
        bricks[brickRow][brickCol].fading = true;
        
        // Create square particles
        createParticles(
            brickCol * (BRICKWIDTH + PADDING) + PADDING + BRICKWIDTH/2,
            brickRow * (BRICKHEIGHT + PADDING) + PADDING + BRICKHEIGHT/2,
            isBonus ? '#FFD700' : '#FF2D75'
        );
        
        score += isBonus ? 50 : 10;
        
        if (isBonus) {
            activateBonus();
        }
        
        dy = -dy;
        updateUI();
    }
    
    // Update fading bricks
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            if (bricks[i][j].fading) {
                bricks[i][j].alpha -= 0.05;
                if (bricks[i][j].alpha <= 0) {
                    bricks[i][j].active = 0;
                    bricks[i][j].fading = false;
                }
            }
        }
    }
}

function draw() {
    // Draw ball
    ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
    
    // Draw paddle with bonus glow
    const paddleY = HEIGHT - paddleh;
    if (bonusActive) {
        ctx.shadowColor = '#00F3FF';
        ctx.shadowBlur = 15;
    }
    ctx.drawImage(paddleImg, paddlex, paddleY, paddlew, paddleh);
    ctx.shadowBlur = 0;
    
    // Draw bricks with fade effect
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            if (bricks[i][j].active === 1) {
                const isBonus = bonusBricks.some(b => b.row === i && b.col === j);
                const img = isBonus ? bonusImg : brickImg;
                
                ctx.globalAlpha = bricks[i][j].alpha;
                ctx.drawImage(
                    img,
                    j * (BRICKWIDTH + PADDING) + PADDING,
                    i * (BRICKHEIGHT + PADDING) + PADDING,
                    BRICKWIDTH,
                    BRICKHEIGHT
                );
                ctx.globalAlpha = 1.0;
            }
        }
    }
    
    // Draw square particles
    drawParticles();
}

function createParticles(x, y, color) {
    const fragmentSize = Math.min(BRICKWIDTH, BRICKHEIGHT) / 3;
    
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            size: fragmentSize * (0.5 + Math.random()),
            color: color,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            life: 40 + Math.random() * 30
        });
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].rotation += particles[i].rotationSpeed;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 70;
        ctx.fillRect(
            -p.size/2,
            -p.size/2,
            p.size,
            p.size
        );
        
        ctx.restore();
    }
    ctx.globalAlpha = 1.0;
}

function activateBonus() {
    bonusActive = true;
    paddlew = 120;
    setTimeout(() => {
        bonusActive = false;
        paddlew = 90;
    }, 5000);
}

function checkLevelComplete() {
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            if (bricks[i][j].active === 1) {
                return false;
            }
        }
    }
    return true;
}

function levelUp() {
    level++;
    if (level > MAX_LEVEL) {
        gameOver(true);
    } else {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        
        Swal.fire({
            title: `Level ${level-1} Complete!`,
            text: `Starting Level ${level}`,
            icon: 'success',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#4CAF50',
            footer: ''
        }).then(() => {
            initBricks();
            x = WIDTH / 2;
            y = HEIGHT / 2;
            startGame();
        });
    }
}

function loseLife() {
    lives--;
    updateUI();
    
    if (lives <= 0) {
        gameOver(false);
    } else {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        
        Swal.fire({
            title: 'Ball Lost!',
            text: `You have ${lives} lives remaining.`,
            icon: 'warning',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#FF9800',
            footer: ''
        }).then(() => {
            resetBallAndPaddle();
        });
    }
}
function resetBallAndPaddle() {
    x = WIDTH / 2;
    y = HEIGHT / 2;
    dx = 0;
    dy = 0;
    initPaddle();
    startGame();
}
function gameOver(isWin) {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    const gameTime = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    const totalScore = score + (level * 1000) - (minutes * 60 + seconds);
    
    // Save high score
    highScores.push({
        score: totalScore,
        level: isWin ? MAX_LEVEL : level,
        time: gameTime
    });
    
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('brickHighScores', JSON.stringify(highScores));
    
    // Show appropriate message
    Swal.fire({
        title: isWin ? 'You Won!' : 'Game Over',
        html: isWin ? 
            `Congratulations! You completed all ${MAX_LEVEL} levels!<br>Final Score: ${totalScore}` :
            `You reached level ${level} with ${score} points`,
        icon: isWin ? 'success' : 'error',
        confirmButtonText: 'Play Again',
        confirmButtonColor: '#4CAF50',
        footer: ''
    }).then(() => {
        resetGame();
    });
}
function resetGame() {
    level = 1;
    lives = 3;
    score = 0;
    seconds = 0;
    minutes = 0;
    isGameOver = false;
    isPaused = false;
    particles = [];
    
    initBricks();
    initPaddle();
    x = WIDTH / 2;
    y = HEIGHT / 2;
    dx = 0;
    dy = 0;
    
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    
    updateUI();
}

function renderHighScores() {
    if (!highScoresList) return;
    
    highScoresList.innerHTML = '';
    highScores.forEach((hs, index) => {
        const li = document.createElement('li');
        li.innerHTML = `#${index+1}: ${hs.score} pts (Level ${hs.level})`;
        highScoresList.appendChild(li);
    });
}

function onKeyDown(evt) {
    if (evt.key === 'ArrowRight') rightDown = true;
    else if (evt.key === 'ArrowLeft') leftDown = true;
    else if (evt.key === ' ') togglePause();
}

function onKeyUp(evt) {
    if (evt.key === 'ArrowRight') rightDown = false;
    else if (evt.key === 'ArrowLeft') leftDown = false;
}

function onMouseMove(evt) {
    if (evt.clientX > canvasMinX && evt.clientX < canvasMaxX) {
        let newPaddleX = evt.clientX - canvasMinX - paddlew / 2;
        newPaddleX = Math.max(0, newPaddleX);
        newPaddleX = Math.min(WIDTH - paddlew, newPaddleX);
        paddlex = newPaddleX;
    }
}