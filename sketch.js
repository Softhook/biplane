// --- START OF FILE sketch.js ---

// --- Game Configuration ---
const GRAVITY_FORCE = 0.1;
const THRUST_FORCE = 0.16;
const LIFT_FACTOR = 0.012;
const TURN_SPEED = 2.5;
const DAMPING_FACTOR = 0.985;
const GROUND_FRICTION = 0.95;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN_FRAMES = 18; // Base cooldown
const RESPAWN_DELAY_FRAMES = 120;
const BALLOON_RESPAWN_FRAMES = 360;
const MAX_CLOUDS = 5;
const CLOUD_BASE_SPEED = 0.3;
const MIN_TAKEOFF_SPEED = 1.8;
const MAX_LANDING_SPEED = 2.5;
const MAX_PARTICLES = 150;
const PLANE_COLLISION_THRESHOLD_FACTOR = 0.8;
const STALL_ANGLE_THRESHOLD = -70;
const STALL_RECOVERY_ANGLE = -50;
const STALL_EFFECT_FACTOR = 0.2;
const MAX_SPEED_FOR_SOUND = 8;
const PROPELLER_BLUR_COLOR = [100, 100, 100, 150];
const PROPELLER_STOPPED_COLOR = [0];

// --- Weather Configuration ---
let isCurrentlyRaining = false; // Start clear
const MAX_RAINDROPS = 300;
const RAIN_LIFT_REDUCTION_FACTOR = 0.50;
const RAIN_DARKNESS_FACTOR = 0.85;
const RAIN_DURATION_MIN = 60 * 15;
const RAIN_DURATION_MAX = 60 * 45;
const CLEAR_DURATION_MIN = 60 * 20;
const CLEAR_DURATION_MAX = 60 * 70;
let rainTimer = 0;
let clearTimer = 0;


// --- Power-up Configuration ---
const POWERUP_DURATION_FRAMES = 1200;
const POWERUP_FALL_SPEED = 0.5;
const POWERUP_SIZE = 30;
const POWERUP_TYPES = ['RapidFire', 'SpeedBoost', 'Shield', 'TripleShot', 'Bomb'];
const POWERUP_COLORS = {
    RapidFire: [255, 255, 0],   // Yellow
    SpeedBoost: [0, 255, 255],  // Cyan
    Shield: [200, 0, 255],      // Magenta
    TripleShot: [255, 255, 255], // White
    Bomb: [80, 80, 80]          // Dark Gray
};
const SHIELD_COLOR = [150, 150, 255, 100];
const TRIPLE_SHOT_SPREAD_ANGLE = 6;
const BOMB_DROP_VELOCITY_Y = 1.5;
const BOMB_FUSE_FRAMES = 90;
const BOMB_EXPLOSION_RADIUS = 70; // Increased radius slightly for hut
const BOMB_EXPLOSION_PARTICLES = 45;
const HUT_DESTRUCTION_PARTICLES = 70; // More particles for hut destruction
const HUT_RUBBLE_PIECES = 25; // Number of static rubble pieces to draw

// --- Sound Parameters ---
const BASE_ENGINE_FREQ = 40;
const MAX_ENGINE_FREQ = 120;
const BASE_ENGINE_AMP = 0.00;
const MAX_ENGINE_AMP = 0.18;

// --- Player Controls ---
const CONTROLS_P1 = { thrust: 87, left: 65, right: 68, shoot: 83 }; // W,A,D,S
const CONTROLS_P2 = { thrust: 38, left: 37, right: 39, shoot: 40 }; // Arrows

// --- Global Variables ---
let plane1, plane2;
let bullets = [];
let clouds = [];
let hut; // Will be an object { x, y, w, h, destroyed, rubbleDetails: [] }
let balloon;
let score1 = 0;
let score2 = 0;
let keys = {};
let particles = [];
let stars = [];
let rainDrops = [];
let powerUps = [];
let bombs = [];

// --- Sound Variables ---
let engineSound1, engineSound2;
let shootSoundEnv, shootNoise;
let explosionSoundEnv, explosionNoise;
let powerUpSpawnSound, powerUpCollectSound, shieldDeflectSound;
let bombDropSound, bombExplosionSoundEnv, bombExplosionNoise;
let audioStarted = false;
let soundNodesStarted = false;

// --- Game State ---
let gameState = 'intro'; // 'intro' or 'playing'

// --- Environment Dimensions ---
const GROUND_LEVEL_Y_FRAC = 0.9;
let GROUND_Y;
const HUT_WIDTH = 75;
const HUT_HEIGHT = 55;
let hutX, hutY;

// --- Colors ---
const SKY_TOP = [5, 3, 15];          // Define the base colors first
const SKY_UPPER_BAND = [65, 35, 20];
const SKY_MID_BLUE = [25, 45, 110];
const SKY_LOWER_BLUE = [70, 120, 200];
const GROUND_COLOR = [45, 30, 50];
const GROUND_HIGHLIGHT = [60, 45, 65];
const MOUNTAIN_DISTANT = [30, 20, 40, 200];
const MOUNTAIN_DARK = [85, 85, 95];
const MOUNTAIN_LIGHT = [115, 115, 125];
const MOUNTAIN_GREEN = [55, 100, 55];
const SNOW_COLOR = [240, 245, 250];
const HUT_WALL = [150, 120, 90];
const HUT_ROOF = [80, 55, 35];
const HUT_DOOR = [60, 40, 30];
const HUT_RUBBLE_COLORS = [ [100, 80, 60], [70, 50, 30], [60, 40, 30], [120, 100, 80], [140, 110, 85], [85, 65, 45] ]; // Colors for destroyed hut particles/drawing
const CLOUD_COLOR = [200, 200, 215]; // Slightly grayer clouds in rain
const CLOUD_SHADOW = [160, 160, 180, 180];
const PLANE1_COLOR_BODY = [200, 100, 30];
const PLANE1_COLOR_WING = [230, 150, 70];
const PLANE1_COLOR_ACCENT = [160, 80, 20];
const PLANE2_COLOR_BODY = [150, 170, 80];
const PLANE2_COLOR_WING = [190, 200, 110];
const PLANE2_COLOR_ACCENT = [120, 140, 60];
const BULLET_CORE_BRIGHTNESS = 255;
const BULLET_TRAIL_ALPHA = 180;
const SCORE_COLOR = [255, 220, 50];
const EXPLOSION_COLORS = [ [255, 200, 0], [255, 100, 0], [200, 50, 0], [100, 100, 100] ];
const BOMB_EXPLOSION_COLORS = [ [150, 150, 150], [100, 100, 100], [255, 150, 0], [50, 50, 50] ];
const BALLOON_COLORS = [ [230, 50, 50], [50, 150, 230], [240, 200, 60], [50, 200, 100] ];
const BALLOON_BASKET = [160, 100, 40];
const BALLOON_ROPE = [80, 60, 40];
const RAINDROP_COLOR = [150, 180, 220, 150];

let currentSkyTop = [...SKY_TOP];
let currentSkyUpperBand = [...SKY_UPPER_BAND];
let currentSkyMidBlue = [...SKY_MID_BLUE];
let currentSkyLowerBlue = [...SKY_LOWER_BLUE];


// --- p5.js Setup Function ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    noSmooth();

    // Initialize Weather State (Start Clear)
    isCurrentlyRaining = false;
    clearTimer = random(CLEAR_DURATION_MIN, CLEAR_DURATION_MAX); // Start with a clear period
    rainTimer = 0;
    rainDrops = []; // Start with no raindrops

    calculateLayout(); // Calls updateWeatherVisuals implicitly

    // Initialize Planes
    let planeStartY = GROUND_Y - 10;
    plane1 = new Plane(width * 0.1, planeStartY, PLANE1_COLOR_BODY, PLANE1_COLOR_WING, PLANE1_COLOR_ACCENT, CONTROLS_P1, 1);
    plane2 = new Plane(width * 0.9, planeStartY, PLANE2_COLOR_BODY, PLANE2_COLOR_WING, PLANE2_COLOR_ACCENT, CONTROLS_P2, 2);

    // Initialize Scenery
    clouds = []; for (let i = 0; i < MAX_CLOUDS; i++) { clouds.push(new Cloud()); }
    balloon = new Balloon(width * 0.75, height * 0.4);
    stars = []; for (let i = 0; i < 150; i++) { stars.push({ x: random(width), y: random(height * 0.7), size: random(1, 2.5), brightness: random(150, 255) }); }

    keys = {};

    // --- Initialize Sounds ---
    engineSound1 = new p5.Oscillator('sawtooth'); engineSound1.freq(BASE_ENGINE_FREQ); engineSound1.amp(0);
    engineSound2 = new p5.Oscillator('sawtooth'); engineSound2.freq(BASE_ENGINE_FREQ); engineSound2.amp(0);

    shootNoise = new p5.Noise('white'); shootNoise.amp(0);
    shootSoundEnv = new p5.Envelope(); shootSoundEnv.setADSR(0.001, 0.02, 0, 0.04); shootSoundEnv.setRange(0.9, 0);

    explosionNoise = new p5.Noise('pink'); explosionNoise.amp(0);
    explosionSoundEnv = new p5.Envelope(); explosionSoundEnv.setADSR(0.03, 0.5, 0.1, 0.7); explosionSoundEnv.setRange(0.7, 0);

    powerUpSpawnSound = new p5.Envelope(); powerUpSpawnSound.setADSR(0.01, 0.1, 0.2, 0.2); powerUpSpawnSound.setRange(0.5, 0);
    powerUpCollectSound = new p5.Envelope(); powerUpCollectSound.setADSR(0.005, 0.05, 0.3, 0.1); powerUpCollectSound.setRange(0.8, 0);
    shieldDeflectSound = new p5.Envelope(); shieldDeflectSound.setADSR(0.001, 0.03, 0, 0.05); shieldDeflectSound.setRange(0.6, 0);

    bombDropSound = new p5.Envelope(); bombDropSound.setADSR(0.01, 0.1, 0, 0.1); bombDropSound.setRange(0.4, 0);
    bombExplosionNoise = new p5.Noise('brown'); bombExplosionNoise.amp(0);
    bombExplosionSoundEnv = new p5.Envelope(); bombExplosionSoundEnv.setADSR(0.05, 0.7, 0.2, 0.9); bombExplosionSoundEnv.setRange(0.9, 0);

    plane1.assignEngineSound(engineSound1);
    plane2.assignEngineSound(engineSound2);
}

// --- Helper to Calculate Layout ---
function calculateLayout() {
    GROUND_Y = height * GROUND_LEVEL_Y_FRAC;
    hutX = width / 2;
    hutY = GROUND_Y - HUT_HEIGHT / 2;
    // Initialize or update hut object
    hut = {
        x: hutX,
        y: hutY,
        w: HUT_WIDTH,
        h: HUT_HEIGHT,
        destroyed: hut ? hut.destroyed : false, // Preserve destroyed state on resize
        rubbleDetails: hut ? hut.rubbleDetails : null // Preserve rubble details on resize
    };

    if (stars && stars.length > 0) {
        for (let star of stars) {
            star.x = random(width);
            star.y = random(height * 0.7);
        }
    }
    if (gameState === 'intro') {
        let planeStartY = GROUND_Y - 10;
        if (plane1) plane1.startPos = createVector(width * 0.1, planeStartY);
        if (plane2) plane2.startPos = createVector(width * 0.9, planeStartY);
        if (hut) { // Reset hut on intro screen (e.g., after resize)
            hut.destroyed = false;
            hut.rubbleDetails = null;
        }
    }

    // Update visuals based on current rain state (ensures correct colors after resize)
    updateWeatherVisuals();
}

// --- p5.js Draw Function (Main Game Loop) ---
function draw() {
    // --- Intro Screen Logic ---
    if (gameState === 'intro') {
        drawIntroScreen();
        return;
    }

    // --- Weather Control Logic ---
    if (gameState === 'playing') { // Only change weather during gameplay
        if (isCurrentlyRaining) {
            rainTimer--;
            if (rainTimer <= 0) {
                // Transition to Clear
                isCurrentlyRaining = false;
                clearTimer = random(CLEAR_DURATION_MIN, CLEAR_DURATION_MAX);
                rainDrops = []; // Clear existing drops
                updateWeatherVisuals();
            }
        } else { // Currently Clear
            clearTimer--;
            if (clearTimer <= 0) {
                // Transition to Rain
                isCurrentlyRaining = true;
                rainTimer = random(RAIN_DURATION_MIN, RAIN_DURATION_MAX);
                // Create new raindrops
                rainDrops = []; // Clear just in case
                for (let i = 0; i < MAX_RAINDROPS; i++) {
                    rainDrops.push(new RainDrop());
                }
                updateWeatherVisuals();
            }
        }
    }
    // --- End Weather Control ---


    // --- Playing State Logic ---
    drawBackground(); // Uses potentially modified currentSky... colors
    drawEnvironment();

    // Update and Draw standard Particles (explosions etc.)
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].display(); if (particles[i].isDead()) { particles.splice(i, 1); } }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (plane1.isAlive && bullets[i].checkCollision(plane1)) {
            if (bullets[i].ownerId !== plane1.id) {
                if (!plane1.hit(false, bullets[i])) { bullets.splice(i, 1); } continue;
            }
        }
        if (plane2.isAlive && bullets[i].checkCollision(plane2)) {
             if (bullets[i].ownerId !== plane2.id) {
                 if (!plane2.hit(false, bullets[i])) { bullets.splice(i, 1); } continue;
             }
        }
        if (balloon.isAlive && balloon.checkCollision(bullets[i])) {
            balloon.hit();
            if (bullets[i].ownerId === 1) { score1++; } else { score2++; }
            bullets.splice(i, 1); continue;
        }
        // Pass the actual hut object to checkCollisionHut
        if (bullets[i].checkCollisionHut(hut)) {
             createExplosion(bullets[i].position.x, bullets[i].position.y, 5, HUT_WALL); bullets.splice(i, 1); continue;
        } // Simpler hut hit effect color
        if (bullets[i].isOffscreen()) { bullets.splice(i, 1); } else { bullets[i].display(); }
    }

    // Bombs
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].update();
        bombs[i].display();
        // Bomb collisions (check after update) - Plane/Hut/Ground
        let exploded = false;
        if (bombs[i].fuseTimer <= 0) {
             bombs[i].explode(hut); exploded = true; // Pass hut object to explode
        } else {
             if (plane1.isAlive && bombs[i].ownerId !== plane1.id && bombs[i].checkCollision(plane1)) { bombs[i].explode(hut); exploded = true; } // Pass hut object to explode
             else if (plane2.isAlive && bombs[i].ownerId !== plane2.id && bombs[i].checkCollision(plane2)) { bombs[i].explode(hut); exploded = true; } // Pass hut object to explode
             else if (bombs[i].checkCollisionHut(hut)) { bombs[i].explode(hut); exploded = true; } // Pass hut object to explode
             else if (bombs[i].checkCollisionGround()) { bombs[i].explode(hut); exploded = true; } // Pass hut object to explode
        }

        if (exploded || bombs[i].isOffscreen()) {
            bombs.splice(i, 1);
        }
    }

    // Planes
    plane1.handleInput(keys); plane1.update(); plane1.display();
    plane2.handleInput(keys); plane2.update(); plane2.display();

    // Plane-Plane Collision
    if (plane1.isAlive && plane2.isAlive && plane1.activePowerUp !== 'Shield' && plane2.activePowerUp !== 'Shield') {
        let distance = dist(plane1.position.x, plane1.position.y, plane2.position.x, plane2.position.y);
        let collisionThreshold = (plane1.size + plane2.size) * PLANE_COLLISION_THRESHOLD_FACTOR;
        if (distance < collisionThreshold) {
            console.log("PLANE COLLISION!"); plane1.hit(true); plane2.hit(true);
             let awayVector = p5.Vector.sub(plane1.position, plane2.position).normalize().mult(2); plane1.velocity.add(awayVector); plane2.velocity.sub(awayVector);
        }
    }

    // Scenery
    for (let cloud of clouds) { cloud.update(); cloud.display(); }
    balloon.update(); balloon.display();
    drawHut(); // Draws based on hut.destroyed and hut.rubbleDetails state

    // --- MODIFIED: Update and Draw Raindrops (Conditional) ---
    if (isCurrentlyRaining) {
        for (let drop of rainDrops) {
            drop.update();
            drop.display();
        }
    }
    // --- End Raindrop Drawing ---

    // PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update(); powerUps[i].display();
        if (plane1.isAlive && powerUps[i].checkCollision(plane1)) { plane1.collectPowerUp(powerUps[i].type); powerUps.splice(i, 1); continue; }
        if (plane2.isAlive && powerUps[i].checkCollision(plane2)) { plane2.collectPowerUp(powerUps[i].type); powerUps.splice(i, 1); continue; }
        if (powerUps[i].isOffscreen()) { powerUps.splice(i, 1); }
    }

    drawUI();
    displayPowerUpStatus(plane1, 20, height - 70);
    displayPowerUpStatus(plane2, width - 220, height - 70);
}

// --- Draw Intro Screen ---
function drawIntroScreen() {
    // Use current (potentially darkened) sky colors for intro too
    drawBackground();
    drawEnvironment();
    if (hut) { // Ensure hut is not destroyed on intro
        hut.destroyed = false;
        hut.rubbleDetails = null;
    }
    drawHut(); // Draw the intact hut on intro

    fill(0, 0, 0, 150);
    rect(width / 2, height / 2, width, height);
    textFont('monospace'); fill(255, 215, 0); stroke(0); strokeWeight(4); textSize(min(width * 0.1, height * 0.15)); textAlign(CENTER, CENTER); text("Biplane Battle", width / 2, height * 0.2);
    noStroke(); fill(240); textSize(min(width * 0.025, height * 0.04)); let instrY = height * 0.45; let lineSpacing = height * 0.05; let col1X = width * 0.3; let col2X = width * 0.7;
    fill(PLANE1_COLOR_BODY); text("Player 1", col1X, instrY); fill(240); text("W: Thrust", col1X, instrY + lineSpacing); text("A: Turn Left", col1X, instrY + lineSpacing * 2); text("D: Turn Right", col1X, instrY + lineSpacing * 3); text("S: Shoot/Drop", col1X, instrY + lineSpacing * 4);
    fill(PLANE2_COLOR_BODY); text("Player 2", col2X, instrY); fill(240); text("Up Arrow: Thrust", col2X, instrY + lineSpacing); text("Left Arrow: Turn Left", col2X, instrY + lineSpacing * 2); text("Right Arrow: Turn Right", col2X, instrY + lineSpacing * 3); text("Down Arrow: Shoot/Drop", col2X, instrY + lineSpacing * 4);
    fill(255, 255, 100); textSize(min(width * 0.03, height * 0.05)); if (floor(frameCount / 20) % 2 === 0) { text("Press any key to start", width / 2, height * 0.85); } noStroke();
}


// --- Input Handling ---
function keyPressed() {
    if (gameState === 'intro') {
        gameState = 'playing';
        if (hut) { // Ensure hut starts intact when game starts
             hut.destroyed = false;
             hut.rubbleDetails = null;
        }
        if (audioStarted && !soundNodesStarted) {
            try {
                 engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start();
                 bombExplosionNoise.start();
                 soundNodesStarted = true;
                 console.log("Sound nodes started via key press after audio context was ready.");
            } catch (e) { console.error("Error starting sound nodes on key press:", e); }
        } else if (!audioStarted) { console.log("Key pressed to start game, but audio context not yet running (click the screen)."); }
        return;
    }
    if (gameState === 'playing') { keys[keyCode] = true; }
}
function keyReleased() { if (gameState === 'playing') { keys[keyCode] = false; } }

// --- Fullscreen & Audio Start ---
function mousePressed() {
  if (!audioStarted && getAudioContext().state !== 'running') {
     console.log("Attempting to start audio context...");
     userStartAudio().then(() => {
        if (getAudioContext().state === 'running') {
            console.log("Audio Context is now running."); audioStarted = true;
            if (gameState === 'playing' && !soundNodesStarted) {
                 try {
                    engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start();
                    bombExplosionNoise.start();
                    soundNodesStarted = true;
                    console.log("Sound nodes started via mouse press because game was already playing.");
                 } catch (e) { console.error("Error starting sound nodes on mouse press:", e); }
            }
        } else { console.error("Audio context failed to resume or start."); }
     }).catch(e => { console.error("Error starting audio:", e); });
  } else if (!audioStarted && getAudioContext().state === 'running') {
      console.log("Audio Context was already running. Marking audio as started."); audioStarted = true;
      if (gameState === 'playing' && !soundNodesStarted) {
           try {
               engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start();
               bombExplosionNoise.start();
               soundNodesStarted = true;
               console.log("Sound nodes started via mouse press (audio context was already running).");
           } catch (e) { console.error("Error starting sound nodes on mouse press (pre-existing context):", e); }
      }
  }
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) { let fs = fullscreen(); fullscreen(!fs); }
}

// --- Window Resize Handling ---
function windowResized() { resizeCanvas(windowWidth, windowHeight); calculateLayout(); }


// --- Drawing Functions ---
function drawBackground() {
    noStroke();
    let bandHeight = height * 0.03;
    fill(currentSkyTop); rect(width / 2, (height * 0.075) / 2, width, height * 0.075);
    fill(currentSkyUpperBand); rect(width / 2, height * 0.075 + bandHeight / 2, width, bandHeight);
    for (let y = height * 0.075 + bandHeight; y < GROUND_Y; y++) {
        let inter = map(y, height * 0.075 + bandHeight, GROUND_Y, 0, 1);
        let c = lerpColor(color(currentSkyMidBlue), color(currentSkyLowerBlue), inter);
        stroke(c); line(0, y, width, y);
    }
    noStroke(); fill(255);
    for (let star of stars) {
        let brightness = star.brightness * (0.8 + sin(frameCount * 2 + star.x) * 0.2);
        // Use isCurrentlyRaining here for alpha
        fill(brightness, isCurrentlyRaining ? 80 : 255);
        ellipse(star.x, star.y, star.size, star.size);
    }
    noStroke();
}

function drawEnvironment() { noStroke(); fill(MOUNTAIN_DISTANT); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y * 0.85); vertex(width * 0.3, GROUND_Y * 0.88); vertex(width * 0.5, GROUND_Y * 0.78); vertex(width * 0.7, GROUND_Y * 0.90); vertex(width * 0.9, GROUND_Y * 0.82); vertex(width, GROUND_Y); endShape(CLOSE); let peak1_baseL = { x: width * 0.05, y: GROUND_Y }; let peak1_top = { x: width * 0.3, y: GROUND_Y * 0.55 }; let peak1_baseR = { x: width * 0.45, y: GROUND_Y }; let peak2_baseL = { x: width * 0.4, y: GROUND_Y }; let peak2_top = { x: width * 0.65, y: GROUND_Y * 0.45 }; let peak2_baseR = { x: width * 0.9, y: GROUND_Y }; fill(MOUNTAIN_DARK); triangle(peak1_baseL.x, peak1_baseL.y, peak1_top.x, peak1_top.y, peak1_baseR.x, peak1_baseR.y); let snowLevel1 = 0.35; fill(SNOW_COLOR); beginShape(); vertex(peak1_top.x, peak1_top.y); let snowP1_L_x = lerp(peak1_top.x, peak1_baseL.x, snowLevel1 * 1.2); let snowP1_L_y = lerp(peak1_top.y, peak1_baseL.y, snowLevel1); vertex(snowP1_L_x, snowP1_L_y); let snowP1_R_x = lerp(peak1_top.x, peak1_baseR.x, snowLevel1 * 1.1); let snowP1_R_y = lerp(peak1_top.y, peak1_baseR.y, snowLevel1); vertex(snowP1_R_x, snowP1_R_y); endShape(CLOSE); fill(MOUNTAIN_LIGHT); triangle(peak2_baseL.x, peak2_baseL.y, peak2_top.x, peak2_top.y, peak2_baseR.x, peak2_baseR.y); let snowLevel2 = 0.4; fill(SNOW_COLOR); beginShape(); vertex(peak2_top.x, peak2_top.y); let snowP2_L_x = lerp(peak2_top.x, peak2_baseL.x, snowLevel2 * 1.15); let snowP2_L_y = lerp(peak2_top.y, peak2_baseL.y, snowLevel2); vertex(snowP2_L_x, snowP2_L_y); let snowP2_R_x = lerp(peak2_top.x, peak2_baseR.x, snowLevel2 * 1.1); let snowP2_R_y = lerp(peak2_top.y, peak2_baseR.y, snowLevel2); vertex(snowP2_R_x, snowP2_R_y); endShape(CLOSE); fill(MOUNTAIN_GREEN); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y); curveVertex(width * 0.15, GROUND_Y * 0.95); vertex(width * 0.2, GROUND_Y * 0.85); curveVertex(width * 0.28, GROUND_Y * 0.98); vertex(width * 0.35, GROUND_Y); vertex(peak1_baseR.x, GROUND_Y); vertex(peak2_baseL.x, GROUND_Y); curveVertex(width * 0.58, GROUND_Y * 0.9); vertex(width * 0.6, GROUND_Y * 0.8); curveVertex(width * 0.75, GROUND_Y); vertex(width * 0.85, GROUND_Y); vertex(peak2_baseR.x, GROUND_Y); vertex(width, GROUND_Y); vertex(width, height); vertex(0, height); endShape(CLOSE); fill(GROUND_COLOR); rect(width / 2, GROUND_Y + (height - GROUND_Y) / 2, width, height - GROUND_Y); strokeWeight(1); for(let i = 0; i < 10; i++) { let lineY = GROUND_Y + (height - GROUND_Y) * (i / 10) * random(0.8, 1.2); let lineCol = lerpColor(color(GROUND_COLOR), color(GROUND_HIGHLIGHT), random(0.3, 0.7)); stroke(red(lineCol), green(lineCol), blue(lineCol), 100); line(0, lineY, width, lineY); } noStroke(); }

function drawHut() {
    // Don't draw if hut doesn't exist
    if (!hut) return;

    if (hut.destroyed) {
        // Draw the static rubble pile
        if (hut.rubbleDetails && hut.rubbleDetails.length > 0) {
            push();
            translate(hut.x, hut.y + hut.h * 0.2); // Base translation for rubble pile
            noStroke();
            // Draw crater effect (optional, can be simple)
            fill(GROUND_COLOR[0]*0.8, GROUND_COLOR[1]*0.8, GROUND_COLOR[2]*0.8);
            ellipse(0, GROUND_Y - hut.y - hut.h * 0.2, hut.w * 1.1, hut.h * 0.4);

            // Draw the pre-calculated rubble pieces
            for (const detail of hut.rubbleDetails) {
                fill(detail.color);
                // Draw rubble relative to the translated origin
                rect(detail.x, detail.y - hut.h * 0.2, detail.w, detail.h, detail.r); // Adjust Y based on translation
            }
            pop();
        }
    } else {
        // Draw the intact hut
        push();
        translate(hut.x, hut.y);
        noStroke();
        // Roof
        fill(HUT_ROOF);
        triangle(-hut.w / 2 - 5, -hut.h / 2, hut.w / 2 + 5, -hut.h / 2, 0, -hut.h / 2 - hut.h * 0.6);
        // Walls
        fill(HUT_WALL);
        rect(0, 0, hut.w, hut.h);
        // Door
        fill(HUT_DOOR);
        rect(-hut.w * 0.25, hut.h * 0.1, hut.w * 0.3, hut.h * 0.7, 3);
        // Window
        fill(currentSkyLowerBlue[0]*0.7, currentSkyLowerBlue[1]*0.7, currentSkyLowerBlue[2]*0.7);
        rect(hut.w * 0.25, -hut.h * 0.1, hut.w * 0.35, hut.h * 0.35, 2);
        // Window Panes
        stroke(HUT_ROOF); strokeWeight(2);
        let winX = hut.w * 0.25; let winY = -hut.h * 0.1; let winW = hut.w * 0.35; let winH = hut.h * 0.35;
        line(winX - winW/2, winY, winX + winW/2, winY); // Horizontal
        line(winX, winY - winH/2, winX, winY + winH/2); // Vertical
        // Wall Planks
        noStroke(); stroke(HUT_WALL[0] * 0.8, HUT_WALL[1] * 0.8, HUT_WALL[2] * 0.8, 150); strokeWeight(1);
        for(let i = 0; i < 6; i++) {
            let lineY = -hut.h/2 + (hut.h / 6) * (i + 0.5);
            line(-hut.w/2, lineY, hut.w/2, lineY);
        }
        noStroke();
        pop();
    }
}

function drawUI() { textSize(40); textFont('monospace'); fill(SCORE_COLOR); stroke(0); strokeWeight(3); textAlign(LEFT, BOTTOM); text(nf(score1, 2), 20, height - 10); textAlign(RIGHT, BOTTOM); text(nf(score2, 2), width - 20, height - 10); noStroke(); }
function displayPowerUpStatus(plane, x, y) { if (!plane.isAlive || !plane.activePowerUp) return; push(); textAlign(LEFT, BOTTOM); textSize(18); textFont('monospace'); let powerUpName = plane.activePowerUp; let remainingTime = ceil(plane.powerUpTimer / 60); let displayColor = POWERUP_COLORS[powerUpName] || [255, 255, 255]; fill(displayColor); stroke(0); strokeWeight(2); text(`${powerUpName}: ${remainingTime}s`, x, y); let barWidth = 100; let barHeight = 8; let currentWidth = map(plane.powerUpTimer, 0, POWERUP_DURATION_FRAMES, 0, barWidth); noStroke(); fill(100); rect(x + barWidth / 2, y + barHeight, barWidth, barHeight); fill(displayColor); rect(x + currentWidth / 2, y + barHeight, currentWidth, barHeight); pop(); noStroke(); }

// --- NEW: Helper Function to Update Sky Colors ---
function updateWeatherVisuals() {
    if (isCurrentlyRaining) {
        // Darken sky colors
        currentSkyTop = SKY_TOP.map(c => c * RAIN_DARKNESS_FACTOR);
        currentSkyUpperBand = SKY_UPPER_BAND.map(c => c * RAIN_DARKNESS_FACTOR);
        currentSkyMidBlue = SKY_MID_BLUE.map(c => c * RAIN_DARKNESS_FACTOR);
        currentSkyLowerBlue = SKY_LOWER_BLUE.map(c => c * RAIN_DARKNESS_FACTOR);
        console.log("Weather: Rain starting");
    } else {
        // Restore default sky colors
        currentSkyTop = [...SKY_TOP];
        currentSkyUpperBand = [...SKY_UPPER_BAND];
        currentSkyMidBlue = [...SKY_MID_BLUE];
        currentSkyLowerBlue = [...SKY_LOWER_BLUE];
        console.log("Weather: Clearing up");
    }
    // Could also adjust cloud color/alpha here if desired
}

// --- NEW: Helper function to destroy the hut ---
function destroyHut(hutObj) {
    if (!hutObj || hutObj.destroyed) return; // Already destroyed or doesn't exist

    console.log("Hut DESTROYED!");
    hutObj.destroyed = true;
    hutObj.rubbleDetails = []; // Initialize the array

    // Create the particle explosion effect
    createExplosion(hutObj.x, hutObj.y, HUT_DESTRUCTION_PARTICLES, BOMB_EXPLOSION_COLORS.concat(HUT_RUBBLE_COLORS), true); // Use bomb colors + rubble

    // Generate static rubble details
    for (let i = 0; i < HUT_RUBBLE_PIECES; i++) {
        let rubbleCol = random(HUT_RUBBLE_COLORS);
        // Positions relative to the hut's center (will be drawn with translation)
        // Y position needs to be adjusted so rubble sits near the ground level (relative to hut center)
        let baseY = hutObj.h * 0.5; // Bottom edge relative to center
        let rubbleX = random(-hutObj.w * 0.6, hutObj.w * 0.6);
        let rubbleY = baseY - random(0, hutObj.h * 0.6); // Place rubble starting from bottom upwards
        let rubbleW = random(hutObj.w * 0.1, hutObj.w * 0.35);
        let rubbleH = random(hutObj.h * 0.1, hutObj.h * 0.3);
        let rubbleR = random(1, 3); // Corner radius

        hutObj.rubbleDetails.push({
            x: rubbleX,
            y: rubbleY, // Store Y relative to hut center
            w: rubbleW,
            h: rubbleH,
            r: rubbleR,
            color: rubbleCol
        });
    }
}


// =====================
// --- Plane Class ---
// =====================
class Plane {
    constructor(x, y, bodyCol, wingCol, accentCol, controls, id) {
        this.id = id; this.startPos = createVector(x, y); this.bodyColor = color(bodyCol); this.wingColor = color(wingCol); this.accentColor = color(accentCol); this.controls = controls; this.size = 22; this.position = this.startPos.copy(); this.velocity = createVector(0, 0); this.angle = (id === 2) ? 180 : 0; this.isAlive = true; this.isOnGround = true; this.respawnTimer = 0; this.shootCooldown = 0; this.isThrusting = false; this.isTurningLeft = false; this.isTurningRight = false; this.planePoints = this.createPlaneShape(); this.engineSound = null; this.isStalled = false; this.activePowerUp = null; this.powerUpTimer = 0;
    }
    assignEngineSound(soundObject) { this.engineSound = soundObject; }
    createPlaneShape() { let s = this.size; return { fuselage: [ {x: s * 0.8, y: 0}, {x: s * 0.6, y: -s * 0.1}, {x: -s * 0.7, y: -s * 0.15}, {x: -s * 0.95, y: -s * 0.05}, {x: -s * 0.9, y: 0}, {x: -s * 0.95, y: s * 0.05}, {x: -s * 0.7, y: s * 0.15}, {x: s * 0.6, y: s * 0.1} ], topWing: [ {x: s * 0.35, y: -s * 0.25}, {x: s * 0.25, y: -s * 0.7}, {x: -s * 0.45, y: -s * 0.7}, {x: -s * 0.4, y: -s * 0.25} ], bottomWing: [ {x: s * 0.25, y: s * 0.25}, {x: s * 0.15, y: s * 0.6}, {x: -s * 0.35, y: s * 0.6}, {x: -s * 0.3, y: s * 0.25} ], tailplane: [ {x: -s * 0.75, y: -s * 0.1}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 1.0, y: 0}, {x: -s * 1.05, y: s * 0.35}, {x: -s * 0.75, y: s * 0.1} ], rudder: [ {x: -s * 0.9, y: 0}, {x: -s * 1.15, y: -s * 0.4}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 0.75, y: -s * 0.1} ], cockpit: [ {x: s * 0.4, y: -s * 0.1}, {x: s * 0.1, y: -s*0.35}, {x: -s*0.1, y: -s*0.25} ], wheels: [ {x: s*0.15, y: s*0.7}, {x: -s*0.2, y: s*0.7} ], wheelRadius: s * 0.18 }; }
    handleInput(keys) { if (!this.isAlive || this.respawnTimer > 0) { this.isThrusting = false; this.isTurningLeft = false; this.isTurningRight = false; return; } this.isThrusting = keys[this.controls.thrust] || false; this.isTurningLeft = keys[this.controls.left] || false; this.isTurningRight = keys[this.controls.right] || false; if (keys[this.controls.shoot]) { this.shoot(); } }
    applyForce(force) { this.velocity.add(force); }

    update() {
        // --- Respawn Timer ---
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return; // Don't update further if waiting to respawn
        }

        // --- Exit if not Alive ---
        if (!this.isAlive) {
            if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0.05);
            return;
        }

        // --- Cooldowns and Timers ---
        if (this.shootCooldown > 0) { this.shootCooldown--; }
        if (this.powerUpTimer > 0) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                console.log(`Plane ${this.id} ${this.activePowerUp} expired.`);
                this.activePowerUp = null;
            }
        }

        // --- Turning ---
        if (this.isTurningLeft) { this.angle -= TURN_SPEED; }
        if (this.isTurningRight) { this.angle += TURN_SPEED; }


        // --- START: Determine Stall State (V26 - Unified Sine Logic) ---
        let checkAngle = this.angle; // For logging
        let normAngle = (this.angle % 360 + 360) % 360; // For other checks potentially
        let currentlyStalled = this.isStalled; // Store state before potential change

        // Calculate vertical orientation (-1 down, +1 up) using standard angle convention
        // p5.js sin() uses DEGREES because angleMode(DEGREES) is set in setup()
        let verticalPointing = sin(this.angle);

        // Define thresholds based on sine of original angles
        const STALL_ENTRY_SIN_THRESHOLD = sin(STALL_ANGLE_THRESHOLD); // sin(-70) approx -0.9397
        const STALL_RECOVERY_SIN_THRESHOLD = sin(STALL_RECOVERY_ANGLE); // sin(-50) approx -0.7660

        if (!this.isOnGround) { // Only check stall state if airborne
            if (!this.isStalled) {
                // --- Check for Entering a Stall (SAME FOR BOTH PLANES) ---
                // Stall if pointing steeply up (sin very negative)
                let enterStall = (verticalPointing < STALL_ENTRY_SIN_THRESHOLD);

                if (enterStall) {
                     this.isStalled = true;
                     if (!currentlyStalled) { console.log(`Plane ${this.id} stalled! Angle: ${checkAngle.toFixed(1)} Sin: ${verticalPointing.toFixed(3)} [Entry]`); }
                }
            } else {
                // --- Check for Exiting Stall (if currently stalled - SAME FOR BOTH PLANES) ---
                // Recover if pointing less steeply up (sin less negative)
                let exitStall = (verticalPointing > STALL_RECOVERY_SIN_THRESHOLD);

                 if (exitStall) {
                     this.isStalled = false;
                     if (currentlyStalled) { console.log(`Plane ${this.id} recovered! Angle: ${checkAngle.toFixed(1)} Sin: ${verticalPointing.toFixed(3)} [Exit]`); }
                 }
            }
        } else { // If on ground, ensure stall is false
            if (this.isStalled) {
                this.isStalled = false;
            }
        }
        // --- END: Determine Stall State ---


        // --- Forces ---
        let thrustVector = createVector(0, 0);
        let currentThrustForce = THRUST_FORCE; // Start with base thrust
        if (this.activePowerUp === 'SpeedBoost') { currentThrustForce *= 1.6; }

        // APPLY STALL EFFECT TO THRUST
        if (this.isStalled) {
            currentThrustForce *= STALL_EFFECT_FACTOR; // Reduce thrust force if stalled
        }

        // Calculate final thrust vector if thrusting
        if (this.isThrusting) {
             thrustVector = p5.Vector.fromAngle(radians(this.angle), currentThrustForce);
        }


        // --- Physics based on Grounded vs Airborne ---
        if (this.isOnGround) {
            // Apply ground friction
            this.velocity.x *= GROUND_FRICTION;

            // Determine if angled correctly for thrusting along ground or slightly up
            let isAngledUpSlightly = (this.id === 1) ? (this.angle < -5 && this.angle > -90) : (normAngle > 185 && normAngle < 270);

            // Apply thrust
            if (this.isThrusting) {
                if (isAngledUpSlightly) {
                    this.applyForce(createVector(thrustVector.x, thrustVector.y * 0.15));
                } else {
                    this.applyForce(createVector(thrustVector.x, 0));
                }
            }

            // Apply gravity (stronger on ground if not trying to take off)
             if (!this.isThrusting || !isAngledUpSlightly) {
                 this.applyForce(createVector(0, GRAVITY_FORCE * 2));
             } else {
                 this.applyForce(createVector(0, GRAVITY_FORCE * 0.5)); // Less gravity when trying takeoff
             }

        } else { // --- Airborne Physics ---
            // Apply thrust (already calculated with potential stall reduction)
            this.applyForce(thrustVector);

            // Calculate base lift
            let speed = this.velocity.mag();
            let liftMagnitude = speed * LIFT_FACTOR;

            // --- Apply Rain Effect (Conditional) ---
            if (isCurrentlyRaining) { // Check the global variable
                 liftMagnitude *= RAIN_LIFT_REDUCTION_FACTOR;
            }
            // --- End Rain Effect ---

            // --- Apply stall effect to lift (if currently stalled) ---
            if (this.isStalled) {
                liftMagnitude *= STALL_EFFECT_FACTOR; // Drastically reduce lift
            }

            // Apply lift force (perpendicular upwards relative to world)
            let liftForce = createVector(0, -liftMagnitude);
            this.applyForce(liftForce);

            // Apply gravity
            this.applyForce(createVector(0, GRAVITY_FORCE));

            // Apply air drag
            this.velocity.mult(DAMPING_FACTOR);
        } // End of Airborne vs Grounded block

        // --- Update Position ---
        this.position.add(this.velocity);

        // --- Ground Interaction / State Changes (Post-Position Update) ---
        let groundCheckY = GROUND_Y - this.size * 0.8;

        // Check for Landing
        if (this.position.y >= groundCheckY && !this.isOnGround) {
             let isTooSteep = (normAngle > 45 && normAngle < 135) || (normAngle > 225 && normAngle < 315);
             let verticalSpeed = this.velocity.y;

             // Check for crash landing
             if ((verticalSpeed > MAX_LANDING_SPEED || isTooSteep) && this.activePowerUp !== 'Shield') {
                 console.log(`Plane ${this.id} CRASH LANDED! V Speed: ${verticalSpeed.toFixed(2)}, Angle: ${this.angle.toFixed(1)}, TooSteep: ${isTooSteep}`);
                 this.hit(true); // Crash counts as a hit
                 return; // Stop update if crashed
             }
             else { // Safe landing (or shield absorbed impact)
                 this.isOnGround = true;
                 this.isStalled = false; // Ensure stall is off upon landing
                 this.position.y = groundCheckY; // Snap to ground level
                 this.velocity.y = 0; // Stop vertical movement

                 if (this.activePowerUp === 'Shield' && (verticalSpeed > MAX_LANDING_SPEED || isTooSteep)) {
                     console.log(`Plane ${this.id} Shield absorbed hard landing!`);
                     this.powerUpTimer = max(0, this.powerUpTimer - POWERUP_DURATION_FRAMES * 0.5);
                 } else {
                     /* console.log(`Plane ${this.id} landed safely. V Speed: ${verticalSpeed.toFixed(2)}`); */
                 }
             }
        }
        // Check for Takeoff / Keep on ground
        else if (this.isOnGround) {
            // Ensure plane stays on ground if it dips slightly below
            if (this.position.y > groundCheckY) {
                this.position.y = groundCheckY;
                if(this.velocity.y > 0) this.velocity.y = 0;
            }

            // Check takeoff conditions
            let horizontalSpeed = abs(this.velocity.x);
            let isAngledForTakeoff = false;
            if (this.id === 1) { // Plane 1 angled up (negative angles)
                isAngledForTakeoff = (this.angle < -5 && this.angle > -85);
            } else { // Plane 2 angled up (angles > 180)
                isAngledForTakeoff = (normAngle > 185 && normAngle < 265);
            }

            // Execute takeoff
            if (this.isThrusting && isAngledForTakeoff && horizontalSpeed > MIN_TAKEOFF_SPEED) {
                this.isOnGround = false;
                this.isStalled = false; // Reset stall state on takeoff
                this.velocity.y -= THRUST_FORCE * 0.6; // Give a little initial lift boost
                console.log(`Plane ${this.id} took off. Speed: ${horizontalSpeed.toFixed(2)}`);
            }
        }


        // --- Boundary Constraints ---
        if (this.position.x > width + this.size) { this.position.x = -this.size; }
        else if (this.position.x < -this.size) { this.position.x = width + this.size; }
        if (this.position.y < this.size / 2) { // Ceiling boundary
            this.position.y = this.size / 2;
            if (this.velocity.y < 0) { this.velocity.y = 0; } // Stop upward velocity at ceiling
        }

        // --- Collisions & Sound (if still alive after potential crash landing) ---
        if (!this.isAlive) return; // Double check after landing/crash check

        // Hut Collision - Pass the hut object
        if (this.checkCollisionHut(hut)) return; // hit() called inside checkCollisionHut

        // Balloon Collision
        if (balloon.isAlive) {
            let planeCollisionRadius = this.size * 0.9;
            let distance = dist(this.position.x, this.position.y, balloon.pos.x, balloon.pos.y);
            let combinedRadius = planeCollisionRadius + balloon.radius;

            if (distance < combinedRadius) {
                if (this.activePowerUp === 'Shield') {
                    // Shield pops balloon
                    console.log(`Plane ${this.id} Shield popped balloon!`);
                    balloon.hit(); // Balloon handles score/powerup drop
                    this.powerUpTimer = max(0, this.powerUpTimer - POWERUP_DURATION_FRAMES * 0.3); // Reduce shield timer
                } else {
                    // Plane crashes into balloon
                    console.log(`Plane ${this.id} crashed into balloon!`);
                    this.hit(true); // Plane crashes
                    return; // Stop update
                }
            }
        }


        // --- Engine Sound ---
        if (this.isAlive && this.engineSound && audioStarted && soundNodesStarted) {
            let speed = this.velocity.mag();
            let targetFreq = map(speed, 0, MAX_SPEED_FOR_SOUND, BASE_ENGINE_FREQ, MAX_ENGINE_FREQ, true);
            let targetAmp = this.isThrusting ? MAX_ENGINE_AMP : BASE_ENGINE_AMP;

            // Adjust sound for stall/boost
            if (this.isStalled) { targetAmp *= 0.5; targetFreq *= 0.8; } // Sound reflects stall state
            if (this.activePowerUp === 'SpeedBoost') { targetFreq *= 1.1; targetAmp *= 1.1; }

            // Smoothly adjust amp/freq
            if (abs(this.engineSound.getAmp() - targetAmp) > 0.001 || targetAmp > 0.01) {
                this.engineSound.amp(targetAmp, 0.1);
            } else if (targetAmp < 0.01 && this.engineSound.getAmp() > 0) {
                 this.engineSound.amp(0, 0.1); // Ramp down completely if stopped/gliding
            }
            this.engineSound.freq(targetFreq, 0.1);
        }
        // Ensure sound stops if plane becomes not alive (redundant check, but safe)
        else if (this.engineSound && this.engineSound.getAmp() > 0) {
            this.engineSound.amp(0, 0.0);
        }
    } // --- End of update() method ---

    display() { push(); translate(this.position.x, this.position.y); rotate(this.angle); if (this.id === 2) { scale(1, -1); } if (this.respawnTimer > 0 && floor(this.respawnTimer / 8) % 2 === 0) { /* Flicker */ } else { stroke(0); strokeWeight(1.5); let pp = this.planePoints; fill(red(this.wingColor)*0.8, green(this.wingColor)*0.8, blue(this.wingColor)*0.8); beginShape(); for(let p of pp.bottomWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.accentColor); beginShape(); for(let p of pp.tailplane) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.fuselage) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.wingColor); beginShape(); for(let p of pp.topWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.rudder) { vertex(p.x, p.y); } endShape(CLOSE); noFill(); stroke(0, 150); strokeWeight(1.5); if (pp.cockpit.length >= 2) { beginShape(); curveVertex(pp.cockpit[0].x, pp.cockpit[0].y); for(let p of pp.cockpit) { curveVertex(p.x, p.y); } curveVertex(pp.cockpit[pp.cockpit.length - 1].x, pp.cockpit[pp.cockpit.length - 1].y); endShape(); } if (this.isOnGround || (!this.isOnGround && this.position.y > GROUND_Y - this.size * 3) || (!this.isOnGround && this.velocity.y > 0.3)) { fill(40); noStroke(); ellipse(pp.wheels[0].x, pp.wheels[0].y, pp.wheelRadius * 2, pp.wheelRadius * 2); ellipse(pp.wheels[1].x, pp.wheels[1].y, pp.wheelRadius * 2, pp.wheelRadius * 2); stroke(60); strokeWeight(3); line(pp.wheels[0].x, pp.wheels[0].y - pp.wheelRadius, pp.bottomWing[1].x * 0.8, pp.bottomWing[1].y - this.size * 0.1); line(pp.wheels[1].x, pp.wheels[1].y - pp.wheelRadius, pp.bottomWing[2].x * 0.8, pp.bottomWing[2].y - this.size * 0.1); } noStroke(); let noseX = this.size * 0.85; let propHeight = this.size * 0.9; let propWidthRunning = this.size * 0.15; let propWidthStopped = this.size * 0.05; let engineRunning = this.isThrusting || (this.velocity.magSq() > 0.5); if (engineRunning) { fill(PROPELLER_BLUR_COLOR); ellipse(noseX, 0, propWidthRunning, propHeight); } else { fill(PROPELLER_STOPPED_COLOR); rect(noseX, 0, propWidthStopped, propHeight); } fill(this.accentColor); ellipse(noseX, 0, this.size * 0.2, this.size * 0.2); if (this.activePowerUp === 'Shield' && this.powerUpTimer > 0) { let shieldAlpha = SHIELD_COLOR[3] * (0.7 + sin(frameCount * 4) * 0.3); if (this.powerUpTimer < 120 && floor(frameCount / 5) % 2 === 0) { shieldAlpha = 0; } fill(SHIELD_COLOR[0], SHIELD_COLOR[1], SHIELD_COLOR[2], shieldAlpha); noStroke(); ellipse(0, 0, this.size * 2.8, this.size * 2.2); } } pop(); noStroke(); }

    shoot() {
        let isAngledForShootingOnGround = false; let normalizedAngle = (this.angle % 360 + 360) % 360;
        if (this.id === 1) { isAngledForShootingOnGround = (this.angle < -10 && this.angle > -170); }
        else { isAngledForShootingOnGround = (normalizedAngle > 190 && normalizedAngle < 350); }
        let canShoot = !this.isOnGround || (this.isOnGround && isAngledForShootingOnGround);

        let currentCooldown = SHOOT_COOLDOWN_FRAMES;
        if (this.activePowerUp === 'RapidFire') { currentCooldown = SHOOT_COOLDOWN_FRAMES / 2.5; }
        else if (this.activePowerUp === 'TripleShot') { currentCooldown = SHOOT_COOLDOWN_FRAMES * 1.5; }
        else if (this.activePowerUp === 'Bomb') { currentCooldown = SHOOT_COOLDOWN_FRAMES * 2.0; }

        if (this.shootCooldown <= 0 && this.isAlive && canShoot && audioStarted && soundNodesStarted) {

            if (this.activePowerUp === 'Bomb') {
                // Drop Bomb
                let originOffsetDistanceBomb = -this.size * 0.3; // Bomb drops from below/behind
                let originOffsetVectorBomb = createVector(originOffsetDistanceBomb, 0);
                let rotatedOffsetBomb = originOffsetVectorBomb.copy().rotate(this.angle);
                let spawnPosBomb = p5.Vector.add(this.position, rotatedOffsetBomb);
                let newBomb = new Bomb(spawnPosBomb.x, spawnPosBomb.y, this.id, this.velocity);
                bombs.push(newBomb);

                // ALSO Shoot a Bullet
                let originOffsetDistanceBullet = this.size * 0.9; // Bullet from the front
                let originOffsetVectorBullet = createVector(originOffsetDistanceBullet, 0);
                let rotatedOffsetBullet = originOffsetVectorBullet.copy().rotate(this.angle);
                let spawnPosBullet = p5.Vector.add(this.position, rotatedOffsetBullet);
                let bulletAngle = this.angle;
                let newBullet = new Bullet(spawnPosBullet.x, spawnPosBullet.y, bulletAngle, this.id, this.bodyColor);
                bullets.push(newBullet);

                if (bombDropSound && audioStarted && soundNodesStarted) { bombDropSound.play(shootNoise); } // Only play bomb drop sound

            } else if (this.activePowerUp === 'TripleShot') {
                // Fire Triple Bullets
                let originOffsetDistance = this.size * 0.9; // Bullets from front
                let originOffsetVector = createVector(originOffsetDistance, 0);
                let rotatedOffset = originOffsetVector.copy().rotate(this.angle);
                let spawnPos = p5.Vector.add(this.position, rotatedOffset);

                let baseAngle = this.angle; let angle1 = baseAngle - TRIPLE_SHOT_SPREAD_ANGLE; let angle2 = baseAngle; let angle3 = baseAngle + TRIPLE_SHOT_SPREAD_ANGLE;
                bullets.push(new Bullet(spawnPos.x, spawnPos.y, angle1, this.id, this.bodyColor));
                bullets.push(new Bullet(spawnPos.x, spawnPos.y, angle2, this.id, this.bodyColor));
                bullets.push(new Bullet(spawnPos.x, spawnPos.y, angle3, this.id, this.bodyColor));
                shootSoundEnv.play(shootNoise);

            } else {
                // Fire Single Bullet (RapidFire handled by lower cooldown)
                 let originOffsetDistance = this.size * 0.9; // Bullet from front
                 let originOffsetVector = createVector(originOffsetDistance, 0);
                 let rotatedOffset = originOffsetVector.copy().rotate(this.angle);
                 let spawnPos = p5.Vector.add(this.position, rotatedOffset);

                 let bulletAngle = this.angle;
                 let newBullet = new Bullet(spawnPos.x, spawnPos.y, bulletAngle, this.id, this.bodyColor);
                 bullets.push(newBullet);
                 shootSoundEnv.play(shootNoise);
            }
            this.shootCooldown = currentCooldown; // Set cooldown after firing
        }
    }


    checkCollisionHut(hutObj) {
        // Pass the actual hut object
        if (!this.isAlive || this.respawnTimer > 0 || !hutObj || hutObj.destroyed) return false; // Check if hut is destroyed
        if (this.activePowerUp === 'Shield') return false;

        // Simple AABB check first (faster rejection)
        let s = this.size; let halfW = s * 1.2; let halfH = s * 0.75;
        let planeMinX = this.position.x - max(halfW, halfH); // Rough bounding box
        let planeMaxX = this.position.x + max(halfW, halfH);
        let planeMinY = this.position.y - max(halfW, halfH);
        let planeMaxY = this.position.y + max(halfW, halfH);

        let hutMinX = hutObj.x - hutObj.w / 2;
        let hutMaxX = hutObj.x + hutObj.w / 2;
        let hutMinY = hutObj.y - hutObj.h / 2;
        let hutMaxY = hutObj.y + hutObj.h / 2;

        if (planeMaxX < hutMinX || planeMinX > hutMaxX || planeMaxY < hutMinY || planeMinY > hutMaxY) {
            return false; // No collision based on rough bounding boxes
        }

        // More precise check (optional, but better if needed)
        // Could use Separating Axis Theorem or point-in-rectangle check with rotated plane points
        // For simplicity, let's stick with a slightly generous bounding box check for now
        // Re-evaluate if collisions feel too inaccurate

        let collisionOccurred = (planeMaxX > hutMinX && planeMinX < hutMaxX && planeMaxY > hutMinY && planeMinY < hutMaxY);

        if (collisionOccurred) {
            console.log(`Plane ${this.id} hit hut!`);
            this.hit(true); // Hit caused by crash
            return true;
        }
        return false;
    }


    hit(causedByCrashOrBomb, bullet = null) {
        if (!this.isAlive) return false;
        if (this.activePowerUp === 'Shield' && !causedByCrashOrBomb && bullet) {
             console.log(`Plane ${this.id} Shield deflected bullet!`);
             if (audioStarted && soundNodesStarted) { shieldDeflectSound.play(shootNoise); }
             this.powerUpTimer = max(0, this.powerUpTimer - POWERUP_DURATION_FRAMES * 0.1);
             return false;
        }
        console.log(`Plane ${this.id} HIT! ${causedByCrashOrBomb ? "(Crash/Hut/Balloon/Bomb)" : "(Bullet)"}`);
        this.isAlive = false; this.isOnGround = false; this.isStalled = false; this.activePowerUp = null; this.powerUpTimer = 0;
        this.velocity = createVector(random(-1.5, 1.5), -2.5); this.respawnTimer = RESPAWN_DELAY_FRAMES;
        createExplosion(this.position.x, this.position.y, 35, EXPLOSION_COLORS);
        if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0);
        if (causedByCrashOrBomb && bullet === null) {
             if (this.id === 1) { score2++; console.log("Crash/Bomb/Hut! Point for Player 2!"); }
             else { score1++; console.log("Crash/Bomb/Hut! Point for Player 1!"); }
        }
        return true;
    }

    respawn() { let startX = (this.id === 1) ? width * 0.1 : width * 0.9; let startY = GROUND_Y - this.size * 0.8; this.startPos = createVector(startX, startY); this.position = this.startPos.copy(); this.velocity = createVector(0, 0); this.angle = (this.id === 2) ? 180 : 0; this.isAlive = true; this.isOnGround = true; this.isStalled = false; this.activePowerUp = null; this.powerUpTimer = 0; this.shootCooldown = SHOOT_COOLDOWN_FRAMES / 2; console.log(`Plane ${this.id} Respawned.`); if (this.engineSound && audioStarted && soundNodesStarted) { this.engineSound.freq(BASE_ENGINE_FREQ, 0.1); this.engineSound.amp(BASE_ENGINE_AMP, 0.1); } }
    collectPowerUp(type) { if (!this.isAlive || this.respawnTimer > 0) return; console.log(`Plane ${this.id} collected ${type}!`); this.activePowerUp = type; this.powerUpTimer = POWERUP_DURATION_FRAMES; if (audioStarted && soundNodesStarted) { powerUpCollectSound.play(explosionNoise); } }
}

// ======================
// --- Bullet Class ---
// ======================
class Bullet { constructor(x, y, angle, ownerId, planeColor) { this.position = createVector(x, y); this.velocity = p5.Vector.fromAngle(radians(angle), BULLET_SPEED); this.ownerId = ownerId; this.size = 8; this.life = 150; this.planeColor = planeColor; this.coreColor = color(BULLET_CORE_BRIGHTNESS); this.trailColor = color(red(planeColor), green(planeColor), blue(planeColor), BULLET_TRAIL_ALPHA); } update() { this.position.add(this.velocity); this.life--; } display() { push(); translate(this.position.x, this.position.y); rotate(degrees(this.velocity.heading())); strokeWeight(2.5); stroke(this.trailColor); line(-this.size * 0.6, 0, this.size * 0.4, 0); strokeWeight(1.5); stroke(this.coreColor); line(-this.size * 0.4, 0, this.size * 0.2, 0); pop(); noStroke(); } isOffscreen() { return (this.life <= 0 || this.position.x < -this.size || this.position.x > width + this.size || this.position.y < -this.size || this.position.y > height + this.size); } checkCollision(plane) { if (plane.id === this.ownerId || !plane.isAlive || plane.respawnTimer > 0) { return false; } let collisionRadius = plane.size * 0.8; let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y); return distance < (collisionRadius + this.size / 2); }
    // Updated checkCollisionHut to accept the hut object
    checkCollisionHut(hutObj) {
        if (!hutObj || hutObj.destroyed) return false; // Check if hut exists and is not destroyed
        return (this.position.x > hutObj.x - hutObj.w / 2 && this.position.x < hutObj.x + hutObj.w / 2 && this.position.y > hutObj.y - hutObj.h / 2 && this.position.y < hutObj.y + hutObj.h / 2);
    }
}

// =====================
// --- Cloud Class ---
// =====================
 class Cloud { constructor() { this.pos = createVector(0,0); this.vel = createVector(0,0); this.size = 100; this.puffOffsets = []; this.numPuffs = 7; this.opacity = 200; this.speedFactor = 1; this.direction = 1; this.reset(); this.pos.x = random(width); } reset() { this.direction = random() < 0.5 ? -1 : 1; this.size = random(100, 190); let startX = this.direction > 0 ? -this.size * 1.5 : width + this.size * 1.5; this.pos = createVector(startX, random(height * 0.1, height * 0.6)); this.speedFactor = random(0.5, 1.5); this.vel = createVector(CLOUD_BASE_SPEED * this.direction * this.speedFactor, 0); this.numPuffs = floor(random(6, 12)); this.puffOffsets = []; for (let i = 0; i < this.numPuffs; i++) { let puffX = random(-this.size * 0.7, this.size * 0.7); let puffY = random(-this.size * 0.3, this.size * 0.3); let puffR = random(this.size * 0.4, this.size * 0.9) * random(0.8, 1.2); this.puffOffsets.push({ x: puffX, y: puffY, r: puffR }); } this.opacity = random(190, 240); }
     update() {
         this.pos.add(this.vel);
         if ( (this.vel.x > 0 && this.pos.x - this.size * 1.5 > width) || (this.vel.x < 0 && this.pos.x + this.size * 1.5 < 0) ) { this.reset(); }
         if (this.pos.y < -this.size || this.pos.y > height + this.size) { this.reset(); }
     }
     display() { push(); noStroke(); translate(this.pos.x, this.pos.y); fill(CLOUD_SHADOW[0], CLOUD_SHADOW[1], CLOUD_SHADOW[2], this.opacity * 0.6); ellipse(0, this.size * 0.25, this.size * 1.3, this.size * 0.7); fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], this.opacity); for (let puff of this.puffOffsets) { ellipse(puff.x, puff.y, puff.r, puff.r * 0.85); } pop(); }
 }

// ==========================
// --- Hot Air Balloon Class ---
// ==========================
class Balloon { constructor(x, y) { this.basePos = createVector(x, y); this.pos = this.basePos.copy(); this.bobbleOffset = 0; this.bobbleSpeed = 0.6; this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.radius = 30; this.visualRadius = 30; this.basketSize = { w: 25, h: 18 }; this.ropeLength = 25; this.isAlive = true; this.respawnTimer = 0; } update() { if (this.respawnTimer > 0) { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); } return; } if (!this.isAlive) return; this.bobbleOffset = sin(frameCount * this.bobbleSpeed) * 6; this.basePos.x += this.driftSpeed; if (this.driftSpeed > 0 && this.basePos.x > width + this.visualRadius * 2) { this.basePos.x = -this.visualRadius * 2; } else if (this.driftSpeed < 0 && this.basePos.x < -this.visualRadius * 2) { this.basePos.x = width + this.visualRadius * 2; } this.pos.y = this.basePos.y + this.bobbleOffset; this.pos.x = this.basePos.x; } display() { if (this.respawnTimer > 0 && !this.isAlive) { if (floor(this.respawnTimer / 8) % 2 !== 0) { return; } } else if (!this.isAlive && this.respawnTimer <= 0) { return; } push(); translate(this.pos.x, this.pos.y); noStroke(); let basketTopY = this.visualRadius * 0.8 + this.ropeLength; let basketBottomY = basketTopY + this.basketSize.h; let basketCenterX = 0; stroke(BALLOON_ROPE); strokeWeight(1.5); line(basketCenterX - this.basketSize.w * 0.4, basketTopY, -this.visualRadius * 0.5, this.visualRadius * 0.7); line(basketCenterX + this.basketSize.w * 0.4, basketTopY, this.visualRadius * 0.5, this.visualRadius * 0.7); line(basketCenterX, basketTopY - 3, 0, this.visualRadius * 0.8); fill(BALLOON_BASKET); rect(basketCenterX, basketTopY + this.basketSize.h / 2, this.basketSize.w, this.basketSize.h, 3); fill(BALLOON_BASKET[0]*0.8, BALLOON_BASKET[1]*0.8, BALLOON_BASKET[2]*0.8); rect(basketCenterX, basketTopY + 2, this.basketSize.w, 4, 2); stroke(BALLOON_BASKET[0]*0.7, BALLOON_BASKET[1]*0.7, BALLOON_BASKET[2]*0.7, 180); strokeWeight(1); for(let i = 1; i < 4; i++){ line(basketCenterX - this.basketSize.w/2, basketTopY + i * (this.basketSize.h/4), basketCenterX + this.basketSize.w/2, basketTopY + i*(this.basketSize.h/4)); } for(let i = 1; i < 5; i++){ line(basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketTopY, basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketBottomY); } noStroke(); let numPanels = BALLOON_COLORS.length * 2; for (let i = 0; i < numPanels; i++) { fill(BALLOON_COLORS[i % BALLOON_COLORS.length]); arc(0, 0, this.visualRadius * 2.1, this.visualRadius * 2.3, i * (360.0 / numPanels) - 90 - (360.0/numPanels)*0.1, (i + 1) * (360.0 / numPanels) - 90 + (360.0/numPanels)*0.1, PIE); } noFill(); stroke(255, 255, 255, 30); strokeWeight(this.visualRadius * 0.5); arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, -150, -30); stroke(0, 0, 0, 40); strokeWeight(this.visualRadius * 0.6); arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, 30, 150); pop(); noStroke(); } hit() { if (!this.isAlive) return; console.log("Balloon HIT!"); this.isAlive = false; this.respawnTimer = BALLOON_RESPAWN_FRAMES; createExplosion(this.pos.x, this.pos.y, 25, EXPLOSION_COLORS.slice(0, 3).concat([BALLOON_BASKET])); let powerUpType = random(POWERUP_TYPES); let newPowerUp = new PowerUp(this.pos.x, this.pos.y, powerUpType); powerUps.push(newPowerUp); console.log(`Balloon dropped ${powerUpType}`); if(audioStarted && soundNodesStarted) { powerUpSpawnSound.play(explosionNoise); } } respawn() { this.isAlive = true; this.basePos.x = random(width * 0.1, width * 0.9); this.basePos.y = random(height * 0.15, height * 0.55); this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.pos = this.basePos.copy(); this.bobbleOffset = 0; console.log("Balloon Respawned at", this.basePos.x.toFixed(0), this.basePos.y.toFixed(0)); } checkCollision(bullet) { if (!this.isAlive) return false; let distance = dist(this.pos.x, this.pos.y, bullet.position.x, bullet.position.y); return distance < this.radius + bullet.size / 2; } }

// =======================
// --- Particle Class ---
// =======================
 class Particle { constructor(x, y, baseColor) { this.pos = createVector(x, y); let angle = random(360); let speed = random(1, 5); this.vel = p5.Vector.fromAngle(radians(angle), speed); this.vel.y += random(-0.5, 0.5); this.lifespan = random(30, 70); this.baseColor = color(baseColor); this.size = random(4, 12); this.decay = random(0.88, 0.96); this.gravity = 0.05; } update() { this.pos.add(this.vel); this.vel.mult(0.95); this.vel.y += this.gravity; this.lifespan -= 1; this.size *= this.decay; } display() { push(); noStroke(); let currentAlpha = map(this.lifespan, 0, 50, 0, alpha(this.baseColor)); fill(red(this.baseColor), green(this.baseColor), blue(this.baseColor), max(0, currentAlpha)); ellipse(this.pos.x, this.pos.y, this.size, this.size); pop(); } isDead() { return this.lifespan <= 0 || this.size < 1; } }

// ===============================================
// --- Helper Function to Create Explosions ---
// ===============================================
 function createExplosion(x, y, count, colors, isBomb = false) {
     if (audioStarted && soundNodesStarted) {
         if (isBomb) {
             bombExplosionSoundEnv.play(bombExplosionNoise);
         } else {
             explosionSoundEnv.play(explosionNoise);
         }
     }
     if (particles.length > MAX_PARTICLES) return;
     for (let i = 0; i < count; i++) { let chosenColor = random(colors); if (particles.length < MAX_PARTICLES) { particles.push(new Particle(x, y, chosenColor)); } else { break; } }
 }

// ==========================
// --- PowerUp Class ---
// ==========================
class PowerUp { constructor(x, y, type) { this.position = createVector(x, y); this.velocity = createVector(random(-0.5, 0.5), POWERUP_FALL_SPEED); this.type = type; this.color = color(POWERUP_COLORS[type] || [255, 255, 255]); this.size = POWERUP_SIZE; this.lifespan = POWERUP_DURATION_FRAMES * 1.5; this.rotation = 0; this.rotationSpeed = random(-2, 2); }
    update() { this.position.add(this.velocity); this.velocity.y += GRAVITY_FORCE * 0.2; this.velocity.mult(0.99); this.lifespan--; this.rotation += this.rotationSpeed; if (this.position.y > GROUND_Y - this.size / 2) { this.position.y = GROUND_Y - this.size / 2; this.velocity.y *= -0.4; this.velocity.x *= 0.8; } }
    display() { push(); translate(this.position.x, this.position.y); rotate(this.rotation); stroke(0); strokeWeight(2); fill(this.color);
        if (this.type === 'RapidFire') { for (let i = 0; i < 4; i++) { rect(0, 0, this.size * 0.3, this.size * 0.8, 2); rotate(45); } fill(255,255,255); noStroke(); ellipse(0,0, this.size*0.3, this.size*0.3); }
        else if (this.type === 'SpeedBoost') { beginShape(); vertex(0, -this.size * 0.6); vertex(this.size * 0.5, 0); vertex(0, this.size * 0.2); vertex(-this.size * 0.5, 0); endShape(CLOSE); stroke(255,255,255, 150); strokeWeight(1.5); line(0, -this.size*0.2, 0, this.size*0.5); line(-this.size*0.2, this.size*0.1, -this.size*0.2, this.size*0.6); line(this.size*0.2, this.size*0.1, this.size*0.2, this.size*0.6); }
        else if (this.type === 'Shield') { ellipse(0, 0, this.size, this.size); fill(255, 255, 255, 180); noStroke(); ellipse(0, 0, this.size * 0.6, this.size * 0.6); }
        else if (this.type === 'TripleShot') { let w = this.size * 0.2; let h = this.size * 0.5; let spacing = w * 1.5; rect(-spacing, 0, w, h, 1); rect(0, 0, w, h, 1); rect(spacing, 0, w, h, 1); }
        else if (this.type === 'Bomb') { ellipse(0, 0, this.size, this.size); fill(0); noStroke(); ellipse(0, 0, this.size*1.05, this.size*1.05); fill(this.color); ellipse(0, 0, this.size, this.size); stroke(255, 200, 0); strokeWeight(2.5); noFill(); arc(0, -this.size * 0.4, this.size*0.4, this.size*0.4, 180, 300); fill(255, 50, 0); noStroke(); ellipse(this.size*0.2*cos(300), -this.size*0.4 + this.size*0.2*sin(300), 4, 4); }
        else { rect(0, 0, this.size, this.size); }
        pop(); noStroke(); }
    isOffscreen() { return this.lifespan <= 0 || this.position.y > height + this.size * 2; }
    checkCollision(plane) { if (!plane.isAlive || plane.respawnTimer > 0) return false; let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y); return distance < plane.size * 0.8 + this.size / 2; }
}

// ==========================
// --- Bomb Class ---
// ==========================
class Bomb {
    constructor(x, y, ownerId, planeVelocity) {
        this.position = createVector(x, y);
        this.velocity = planeVelocity.copy().mult(0.5);
        this.velocity.y += BOMB_DROP_VELOCITY_Y;
        this.ownerId = ownerId; this.size = 12; this.fuseTimer = BOMB_FUSE_FRAMES;
        this.rotation = random(360); this.rotationSpeed = random(-1, 1) * (this.velocity.x > 0 ? 1 : -1);
    }
    update() { this.position.add(this.velocity); this.velocity.y += GRAVITY_FORCE * 1.5; this.velocity.mult(0.985); this.fuseTimer--; this.rotation += this.rotationSpeed; }
    display() { push(); translate(this.position.x, this.position.y); rotate(this.rotation); fill(50); stroke(80); strokeWeight(1); ellipse(0, 0, this.size * 1.2, this.size); fill(90); noStroke(); triangle(-this.size * 0.6, 0, -this.size * 0.9, -this.size * 0.3, -this.size * 0.9, this.size * 0.3); if (floor(this.fuseTimer / max(5, this.fuseTimer * 0.2)) % 2 === 0) { fill(255, 50 + (BOMB_FUSE_FRAMES - this.fuseTimer)*2, 0); ellipse(this.size * 0.5, 0, 4, 4); } pop(); noStroke(); }

    explode(hutObj) { // Accept hut object
        console.log("Bomb Exploded!");
        createExplosion(this.position.x, this.position.y, BOMB_EXPLOSION_PARTICLES, BOMB_EXPLOSION_COLORS, true); // Base explosion

        // Plane Collision Check
        let p1Dist = dist(this.position.x, this.position.y, plane1.position.x, plane1.position.y);
        let p2Dist = dist(this.position.x, this.position.y, plane2.position.x, plane2.position.y);
        if (plane1.isAlive && p1Dist < BOMB_EXPLOSION_RADIUS + plane1.size * 0.5) {
            console.log("Bomb hit Plane 1!");
            let hitSuccess = plane1.hit(true); // Hit caused by Bomb
            if (hitSuccess && this.ownerId !== plane1.id) { score2++; console.log("Bomb! Point P2");}
        }
        if (plane2.isAlive && p2Dist < BOMB_EXPLOSION_RADIUS + plane2.size * 0.5) {
            console.log("Bomb hit Plane 2!");
            let hitSuccess = plane2.hit(true); // Hit caused by Bomb
            if (hitSuccess && this.ownerId !== plane2.id) { score1++; console.log("Bomb! Point P1"); }
        }

        // Hut Destruction/Damage Check
        if (hutObj) { // Make sure hut object exists
             let hutDist = dist(this.position.x, this.position.y, hutObj.x, hutObj.y);
             let collisionThresholdHut = BOMB_EXPLOSION_RADIUS + max(hutObj.w, hutObj.h) * 0.5; // Collision radius check

             if (!hutObj.destroyed && hutDist < collisionThresholdHut) {
                 // Destroy the hut - call the helper function
                 destroyHut(hutObj);
             } else if (hutObj.destroyed && hutDist < collisionThresholdHut) {
                 // Optional: Smaller effect if bomb hits existing rubble
                 // console.log("Bomb hit hut rubble!");
                 createExplosion(this.position.x, this.position.y, 10, HUT_RUBBLE_COLORS, true);
             }
        }
    }

     checkCollision(plane) { if (!plane.isAlive || plane.respawnTimer > 0) return false; let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y); return distance < plane.size * 0.7 + this.size / 2; }

     // Updated checkCollisionHut to accept the hut object
     checkCollisionHut(hutObj) {
        if (!hutObj || hutObj.destroyed) return false; // Check if hut exists and is not destroyed
        return (this.position.x > hutObj.x - hutObj.w / 2 && this.position.x < hutObj.x + hutObj.w / 2 && this.position.y > hutObj.y - hutObj.h / 2 && this.position.y < hutObj.y + hutObj.h / 2);
     }

     checkCollisionGround() { return this.position.y >= GROUND_Y - this.size / 2; }
    isOffscreen() { return (this.fuseTimer < -300 && (this.position.y > height + this.size * 5 || this.position.x < -width || this.position.x > width*2)); }
}

// ===============================
// --- RainDrop Class ---
// ===============================
class RainDrop {
    constructor() { this.reset(); }
    reset() { this.z = random(0.2, 1); this.pos = createVector(random(width * 1.2), random(-height * 0.5, -20)); this.len = map(this.z, 0.2, 1, 4, 12); this.ySpeed = map(this.z, 0.2, 1, 4, 10); this.vel = createVector(0, this.ySpeed); }
    update() { this.pos.add(this.vel); if (this.pos.y > GROUND_Y + this.len) { this.reset(); } }
    display() { push(); let alpha = map(this.z, 0.2, 1, 80, 200); let weight = map(this.z, 0.2, 1, 0.5, 1.5); stroke(RAINDROP_COLOR[0], RAINDROP_COLOR[1], RAINDROP_COLOR[2], alpha); strokeWeight(weight); line(this.pos.x, this.pos.y, this.pos.x, this.pos.y + this.len); pop(); noStroke(); }
}


// --- END OF FILE sketch.js ---