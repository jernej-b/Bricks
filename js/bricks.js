// Brick configuration
const NROWS = 5;
const NCOLS = 8;
const BRICK_WIDTH = 72;
const BRICK_HEIGHT = 20;
const PADDING = 2;
const BRICK_TOP_OFFSET = 50;

// Brick images
const brickImages = {
    red: new Image(),
    green: new Image(),
    purple: new Image(),
    yellow: new Image()
};

// Load brick images
brickImages.red.src = 'assets/element_red_rectangle.png';
brickImages.green.src = 'assets/element_green_rectangle.png';
brickImages.purple.src = 'assets/element_purple_rectangle.png';
brickImages.yellow.src = 'assets/element_yellow_rectangle.png';

// Game variables
var bricks = [];
var level = 1;

function initBricks() {
    bricks = [];
    const totalWidth = NCOLS * BRICK_WIDTH + (NCOLS - 1) * PADDING;
    const startX = (WIDTH - totalWidth) / 2;
    
    for(let row = 0; row < NROWS; row++) {
        bricks[row] = [];
        for(let col = 0; col < NCOLS; col++) {
            const color = ['red', 'green', 'purple', 'yellow'][(row + col) % 4];
            bricks[row][col] = {
                active: true,
                color: color,
                x: startX + col * (BRICK_WIDTH + PADDING),
                y: row * (BRICK_HEIGHT + PADDING) + BRICK_TOP_OFFSET,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                points: (row + 1) * 10
            };
        }
    }
}

function drawBricks() {
    for(let row = 0; row < NROWS; row++) {
        for(let col = 0; col < NCOLS; col++) {
            const brick = bricks[row][col];
            if(brick.active) {
                ctx.drawImage(
                    brickImages[brick.color],
                    brick.x,
                    brick.y,
                    brick.width,
                    brick.height
                );
            }
        }
    }
}

function handleBrickCollisions() {
    for(let row = 0; row < NROWS; row++) {
        for(let col = 0; col < NCOLS; col++) {
            const brick = bricks[row][col];
            if(brick.active && checkCollision(brick)) {
                brick.active = false;
                dy = -dy;
                updateScore(brick.points);
                sounds.hit.currentTime = 0;
                sounds.hit.play();
                
                if(isLevelComplete()) {
                    levelComplete();
                }
                return;
            }
        }
    }
}

function checkCollision(brick) {
    return x + r > brick.x && 
           x - r < brick.x + brick.width &&
           y + r > brick.y && 
           y - r < brick.y + brick.height;
}

function isLevelComplete() {
    return bricks.flat().every(b => !b.active);
}

function levelComplete() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    
    Swal.fire({
        title: 'LEVEL COMPLETE!',
        text: `Ready for level ${level + 1}?`,
        confirmButtonText: 'CONTINUE',
        background: '#333'
    }).then(() => nextLevel());
}

function nextLevel() {
    level++;
    document.getElementById('level').textContent = level;
    dx *= 1.05;
    dy *= 1.05;
    initBricks();
    resetBall();
    gameActive = true;
    animationId = requestAnimationFrame(draw);
}

function resetBall() {
    x = WIDTH / 2;
    y = HEIGHT / 2;
}