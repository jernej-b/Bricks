// Image assets
var images = {
    brick: new Image(),
    paddle: new Image(),
    ball: new Image()
};

// Load images
function loadImages() {
    images.brick.src = "images/brick.png";
    images.paddle.src = "images/paddle.png";
    images.ball.src = "images/ball.png";
    
    // You can add onload handlers if needed
}

// Initialize images when the game starts
loadImages();