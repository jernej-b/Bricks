// Game variables
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Ball properties
var ballRadius = 15;
var x = canvas.width / 2;
var y = canvas.height - 30;
var dx = 2;
var dy = -2;

// Paddle properties
var paddleHeight = 15;
var paddleWidth = 112;
var paddleX = (canvas.width - paddleWidth) / 2;
var rightPressed = false;
var leftPressed = false;

// Brick properties (using 110x200 images)
var brickRowCount = 3;
var brickColumnCount = 6;
var brickWidth = 110;
var brickHeight = 200;
var brickPadding = 0;
var brickOffsetTop = 10;
var brickOffsetLeft = 0;
var bricks = [];

// Game state
var score = 0;
var time = 0;
var gameLoop;
var gameRunning = false;
var gamePaused = false;
var level = 1;
var timerInterval;
var highScores = JSON.parse(localStorage.getItem('highScores')) || [];
var countdown = 0;

// DOM elements
var scoreElement = document.getElementById('score');
var timeElement = document.getElementById('time');
var levelElement = document.getElementById('level');
var highScoreElement = document.getElementById('highScore');

// Brick images
var brickImg = new Image();
brickImg.src = 'first.png';
var goldenBrickImg = new Image();
goldenBrickImg.src = 'golden_brick.png';

// Event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === "p" || e.key === "P") togglePause();
    else if (e.key === "Escape") endGame();
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > paddleWidth/2 && relativeX < canvas.width - paddleWidth/2) {
        paddleX = relativeX - paddleWidth/2;
    }
}

function initBricks() {
    bricks = [];
    for (var c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (var r = 0; r < brickRowCount; r++) {
            var isGolden = Math.random() < 0.2;
            bricks[c][r] = {
                x: c * brickWidth,
                y: r * brickHeight + brickOffsetTop,
                status: isGolden ? 2 : 1,
                img: isGolden ? goldenBrickImg : brickImg
            };
        }
    }
}

function resetGame() {
    cancelAnimationFrame(gameLoop);
    clearInterval(timerInterval);

    x = canvas.width / 2;
    y = canvas.height - 60;
    dx = 2 * level;
    dy = -2 * level;
    paddleX = (canvas.width - paddleWidth) / 2;

    initBricks();
    score = 0;
    time = 0;
    updateStats();
}

function updateStats() {
    scoreElement.textContent = `Score: ${score}`;
    timeElement.textContent = `Time: ${time}s`;
    levelElement.textContent = `Level: ${level}`;
    highScoreElement.textContent = highScores.length > 0 ? `High: ${highScores[0].score}` : 'High: 0';
}

function drawCountdown() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    drawBall();
    
    ctx.font = "48px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width/2, canvas.height/2);

    if (countdown > 0) {
        countdown--;
        setTimeout(drawCountdown, 1000);
    } else {
        timerInterval = setInterval(() => {
            if (!gamePaused) time++;
            updateStats();
        }, 1000);
        gameLoop = requestAnimationFrame(draw);
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var brick = bricks[c][r];
            if (brick.status > 0) {
                ctx.drawImage(brick.img, brick.x, brick.y, brickWidth, brickHeight);
            }
        }
    }
}

function collisionDetection() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var brick = bricks[c][r];
            if (brick.status > 0) {
                // Only check collision with top half of brick
                if (x + ballRadius > brick.x && 
                    x - ballRadius < brick.x + brickWidth &&
                    y + ballRadius > brick.y && 
                    y - ballRadius < brick.y + (brickHeight/2)) {
                    
                    dy = -dy;
                    brick.status--;
                    score += brick.status === 1 ? 5 : 1;
                    updateStats();
                    
                    // Check level completion
                    var bricksLeft = bricks.flat().filter(b => b.status > 0).length;
                    if (bricksLeft === 0) {
                        levelComplete();
                    }
                }
            }
        }
    }
}

function levelComplete() {
    gameRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoop);
    saveScore();
    
    Swal.fire({
        title: 'Level Complete!',
        text: `Score: ${score}, Time: ${time}s`,
        icon: 'success',
        confirmButtonText: 'Next Level'
    }).then((result) => {
        if (result.isConfirmed) {
            level++;
            startGame();
        }
    });
}

function startGame() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        gamePaused = false;
        countdown = 3;
        drawCountdown();
    }
}

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (!gamePaused) draw();
}

function endGame() {
    if (!gameRunning) return;
    gameRunning = false;
    gamePaused = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoop);
    saveScore();
    
    Swal.fire({
        title: 'Game Ended',
        text: `Score: ${score}, Time: ${time}s`,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

function saveScore() {
    highScores.push({ score: score, time: time, level: level });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
    updateStats();
}

function draw() {
    if (!gameRunning || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    
    // Wall collision
    if (x + dx > canvas.width-ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    
    // Paddle collision
    if (y + dy > canvas.height-ballRadius-paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else if (y + dy > canvas.height) {
            gameOver();
        }
    }
    
    // Move paddle
    if (rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 7;
    if (leftPressed && paddleX > 0) paddleX -= 7;
    
    // Move ball
    x += dx;
    y += dy;
    
    gameLoop = requestAnimationFrame(draw);
}

function gameOver() {
    gameRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(gameLoop);
    saveScore();
    
    Swal.fire({
        title: 'Game Over!',
        text: `Score: ${score}, Time: ${time}s`,
        icon: 'error',
        confirmButtonText: 'Play Again'
    }).then((result) => {
        if (result.isConfirmed) startGame();
    });
}

// Initialize game
updateStats();var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var ballRadius = 15;
var x, y, dx, dy;
var paddleHeight = 15;
var paddleWidth = 112;
var paddleX;
var rightPressed = false;
var leftPressed = false;

var brickRowCount = 4;
var brickColumnCount = 5;
var brickWidth = 112;
var brickHeight = 30;
var brickPadding = 15;
var brickOffsetTop = 45;
var brickOffsetLeft = 45;
var bricks = [];
var score = 0;
var time = 0;
var gameLoop;
var gameRunning = false;
var gamePaused = false;
var level = 1;
var timerInterval;
var highScores = JSON.parse(localStorage.getItem('highScores')) || [];
var countdown = 0;

var scoreElement = document.getElementById('score');
var timeElement = document.getElementById('time');
var levelElement = document.getElementById('level');
var highScoreElement = document.getElementById('highScore');

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === "p" || e.key === "P") {
        if (gameRunning && countdown === 0) {
            gamePaused = !gamePaused;
            if (!gamePaused) draw();
        }
    }
    else if (e.key === "Escape") { // End game on Esc key
        if (gameRunning) {
            gameRunning = false;
            gamePaused = false;
            clearInterval(timerInterval);
            cancelAnimationFrame(gameLoop);
            saveScore();
            Swal.fire({
                title: 'Game Ended',
                text: `Score: ${score}, Time: ${time}s`,
                icon: 'info',
                confirmButtonText: 'OK'
            });
        }
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX - paddleWidth / 2 > 0 && relativeX + paddleWidth / 2 < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function startGame() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        gamePaused = false;
        countdown = 3;
        drawCountdown();
    }
}

function changeLevel() {
    level = parseInt(document.getElementById('levelSelect').value);
    levelElement.textContent = `Level: ${level}`;
    if (gameRunning) resetGame();
}

function resetGame() {
    if (gameLoop) cancelAnimationFrame(gameLoop);
    clearInterval(timerInterval);

    x = canvas.width / 2;
    y = canvas.height - 45; // Adjusted for new canvas height
    dx = 3 * level;
    dy = -3 * level;

    paddleX = (canvas.width - paddleWidth) / 2;

    bricks = [];
    for (var c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (var r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: Math.random() < 0.2 ? 2 : 1 };
        }
    }

    score = 0;
    time = 0;
    updateStats();
}

function saveScore() {
    highScores.push({ score: score, time: time, level: level });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
    updateStats();
}

function updateStats() {
    scoreElement.textContent = `Score: ${score}`;
    timeElement.textContent = `Time: ${time}s`;
    levelElement.textContent = `Level: ${level}`;
    highScoreElement.textContent = highScores.length > 0 ? `High: ${highScores[0].score}` : 'High: 0';
}

function drawCountdown() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    
    ctx.font = "48px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);

    if (countdown > 0) {
        countdown--;
        setTimeout(drawCountdown, 1000);
    } else {
        timerInterval = setInterval(() => { 
            if (!gamePaused) {
                time++;
                updateStats();
            }
        }, 1000);
        draw();
    }
}

function checkGameOver() {
    if (y + dy + ballRadius > canvas.height - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            y = canvas.height - paddleHeight - ballRadius;
            dy = -dy;
        } else if (y + dy > canvas.height) {
            gameRunning = false;
            clearInterval(timerInterval);
            cancelAnimationFrame(gameLoop);
            saveScore();
            Swal.fire({
                title: 'Game Over!',
                text: `Score: ${score}, Time: ${time}s`,
                icon: 'error',
                confirmButtonText: 'Play Again'
            }).then((result) => {
                if (result.isConfirmed) startGame();
            });
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) {
                var brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                var brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].status === 2 ? "#FFD700" : "#000000";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function collisionDetection() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var b = bricks[c][r];
            if (b.status > 0) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += b.status === 2 ? 5 : 1;
                    updateStats();
                    if (score >= brickRowCount * brickColumnCount) {
                        gameRunning = false;
                        clearInterval(timerInterval);
                        cancelAnimationFrame(gameLoop);
                        saveScore();
                        Swal.fire({
                            title: 'Congratulations!',
                            text: `Score: ${score}, Time: ${time}s`,
                            icon: 'success',
                            confirmButtonText: 'Play Again'
                        }).then((result) => {
                            if (result.isConfirmed) startGame();
                        });
                    }
                }
            }
        }
    }
}

function draw() {
    if (!gameRunning || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    checkGameOver();

    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 10;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 10;
    }

    gameLoop = requestAnimationFrame(draw);
}

updateStats();