// --- START OF FILE sketch.js ---

// --- Game Configuration ---
const GRAVITY_FORCE = 0.1; // Adjusted gravity
const THRUST_FORCE = 0.16;
const LIFT_FACTOR = 0.012; // How much lift is generated per unit of speed
const TURN_SPEED = 2.5;
const DAMPING_FACTOR = 0.985;
const GROUND_FRICTION = 0.95;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN_FRAMES = 18;
const RESPAWN_DELAY_FRAMES = 120; // Plane respawn
const BALLOON_RESPAWN_FRAMES = 360; // Balloon respawn longer
const MAX_CLOUDS = 5;
const CLOUD_BASE_SPEED = 0.3;
const MIN_TAKEOFF_SPEED = 1.8; // *** Increased significantly ***
const MAX_LANDING_SPEED = 2.5;
const MAX_PARTICLES = 150;
const PLANE_COLLISION_THRESHOLD_FACTOR = 0.8;
const STALL_ANGLE_THRESHOLD = -70; // Degrees relative to horizontal when upright
const STALL_RECOVERY_ANGLE = -50;// Degrees relative to horizontal when upright
const STALL_EFFECT_FACTOR = 0.2;
const MAX_SPEED_FOR_SOUND = 8;
// --- Adjusted Sound Parameters ---
const BASE_ENGINE_FREQ = 40;
const MAX_ENGINE_FREQ = 120;
const BASE_ENGINE_AMP = 0.00;
const MAX_ENGINE_AMP = 0.18;
const PROPELLER_BLUR_COLOR = [100, 100, 100, 150];
const PROPELLER_STOPPED_COLOR = [80, 80, 80];


// --- Player Controls ---
const CONTROLS_P1 = { thrust: 87, left: 65, right: 68, shoot: 83 }; // W,A,D,S
const CONTROLS_P2 = { thrust: 38, left: 37, right: 39, shoot: 40 }; // Arrows

// --- Global Variables ---
let plane1, plane2;
let bullets = [];
let clouds = [];
let hut;
let balloon;
let score1 = 0;
let score2 = 0;
let keys = {};
let particles = [];
let stars = [];

// --- Sound Variables ---
let engineSound1, engineSound2;
let shootSoundEnv, shootNoise;
let explosionSoundEnv, explosionNoise;
let audioStarted = false;
let soundNodesStarted = false; // New flag to track if Oscillators/Noise have started

// --- Game State ---
let gameState = 'intro'; // 'intro' or 'playing'


// --- Environment Dimensions ---
const GROUND_LEVEL_Y_FRAC = 0.9;
let GROUND_Y;
const HUT_WIDTH = 75;
const HUT_HEIGHT = 55;
let hutX, hutY;

// --- Colors ---
const SKY_TOP = [5, 3, 15];
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
const CLOUD_COLOR = [230, 230, 245];
const CLOUD_SHADOW = [180, 180, 200, 180];
const PLANE1_COLOR_BODY = [200, 100, 30]; // P1 Orange
const PLANE1_COLOR_WING = [230, 150, 70];
const PLANE1_COLOR_ACCENT = [160, 80, 20];
const PLANE2_COLOR_BODY = [150, 170, 80]; // P2 Green
const PLANE2_COLOR_WING = [190, 200, 110];
const PLANE2_COLOR_ACCENT = [120, 140, 60];
const BULLET_CORE_BRIGHTNESS = 255;
const BULLET_TRAIL_ALPHA = 180;
const SCORE_COLOR = [255, 220, 50];
const EXPLOSION_COLORS = [ [255, 200, 0], [255, 100, 0], [200, 50, 0], [100, 100, 100] ];
const BALLOON_COLORS = [ [230, 50, 50], [50, 150, 230], [240, 200, 60], [50, 200, 100] ];
const BALLOON_BASKET = [160, 100, 40];
const BALLOON_ROPE = [80, 60, 40];

// --- p5.js Setup Function ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    noSmooth();

    calculateLayout();

    // Initialize Planes
    let planeStartY = GROUND_Y - 10; // Start slightly above visual ground line
    plane1 = new Plane(width * 0.1, planeStartY, PLANE1_COLOR_BODY, PLANE1_COLOR_WING, PLANE1_COLOR_ACCENT, CONTROLS_P1, 1);
    plane2 = new Plane(width * 0.9, planeStartY, PLANE2_COLOR_BODY, PLANE2_COLOR_WING, PLANE2_COLOR_ACCENT, CONTROLS_P2, 2);

    // Initialize Scenery
    clouds = []; for (let i = 0; i < MAX_CLOUDS; i++) { clouds.push(new Cloud()); }
    balloon = new Balloon(width * 0.75, height * 0.4);
    stars = []; for (let i = 0; i < 150; i++) { stars.push({ x: random(width), y: random(height * 0.7), size: random(1, 2.5), brightness: random(150, 255) }); }

    keys = {};

    // --- Initialize Sounds (but DO NOT start them yet) ---
    engineSound1 = new p5.Oscillator('sawtooth'); engineSound1.freq(BASE_ENGINE_FREQ); engineSound1.amp(0);
    engineSound2 = new p5.Oscillator('sawtooth'); engineSound2.freq(BASE_ENGINE_FREQ); engineSound2.amp(0);

    shootNoise = new p5.Noise('white'); shootNoise.amp(0);
    shootSoundEnv = new p5.Envelope(); shootSoundEnv.setADSR(0.001, 0.02, 0, 0.04); shootSoundEnv.setRange(0.9, 0);

    explosionNoise = new p5.Noise('pink'); explosionNoise.amp(0);
    explosionSoundEnv = new p5.Envelope(); explosionSoundEnv.setADSR(0.03, 0.5, 0.1, 0.7); explosionSoundEnv.setRange(0.7, 0);

    // Assign engine sounds (assignment is okay, starting is not)
    plane1.assignEngineSound(engineSound1);
    plane2.assignEngineSound(engineSound2);
}

// --- Helper to Calculate Layout ---
function calculateLayout() {
    GROUND_Y = height * GROUND_LEVEL_Y_FRAC; hutX = width / 2; hutY = GROUND_Y - HUT_HEIGHT / 2; hut = { x: hutX, y: hutY, w: HUT_WIDTH, h: HUT_HEIGHT };
    if (stars && stars.length > 0) { for (let star of stars) { star.x = random(width); star.y = random(height * 0.7); } }
    // Recalculate plane start positions if needed (e.g., on resize before game starts)
    if (gameState === 'intro') {
        let planeStartY = GROUND_Y - 10;
        if (plane1) plane1.startPos = createVector(width * 0.1, planeStartY);
        if (plane2) plane2.startPos = createVector(width * 0.9, planeStartY);
    }
}

// --- p5.js Draw Function (Main Game Loop) ---
function draw() {
    // --- Intro Screen Logic ---
    if (gameState === 'intro') {
        drawIntroScreen();
        return; // Don't draw the game yet
    }

    // --- Playing State Logic ---
    drawBackground();
    drawEnvironment();

    // Update and Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].display(); if (particles[i].isDead()) { particles.splice(i, 1); } }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (plane1.isAlive && bullets[i].checkCollision(plane1)) { if (bullets[i].ownerId !== plane1.id) { plane1.hit(false); score2++; createExplosion(plane1.position.x, plane1.position.y, 35, EXPLOSION_COLORS); bullets.splice(i, 1); continue; } }
        if (plane2.isAlive && bullets[i].checkCollision(plane2)) { if (bullets[i].ownerId !== plane2.id) { plane2.hit(false); score1++; createExplosion(plane2.position.x, plane2.position.y, 35, EXPLOSION_COLORS); bullets.splice(i, 1); continue; } }
        // Check bullet collision with balloon *before* hut/offscreen checks
        if (balloon.isAlive && balloon.checkCollision(bullets[i])) {
            createExplosion(balloon.pos.x, balloon.pos.y, 20, EXPLOSION_COLORS.slice(0,3)); // Balloon explosion uses fewer colors
            balloon.hit(); // Balloon is destroyed by bullet
            if (bullets[i].ownerId === 1) { score1++; } else { score2++; } // Award point to shooter
            bullets.splice(i, 1); // Remove bullet
            continue; // Stop processing this bullet
        }
        if (bullets[i].checkCollisionHut(hut)) { createExplosion(bullets[i].position.x, bullets[i].position.y, 5, [[150,120,90],[80,55,35],[100,100,100,100]]); bullets.splice(i, 1); continue; }
        if (bullets[i].isOffscreen()) { bullets.splice(i, 1); } else { bullets[i].display(); }
    }

    // Planes
    plane1.handleInput(keys); plane1.update(); plane1.display();
    plane2.handleInput(keys); plane2.update(); plane2.display();

    // Plane-Plane Collision
    if (plane1.isAlive && plane2.isAlive) {
        let distance = dist(plane1.position.x, plane1.position.y, plane2.position.x, plane2.position.y);
        let collisionThreshold = (plane1.size + plane2.size) * PLANE_COLLISION_THRESHOLD_FACTOR;
        if (distance < collisionThreshold) {
            console.log("PLANE COLLISION!");
            plane1.hit(true); // Crash scoring handled in hit()
            plane2.hit(true); // Crash scoring handled in hit()
        }
    }

    // Scenery
    for (let cloud of clouds) { cloud.update(); cloud.display(); }
    balloon.update(); balloon.display(); // Balloon update/display happens regardless of hits this frame
    drawHut();

    drawUI();
}

// --- NEW: Draw Intro Screen ---
function drawIntroScreen() {
    drawBackground(); // Draw the same nice background
    drawEnvironment(); // Draw mountains and ground too

    // Semi-transparent overlay to make text pop
    fill(0, 0, 0, 150);
    rect(width / 2, height / 2, width, height);

    // Title
    textFont('monospace');
    fill(255, 215, 0); // Gold-ish color
    stroke(0);
    strokeWeight(4);
    textSize(min(width * 0.1, height * 0.15)); // Responsive text size
    textAlign(CENTER, CENTER);
    text("Biplane Battle", width / 2, height * 0.2);

    // Instructions
    noStroke();
    fill(240);
    textSize(min(width * 0.025, height * 0.04)); // Smaller text for instructions
    let instrY = height * 0.45;
    let lineSpacing = height * 0.05;
    let col1X = width * 0.3;
    let col2X = width * 0.7;

    // Player 1 Instructions
    fill(PLANE1_COLOR_BODY);
    text("Player 1", col1X, instrY);
    fill(240);
    text("W: Thrust", col1X, instrY + lineSpacing);
    text("A: Turn Left", col1X, instrY + lineSpacing * 2);
    text("D: Turn Right", col1X, instrY + lineSpacing * 3);
    text("S: Shoot", col1X, instrY + lineSpacing * 4);

    // Player 2 Instructions
    fill(PLANE2_COLOR_BODY);
    text("Player 2", col2X, instrY);
    fill(240);
    text("Up Arrow: Thrust", col2X, instrY + lineSpacing);
    text("Left Arrow: Turn Left", col2X, instrY + lineSpacing * 2);
    text("Right Arrow: Turn Right", col2X, instrY + lineSpacing * 3);
    text("Down Arrow: Shoot", col2X, instrY + lineSpacing * 4);

    // Start Prompt
    fill(255, 255, 100);
    textSize(min(width * 0.03, height * 0.05));
    // Blinking effect for the prompt
    if (floor(frameCount / 20) % 2 === 0) {
        text("Press any key to start", width / 2, height * 0.85);
    }

    noStroke();
}


// --- Input Handling ---
function keyPressed() {
    // --- Handle Intro Screen Transition ---
    if (gameState === 'intro') {
        gameState = 'playing'; // Change state to start the game

        // Start the sound nodes *only* if the user has already clicked to enable audio
        if (audioStarted && !soundNodesStarted) {
            try {
                 engineSound1.start();
                 engineSound2.start();
                 shootNoise.start();
                 explosionNoise.start();
                 soundNodesStarted = true; // Mark sounds as started
                 console.log("Sound nodes started via key press after audio context was ready.");
            } catch (e) {
                console.error("Error starting sound nodes on key press:", e);
            }
        } else if (!audioStarted) {
            console.log("Key pressed to start game, but audio context not yet running (click the screen).");
        }
        // Don't set keys[keyCode] = true here, wait for next frame in 'playing' state
        return; // Prevent immediate key registration in the game logic
    }

    // --- Handle In-Game Key Presses ---
    if (gameState === 'playing') {
        keys[keyCode] = true;
    }
}

function keyReleased() {
    // Only release keys if the game is playing
    if (gameState === 'playing') {
        keys[keyCode] = false;
    }
}

// --- Fullscreen & Audio Start ---
function mousePressed() {
  // Attempt to start audio context on first click (required by browsers)
  if (!audioStarted && getAudioContext().state !== 'running') {
     console.log("Attempting to start audio context...");
     userStartAudio().then(() => {
        if (getAudioContext().state === 'running') {
            console.log("Audio Context is now running.");
            audioStarted = true; // Mark audio as enabled
            // Start sound nodes ONLY if the game has already transitioned to 'playing'
            if (gameState === 'playing' && !soundNodesStarted) {
                 try {
                    engineSound1.start();
                    engineSound2.start();
                    shootNoise.start();
                    explosionNoise.start();
                    soundNodesStarted = true;
                    console.log("Sound nodes started via mouse press because game was already playing.");
                 } catch (e) {
                     console.error("Error starting sound nodes on mouse press:", e);
                 }
            }
        } else { console.error("Audio context failed to resume or start."); }
     }).catch(e => { console.error("Error starting audio:", e); });
  } else if (!audioStarted && getAudioContext().state === 'running') {
      // This case handles if audio context was somehow running before first click
      console.log("Audio Context was already running. Marking audio as started.");
      audioStarted = true;
      // Start sound nodes ONLY if the game has already transitioned to 'playing'
      if (gameState === 'playing' && !soundNodesStarted) {
           try {
               engineSound1.start();
               engineSound2.start();
               shootNoise.start();
               explosionNoise.start();
               soundNodesStarted = true;
               console.log("Sound nodes started via mouse press (audio context was already running).");
           } catch (e) {
                console.error("Error starting sound nodes on mouse press (pre-existing context):", e);
           }
      }
  }

  // Toggle fullscreen on click anywhere
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
       let fs = fullscreen();
       fullscreen(!fs);
   }
}


// --- Window Resize Handling ---
function windowResized() { resizeCanvas(windowWidth, windowHeight); calculateLayout(); }

// --- Drawing Functions ---
function drawBackground() { noStroke(); let bandHeight = height * 0.03; fill(SKY_TOP); rect(width / 2, (height * 0.075) / 2, width, height * 0.075); fill(SKY_UPPER_BAND); rect(width / 2, height * 0.075 + bandHeight / 2, width, bandHeight); for (let y = height * 0.075 + bandHeight; y < GROUND_Y; y++) { let inter = map(y, height * 0.075 + bandHeight, GROUND_Y, 0, 1); let c = lerpColor(color(SKY_MID_BLUE), color(SKY_LOWER_BLUE), inter); stroke(c); line(0, y, width, y); } noStroke(); fill(255); for (let star of stars) { let brightness = star.brightness * (0.8 + sin(frameCount * 2 + star.x) * 0.2); fill(brightness); ellipse(star.x, star.y, star.size, star.size); } noStroke(); }
function drawEnvironment() { noStroke(); fill(MOUNTAIN_DISTANT); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y * 0.85); vertex(width * 0.3, GROUND_Y * 0.88); vertex(width * 0.5, GROUND_Y * 0.78); vertex(width * 0.7, GROUND_Y * 0.90); vertex(width * 0.9, GROUND_Y * 0.82); vertex(width, GROUND_Y); endShape(CLOSE); let peak1_baseL = { x: width * 0.05, y: GROUND_Y }; let peak1_top = { x: width * 0.3, y: GROUND_Y * 0.55 }; let peak1_baseR = { x: width * 0.45, y: GROUND_Y }; let peak2_baseL = { x: width * 0.4, y: GROUND_Y }; let peak2_top = { x: width * 0.65, y: GROUND_Y * 0.45 }; let peak2_baseR = { x: width * 0.9, y: GROUND_Y }; fill(MOUNTAIN_DARK); triangle(peak1_baseL.x, peak1_baseL.y, peak1_top.x, peak1_top.y, peak1_baseR.x, peak1_baseR.y); let snowLevel1 = 0.35; fill(SNOW_COLOR); beginShape(); vertex(peak1_top.x, peak1_top.y); let snowP1_L_x = lerp(peak1_top.x, peak1_baseL.x, snowLevel1 * 1.2); let snowP1_L_y = lerp(peak1_top.y, peak1_baseL.y, snowLevel1); vertex(snowP1_L_x, snowP1_L_y); let snowP1_R_x = lerp(peak1_top.x, peak1_baseR.x, snowLevel1 * 1.1); let snowP1_R_y = lerp(peak1_top.y, peak1_baseR.y, snowLevel1); vertex(snowP1_R_x, snowP1_R_y); endShape(CLOSE); fill(MOUNTAIN_LIGHT); triangle(peak2_baseL.x, peak2_baseL.y, peak2_top.x, peak2_top.y, peak2_baseR.x, peak2_baseR.y); let snowLevel2 = 0.4; fill(SNOW_COLOR); beginShape(); vertex(peak2_top.x, peak2_top.y); let snowP2_L_x = lerp(peak2_top.x, peak2_baseL.x, snowLevel2 * 1.15); let snowP2_L_y = lerp(peak2_top.y, peak2_baseL.y, snowLevel2); vertex(snowP2_L_x, snowP2_L_y); let snowP2_R_x = lerp(peak2_top.x, peak2_baseR.x, snowLevel2 * 1.1); let snowP2_R_y = lerp(peak2_top.y, peak2_baseR.y, snowLevel2); vertex(snowP2_R_x, snowP2_R_y); endShape(CLOSE); fill(MOUNTAIN_GREEN); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y); curveVertex(width * 0.15, GROUND_Y * 0.95); vertex(width * 0.2, GROUND_Y * 0.85); curveVertex(width * 0.28, GROUND_Y * 0.98); vertex(width * 0.35, GROUND_Y); vertex(peak1_baseR.x, GROUND_Y); vertex(peak2_baseL.x, GROUND_Y); curveVertex(width * 0.58, GROUND_Y * 0.9); vertex(width * 0.6, GROUND_Y * 0.8); curveVertex(width * 0.75, GROUND_Y); vertex(width * 0.85, GROUND_Y); vertex(peak2_baseR.x, GROUND_Y); vertex(width, GROUND_Y); vertex(width, height); vertex(0, height); endShape(CLOSE); fill(GROUND_COLOR); rect(width / 2, GROUND_Y + (height - GROUND_Y) / 2, width, height - GROUND_Y); strokeWeight(1); for(let i = 0; i < 10; i++) { let lineY = GROUND_Y + (height - GROUND_Y) * (i / 10) * random(0.8, 1.2); let lineCol = lerpColor(color(GROUND_COLOR), color(GROUND_HIGHLIGHT), random(0.3, 0.7)); stroke(red(lineCol), green(lineCol), blue(lineCol), 100); line(0, lineY, width, lineY); } noStroke(); }
function drawHut() { push(); translate(hutX, hutY); noStroke(); fill(HUT_ROOF); triangle(-HUT_WIDTH / 2 - 5, -HUT_HEIGHT / 2, HUT_WIDTH / 2 + 5, -HUT_HEIGHT / 2, 0, -HUT_HEIGHT / 2 - HUT_HEIGHT * 0.6); fill(HUT_WALL); rect(0, 0, HUT_WIDTH, HUT_HEIGHT); fill(HUT_DOOR); rect(-HUT_WIDTH * 0.25, HUT_HEIGHT * 0.1, HUT_WIDTH * 0.3, HUT_HEIGHT * 0.7, 3); fill(SKY_LOWER_BLUE[0]*0.7, SKY_LOWER_BLUE[1]*0.7, SKY_LOWER_BLUE[2]*0.7); rect(HUT_WIDTH * 0.25, -HUT_HEIGHT * 0.1, HUT_WIDTH * 0.35, HUT_HEIGHT * 0.35, 2); stroke(HUT_ROOF); strokeWeight(2); let winX = HUT_WIDTH * 0.25; let winY = -HUT_HEIGHT * 0.1; let winW = HUT_WIDTH * 0.35; let winH = HUT_HEIGHT * 0.35; line(winX - winW/2, winY, winX + winW/2, winY); line(winX, winY - winH/2, winX, winY + winH/2); noStroke(); stroke(HUT_WALL[0] * 0.8, HUT_WALL[1] * 0.8, HUT_WALL[2] * 0.8, 150); strokeWeight(1); for(let i = 0; i < 6; i++) { let lineY = -HUT_HEIGHT/2 + (HUT_HEIGHT / 6) * (i + 0.5); line(-HUT_WIDTH/2, lineY, HUT_WIDTH/2, lineY); } noStroke(); pop(); }
function drawUI() { textSize(40); textFont('monospace'); fill(SCORE_COLOR); stroke(0); strokeWeight(3); textAlign(LEFT, BOTTOM); text(nf(score1, 2), 20, height - 10); textAlign(RIGHT, BOTTOM); text(nf(score2, 2), width - 20, height - 10); noStroke(); }


// =====================
// --- Plane Class ---
// =====================
class Plane {
    constructor(x, y, bodyCol, wingCol, accentCol, controls, id) {
        this.id = id;
        this.startPos = createVector(x, y);
        this.bodyColor = color(bodyCol);
        this.wingColor = color(wingCol);
        this.accentColor = color(accentCol);
        this.controls = controls;
        this.size = 22;
        this.position = this.startPos.copy();
        this.velocity = createVector(0, 0);
        this.angle = (id === 2) ? 180 : 0; // Start P2 facing left
        this.isAlive = true;
        this.isOnGround = true;
        this.respawnTimer = 0;
        this.shootCooldown = 0;
        this.isThrusting = false;
        this.isTurningLeft = false; // Based on key press
        this.isTurningRight = false;// Based on key press
        this.planePoints = this.createPlaneShape();
        this.engineSound = null;
        this.isStalled = false;
    }

    assignEngineSound(soundObject) { this.engineSound = soundObject; }

    createPlaneShape() {
        let s = this.size;
        // Defined as if facing right (angle = 0)
        return {
            fuselage: [ {x: s * 0.8, y: 0}, {x: s * 0.6, y: -s * 0.1}, {x: -s * 0.7, y: -s * 0.15}, {x: -s * 0.95, y: -s * 0.05}, {x: -s * 0.9, y: 0}, {x: -s * 0.95, y: s * 0.05}, {x: -s * 0.7, y: s * 0.15}, {x: s * 0.6, y: s * 0.1} ],
            topWing: [ {x: s * 0.35, y: -s * 0.25}, {x: s * 0.25, y: -s * 0.7}, {x: -s * 0.45, y: -s * 0.7}, {x: -s * 0.4, y: -s * 0.25} ],
            bottomWing: [ {x: s * 0.25, y: s * 0.25}, {x: s * 0.15, y: s * 0.6}, {x: -s * 0.35, y: s * 0.6}, {x: -s * 0.3, y: s * 0.25} ],
            tailplane: [ {x: -s * 0.75, y: -s * 0.1}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 1.0, y: 0}, {x: -s * 1.05, y: s * 0.35}, {x: -s * 0.75, y: s * 0.1} ],
            rudder: [ {x: -s * 0.9, y: 0}, {x: -s * 1.15, y: -s * 0.4}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 0.75, y: -s * 0.1} ],
            cockpit: [ {x: s * 0.4, y: -s * 0.1}, {x: s * 0.1, y: -s*0.35}, {x: -s*0.1, y: -s*0.25} ],
            wheels: [ {x: s*0.15, y: s*0.7}, {x: -s*0.2, y: s*0.7} ],
            wheelRadius: s * 0.18
        };
    }

    handleInput(keys) {
        // This function now only *reads* the keys state.
        // It's called even if the plane isn't alive, but the effects are ignored later.
        if (!this.isAlive || this.respawnTimer > 0) {
            this.isThrusting = false;
            this.isTurningLeft = false;
            this.isTurningRight = false;
            return;
        }
        this.isThrusting = keys[this.controls.thrust] || false;
        this.isTurningLeft = keys[this.controls.left] || false;
        this.isTurningRight = keys[this.controls.right] || false;

        if (keys[this.controls.shoot]) { this.shoot(); }
    }

    applyForce(force) { this.velocity.add(force); }

    update() {
        // Respawn Logic
        if (this.respawnTimer > 0) { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); } return; }
        if (!this.isAlive) { if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0.05); return; } // Ensure sound nodes have started before trying to control amp
        if (this.shootCooldown > 0) { this.shootCooldown--; }

        // --- Apply Turning ---
        if (this.isTurningLeft) { this.angle -= TURN_SPEED; }
        if (this.isTurningRight) { this.angle += TURN_SPEED; }

        // --- Determine Thrust ---
        let thrustVector = createVector(0, 0);
        let currentThrustForce = THRUST_FORCE;
        if (this.isStalled) { currentThrustForce *= STALL_EFFECT_FACTOR; }
        if (this.isThrusting) {
            thrustVector = p5.Vector.fromAngle(radians(this.angle), currentThrustForce);
        }

        // --- Apply Forces based on state ---
        if (this.isOnGround) {
            // --- Ground Physics ---
            this.velocity.x *= GROUND_FRICTION;
            let normalizedAngle = (this.angle % 360 + 360) % 360;
            let isAngledUpSlightly = (this.id === 1) ? (this.angle < -5 && this.angle > -90) : (normalizedAngle > 185 && normalizedAngle < 270);

            // Apply thrust based on angle and thrusting state
            if (this.isThrusting) {
                if (isAngledUpSlightly) {
                    // Apply thrust with a small vertical component for takeoff run
                    this.applyForce(createVector(thrustVector.x, thrustVector.y * 0.15)); // Small up component
                } else {
                    // Apply only horizontal thrust component if not angled up
                    this.applyForce(createVector(thrustVector.x, 0));
                }
            }

            // Apply gravity firmly on the ground unless trying to take off actively
             if (!this.isThrusting || !isAngledUpSlightly) {
                 this.applyForce(createVector(0, GRAVITY_FORCE * 2)); // Stronger gravity effect when not trying takeoff
             } else {
                 // Lighter gravity only when actively thrusting AND angled up
                 this.applyForce(createVector(0, GRAVITY_FORCE * 0.5));
             }

        } else {
            // --- Airborne Physics ---
            // 1. Apply Thrust
            this.applyForce(thrustVector);
            // 2. Calculate Lift
            let speed = this.velocity.mag();
            let liftMagnitude = speed * LIFT_FACTOR;
            // Stall Effect on Lift
            if (this.isStalled) {
                liftMagnitude *= 0.15;
            }
            // 3. Apply Lift
            let liftForce = createVector(0, -liftMagnitude);
            this.applyForce(liftForce);
            // 4. Apply Gravity
            this.applyForce(createVector(0, GRAVITY_FORCE));
            // 5. Apply Air Drag
            this.velocity.mult(DAMPING_FACTOR);
        }

        // Update Position
        this.position.add(this.velocity);

        // --- Check and Handle Ground Interaction / State Changes ---
        let groundCheckY = GROUND_Y - this.size * 0.8; // Position where wheels touch ground

        // A: Transitioning from Air to Ground (Landing/Crash)
        // Check if plane's *new* position is at or below ground AND it *was* airborne last frame
        if (this.position.y >= groundCheckY && !this.isOnGround) {
             let normalizedAngle = (this.angle % 360 + 360) % 360;
             let isTooSteep = (normalizedAngle > 45 && normalizedAngle < 135) || (normalizedAngle > 225 && normalizedAngle < 315);
             let verticalSpeed = this.velocity.y; // Vertical speed at impact

             if (verticalSpeed > MAX_LANDING_SPEED || isTooSteep) {
                 console.log(`Plane ${this.id} CRASH LANDED! V Speed: ${verticalSpeed.toFixed(2)}, Angle: ${this.angle.toFixed(1)}, TooSteep: ${isTooSteep}`);
                 this.hit(true); return; // Stop update if crashed
             } else {
                 // Safe landing
                 this.isOnGround = true; // Set state to grounded
                 this.isStalled = false; // Recover from stall on landing
                 this.position.y = groundCheckY; // Snap precisely to ground level
                 this.velocity.y = 0; // Stop all vertical movement immediately
                 console.log(`Plane ${this.id} landed safely. V Speed: ${verticalSpeed.toFixed(2)}`);
                 // Horizontal velocity is preserved (affected by friction next frame)
             }
        // B: Currently on Ground (Check for Takeoff or stay grounded)
        // Check if plane *was* on ground last frame
        } else if (this.isOnGround) {
            // Keep plane clamped to ground if position update somehow put it below
            if (this.position.y > groundCheckY) {
                 this.position.y = groundCheckY; // Clamp to ground
                 if(this.velocity.y > 0) this.velocity.y = 0; // Stop any residual downward movement
            }

            // Takeoff Check (Only if still considered on ground)
            let horizontalSpeed = abs(this.velocity.x);
            let isAngledForTakeoff = false;
            let normalizedAngle = (this.angle % 360 + 360) % 360;
            if (this.id === 1) { // P1 takeoff angle: Roughly -5 to -85 degrees
                isAngledForTakeoff = (this.angle < -5 && this.angle > -85);
            } else { // P2 takeoff angle: Roughly 185 to 265 degrees
                isAngledForTakeoff = (normalizedAngle > 185 && normalizedAngle < 265);
            }

            // Check conditions for takeoff
            if (this.isThrusting && isAngledForTakeoff && horizontalSpeed > MIN_TAKEOFF_SPEED) {
                // *** Successful Takeoff ***
                this.isOnGround = false; // Set state to airborne HERE
                this.isStalled = false;
                // Give a substantial upward boost to counteract gravity initially
                this.velocity.y -= THRUST_FORCE * 0.6; // Increased boost
                console.log(`Plane ${this.id} took off. Speed: ${horizontalSpeed.toFixed(2)}`);
                // Now it's airborne, next frame airborne physics will apply
            }
            // No 'else' needed here - if takeoff conditions aren't met, it just stays grounded
            // and ground physics will apply next frame. The clamping above keeps it on the ground.

        // C: Currently Airborne
        // Check if plane is above ground and *was not* on ground last frame (or just took off)
        } else { // Plane is airborne (this.position.y < groundCheckY)
            this.isOnGround = false; // Ensure state remains airborne

             // Stall Check (Only when airborne)
             let normAngle = (this.angle % 360 + 360) % 360;
             let checkAngle = this.angle;
             let isTryingStall = false;
             let isTryingRecover = false;

             if (normAngle > 90 && normAngle < 270) { // Mostly inverted
                isTryingStall = normAngle > (180 - STALL_ANGLE_THRESHOLD);
                isTryingRecover = normAngle < (180 - STALL_RECOVERY_ANGLE);
            } else { // Mostly upright
                isTryingStall = checkAngle < STALL_ANGLE_THRESHOLD;
                isTryingRecover = checkAngle > STALL_RECOVERY_ANGLE;
            }

            if(isTryingStall) {
                if (!this.isStalled) console.log(`Plane ${this.id} stalled! Angle: ${checkAngle.toFixed(1)} Norm: ${normAngle.toFixed(1)}`);
                this.isStalled = true;
            } else if (isTryingRecover) {
                 if (this.isStalled) console.log(`Plane ${this.id} recovered from stall. Angle: ${checkAngle.toFixed(1)} Norm: ${normAngle.toFixed(1)}`);
                 this.isStalled = false;
            }
             // Stall state persists if neither condition is met
        }

        // --- Boundary Constraints ---
        if (this.position.x > width + this.size) { this.position.x = -this.size; } else if (this.position.x < -this.size) { this.position.x = width + this.size; }
        // Ceiling boundary
        if (this.position.y < this.size / 2) { this.position.y = this.size / 2; if (this.velocity.y < 0) { this.velocity.y = 0; } }

        // --- Collisions & Sound (after position/state finalized for the frame) ---
        // Check if plane is still alive after potential landing crash
        if (!this.isAlive) return;

        // Check Hut Collision
        if (this.checkCollisionHut(hut)) return; // Stop update if hit hut

        // Check Balloon Collision (re-check isAlive)
        if (this.isAlive && balloon.isAlive) {
            let planeCollisionRadius = this.size * 0.9;
            let distance = dist(this.position.x, this.position.y, balloon.pos.x, balloon.pos.y);
            let combinedRadius = planeCollisionRadius + balloon.radius;
            if (distance < combinedRadius) {
                console.log(`Plane ${this.id} crashed into balloon!`);
                this.hit(true);
                return; // Stop update if hit balloon
            }
        }

        // --- Update Engine Sound ---
        // Only update sound if audio context is ready AND sound nodes have been started
        if (this.isAlive && this.engineSound && audioStarted && soundNodesStarted) {
             let speed = this.velocity.mag();
             let targetFreq = map(speed, 0, MAX_SPEED_FOR_SOUND, BASE_ENGINE_FREQ, MAX_ENGINE_FREQ, true);
             let targetAmp = this.isThrusting ? MAX_ENGINE_AMP : BASE_ENGINE_AMP;
             if (this.isStalled) { targetAmp *= 0.5; targetFreq *= 0.8; } // Stall sound effect
             if (abs(this.engineSound.getAmp() - targetAmp) > 0.001 || targetAmp > 0.01) {
                 this.engineSound.amp(targetAmp, 0.1);
             } else if (targetAmp < 0.01 && this.engineSound.getAmp() > 0) {
                  this.engineSound.amp(0, 0.1);
             }
             this.engineSound.freq(targetFreq, 0.1);
        } else if (this.engineSound && this.engineSound.getAmp() > 0) {
            // If audio isn't started/ready, ensure the sound is silent
             this.engineSound.amp(0, 0.1);
        }

    } // End of update()

    display() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle); // Handles the facing direction (0 for P1 right, 180 for P2 left)

        // ADD THIS BLOCK: Flip vertically *after* rotation for Plane 2
        if (this.id === 2) {
            scale(1, -1); // Flip along the plane's local X-axis (now pointing left)
        }

        // --- The rest of the drawing code remains the same ---
        if (this.respawnTimer > 0 && floor(this.respawnTimer / 8) % 2 === 0) {
            // Flicker when respawning
        } else {
            // Draw Plane Body
            stroke(0);
            strokeWeight(1.5);
            let pp = this.planePoints;

            // Draw parts back-to-front
            fill(red(this.wingColor)*0.8, green(this.wingColor)*0.8, blue(this.wingColor)*0.8); // Bottom Wing Shadow
            beginShape(); for(let p of pp.bottomWing) { vertex(p.x, p.y); } endShape(CLOSE);

            fill(this.accentColor); // Tailplane
            beginShape(); for(let p of pp.tailplane) { vertex(p.x, p.y); } endShape(CLOSE);

            fill(this.bodyColor); // Fuselage
            beginShape(); for(let p of pp.fuselage) { vertex(p.x, p.y); } endShape(CLOSE);

            fill(this.wingColor); // Top Wing
            beginShape(); for(let p of pp.topWing) { vertex(p.x, p.y); } endShape(CLOSE);

            fill(this.bodyColor); // Rudder
            beginShape(); for(let p of pp.rudder) { vertex(p.x, p.y); } endShape(CLOSE);

            // Cockpit outline
             noFill(); stroke(0, 150); strokeWeight(1.5);
             if (pp.cockpit.length >= 2) { // Ensure enough points for curveVertex
                beginShape();
                curveVertex(pp.cockpit[0].x, pp.cockpit[0].y); // Duplicate first point
                for(let p of pp.cockpit) { curveVertex(p.x, p.y); }
                curveVertex(pp.cockpit[pp.cockpit.length - 1].x, pp.cockpit[pp.cockpit.length - 1].y); // Duplicate last point
                endShape();
             }

            // Draw Wheels
            // Adjusted condition: Draw if on ground, or if airborne but close to ground OR moving down significantly
            if (this.isOnGround || (!this.isOnGround && this.position.y > GROUND_Y - this.size * 3) || (!this.isOnGround && this.velocity.y > 0.3)) {
                 fill(40); noStroke();
                 ellipse(pp.wheels[0].x, pp.wheels[0].y, pp.wheelRadius * 2, pp.wheelRadius * 2);
                 ellipse(pp.wheels[1].x, pp.wheels[1].y, pp.wheelRadius * 2, pp.wheelRadius * 2);
                 stroke(60); strokeWeight(3);
                 line(pp.wheels[0].x, pp.wheels[0].y - pp.wheelRadius, pp.bottomWing[1].x * 0.8, pp.bottomWing[1].y - this.size * 0.1);
                 line(pp.wheels[1].x, pp.wheels[1].y - pp.wheelRadius, pp.bottomWing[2].x * 0.8, pp.bottomWing[2].y - this.size * 0.1);
            }

            // Draw Propeller
            noStroke();
            let noseX = this.size * 0.85;
            let propHeight = this.size * 0.9;
            let propWidthRunning = this.size * 0.15;
            let propWidthStopped = this.size * 0.05;
            let engineRunning = this.isThrusting || (!this.isOnGround && this.velocity.magSq() > 0.5);

            if (engineRunning) {
                fill(PROPELLER_BLUR_COLOR);
                ellipse(noseX, 0, propWidthRunning, propHeight);
            } else if (!this.isOnGround) { // Only draw stopped prop if airborne AND not running
                fill(PROPELLER_STOPPED_COLOR);
                rect(noseX, 0, propWidthStopped, propHeight);
            }
            fill(this.accentColor); // Spinner
            ellipse(noseX, 0, this.size * 0.2, this.size * 0.2);
        }
        pop(); // Restore drawing state (undoes translate, rotate, and scale)
        noStroke();
    }

    shoot() {
        // Check if plane can shoot based on state and angle
        let isAngledForShootingOnGround = false;
        let normalizedAngle = (this.angle % 360 + 360) % 360;
        if (this.id === 1) {
             // P1 can shoot if angle is roughly between horizontal and up (-10 to -170)
             isAngledForShootingOnGround = (this.angle < -10 && this.angle > -170);
        } else { // P2
             // P2 can shoot if angle is roughly between horizontal and up (190 to 350)
             isAngledForShootingOnGround = (normalizedAngle > 190 && normalizedAngle < 350);
        }
        let canShoot = !this.isOnGround || (this.isOnGround && isAngledForShootingOnGround);

        // Can only shoot if cooldown is ready, plane alive, conditions met, AND audio/sounds are ready
        if (this.shootCooldown <= 0 && this.isAlive && canShoot && audioStarted && soundNodesStarted) {
            // Calculate bullet origin at the nose of the plane
            let noseOffsetDistance = this.size * 0.9;
            let noseOffsetVector = createVector(noseOffsetDistance, 0); // Offset along plane's local X axis

            // Rotate the offset by the plane's current angle
            let rotatedOffset = noseOffsetVector.copy().rotate(this.angle);

            // Add the rotated offset to the plane's world position
            let bulletPos = p5.Vector.add(this.position, rotatedOffset);

            // Bullet travels in the direction the plane is currently facing
            let bulletAngle = this.angle;

            // Create and add the bullet
            let newBullet = new Bullet(bulletPos.x, bulletPos.y, bulletAngle, this.id, this.bodyColor);
            bullets.push(newBullet);

            // Reset cooldown and play sound
            this.shootCooldown = SHOOT_COOLDOWN_FRAMES;
            shootSoundEnv.play(shootNoise); // Play sound only if check passed
        }
    }

    checkCollisionHut(hutRect) {
         if (!this.isAlive || this.respawnTimer > 0) return false;

         // --- Accurate Collision Check using Rotated Bounding Box ---
         let s = this.size;
         let halfW = s * 1.2; // Approximate half-width
         let halfH = s * 0.75; // Approximate half-height
         let cornersLocal = [
            createVector(-halfW, -halfH), createVector( halfW, -halfH),
            createVector( halfW,  halfH), createVector(-halfW,  halfH)
         ];
         let cornersWorld = cornersLocal.map(p => {
             let rotatedP = p.copy().rotate(this.angle);
             return p5.Vector.add(this.position, rotatedP);
         });
         let minX = min(cornersWorld.map(p => p.x));
         let maxX = max(cornersWorld.map(p => p.x));
         let minY = min(cornersWorld.map(p => p.y));
         let maxY = max(cornersWorld.map(p => p.y));
         let hutMinX = hutRect.x - hutRect.w / 2;
         let hutMaxX = hutRect.x + hutRect.w / 2;
         let hutMinY = hutRect.y - hutRect.h / 2;
         let hutMaxY = hutRect.y + hutRect.h / 2;

         if (maxX > hutMinX && minX < hutMaxX && maxY > hutMinY && minY < hutMaxY) {
            console.log(`Plane ${this.id} hit hut!`);
            this.hit(true);
            return true;
         }
         return false;
     }

    hit(causedByCrash) {
        if (!this.isAlive) return;
        console.log(`Plane ${this.id} HIT! ${causedByCrash ? "(Crash/Hut/Plane/Balloon)" : "(Bullet)"}`);
        this.isAlive = false;
        this.isOnGround = false;
        this.isStalled = false;
        this.velocity = createVector(random(-1.5, 1.5), -2.5); // Explosion impulse
        this.respawnTimer = RESPAWN_DELAY_FRAMES;
        createExplosion(this.position.x, this.position.y, 35, EXPLOSION_COLORS); // Explosion sound handled in createExplosion
        if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0.05); // Silence engine
        if (causedByCrash) {
            if (this.id === 1) { score2++; console.log("Crash! Point for Player 2!"); }
            else { score1++; console.log("Crash! Point for Player 1!"); }
        }
    }

    respawn() {
        let startX = (this.id === 1) ? width * 0.1 : width * 0.9;
        let startY = GROUND_Y - this.size * 0.8; // Respawn slightly above ground line
        this.startPos = createVector(startX, startY);
        this.position = this.startPos.copy();
        this.velocity = createVector(0, 0);
        this.angle = (this.id === 2) ? 180 : 0;
        this.isAlive = true;
        this.isOnGround = true; // Start on the ground
        this.isStalled = false;
        this.shootCooldown = SHOOT_COOLDOWN_FRAMES / 2;
        console.log(`Plane ${this.id} Respawned.`);
        // Reset engine sound to base state if audio is ready
        if (this.engineSound && audioStarted && soundNodesStarted) {
            this.engineSound.freq(BASE_ENGINE_FREQ, 0.1);
            this.engineSound.amp(BASE_ENGINE_AMP, 0.1);
        }
    }
}

// ======================
// --- Bullet Class ---
// ======================
class Bullet {
    constructor(x, y, angle, ownerId, planeColor) {
        this.position = createVector(x, y);
        this.velocity = p5.Vector.fromAngle(radians(angle), BULLET_SPEED); // Travels in direction of plane angle
        this.ownerId = ownerId;
        this.size = 8;
        this.life = 150; // Frames before disappearing
        this.planeColor = planeColor; // Base color for trail
        this.coreColor = color(BULLET_CORE_BRIGHTNESS);
        this.trailColor = color(red(planeColor), green(planeColor), blue(planeColor), BULLET_TRAIL_ALPHA);
    }

    update() {
        this.position.add(this.velocity);
        this.life--;
    }

    display() {
        push();
        translate(this.position.x, this.position.y);
        rotate(degrees(this.velocity.heading())); // Align with velocity vector

        // Draw trail behind the core
        strokeWeight(2.5);
        stroke(this.trailColor);
        line(-this.size * 0.6, 0, this.size * 0.4, 0);

        // Draw bright core
        strokeWeight(1.5);
        stroke(this.coreColor);
        line(-this.size * 0.4, 0, this.size * 0.2, 0); // Slightly offset forward

        pop();
        noStroke();
    }

    isOffscreen() {
        return (this.life <= 0 || this.position.x < -this.size || this.position.x > width + this.size || this.position.y < -this.size || this.position.y > height + this.size);
    }

    checkCollision(plane) {
        if (plane.id === this.ownerId || !plane.isAlive || plane.respawnTimer > 0) {
            return false; // Cannot collide with self, dead planes, or respawning planes
        }
        // Check distance vs combined radii (approximate)
        let collisionRadius = plane.size * 0.8; // Effective collision radius for plane body
        let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y);
        return distance < (collisionRadius + this.size / 2);
    }

    checkCollisionHut(hutRect) {
        // Simple Axis-Aligned Bounding Box check for bullet vs hut
        return (this.position.x > hutRect.x - hutRect.w / 2 &&
                this.position.x < hutRect.x + hutRect.w / 2 &&
                this.position.y > hutRect.y - hutRect.h / 2 &&
                this.position.y < hutRect.y + hutRect.h / 2);
    }
}


// =====================
// --- Cloud Class ---
// =====================
 class Cloud {
     constructor() {
         this.pos = createVector(0,0);
         this.vel = createVector(0,0);
         this.size = 100;
         this.puffOffsets = [];
         this.numPuffs = 7;
         this.opacity = 200;
         this.speedFactor = 1;
         this.direction = 1;
         this.reset();
         // Start clouds at random positions initially
         this.pos.x = random(width);
     }

     reset() {
         this.direction = random() < 0.5 ? -1 : 1; // Random direction
         this.size = random(100, 190);
         // Start offscreen based on direction
         let startX = this.direction > 0 ? -this.size * 1.5 : width + this.size * 1.5;
         this.pos = createVector(startX, random(height * 0.1, height * 0.6)); // Random height
         this.speedFactor = random(0.5, 1.5); // Vary speed slightly
         this.vel = createVector(CLOUD_BASE_SPEED * this.direction * this.speedFactor, 0);
         this.numPuffs = floor(random(6, 12)); // Vary complexity
         this.puffOffsets = [];
         for (let i = 0; i < this.numPuffs; i++) {
             let puffX = random(-this.size * 0.7, this.size * 0.7);
             let puffY = random(-this.size * 0.3, this.size * 0.3);
             let puffR = random(this.size * 0.4, this.size * 0.9) * random(0.8, 1.2); // Random puff size
             this.puffOffsets.push({ x: puffX, y: puffY, r: puffR });
         }
         this.opacity = random(190, 240); // Vary opacity
     }

     update() {
         this.pos.add(this.vel);
         // Reset if moved fully offscreen
         if (this.direction > 0 && this.pos.x - this.size * 1.5 > width) {
             this.reset();
         } else if (this.direction < 0 && this.pos.x + this.size * 1.5 < 0) {
             this.reset();
         }
     }

     display() {
         push();
         noStroke();
         translate(this.pos.x, this.pos.y);

         // Draw shadow ellipse slightly below
         fill(CLOUD_SHADOW[0], CLOUD_SHADOW[1], CLOUD_SHADOW[2], this.opacity * 0.6);
         ellipse(0, this.size * 0.25, this.size * 1.3, this.size * 0.7);

         // Draw main cloud puffs
         fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], this.opacity);
         for (let puff of this.puffOffsets) {
             ellipse(puff.x, puff.y, puff.r, puff.r * 0.85); // Slightly oval puffs
         }
         pop();
     }
 }

// ==========================
// --- Hot Air Balloon Class ---
// ==========================
class Balloon {
    constructor(x, y) {
        this.basePos = createVector(x, y); // Center point for drift/bobble calculation
        this.pos = this.basePos.copy(); // Actual drawing position
        this.bobbleOffset = 0;
        this.bobbleSpeed = 0.6; // How fast it bobs
        this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); // Sideways drift
        this.radius = 30; // Radius of the balloon envelope for collision
        this.visualRadius = 30; // Visual radius can differ slightly if needed
        this.basketSize = { w: 25, h: 18 };
        this.ropeLength = 25;
        this.isAlive = true;
        this.respawnTimer = 0;
    }

    update() {
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return; // Do nothing else if waiting to respawn
        }
        if (!this.isAlive) return; // Do nothing if dead (waiting for respawn timer)

        // Bobble up and down
        this.bobbleOffset = sin(frameCount * this.bobbleSpeed) * 6; // Oscillate vertically

        // Drift sideways
        this.basePos.x += this.driftSpeed;

        // Wrap around screen edges
        if (this.driftSpeed > 0 && this.basePos.x > width + this.visualRadius * 2) {
            this.basePos.x = -this.visualRadius * 2;
        } else if (this.driftSpeed < 0 && this.basePos.x < -this.visualRadius * 2) {
            this.basePos.x = width + this.visualRadius * 2;
        }

        // Update actual position based on drift and bobble
        this.pos.y = this.basePos.y + this.bobbleOffset;
        this.pos.x = this.basePos.x;
    }

    display() {
         // Use the respawn timer to control visibility when respawning
         if (this.respawnTimer > 0 && !this.isAlive) {
             if (floor(this.respawnTimer / 8) % 2 !== 0) {
                 return; // Skip drawing for flickering effect
             }
         } else if (!this.isAlive && this.respawnTimer <= 0) {
              return; // Don't draw if dead and not respawning
         }


        push();
        translate(this.pos.x, this.pos.y);
        noStroke();

        // --- Basket Details ---
        let basketTopY = this.visualRadius * 0.8 + this.ropeLength;
        let basketBottomY = basketTopY + this.basketSize.h;
        let basketCenterX = 0;

        // Ropes
        stroke(BALLOON_ROPE);
        strokeWeight(1.5);
        line(basketCenterX - this.basketSize.w * 0.4, basketTopY, -this.visualRadius * 0.5, this.visualRadius * 0.7); // Left rope
        line(basketCenterX + this.basketSize.w * 0.4, basketTopY, this.visualRadius * 0.5, this.visualRadius * 0.7); // Right rope
        line(basketCenterX, basketTopY - 3, 0, this.visualRadius * 0.8); // Center rope (visual)

        // Basket Base
        fill(BALLOON_BASKET);
        rect(basketCenterX, basketTopY + this.basketSize.h / 2, this.basketSize.w, this.basketSize.h, 3); // Rounded corners

        // Basket Rim
        fill(BALLOON_BASKET[0]*0.8, BALLOON_BASKET[1]*0.8, BALLOON_BASKET[2]*0.8); // Slightly darker
        rect(basketCenterX, basketTopY + 2, this.basketSize.w, 4, 2); // Top rim

        // Basket Weave Texture (Subtle Lines)
        stroke(BALLOON_BASKET[0]*0.7, BALLOON_BASKET[1]*0.7, BALLOON_BASKET[2]*0.7, 180);
        strokeWeight(1);
        // Horizontal lines
        for(let i = 1; i < 4; i++){
            line(basketCenterX - this.basketSize.w/2, basketTopY + i * (this.basketSize.h/4), basketCenterX + this.basketSize.w/2, basketTopY + i*(this.basketSize.h/4));
        }
        // Vertical lines
        for(let i = 1; i < 5; i++){
            line(basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketTopY, basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketBottomY);
        }

        // --- Balloon Envelope ---
        noStroke();
        let numPanels = BALLOON_COLORS.length * 2; // Double the colors for alternating panels
        for (let i = 0; i < numPanels; i++) {
            fill(BALLOON_COLORS[i % BALLOON_COLORS.length]); // Cycle through colors
            // Draw each panel as a pie slice (arc)
            arc(0, 0, // Center
                this.visualRadius * 2.1, this.visualRadius * 2.3, // Width, Height (slightly taller than wide)
                i * (360.0 / numPanels) - 90 - (360.0/numPanels)*0.1, // Start angle (offset for gaps)
                (i + 1) * (360.0 / numPanels) - 90 + (360.0/numPanels)*0.1, // End angle (offset for gaps)
                PIE); // Use PIE mode to fill to center
        }

        // --- Subtle Highlights/Shadows on Envelope ---
        noFill();
        // Highlight
        stroke(255, 255, 255, 30); // Faint white
        strokeWeight(this.visualRadius * 0.5); // Thick stroke for diffused look
        arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, -150, -30); // Top-left curve
        // Shadow
        stroke(0, 0, 0, 40); // Faint black
        strokeWeight(this.visualRadius * 0.6);
        arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, 30, 150); // Bottom-right curve

        pop();
        noStroke();
    }

    hit() {
        // Called when hit by a bullet
        if (!this.isAlive) return; // Can't hit it if already dead/respawning
        console.log("Balloon HIT by bullet!");
        this.isAlive = false;
        this.respawnTimer = BALLOON_RESPAWN_FRAMES; // Set timer to respawn later
        // Explosion is created in the main draw loop where the hit is detected
    }

    respawn() {
        this.isAlive = true;
        // Respawn at a random position, avoiding edges initially
        this.basePos.x = random(width * 0.1, width * 0.9);
        this.basePos.y = random(height * 0.15, height * 0.55); // Keep in upper part of sky
        this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); // New random drift
        this.pos = this.basePos.copy(); // Reset actual position
        this.bobbleOffset = 0; // Reset bobble
        console.log("Balloon Respawned at", this.basePos.x.toFixed(0), this.basePos.y.toFixed(0));
    }

    checkCollision(bullet) {
        // Checks collision with a bullet
        if (!this.isAlive) return false; // Cannot collide if dead
        // Check distance between bullet center and balloon center (envelope)
        let distance = dist(this.pos.x, this.pos.y, bullet.position.x, bullet.position.y);
        // Use the collision radius defined in constructor
        return distance < this.radius + bullet.size / 2;
    }
}


// =======================
// --- Particle Class ---
// =======================
 class Particle {
     constructor(x, y, baseColor) {
         this.pos = createVector(x, y);
         let angle = random(360); // Random explosion direction
         let speed = random(1, 5); // Random initial speed
         this.vel = p5.Vector.fromAngle(radians(angle), speed);
         this.vel.y += random(-0.5, 0.5); // Slight vertical variation
         this.lifespan = random(30, 70); // How long the particle lasts (frames)
         this.baseColor = color(baseColor); // Store the color it should be
         this.size = random(4, 12); // Initial size
         this.decay = random(0.88, 0.96); // How quickly it shrinks
         this.gravity = 0.05; // Simulate some gravity
     }

     update() {
         this.pos.add(this.vel); // Move particle
         this.vel.mult(0.95); // Apply air friction/damping
         this.vel.y += this.gravity; // Apply gravity
         this.lifespan -= 1; // Decrease lifespan
         this.size *= this.decay; // Shrink particle
     }

     display() {
         push();
         noStroke();
         // Fade out the particle as it nears the end of its life
         let currentAlpha = map(this.lifespan, 0, 50, 0, alpha(this.baseColor)); // Fade out over last 50 frames
         fill(red(this.baseColor), green(this.baseColor), blue(this.baseColor), max(0, currentAlpha)); // Apply color and calculated alpha
         ellipse(this.pos.x, this.pos.y, this.size, this.size); // Draw as a circle
         pop();
     }

     isDead() {
         // Particle is dead if lifespan is over or it's too small to see
         return this.lifespan <= 0 || this.size < 1;
     }
 }

// ===============================================
// --- Helper Function to Create Explosions ---
// ===============================================
 function createExplosion(x, y, count, colors) {
     // Play explosion sound ONLY if audio context is ready AND sound nodes started
     if (audioStarted && soundNodesStarted) {
         explosionSoundEnv.play(explosionNoise);
     }

     // Limit total particles to avoid performance issues
     if (particles.length > MAX_PARTICLES) return;

     // Create the specified number of particles
     for (let i = 0; i < count; i++) {
         let chosenColor = random(colors); // Pick a random color from the provided list
         // Add particle only if we haven't reached the maximum
         if (particles.length < MAX_PARTICLES) {
             particles.push(new Particle(x, y, chosenColor));
         } else {
             break; // Stop creating if max is reached
         }
     }
 }
// --- END OF FILE sketch.js ---