// Sound effects
var soundEnabled = true;
var sounds = {
    brickHit: new Audio("sounds/hit.mp3"),
    paddleHit: new Audio("sounds/hit.mp3"),
    wallHit: new Audio("sounds/hit.mp3"),
    gameOver: new Audio("sounds/music.mp3"),
    levelComplete: new Audio("sounds/music.mp3")
};

// Play sound function
function playSound(sound) {
    if (!soundEnabled) return;
    
    if (sounds[sound]) {
        try {
            sounds[sound].currentTime = 0;
            sounds[sound].play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {
            console.log("Audio error:", e);
        }
    }
}

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
}

// Preload sounds
function initSounds() {
    sounds.brickHit.volume = 0.7;
    sounds.paddleHit.volume = 0.5;
    sounds.wallHit.volume = 0.4;
    sounds.gameOver.volume = 0.6;
    sounds.levelComplete.volume = 0.6;
    
    Object.values(sounds).forEach(sound => {
        sound.load();
    });
}