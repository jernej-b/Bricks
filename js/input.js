// Game controls
var rightDown = false;
var leftDown = false;

function initInput() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') rightDown = true;
        else if (e.key === 'ArrowLeft') leftDown = true;
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight') rightDown = false;
        else if (e.key === 'ArrowLeft') leftDown = false;
    });
}

function updatePaddlePosition() {
    const speed = 8;
    
    if (rightDown) {
        paddlex = Math.min(paddlex + speed, WIDTH - paddlew);
    }
    if (leftDown) {
        paddlex = Math.max(paddlex - speed, 0);
    }
}