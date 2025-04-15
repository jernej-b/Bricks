// Game variables
var x = 250;
var y = 750;
var dx = 0;
var dy = 0;
var WIDTH = 500;
var HEIGHT = 1050;
var r = 20;
var ctx;
var paddlex;
var paddleh = 15;
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
var powerUps = [];
var ballTrail = [];
var bgOffset = 0;

var POWERUPS = {
    WIDE_PADDLE: { 
        duration: 10000, 
        color: '#FFD700', 
        apply: function() { paddlew = 120; }, 
        reset: function() { paddlew = 90; }
    },
    SLOW_BALL: { 
        duration: 8000, 
        color: '#ADD8E6', 
        apply: function() { 
            // Store original speed
            this.originalDx = dx;
            this.originalDy = dy;
            dx *= 0.7; 
            dy *= 0.7; 
        }, 
        reset: function() {
            // Restore original speed
            dx = this.originalDx || dx / 0.7;
            dy = this.originalDy || dy / 0.7;
        }
    }
};

var activePowerUps = [];

// DOM elements
var scoreElement = document.getElementById("tocke");
var timeElement = document.getElementById("cas");
var levelElement = document.getElementById("level");
var livesElement = document.getElementById("lives");
var startButton = document.getElementById("play");
var pauseButton = document.getElementById("pause");
var highScoresList = document.getElementById("high-scores");

// Game images
var brickImg = new Image();
brickImg.src = "imgs/brick.png";
var ballImg = new Image();
ballImg.src = "imgs/ball.png";
var paddleImg = new Image();
paddleImg.src = "imgs/paddle.png";
var bonusImg = new Image();
bonusImg.src = "imgs/bonus.png";

// Particle class
function Particle(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 1;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * 6 - 3;
    this.life = 30 + Math.random() * 20;
}

Particle.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
}

Particle.prototype.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
}

// Initialize game when images are loaded
window.onload = function() {
    var imagesLoaded = 0;
    var totalImages = 4;
    
    function imageLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            initGame();
        }
    }
    
    brickImg.onload = imageLoaded;
    ballImg.onload = imageLoaded;
    paddleImg.onload = imageLoaded;
    bonusImg.onload = imageLoaded;
    
    if (brickImg.complete && ballImg.complete && paddleImg.complete && bonusImg.complete) {
        initGame();
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
    
    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
}

function initPaddle() {
    paddlex = (WIDTH / 2) - (paddlew / 2);
    paddleh = 15; 
    paddlew = 90;
}

function initMouse() {
    var canvas = document.querySelector("canvas");
    function updateCanvasBounds() {
        var rect = canvas.getBoundingClientRect();
        canvasMinX = rect.left + window.scrollX;
        canvasMaxX = rect.right + window.scrollX;
    }
    updateCanvasBounds();
    window.addEventListener('resize', updateCanvasBounds);
    window.addEventListener('scroll', updateCanvasBounds);
}

function initBricks() {
    NROWS = 4 + level;
    NCOLS = 6 + level;
    BRICKWIDTH = (WIDTH / NCOLS) - 6;
    BRICKHEIGHT = 40;
    PADDING = 5;
    
    bricks = new Array(NROWS);
    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = 1;
        }
    }
    
    bonusBricks = [];
    var totalBricks = NROWS * NCOLS;
    var bonusCount = Math.max(1, Math.floor(totalBricks * 0.1));
    
    for (var i = 0; i < bonusCount; i++) {
        var row = Math.floor(Math.random() * NROWS);
        var col = Math.floor(Math.random() * NCOLS);
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
    var formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    var formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    timeElement.textContent = formattedMinutes + ":" + formattedSeconds;
}

function startGame() {
    if (isGameOver) {
        resetGame();
    }
    
    startButton.disabled = true;
    pauseButton.disabled = false;
    isPaused = false;
    isGameOver = false;
    
    let countdown = 3;
    function drawCountdown() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        drawBackground();
        // Draw bricks (replaced drawBricks())
        for (var i = 0; i < NROWS; i++) {
            for (var j = 0; j < NCOLS; j++) {
                if (bricks[i][j] === 1) {
                    var img = bonusBricks.some(b => b.row === i && b.col === j) ? bonusImg : brickImg;
                    ctx.drawImage(
                        img,
                        j * (BRICKWIDTH + PADDING) + PADDING,
                        i * (BRICKHEIGHT + PADDING) + PADDING,
                        BRICKWIDTH,
                        BRICKHEIGHT
                    );
                }
            }
        }
        drawPaddle();
        ctx.font = "48px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(countdown, WIDTH / 2, HEIGHT / 2);
        
        if (countdown > 0) {
            countdown--;
            setTimeout(drawCountdown, 1000);
        } else {
            var baseSpeed = 2 + (level * 0.5);
            dx = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
            dy = baseSpeed;
            gameInterval = setInterval(gameLoop, 10);
            timerInterval = setInterval(updateTimer, 1000);
        }
    }
    drawCountdown();
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
    if (!isPaused) {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        updateTimerDisplay();
    }
}

function gameLoop() {
    if (isPaused || isGameOver) return;
    
    clear();
    update();
    draw();
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function update() {
    x += dx;
    y += dy;
    
    updateBallTrail();
    
    if (x + dx > WIDTH - r || x + dx < r) {
        dx = -dx;
        createParticles(x, y, '#FFFFFF', 5);
    }
    if (y + dy < r) {
        dy = -dy;
        createParticles(x, y, '#FFFFFF', 5);
    }
    
    if (y + dy > HEIGHT - paddleh - r) {
        if (x > paddlex && x < paddlex + paddlew) {
            var hitPosition = (x - (paddlex + paddlew / 2)) / (paddlew / 2);
            dx = hitPosition * 5;
            y = HEIGHT - paddleh - r;
            dy = -Math.abs(dy);
            createParticles(x, HEIGHT - paddleh, '#FFFFFF', 10);
            
            if (rightDown) dx += 1;
            if (leftDown) dx -= 1;
        } else if (y + dy > HEIGHT) {
            loseLife();
        }
    }
    
    if (rightDown) paddlex = Math.min(paddlex + 7, WIDTH - paddlew);
    if (leftDown) paddlex = Math.max(paddlex - 7, 0);
    
    checkBrickCollision();
    
    updateParticles();
    
    updatePowerUps();
}

function draw() {
    drawBackground();
    
    drawBallTrail();
    
    ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
    
    ctx.drawImage(paddleImg, paddlex, HEIGHT - paddleh, paddlew, paddleh);
    
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] === 1) {
                var img = bonusBricks.some(b => b.row === i && b.col === j) ? bonusImg : brickImg;
                ctx.drawImage(
                    img,
                    j * (BRICKWIDTH + PADDING) + PADDING,
                    i * (BRICKHEIGHT + PADDING) + PADDING,
                    BRICKWIDTH,
                    BRICKHEIGHT
                );
            }
        }
    }
    
    drawParticles();
    
    drawPowerUps();
}

function drawPaddle() {
    ctx.drawImage(paddleImg, paddlex, HEIGHT - paddleh, paddlew, paddleh);
}

function createParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => p.draw(ctx));
}

function spawnPowerUp(x, y) {
    var powerUpTypes = Object.keys(POWERUPS);
    var randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    var powerUp = { 
        x, 
        y, 
        type: randomType,
        width: 30,
        height: 15,
        speed: 2,
        color: POWERUPS[randomType].color
    };
    
    powerUps.push(powerUp);
}

function updatePowerUps() {
    for (var i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        
        if (powerUps[i].y + powerUps[i].height > HEIGHT - paddleh && 
            powerUps[i].x + powerUps[i].width > paddlex && 
            powerUps[i].x < paddlex + paddlew) {
            var powerUpType = powerUps[i].type; // Store type before splice
            activatePowerUp(powerUpType);
            powerUps.splice(i, 1);
            createParticles(WIDTH/2, HEIGHT/2, POWERUPS[powerUpType]?.color || '#FFFFFF', 50);
        } else if (powerUps[i].y > HEIGHT) {
            powerUps.splice(i, 1);
        }
    }
    
    var now = Date.now();
    for (var i = activePowerUps.length - 1; i >= 0; i--) {
        if (now > activePowerUps[i].endTime) {
            POWERUPS[activePowerUps[i].type].reset();
            activePowerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(type) {
    var powerUp = POWERUPS[type];
    powerUp.apply();
    
    if (powerUp.duration > 0) {
        activePowerUps.push({
            type,
            endTime: Date.now() + powerUp.duration
        });
    }
    
    createParticles(WIDTH/2, HEIGHT/2, powerUp.color, 50);
    var flash = setInterval(() => {
        ctx.fillStyle = "rgba(255, 255, 0, " + Math.random() * 0.3 + ")";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }, 50);
    setTimeout(() => clearInterval(flash), 300);
}

function drawExtraBalls() {
    extraBalls.forEach(function (ball) {
        ctx.drawImage(
            ballImg, 
            ball.x - ball.radius, 
            ball.y - ball.radius, 
            ball.radius * 2, 
            ball.radius * 2
        );
    });
}

function drawPowerUps() {
    powerUps.forEach(function (pu) {
        ctx.fillStyle = pu.color;
        ctx.fillRect(pu.x, pu.y, pu.width, pu.height);
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        ctx.fillText(pu.type[0], pu.x + pu.width / 2, pu.y + pu.height / 2);
    });
}

function updateBallTrail() {
    ballTrail.push({ x, y });
    if (ballTrail.length > 10) {
        ballTrail.shift();
    }
}

function drawBallTrail() {
    ctx.save();
    for (var i = 0; i < ballTrail.length; i++) {
        var alpha = i / ballTrail.length * 0.6;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
            ballImg, 
            ballTrail[i].x - r, 
            ballTrail[i].y - r, 
            r * 2, 
            r * 2
        );
    }
    ctx.restore();
}

function drawBackground() {
    // Let CSS handle the gradient background
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#16213E';
    ctx.lineWidth = 1;
    for (var i = 0; i < WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, HEIGHT);
        ctx.stroke();
    }
    for (var i = 0; i < HEIGHT; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(WIDTH, i);
        ctx.stroke();
    }
}

function checkBrickCollision() {
    var brickRowHeight = BRICKHEIGHT + PADDING;
    var brickColWidth = BRICKWIDTH + PADDING;
    var brickRow = Math.floor(y / brickRowHeight);
    var brickCol = Math.floor(x / brickColWidth);
    
    if (y < NROWS * brickRowHeight && brickRow >= 0 && brickCol >= 0 && 
        brickRow < NROWS && brickCol < NCOLS && bricks[brickRow][brickCol] === 1) {
        
        var brickX = brickCol * brickColWidth + PADDING;
        var brickY = brickRow * brickRowHeight + PADDING;
        
        var ballLeft = x - r;
        var ballRight = x + r;
        var ballTop = y - r;
        var ballBottom = y + r;
        
        var brickLeft = brickX;
        var brickRight = brickX + BRICKWIDTH;
        var brickTop = brickY;
        var brickBottom = brickY + BRICKHEIGHT;
        
        var overlapLeft = ballRight - brickLeft;
        var overlapRight = brickRight - ballLeft;
        var overlapTop = ballBottom - brickTop;
        var overlapBottom = brickBottom - ballTop;
        
        var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        if (minOverlap === overlapLeft) {
            dx = -Math.abs(dx);
        } else if (minOverlap === overlapRight) {
            dx = Math.abs(dx);
        } else if (minOverlap === overlapTop) {
            dy = -Math.abs(dy);
        } else {
            dy = Math.abs(dy);
        }
        
        var isBonus = bonusBricks.some(b => b.row === brickRow && b.col === brickCol);
        bricks[brickRow][brickCol] = 0;
        
        var brickColor = isBonus ? '#FFD700' : '#FF5555';
        createParticles(x, y, brickColor, 15);
        
        if (isBonus) {
            score += 50;
            spawnPowerUp(brickX + BRICKWIDTH/2, brickY + BRICKHEIGHT/2);
            
            var flash = setInterval(() => {
                ctx.fillStyle = "rgba(255, 215, 0, " + Math.random() * 0.3 + ")";
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }, 50);
            setTimeout(() => clearInterval(flash), 300);
        } else {
            score += 10;
            
            if (Math.random() < 0.1) {
                spawnPowerUp(brickX + BRICKWIDTH/2, brickY + BRICKHEIGHT/2);
            }
        }
        
        if (checkLevelComplete()) {
            levelUp();
        }
        
        updateUI();
    }
}

function checkLevelComplete() {
    for (var i = 0; i < NROWS; i++) {
        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] === 1) return false;
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
        
        for (var i = 0; i < 100; i++) {
            createParticles(WIDTH/2, HEIGHT/2, "hsl(" + Math.random() * 360 + ", 100%, 50%)", 1);
        }
        
        Swal.fire({
            title: "Level " + (level-1) + " Complete!",
            text: "Starting Level " + level,
            icon: 'success',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#4CAF50'
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
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        setTimeout(() => {
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
        }, 500);
        
        Swal.fire({
            title: 'Ball Lost!',
            text: "You have " + lives + " lives remaining.",
            icon: 'warning',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#FF9800'
        }).then(() => {
            x = WIDTH / 2;
            y = HEIGHT / 2;
            dx = 0;
            dy = 0;
            initPaddle();
            startGame();
        });
    }
}

function gameOver(isWin) {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    var gameTime = minutes + ":" + (seconds < 10 ? '0' + seconds : seconds);
    var totalScore = score + (level * 1000) - (minutes * 60 + seconds);
    
    highScores.push({
        score: totalScore,
        level: isWin ? MAX_LEVEL : level,
        time: gameTime,
        date: new Date().toLocaleDateString()
    });
    
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('brickHighScores', JSON.stringify(highScores));
    
    ctx.fillStyle = isWin ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    Swal.fire({
        title: isWin ? 'You Won!' : 'Game Over',
        html: isWin ? 
            "Congratulations! You completed all " + MAX_LEVEL + " levels!<br>Final Score: " + totalScore :
            "You reached level " + level + " with " + score + " points",
        icon: isWin ? 'success' : 'error',
        confirmButtonText: 'Play Again',
        confirmButtonColor: '#4CAF50'
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
    
    initBricks();
    initPaddle();
    x = WIDTH / 2;
    y = HEIGHT / 2;
    dx = 0;
    dy = 0;
    
    particles = [];
    powerUps = [];
    ballTrail = [];
    activePowerUps = [];
    
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    
    updateUI();
}

function renderHighScores() {
    if (!highScoresList) return;
    
    highScoresList.innerHTML = '';
    highScores.forEach((hs, index) => {
        var li = document.createElement('li');
        li.innerHTML = "#" + (index+1) + ": " + hs.score + " pts(Lvl:" + hs.level + " "  + hs.date + ")";
        highScoresList.appendChild(li);
    });
}

function onKeyDown(evt) {
    if (evt.key === 'ArrowRight') rightDown = true;
    else if (evt.key === 'ArrowLeft') leftDown = true;
    else if (evt.key === ' ') {
        if (!isGameOver) {
            togglePause();
        }
    }
    else if (evt.key === 'Escape') {
        if (!isGameOver) {
            gameOver(false);
        }
    }
}

function onKeyUp(evt) {
    if (evt.key === 'ArrowRight') rightDown = false;
    else if (evt.key === 'ArrowLeft') leftDown = false;
}

function onMouseMove(evt) {
    var mouseX = evt.clientX - canvasMinX;
    paddlex = Math.max(0, Math.min(WIDTH - paddlew, mouseX - paddlew / 2));
}
