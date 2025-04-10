// --- START OF FILE sketch.js ---

// --- Game Configuration ---
const GRAVITY_FORCE = 0.1;
const THRUST_FORCE = 0.16;
const LIFT_FACTOR = 0.012;
const TURN_SPEED = 2.5; // Base turn speed
const DAMPING_FACTOR = 0.985; // Base air drag
const GROUND_FRICTION = 0.95;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN_FRAMES = 18; // Base cooldown
const RESPAWN_DELAY_FRAMES = 120;
const BALLOON_RESPAWN_FRAMES = 360;
const MAX_CLOUDS = 5;
const CLOUD_BASE_SPEED = 0.3;
const MIN_TAKEOFF_SPEED = 1.8;
const MAX_LANDING_SPEED = 2.5; // Speed above which crash might occur (unless Trampoline)
const MAX_PARTICLES = 250;
const PLANE_COLLISION_THRESHOLD_FACTOR = 0.8; // Multiplier for combined radii
const STALL_ANGLE_THRESHOLD = -70;
const STALL_RECOVERY_ANGLE = -50;
const STALL_EFFECT_FACTOR = 0.2;
const MAX_SPEED_FOR_SOUND = 8;
const PROPELLER_BLUR_COLOR = [100, 100, 100, 150];
const PROPELLER_STOPPED_COLOR = [0];
const PLANE_BASE_SIZE = 22; // Define fixed plane size

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
const POWERUP_DURATION_FRAMES = 60 * 30; // 30 Seconds
const POWERUP_FALL_SPEED = 0.5;
const POWERUP_SIZE = 30;
// ADDED CloudDisguise
const POWERUP_TYPES = [
    'RapidFire', 'SpeedBoost', 'Shield', 'TripleShot', 'Bomb',
    'Trampoline', 'ChickenLauncher', 'BubbleGun', 'ReverseGun', 'RainbowTrail',
    'CloudDisguise'
];
const POWERUP_COLORS = {
    RapidFire: [255, 255, 0],   // Yellow
    SpeedBoost: [0, 255, 255],  // Cyan
    Shield: [200, 0, 255],      // Magenta
    TripleShot: [255, 255, 255], // White
    Bomb: [80, 80, 80],          // Dark Gray
    Trampoline: [0, 255, 0],      // Green
    ChickenLauncher: [255, 200, 150], // Peach
    BubbleGun: [150, 180, 255],   // Light Sky Blue
    ReverseGun: [255, 165, 0],    // Orange
    RainbowTrail: [255, 0, 255],     // Temp Magenta (trail is rainbow)
    CloudDisguise: [220, 220, 235] // Light Gray-Blue
};
const SHIELD_COLOR = [150, 150, 255, 100];
const TRIPLE_SHOT_SPREAD_ANGLE = 6;
const BOMB_DROP_VELOCITY_Y = 1.5;
const BOMB_FUSE_FRAMES = 90;
const BOMB_EXPLOSION_RADIUS = 70;
const BOMB_EXPLOSION_PARTICLES = 45;
const HUT_DESTRUCTION_PARTICLES = 70;
const HUT_RUBBLE_PIECES = 25;

// --- WACKY POWERUP CONFIG ---
const TRAMPOLINE_BOUNCE_FORCE = 4.0;
const TRAMPOLINE_MAX_SPEED_THRESHOLD = 6;
const CHICKEN_SPEED = 5;
const CHICKEN_BOUNCE_FACTOR = 0.7;
// const CHICKEN_DAMAGE = 0; // Chickens are now lethal in their hitEffect
const BUBBLE_SPEED = 2.5;
const BUBBLE_TRAP_DURATION = 180;
const BUBBLE_FLOAT_FORCE = 0.15;
const RAINBOW_TRAIL_PARTICLE_INTERVAL = 2;
const RAINBOW_TRAIL_PARTICLE_LIFESPAN = 60;
const RAINBOW_COLORS = [ [255, 0, 0], [255, 165, 0], [255, 255, 0], [0, 255, 0], [0, 0, 255], [75, 0, 130], [148, 0, 211] ];
let rainbowColorIndex = 0;
const CLOUD_DISGUISE_PUFF_COUNT = 5; // Number of puffs for disguise
const CLOUD_DISGUISE_SIZE_FACTOR = 1.6; // How large the disguise cloud is relative to plane size
const CLOUD_DISGUISE_OPACITY = 190; // Base opacity for disguise cloud

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
let hut;
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
let boingSound, chickenSound, bubblePopSound, rainbowSparkleSound, cloudPoofSound; // Added cloudPoofSound
let boingEnv, chickenEnv, bubbleEnv, rainbowEnv, cloudPoofEnv; // Added cloudPoofEnv
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

// --- Colors --- (Removed Shrink/Grow Ray colors)
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
const HUT_RUBBLE_COLORS = [ [100, 80, 60], [70, 50, 30], [60, 40, 30], [120, 100, 80], [140, 110, 85], [85, 65, 45] ];
const CLOUD_COLOR = [200, 200, 215];
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
const CHICKEN_BODY_COLOR = [245, 225, 180];
const CHICKEN_ACCENT_COLOR = [255, 80, 80];
const BUBBLE_FILL_COLOR = [180, 210, 255, 80];
const BUBBLE_STROKE_COLOR = [220, 240, 255, 150];

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

    isCurrentlyRaining = false;
    clearTimer = random(CLEAR_DURATION_MIN, CLEAR_DURATION_MAX);
    rainTimer = 0;
    rainDrops = [];

    calculateLayout();

    let planeStartY = GROUND_Y - PLANE_BASE_SIZE * 0.8;
    plane1 = new Plane(width * 0.1, planeStartY, PLANE1_COLOR_BODY, PLANE1_COLOR_WING, PLANE1_COLOR_ACCENT, CONTROLS_P1, 1);
    plane2 = new Plane(width * 0.9, planeStartY, PLANE2_COLOR_BODY, PLANE2_COLOR_WING, PLANE2_COLOR_ACCENT, CONTROLS_P2, 2);

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

    boingSound = new p5.Oscillator('sine'); boingSound.amp(0); boingSound.freq(440);
    boingEnv = new p5.Envelope(); boingEnv.setADSR(0.01, 0.2, 0, 0.1); boingEnv.setRange(0.7, 0);
    chickenSound = new p5.Oscillator('square'); chickenSound.amp(0); chickenSound.freq(880);
    chickenEnv = new p5.Envelope(); chickenEnv.setADSR(0.005, 0.05, 0, 0.05); chickenEnv.setRange(0.4, 0);
    bubblePopSound = new p5.Noise('white'); bubblePopSound.amp(0);
    bubbleEnv = new p5.Envelope(); bubbleEnv.setADSR(0.001, 0.03, 0, 0.04); bubbleEnv.setRange(0.6, 0);
    rainbowSparkleSound = new p5.Oscillator('triangle'); rainbowSparkleSound.amp(0); rainbowSparkleSound.freq(1200);
    rainbowEnv = new p5.Envelope(); rainbowEnv.setADSR(0.005, 0.1, 0, 0.1); rainbowEnv.setRange(0.3, 0);

    // Initialize Cloud Poof Sound
    cloudPoofSound = new p5.Noise('white'); cloudPoofSound.amp(0);
    cloudPoofEnv = new p5.Envelope(); cloudPoofEnv.setADSR(0.01, 0.15, 0.1, 0.2); cloudPoofEnv.setRange(0.4, 0);


    plane1.assignEngineSound(engineSound1);
    plane2.assignEngineSound(engineSound2);
}

// --- Helper to Calculate Layout ---
function calculateLayout() {
    GROUND_Y = height * GROUND_LEVEL_Y_FRAC;
    hutX = width / 2;
    hutY = GROUND_Y - HUT_HEIGHT / 2;
    hut = { x: hutX, y: hutY, w: HUT_WIDTH, h: HUT_HEIGHT, destroyed: hut ? hut.destroyed : false, rubbleDetails: hut ? hut.rubbleDetails : null };

    if (stars && stars.length > 0) { for (let star of stars) { star.x = random(width); star.y = random(height * 0.7); } }

    let planeStartY = GROUND_Y - PLANE_BASE_SIZE * 0.8;

    if (gameState === 'intro') {
        if (plane1) plane1.startPos = createVector(width * 0.1, planeStartY);
        if (plane2) plane2.startPos = createVector(width * 0.9, planeStartY);
        if (hut) { hut.destroyed = false; hut.rubbleDetails = null; }
    } else {
        if (plane1) plane1.startPos.y = planeStartY;
        if (plane2) plane2.startPos.y = planeStartY;
    }
    updateWeatherVisuals();
}

// --- p5.js Draw Function (Main Game Loop) ---
function draw() {
    if (gameState === 'intro') { drawIntroScreen(); return; }

    // --- Weather ---
    if (gameState === 'playing') {
        if (isCurrentlyRaining) { rainTimer--; if (rainTimer <= 0) { isCurrentlyRaining = false; clearTimer = random(CLEAR_DURATION_MIN, CLEAR_DURATION_MAX); rainDrops = []; updateWeatherVisuals(); } }
        else { clearTimer--; if (clearTimer <= 0) { isCurrentlyRaining = true; rainTimer = random(RAIN_DURATION_MIN, RAIN_DURATION_MAX); rainDrops = []; for (let i = 0; i < MAX_RAINDROPS; i++) { rainDrops.push(new RainDrop()); } updateWeatherVisuals(); } }
    }

    drawBackground();
    drawEnvironment();

    // --- Particles ---
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].display(); if (particles[i].isDead()) { particles.splice(i, 1); } }

    // --- Projectiles ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        let proj = bullets[i];
        proj.update();
        let removeProjectile = false;
        for (let plane of [plane1, plane2]) { if (proj.checkCollision(plane)) { proj.hitEffect(plane); removeProjectile = true; break; } }
        if (removeProjectile) { bullets.splice(i, 1); continue; }
        if (proj.checkCollision(balloon, true)) { balloon.hit(); removeProjectile = true; if (proj.ownerId === 1) { score1++; } else { score2++; } if (proj instanceof BubbleProjectile && bubblePopSound && bubbleEnv && audioStarted && soundNodesStarted) { bubbleEnv.play(bubblePopSound); } }
        if (removeProjectile) { bullets.splice(i, 1); continue; }
        if (proj.checkCollisionHut(hut)) { if (!(proj instanceof ChickenProjectile)) { removeProjectile = true; } }
        if (removeProjectile) { bullets.splice(i, 1); continue; }
        if (proj.isOffscreen()) { removeProjectile = true; }
        if (removeProjectile) { bullets.splice(i, 1); continue; }
        proj.display();
    }

    // --- Bombs ---
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].update(); bombs[i].display(); let exploded = false;
        if (bombs[i].fuseTimer <= 0) { bombs[i].explode(hut); exploded = true; }
        else { if (plane1.isAlive && bombs[i].ownerId !== plane1.id && bombs[i].checkCollision(plane1)) { bombs[i].explode(hut); exploded = true; } else if (plane2.isAlive && bombs[i].ownerId !== plane2.id && bombs[i].checkCollision(plane2)) { bombs[i].explode(hut); exploded = true; } else if (bombs[i].checkCollisionHut(hut)) { bombs[i].explode(hut); exploded = true; } else if (bombs[i].checkCollisionGround()) { bombs[i].explode(hut); exploded = true; } }
        if (exploded || bombs[i].isOffscreen()) { bombs.splice(i, 1); }
    }

    // --- Planes ---
    plane1.handleInput(keys); plane1.update(); plane1.display();
    plane2.handleInput(keys); plane2.update(); plane2.display();

    // --- Plane-Plane Collision ---
    if (plane1.isAlive && plane2.isAlive && !plane1.activePowerUps['Shield'] && !plane2.activePowerUps['Shield'] && !plane1.activePowerUps['CloudDisguise'] && !plane2.activePowerUps['CloudDisguise']) { // Cloud disguise does not prevent collision
        let distanceSq = (plane1.position.x - plane2.position.x)**2 + (plane1.position.y - plane2.position.y)**2;
        let collisionRadius = (plane1.size + plane2.size) * 0.5 * PLANE_COLLISION_THRESHOLD_FACTOR;
        if (distanceSq < collisionRadius * collisionRadius) {
            // console.log("PLANE COLLISION!");
            plane1.hit(true); plane2.hit(true);
            let awayVector = p5.Vector.sub(plane1.position, plane2.position).normalize().mult(2);
            plane1.velocity.add(awayVector); plane2.velocity.sub(awayVector);
        }
    }

    // --- Scenery & Environment ---
    for (let cloud of clouds) { cloud.update(); cloud.display(); }
    balloon.update(); balloon.display();
    drawHut();
    if (isCurrentlyRaining) { for (let drop of rainDrops) { drop.update(); drop.display(); } }

    // --- PowerUps ---
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update(); powerUps[i].display();
        if (powerUps[i].checkCollision(plane1)) { plane1.collectPowerUp(powerUps[i].type); powerUps.splice(i, 1); continue; }
        if (powerUps[i].checkCollision(plane2)) { plane2.collectPowerUp(powerUps[i].type); powerUps.splice(i, 1); continue; }
        if (powerUps[i].isOffscreen()) { powerUps.splice(i, 1); }
    }

    // --- UI ---
    drawUI();
    displayPowerUpStatus(plane1, 20, height - 100, width * 0.4); // Display P1 powerups on left
    displayPowerUpStatus(plane2, width - 20, height - 100, width * 0.4, true); // Display P2 powerups on right
}

// --- Draw Intro Screen --- (Unchanged)
function drawIntroScreen() { drawBackground(); drawEnvironment(); if (hut) { hut.destroyed = false; hut.rubbleDetails = null; } drawHut(); fill(0, 0, 0, 150); rect(width / 2, height / 2, width, height); textFont('monospace'); fill(255, 215, 0); stroke(0); strokeWeight(4); textSize(min(width * 0.1, height * 0.15)); textAlign(CENTER, CENTER); text("Biplane Battle", width / 2, height * 0.2); noStroke(); fill(240); textSize(min(width * 0.025, height * 0.04)); let instrY = height * 0.45; let lineSpacing = height * 0.05; let col1X = width * 0.3; let col2X = width * 0.7; fill(PLANE1_COLOR_BODY); text("Player 1", col1X, instrY); fill(240); text("W: Thrust", col1X, instrY + lineSpacing); text("A: Turn Left", col1X, instrY + lineSpacing * 2); text("D: Turn Right", col1X, instrY + lineSpacing * 3); text("S: Shoot/Drop", col1X, instrY + lineSpacing * 4); fill(PLANE2_COLOR_BODY); text("Player 2", col2X, instrY); fill(240); text("Up Arrow: Thrust", col2X, instrY + lineSpacing); text("Left Arrow: Turn Left", col2X, instrY + lineSpacing * 2); text("Right Arrow: Turn Right", col2X, instrY + lineSpacing * 3); text("Down Arrow: Shoot/Drop", col2X, instrY + lineSpacing * 4); fill(255, 255, 100); textSize(min(width * 0.03, height * 0.05)); if (floor(frameCount / 20) % 2 === 0) { text("Press any key to start", width / 2, height * 0.85); } noStroke(); }

// --- Input Handling ---
function keyPressed() {
    if (gameState === 'intro') {
        gameState = 'playing'; if (hut) { hut.destroyed = false; hut.rubbleDetails = null; }
        if (audioStarted && !soundNodesStarted) { try { engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start(); bombExplosionNoise.start(); boingSound.start(); chickenSound.start(); bubblePopSound.start(); rainbowSparkleSound.start(); cloudPoofSound.start(); soundNodesStarted = true; /* console.log("Sound nodes started via key press."); */ } catch (e) { console.error("Error starting sound nodes:", e); } }
        else if (!audioStarted) { /* console.log("Key pressed, waiting for audio context."); */ } return;
    } if (gameState === 'playing') { keys[keyCode] = true; }
}
function keyReleased() { if (gameState === 'playing') { keys[keyCode] = false; } }

// --- Fullscreen & Audio Start ---
function mousePressed() {
  if (!audioStarted && getAudioContext().state !== 'running') { userStartAudio().then(() => { if (getAudioContext().state === 'running') { /* console.log("Audio Context running."); */ audioStarted = true; if (gameState === 'playing' && !soundNodesStarted) { try { engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start(); bombExplosionNoise.start(); boingSound.start(); chickenSound.start(); bubblePopSound.start(); rainbowSparkleSound.start(); cloudPoofSound.start(); soundNodesStarted = true; /* console.log("Sound nodes started (mouse press)."); */ } catch (e) { console.error("Error starting sound nodes:", e); } } } else { console.error("Audio context failed to resume."); } }).catch(e => { console.error("Error starting audio:", e); }); }
  else if (!audioStarted && getAudioContext().state === 'running') { /* console.log("Audio Context already running."); */ audioStarted = true; if (gameState === 'playing' && !soundNodesStarted) { try { engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start(); bombExplosionNoise.start(); boingSound.start(); chickenSound.start(); bubblePopSound.start(); rainbowSparkleSound.start(); cloudPoofSound.start(); soundNodesStarted = true; /* console.log("Sound nodes started (pre-existing context)."); */ } catch (e) { console.error("Error starting sound nodes:", e); } } }
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) { let fs = fullscreen(); fullscreen(!fs); }
}

// --- Window Resize Handling ---
function windowResized() { resizeCanvas(windowWidth, windowHeight); calculateLayout(); }

// --- Drawing Functions ---
function drawBackground() { noStroke(); let bandHeight = height * 0.03; fill(currentSkyTop); rect(width / 2, (height * 0.075) / 2, width, height * 0.075); fill(currentSkyUpperBand); rect(width / 2, height * 0.075 + bandHeight / 2, width, bandHeight); for (let y = height * 0.075 + bandHeight; y < GROUND_Y; y++) { let inter = map(y, height * 0.075 + bandHeight, GROUND_Y, 0, 1); let c = lerpColor(color(currentSkyMidBlue), color(currentSkyLowerBlue), inter); stroke(c); line(0, y, width, y); } noStroke(); fill(255); for (let star of stars) { let brightness = star.brightness * (0.8 + sin(frameCount * 2 + star.x) * 0.2); fill(brightness, isCurrentlyRaining ? 80 : 255); ellipse(star.x, star.y, star.size, star.size); } noStroke(); }
function drawEnvironment() { noStroke(); fill(MOUNTAIN_DISTANT); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y * 0.85); vertex(width * 0.3, GROUND_Y * 0.88); vertex(width * 0.5, GROUND_Y * 0.78); vertex(width * 0.7, GROUND_Y * 0.90); vertex(width * 0.9, GROUND_Y * 0.82); vertex(width, GROUND_Y); endShape(CLOSE); let peak1_baseL = { x: width * 0.05, y: GROUND_Y }; let peak1_top = { x: width * 0.3, y: GROUND_Y * 0.55 }; let peak1_baseR = { x: width * 0.45, y: GROUND_Y }; let peak2_baseL = { x: width * 0.4, y: GROUND_Y }; let peak2_top = { x: width * 0.65, y: GROUND_Y * 0.45 }; let peak2_baseR = { x: width * 0.9, y: GROUND_Y }; fill(MOUNTAIN_DARK); triangle(peak1_baseL.x, peak1_baseL.y, peak1_top.x, peak1_top.y, peak1_baseR.x, peak1_baseR.y); let snowLevel1 = 0.35; fill(SNOW_COLOR); beginShape(); vertex(peak1_top.x, peak1_top.y); let snowP1_L_x = lerp(peak1_top.x, peak1_baseL.x, snowLevel1 * 1.2); let snowP1_L_y = lerp(peak1_top.y, peak1_baseL.y, snowLevel1); vertex(snowP1_L_x, snowP1_L_y); let snowP1_R_x = lerp(peak1_top.x, peak1_baseR.x, snowLevel1 * 1.1); let snowP1_R_y = lerp(peak1_top.y, peak1_baseR.y, snowLevel1); vertex(snowP1_R_x, snowP1_R_y); endShape(CLOSE); fill(MOUNTAIN_LIGHT); triangle(peak2_baseL.x, peak2_baseL.y, peak2_top.x, peak2_top.y, peak2_baseR.x, peak2_baseR.y); let snowLevel2 = 0.4; fill(SNOW_COLOR); beginShape(); vertex(peak2_top.x, peak2_top.y); let snowP2_L_x = lerp(peak2_top.x, peak2_baseL.x, snowLevel2 * 1.15); let snowP2_L_y = lerp(peak2_top.y, peak2_baseL.y, snowLevel2); vertex(snowP2_L_x, snowP2_L_y); let snowP2_R_x = lerp(peak2_top.x, peak2_baseR.x, snowLevel2 * 1.1); let snowP2_R_y = lerp(peak2_top.y, peak2_baseR.y, snowLevel2); vertex(snowP2_R_x, snowP2_R_y); endShape(CLOSE); fill(MOUNTAIN_GREEN); beginShape(); vertex(0, GROUND_Y); vertex(width * 0.1, GROUND_Y); curveVertex(width * 0.15, GROUND_Y * 0.95); vertex(width * 0.2, GROUND_Y * 0.85); curveVertex(width * 0.28, GROUND_Y * 0.98); vertex(width * 0.35, GROUND_Y); vertex(peak1_baseR.x, GROUND_Y); vertex(peak2_baseL.x, GROUND_Y); curveVertex(width * 0.58, GROUND_Y * 0.9); vertex(width * 0.6, GROUND_Y * 0.8); curveVertex(width * 0.75, GROUND_Y); vertex(width * 0.85, GROUND_Y); vertex(peak2_baseR.x, GROUND_Y); vertex(width, GROUND_Y); vertex(width, height); vertex(0, height); endShape(CLOSE); fill(GROUND_COLOR); rect(width / 2, GROUND_Y + (height - GROUND_Y) / 2, width, height - GROUND_Y); strokeWeight(1); for(let i = 0; i < 10; i++) { let lineY = GROUND_Y + (height - GROUND_Y) * (i / 10) * random(0.8, 1.2); let lineCol = lerpColor(color(GROUND_COLOR), color(GROUND_HIGHLIGHT), random(0.3, 0.7)); stroke(red(lineCol), green(lineCol), blue(lineCol), 100); line(0, lineY, width, lineY); } noStroke(); }
function drawHut() { if (!hut) return; if (hut.destroyed) { if (hut.rubbleDetails && hut.rubbleDetails.length > 0) { push(); translate(hut.x, hut.y + hut.h * 0.2); noStroke(); fill(GROUND_COLOR[0]*0.8, GROUND_COLOR[1]*0.8, GROUND_COLOR[2]*0.8); ellipse(0, GROUND_Y - hut.y - hut.h * 0.2, hut.w * 1.1, hut.h * 0.4); for (const detail of hut.rubbleDetails) { fill(detail.color); rect(detail.x, detail.y - hut.h * 0.2, detail.w, detail.h, detail.r); } pop(); } } else { push(); translate(hut.x, hut.y); noStroke(); fill(HUT_ROOF); triangle(-hut.w / 2 - 5, -hut.h / 2, hut.w / 2 + 5, -hut.h / 2, 0, -hut.h / 2 - hut.h * 0.6); fill(HUT_WALL); rect(0, 0, hut.w, hut.h); fill(HUT_DOOR); rect(-hut.w * 0.25, hut.h * 0.1, hut.w * 0.3, hut.h * 0.7, 3); fill(currentSkyLowerBlue[0]*0.7, currentSkyLowerBlue[1]*0.7, currentSkyLowerBlue[2]*0.7); rect(hut.w * 0.25, -hut.h * 0.1, hut.w * 0.35, hut.h * 0.35, 2); stroke(HUT_ROOF); strokeWeight(2); let winX = hut.w * 0.25; let winY = -hut.h * 0.1; let winW = hut.w * 0.35; let winH = hut.h * 0.35; line(winX - winW/2, winY, winX + winW/2, winY); line(winX, winY - winH/2, winX, winY + winH/2); stroke(HUT_WALL[0] * 0.8, HUT_WALL[1] * 0.8, HUT_WALL[2] * 0.8, 150); strokeWeight(1); for(let i = 0; i < 6; i++) { let lineY = -hut.h/2 + (hut.h / 6) * (i + 0.5); line(-hut.w/2, lineY, hut.w/2, lineY); } noStroke(); pop(); } }
function drawUI() { textSize(40); textFont('monospace'); fill(SCORE_COLOR); stroke(0); strokeWeight(3); textAlign(LEFT, BOTTOM); text(nf(score1, 2), 20, height - 10); textAlign(RIGHT, BOTTOM); text(nf(score2, 2), width - 20, height - 10); noStroke(); }

// Updated to display multiple powerups
function displayPowerUpStatus(plane, x, y, maxWidth, alignRight = false) {
    if (!plane.isAlive || Object.keys(plane.activePowerUps).length === 0) return;

    push();
    textFont('monospace');
    textSize(18);
    strokeWeight(2);
    let currentY = y;
    let iconsPerRow = floor(maxWidth / (POWERUP_SIZE + 10)); // Calculate how many icons fit
    let iconSize = POWERUP_SIZE * 0.8; // Smaller icons for status display
    let iconSpacing = iconSize + 8;
    let currentX = alignRight ? x - iconSize : x;
    let countInRow = 0;

    // Loop through active power-ups
    for (const type in plane.activePowerUps) {
        if (plane.activePowerUps.hasOwnProperty(type)) {
            let remainingFrames = plane.activePowerUps[type];
            let displayColor = POWERUP_COLORS[type] || [255, 255, 255];

            // Draw Icon
            push();
            translate(currentX + iconSize / 2, currentY + iconSize / 2);
            scale(iconSize / POWERUP_SIZE);
            stroke(0); fill(displayColor);
            if (type === 'RapidFire') { rect(0,0, POWERUP_SIZE*0.6, POWERUP_SIZE*0.6, 3); }
            else if (type === 'SpeedBoost') { triangle(0, -POWERUP_SIZE*0.4, -POWERUP_SIZE*0.4, POWERUP_SIZE*0.3, POWERUP_SIZE*0.4, POWERUP_SIZE*0.3); }
            else if (type === 'Shield') { ellipse(0,0, POWERUP_SIZE, POWERUP_SIZE); }
            else if (type === 'TripleShot') { rect(0,0, POWERUP_SIZE*0.2, POWERUP_SIZE*0.6); rect(-POWERUP_SIZE*0.3,0, POWERUP_SIZE*0.2, POWERUP_SIZE*0.6); rect(POWERUP_SIZE*0.3,0, POWERUP_SIZE*0.2, POWERUP_SIZE*0.6);}
            else if (type === 'Bomb') { ellipse(0,0,POWERUP_SIZE, POWERUP_SIZE); }
            else if (type === 'Trampoline') { noFill(); arc(0, POWERUP_SIZE*0.1, POWERUP_SIZE*0.8, POWERUP_SIZE*0.6, 180, 360); line(-POWERUP_SIZE*0.4, POWERUP_SIZE*0.1, POWERUP_SIZE*0.4, POWERUP_SIZE*0.1);}
            else if (type === 'ChickenLauncher') { ellipse(0,0, POWERUP_SIZE*0.7, POWERUP_SIZE*0.5);}
            else if (type === 'BubbleGun') { ellipse(0, 0, POWERUP_SIZE, POWERUP_SIZE); noFill(); stroke(255,150); arc(0,0, POWERUP_SIZE*0.6, POWERUP_SIZE*0.6, 90, 270);}
            else if (type === 'ReverseGun') { triangle(POWERUP_SIZE*0.4, 0, -POWERUP_SIZE*0.4, -POWERUP_SIZE*0.3, -POWERUP_SIZE*0.4, POWERUP_SIZE*0.3);}
            else if (type === 'RainbowTrail') {
                 noFill();
                 strokeWeight(2); // Ensure consistent stroke weight
                 let arcRad = POWERUP_SIZE * 0.8;
                 let numArcs = 3; // Draw 3 arcs for simplicity
                 for(let i = 0; i < numArcs; i++){
                     stroke(RAINBOW_COLORS[i % RAINBOW_COLORS.length]); // Use fixed colors from the array
                     arc(0, 0, arcRad, arcRad, i * (180 / numArcs) - 90, (i + 1) * (180 / numArcs) - 90); // Draw semicircular arcs
                 }
                 stroke(0); // Reset stroke for timer bar later
                 strokeWeight(1); // Reset stroke weight
            }
            // --- Cloud Disguise Icon ---
            else if (type === 'CloudDisguise') {
                 noStroke(); fill(displayColor[0], displayColor[1], displayColor[2], 220);
                 ellipse(0, 0, POWERUP_SIZE * 0.8, POWERUP_SIZE * 0.6);
                 ellipse(-POWERUP_SIZE * 0.3, POWERUP_SIZE * 0.1, POWERUP_SIZE * 0.5, POWERUP_SIZE * 0.4);
                 ellipse(POWERUP_SIZE * 0.3, POWERUP_SIZE * 0.05, POWERUP_SIZE * 0.6, POWERUP_SIZE * 0.5);
            }
            else { rect(0,0, POWERUP_SIZE, POWERUP_SIZE); } // Default
            pop();

            // Draw Timer Bar below icon
            let barWidth = iconSize;
            let barHeight = 5;
            let barY = currentY + iconSize + 2;
            let currentBarWidth = map(remainingFrames, 0, POWERUP_DURATION_FRAMES, 0, barWidth);
            noStroke();
            fill(100);
            rect(currentX + barWidth / 2, barY + barHeight / 2, barWidth, barHeight); // Background bar
            fill(displayColor);
            rect(currentX + currentBarWidth / 2, barY + barHeight / 2, currentBarWidth, barHeight); // Foreground bar

            // Move to next position
            countInRow++;
            if (alignRight) {
                currentX -= iconSpacing;
            } else {
                currentX += iconSpacing;
            }
        }
    }
    pop();
    noStroke();
}


// --- Helper Function to Update Sky Colors ---
function updateWeatherVisuals() { if (isCurrentlyRaining) { currentSkyTop = SKY_TOP.map(c => c * RAIN_DARKNESS_FACTOR); currentSkyUpperBand = SKY_UPPER_BAND.map(c => c * RAIN_DARKNESS_FACTOR); currentSkyMidBlue = SKY_MID_BLUE.map(c => c * RAIN_DARKNESS_FACTOR); currentSkyLowerBlue = SKY_LOWER_BLUE.map(c => c * RAIN_DARKNESS_FACTOR); } else { currentSkyTop = [...SKY_TOP]; currentSkyUpperBand = [...SKY_UPPER_BAND]; currentSkyMidBlue = [...SKY_MID_BLUE]; currentSkyLowerBlue = [...SKY_LOWER_BLUE]; } }
// --- Helper function to destroy the hut ---
function destroyHut(hutObj) { if (!hutObj || hutObj.destroyed) return; /* console.log("Hut DESTROYED!"); */ hutObj.destroyed = true; hutObj.rubbleDetails = []; createExplosion(hutObj.x, hutObj.y, HUT_DESTRUCTION_PARTICLES, BOMB_EXPLOSION_COLORS.concat(HUT_RUBBLE_COLORS), true); for (let i = 0; i < HUT_RUBBLE_PIECES; i++) { let rubbleCol = random(HUT_RUBBLE_COLORS); let baseY = hutObj.h * 0.5; let rubbleX = random(-hutObj.w * 0.6, hutObj.w * 0.6); let rubbleY = baseY - random(0, hutObj.h * 0.6); let rubbleW = random(hutObj.w * 0.1, hutObj.w * 0.35); let rubbleH = random(hutObj.h * 0.1, hutObj.h * 0.3); let rubbleR = random(1, 3); hutObj.rubbleDetails.push({ x: rubbleX, y: rubbleY, w: rubbleW, h: rubbleH, r: rubbleR, color: rubbleCol }); } }


// =====================
// --- Plane Class --- (Major Changes for Multiple Powerups, Cloud Disguise)
// =====================
class Plane {
    constructor(x, y, bodyCol, wingCol, accentCol, controls, id) {
        this.id = id;
        this.startPos = createVector(x, y);
        this.bodyColor = color(bodyCol);
        this.wingColor = color(wingCol);
        this.accentColor = color(accentCol);
        this.controls = controls;
        this.size = PLANE_BASE_SIZE; // Fixed size
        this.position = this.startPos.copy();
        this.velocity = createVector(0, 0);
        this.angle = (id === 2) ? 180 : 0;
        this.isAlive = true;
        this.isOnGround = true;
        this.respawnTimer = 0;
        this.shootCooldown = 0;
        this.isThrusting = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        this.planePoints = this.createPlaneShape(this.size); // Create based on fixed size
        this.engineSound = null;
        this.isStalled = false;
        this.isBubbled = false;
        this.bubbleTimer = 0;
        this.rainbowTrailCounter = 0;
        // NEW: Store multiple active powerups and their timers
        this.activePowerUps = {}; // e.g., { 'Shield': 1800, 'RapidFire': 1500 }

        // Cloud Disguise specific properties
        this.cloudPuffOffsets = []; // Store puff details for disguise
        this.generateCloudPuffOffsets(); // Generate initial (but unused until powerup)
    }

    assignEngineSound(soundObject) { this.engineSound = soundObject; }
    createPlaneShape(s) { return { fuselage: [ {x: s * 0.8, y: 0}, {x: s * 0.6, y: -s * 0.1}, {x: -s * 0.7, y: -s * 0.15}, {x: -s * 0.95, y: -s * 0.05}, {x: -s * 0.9, y: 0}, {x: -s * 0.95, y: s * 0.05}, {x: -s * 0.7, y: s * 0.15}, {x: s * 0.6, y: s * 0.1} ], topWing: [ {x: s * 0.35, y: -s * 0.25}, {x: s * 0.25, y: -s * 0.7}, {x: -s * 0.45, y: -s * 0.7}, {x: -s * 0.4, y: -s * 0.25} ], bottomWing: [ {x: s * 0.25, y: s * 0.25}, {x: s * 0.15, y: s * 0.6}, {x: -s * 0.35, y: s * 0.6}, {x: -s * 0.3, y: s * 0.25} ], tailplane: [ {x: -s * 0.75, y: -s * 0.1}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 1.0, y: 0}, {x: -s * 1.05, y: s * 0.35}, {x: -s * 0.75, y: s * 0.1} ], rudder: [ {x: -s * 0.9, y: 0}, {x: -s * 1.15, y: -s * 0.4}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 0.75, y: -s * 0.1} ], cockpit: [ {x: s * 0.4, y: -s * 0.1}, {x: s * 0.1, y: -s*0.35}, {x: -s*0.1, y: -s*0.25} ], wheels: [ {x: s*0.15, y: s*0.7}, {x: -s*0.2, y: s*0.7} ], wheelRadius: s * 0.18 }; }

    // Helper for cloud disguise puffs
    generateCloudPuffOffsets() {
        this.cloudPuffOffsets = [];
        let baseRadius = this.size * CLOUD_DISGUISE_SIZE_FACTOR;
        for (let i = 0; i < CLOUD_DISGUISE_PUFF_COUNT; i++) {
            let angle = random(360);
            let dist = random(0.1, 0.5) * baseRadius;
            let puffX = cos(angle) * dist;
            let puffY = sin(angle) * dist + random(-baseRadius * 0.1, baseRadius * 0.1); // Slight vertical bias?
            let puffR = random(baseRadius * 0.4, baseRadius * 0.7) * random(0.8, 1.2);
            this.cloudPuffOffsets.push({ x: puffX, y: puffY, r: puffR });
        }
    }

    handleInput(keys) {
        // Allow input even when disguised, but not when bubbled or respawning
        if (!this.isAlive || this.respawnTimer > 0 || this.isBubbled) {
            this.isThrusting = false;
            this.isTurningLeft = false;
            this.isTurningRight = false;
            return;
        }
        this.isThrusting = keys[this.controls.thrust] || false;
        this.isTurningLeft = keys[this.controls.left] || false;
        this.isTurningRight = keys[this.controls.right] || false;
        if (keys[this.controls.shoot]) {
            this.shoot();
        }
    }

    applyForce(force) { this.velocity.add(force); }

    update() {
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return; // Exit early if respawning
        }
        if (!this.isAlive) {
            if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0.05);
            return; // Exit early if dead
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // --- PowerUp Timer Update ---
        let expiredPowerups = [];
        for (const type in this.activePowerUps) {
            if (this.activePowerUps.hasOwnProperty(type)) {
                this.activePowerUps[type]--; // Decrement timer
                if (this.activePowerUps[type] <= 0) {
                    expiredPowerups.push(type); // Mark for removal
                }
            }
        }
        // Remove expired powerups and handle effects (like cloud disguise fade)
        for (const type of expiredPowerups) {
            // console.log(`Plane ${this.id} ${type} expired.`);
            delete this.activePowerUps[type];
            if (type === 'CloudDisguise' && audioStarted && soundNodesStarted && cloudPoofSound && cloudPoofEnv) {
                 cloudPoofEnv.play(cloudPoofSound); // Play sound on expiration
            }
            // Add other expiration effects if needed
        }


        // --- Bubble State Update ---
        if (this.isBubbled) {
             this.bubbleTimer--;
             if (this.bubbleTimer <= 0) {
                 this.isBubbled = false;
                 this.velocity.y -= 0.5; // Small downward pop when bubble breaks
             }
             else {
                 // Apply bubble physics
                 this.applyForce(createVector(0, -BUBBLE_FLOAT_FORCE));
                 this.velocity.mult(0.96); // Dampen velocity in bubble
                 this.angle += sin(frameCount * 3 + this.id) * 0.5; // Wobble angle
             }
             // Skip regular movement and physics updates while bubbled
        }

        // --- Ground Check Y (using fixed size) ---
        let groundCheckY = GROUND_Y - (this.size * 0.8);

        // --- Movement controls only if NOT bubbled ---
        // Cloud disguise does NOT restrict turning
        if (!this.isBubbled) {
            if (this.isTurningLeft) { this.angle -= TURN_SPEED; }
            if (this.isTurningRight) { this.angle += TURN_SPEED; }
        }

        // --- Stall Check (only if not grounded and not bubbled)---
        let verticalPointing = sin(this.angle);
        const STALL_ENTRY_SIN_THRESHOLD = sin(STALL_ANGLE_THRESHOLD);
        const STALL_RECOVERY_SIN_THRESHOLD = sin(STALL_RECOVERY_ANGLE);

        // Cloud disguise does not prevent stalling
        if (!this.isOnGround && !this.isBubbled) {
            if (!this.isStalled) {
                if (verticalPointing < STALL_ENTRY_SIN_THRESHOLD) {
                    this.isStalled = true;
                }
            } else { // Is currently stalled
                if (verticalPointing > STALL_RECOVERY_SIN_THRESHOLD) {
                    this.isStalled = false; // Recovered from stall
                }
            }
        } else { // On ground or bubbled
            if (this.isStalled) {
                this.isStalled = false; // Instantly recover stall state on ground/bubble
            }
        }

        // --- Calculate Forces (only if not bubbled) ---
        // Cloud disguise does NOT affect forces
        let thrustVector = createVector(0, 0);
        let currentThrustForce = THRUST_FORCE;
        if (!this.isBubbled) {
            if (this.activePowerUps['SpeedBoost']) {
                currentThrustForce *= 1.6; // Apply SpeedBoost multiplier
            }
            if (this.isStalled) {
                currentThrustForce *= STALL_EFFECT_FACTOR; // Reduce thrust if stalled
            }
            if (this.isThrusting) { // Calculate thrust vector if thrusting key is pressed
                thrustVector = p5.Vector.fromAngle(radians(this.angle), currentThrustForce);
            }
        }

        // --- Physics: Grounded vs Airborne ---
        if (this.isOnGround) {
            // --- Grounded Physics ---
            this.velocity.x *= GROUND_FRICTION; // Apply ground friction to horizontal speed

            let normAngle = (this.angle % 360 + 360) % 360;
            const TAKEOFF_MIN_ANGLE_P1 = -10; const TAKEOFF_MAX_ANGLE_P1 = -85;
            const TAKEOFF_MIN_ANGLE_P2 = 190; const TAKEOFF_MAX_ANGLE_P2 = 265;
            let isAngledForTakeoff = (this.id === 1) ? (this.angle < TAKEOFF_MIN_ANGLE_P1 && this.angle > TAKEOFF_MAX_ANGLE_P1) : (normAngle > TAKEOFF_MIN_ANGLE_P2 && normAngle < TAKEOFF_MAX_ANGLE_P2);

            // Apply Thrust (if not bubbled)
            if (this.isThrusting && !this.isBubbled) {
                 if (isAngledForTakeoff) { this.applyForce(createVector(thrustVector.x, thrustVector.y * 0.15)); }
                 else { this.applyForce(createVector(thrustVector.x, 0)); }
            }
            // Apply Gravity / Downward Force
             if (this.isThrusting && !this.isBubbled && isAngledForTakeoff) { this.applyForce(createVector(0, GRAVITY_FORCE * 0.7)); }
             else if (this.isThrusting && !this.isBubbled && !isAngledForTakeoff) { this.applyForce(createVector(0, GRAVITY_FORCE * 1.0)); }
             else { this.applyForce(createVector(0, GRAVITY_FORCE * 2.0)); }
            // Ground Clamping
            if (this.position.y > groundCheckY) { this.position.y = groundCheckY; if(this.velocity.y > 0) this.velocity.y = 0; }
            // Takeoff Transition
            let horizontalSpeed = abs(this.velocity.x);
            if (this.isThrusting && isAngledForTakeoff && horizontalSpeed > MIN_TAKEOFF_SPEED && !this.isBubbled) {
                this.isOnGround = false; this.isStalled = false; this.velocity.y -= currentThrustForce * 2.0;
            }

        } else { // --- Airborne Physics ---
            if (!this.isBubbled) { // Apply normal airborne physics if not bubbled (Cloud Disguise doesn't change physics)
                this.applyForce(thrustVector); // Apply engine thrust
                // Apply lift based on speed (reduced by rain or stall)
                let speed = this.velocity.mag();
                let liftMagnitude = speed * LIFT_FACTOR;
                if (isCurrentlyRaining) { liftMagnitude *= RAIN_LIFT_REDUCTION_FACTOR; }
                if (this.isStalled) { liftMagnitude *= STALL_EFFECT_FACTOR; }
                this.applyForce(createVector(0, -liftMagnitude)); // Upward lift force
                this.applyForce(createVector(0, GRAVITY_FORCE)); // Apply gravity
                this.velocity.mult(DAMPING_FACTOR); // Apply air drag
            } else { // Bubbled in the air
                 this.applyForce(createVector(0, GRAVITY_FORCE * 0.3));
            }
        }

        // --- Update Position (applies to both grounded and airborne) ---
        // Only update position if not bubbled, bubble handles its own minimal movement
        if (!this.isBubbled) {
             this.position.add(this.velocity);
        }

        // --- Landing / Ground Interaction (Post-Position Update) ---
        if (this.position.y >= groundCheckY && !this.isOnGround) {
             let normAngle = (this.angle % 360 + 360) % 360;
             let isTooSteep = (normAngle > 45 && normAngle < 135) || (normAngle > 225 && normAngle < 315);
             let verticalSpeed = this.velocity.y;

             // --- TRAMPOLINE POWERUP OVERRIDE ---
             if (this.activePowerUps['Trampoline'] && verticalSpeed > 0 && !this.isBubbled) {
                  if (verticalSpeed < TRAMPOLINE_MAX_SPEED_THRESHOLD) {
                      this.position.y = groundCheckY - 1; this.velocity.y *= -TRAMPOLINE_BOUNCE_FORCE; this.velocity.x *= 0.9; this.velocity.add(p5.Vector.random2D().mult(0.5));
                      if (audioStarted && soundNodesStarted && boingSound && boingEnv) { boingSound.freq(random(300, 600)); boingEnv.play(boingSound); }
                      if(this.activePowerUps['Trampoline']) this.activePowerUps['Trampoline'] = max(0, this.activePowerUps['Trampoline'] - POWERUP_DURATION_FRAMES * 0.05);
                  } else { // Land normally if too fast for trampoline
                      this.isOnGround = true; this.isStalled = false; this.position.y = groundCheckY; this.velocity.y = 0;
                      if (this.isBubbled) { this.isBubbled = false; this.bubbleTimer = 0; if (bubblePopSound && bubbleEnv && audioStarted && soundNodesStarted) bubbleEnv.play(bubblePopSound); }
                  }
             }
             // --- REGULAR LANDING / CRASH CHECK (Only if Trampoline NOT active/used) ---
             else {
                 // Crash condition: Too fast OR too steep, AND not shielded OR bubbled (Cloud Disguise offers no protection)
                 if ((verticalSpeed > MAX_LANDING_SPEED || isTooSteep) && !this.activePowerUps['Shield'] && !this.isBubbled) {
                      this.hit(true); return; // Stop updates this frame after crash
                 }
                 // Safe landing or Shield absorption
                 else {
                     this.isOnGround = true; this.isStalled = false; this.position.y = groundCheckY; this.velocity.y = 0;
                     if (this.isBubbled) { this.isBubbled = false; this.bubbleTimer = 0; if (bubblePopSound && bubbleEnv && audioStarted && soundNodesStarted) bubbleEnv.play(bubblePopSound); }
                     if (this.activePowerUps['Shield'] && (verticalSpeed > MAX_LANDING_SPEED || isTooSteep)) { if(this.activePowerUps['Shield']) this.activePowerUps['Shield'] = max(0, this.activePowerUps['Shield'] - POWERUP_DURATION_FRAMES * 0.4); }
                 }
             }
        } // End of landing check

        // --- Boundary Constraints (Screen Wrapping & Ceiling) ---
        if (this.position.x > width + this.size) { this.position.x = -this.size; }
        else if (this.position.x < -this.size) { this.position.x = width + this.size; }
        if (this.position.y < this.size / 2) { this.position.y = this.size / 2; if (this.velocity.y < 0) { this.velocity.y = 0; } }

        // --- Collisions (Hut, Balloon) if still alive ---
        if (!this.isAlive) return; // Double check aliveness

        // Check Hut collision (Cloud Disguise doesn't prevent)
        if (this.checkCollisionHut(hut)) { if (!this.isAlive) return; }

        // Check Balloon collision
        if (balloon.isAlive) {
            let distanceSq = (this.position.x - balloon.pos.x)**2 + (this.position.y - balloon.pos.y)**2;
            let combinedRadiusSq = (this.size * 0.9 + balloon.radius)**2;
            if (distanceSq < combinedRadiusSq) {
                if (this.activePowerUps['Shield']) { balloon.hit(); if(this.activePowerUps['Shield']) this.activePowerUps['Shield'] = max(0, this.activePowerUps['Shield'] - POWERUP_DURATION_FRAMES * 0.2); }
                else if (!this.isBubbled) { // Unshielded, non-bubbled (even if disguised) plane crashes
                    this.hit(true); return;
                }
            }
        }

        // --- Rainbow Trail Emission ---
        if (this.activePowerUps['RainbowTrail'] && !this.isOnGround && !this.isBubbled) {
             this.rainbowTrailCounter++;
             if (this.rainbowTrailCounter >= RAINBOW_TRAIL_PARTICLE_INTERVAL) {
                 this.rainbowTrailCounter = 0;
                 let trailColor = RAINBOW_COLORS[rainbowColorIndex % RAINBOW_COLORS.length];
                 let offset = p5.Vector.fromAngle(radians(this.angle + 180), this.size * 0.5);
                 let spawnPos = p5.Vector.add(this.position, offset);
                 if (particles.length < MAX_PARTICLES) { particles.push(new RainbowParticle(spawnPos.x, spawnPos.y, trailColor)); }
                 rainbowColorIndex++;
                 if (random() < 0.1 && audioStarted && soundNodesStarted && rainbowSparkleSound && rainbowEnv) { rainbowSparkleSound.freq(random(800, 1600)); rainbowEnv.play(rainbowSparkleSound); }
             }
         }

        // --- Engine Sound Update ---
        // Cloud Disguise does not affect engine sound
        if (this.isAlive && this.engineSound && audioStarted && soundNodesStarted) {
            let targetFreq = BASE_ENGINE_FREQ;
            let targetAmp = BASE_ENGINE_AMP;
            if (!this.isBubbled) { // Normal engine sound logic
                 let speed = this.velocity.mag();
                 targetFreq = map(speed, 0, MAX_SPEED_FOR_SOUND, BASE_ENGINE_FREQ, MAX_ENGINE_FREQ, true);
                 targetAmp = (this.isThrusting) ? MAX_ENGINE_AMP : BASE_ENGINE_AMP;
                 if (this.isStalled) { targetAmp *= 0.5; targetFreq *= 0.8; }
                 if (this.activePowerUps['SpeedBoost']) { targetFreq *= 1.1; targetAmp *= 1.1; }
                 if (this.isOnGround && !this.isThrusting) { targetAmp = BASE_ENGINE_AMP * 0.5; }
             } else { // Muffled sound when bubbled
                 targetAmp = BASE_ENGINE_AMP * 0.5; targetFreq = BASE_ENGINE_FREQ * 0.8;
             }
            this.engineSound.amp(targetAmp, 0.1); this.engineSound.freq(targetFreq, 0.1);
        }
        else if (this.engineSound && this.engineSound.getAmp() > 0) { this.engineSound.amp(0, 0.1); }

    } // --- End of update() ---

    display() {
        push();
        translate(this.position.x, this.position.y);

        // Flicker if respawning
        if (this.respawnTimer > 0 && floor(this.respawnTimer / 8) % 2 === 0) {
             // Don't draw anything to make it flicker
        }
        // --- CLOUD DISGUISE DRAWING ---
        else if (this.activePowerUps['CloudDisguise']) {
             noStroke();
             let baseOpacity = CLOUD_DISGUISE_OPACITY;
             // Fade out effect
             let timer = this.activePowerUps['CloudDisguise'];
             if (timer < 120) {
                 baseOpacity = map(timer, 0, 120, 0, CLOUD_DISGUISE_OPACITY);
                 if (floor(frameCount / 4) % 2 === 0) baseOpacity = 0; // Flicker when ending
             }

             // Shadow (optional, slightly darker)
             fill(CLOUD_SHADOW[0] * 0.9, CLOUD_SHADOW[1] * 0.9, CLOUD_SHADOW[2] * 0.9, baseOpacity * 0.5);
             ellipse(0, this.size * 0.4, this.size * CLOUD_DISGUISE_SIZE_FACTOR * 1.1, this.size * CLOUD_DISGUISE_SIZE_FACTOR * 0.6);

             // Main puffs (use pre-generated offsets)
             fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], baseOpacity);
             let wobbleFactor = sin(frameCount * 1.5 + this.id * 10) * 0.05 + 1.0; // Gentle size wobble
             for (let puff of this.cloudPuffOffsets) {
                 ellipse(puff.x, puff.y, puff.r * wobbleFactor, puff.r * 0.85 * wobbleFactor);
             }
        }
        // --- NORMAL PLANE DRAWING ---
        else {
            rotate(this.angle);
            if (this.id === 2) { scale(1, -1); } // Flip P2 visually

            stroke(0); strokeWeight(1.5); let pp = this.planePoints;
            fill(red(this.wingColor)*0.8, green(this.wingColor)*0.8, blue(this.wingColor)*0.8); beginShape(); for(let p of pp.bottomWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.accentColor); beginShape(); for(let p of pp.tailplane) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.fuselage) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.wingColor); beginShape(); for(let p of pp.topWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.rudder) { vertex(p.x, p.y); } endShape(CLOSE); noFill(); stroke(0, 150); strokeWeight(1.5); if (pp.cockpit.length >= 2) { beginShape(); curveVertex(pp.cockpit[0].x, pp.cockpit[0].y); for(let p of pp.cockpit) { curveVertex(p.x, p.y); } curveVertex(pp.cockpit[pp.cockpit.length - 1].x, pp.cockpit[pp.cockpit.length - 1].y); endShape(); }
            let wheelDrawThreshold = GROUND_Y - this.size * 3; if (this.isOnGround || (!this.isOnGround && this.position.y > wheelDrawThreshold) || (!this.isOnGround && this.velocity.y > 0.3)) { fill(40); noStroke(); ellipse(pp.wheels[0].x, pp.wheels[0].y, pp.wheelRadius * 2, pp.wheelRadius * 2); ellipse(pp.wheels[1].x, pp.wheels[1].y, pp.wheelRadius * 2, pp.wheelRadius * 2); stroke(60); strokeWeight(3); line(pp.wheels[0].x, pp.wheels[0].y - pp.wheelRadius, pp.bottomWing[1].x * 0.8, pp.bottomWing[1].y - this.size * 0.1); line(pp.wheels[1].x, pp.wheels[1].y - pp.wheelRadius, pp.bottomWing[2].x * 0.8, pp.bottomWing[2].y - this.size * 0.1); }
            noStroke(); let noseX = this.size * 0.85; let propHeight = this.size * 0.9; let propWidthRunning = this.size * 0.15; let propWidthStopped = this.size * 0.05; let engineRunning = (this.isThrusting || (this.velocity.magSq() > 0.5)) && !this.isBubbled; if (engineRunning) { fill(PROPELLER_BLUR_COLOR); ellipse(noseX, 0, propWidthRunning, propHeight); } else { fill(PROPELLER_STOPPED_COLOR); rect(noseX, 0, propWidthStopped, propHeight); } fill(this.accentColor); ellipse(noseX, 0, this.size * 0.2, this.size * 0.2);
            // --- Display Active Powerup Effects (Shield, Bubble) ---
            if (this.activePowerUps['Shield']) { let shieldTimer = this.activePowerUps['Shield']; let shieldAlpha = SHIELD_COLOR[3] * (0.7 + sin(frameCount * 4) * 0.3); if (shieldTimer < 120 && floor(frameCount / 5) % 2 === 0) { shieldAlpha = 0; } fill(SHIELD_COLOR[0], SHIELD_COLOR[1], SHIELD_COLOR[2], shieldAlpha); noStroke(); ellipse(0, 0, this.size * 2.8, this.size * 2.2); }
            if (this.isBubbled) { let bubbleAlpha = BUBBLE_FILL_COLOR[3] * (0.8 + sin(frameCount * 2) * 0.2); fill(BUBBLE_FILL_COLOR[0], BUBBLE_FILL_COLOR[1], BUBBLE_FILL_COLOR[2], bubbleAlpha); strokeWeight(2); stroke(BUBBLE_STROKE_COLOR[0],BUBBLE_STROKE_COLOR[1],BUBBLE_STROKE_COLOR[2], BUBBLE_STROKE_COLOR[3] * 0.8); ellipse(0, 0, this.size * 3.0, this.size * 3.0); noFill(); stroke(255, 255, 255, 100); arc(this.size * -0.5, this.size * -0.5, this.size * 1.5, this.size * 1.5, 180, 270); }
        }
        pop();
        noStroke();
    }


    shoot() {
        // Cloud Disguise does not affect shooting ability or angle requirements
        let isAngledForShootingOnGround = false; let normalizedAngle = (this.angle % 360 + 360) % 360; if (this.id === 1) { isAngledForShootingOnGround = (this.angle < -10 && this.angle > -170); } else { isAngledForShootingOnGround = (normalizedAngle > 190 && normalizedAngle < 350); }
        let canShoot = (!this.isOnGround || (this.isOnGround && isAngledForShootingOnGround)) && !this.isBubbled;

        let currentCooldown = SHOOT_COOLDOWN_FRAMES;
        if (this.activePowerUps['RapidFire']) { currentCooldown = SHOOT_COOLDOWN_FRAMES / 2.5; }
        else if (this.activePowerUps['TripleShot']) { currentCooldown = SHOOT_COOLDOWN_FRAMES * 1.5; }
        else if (this.activePowerUps['Bomb']) { currentCooldown = SHOOT_COOLDOWN_FRAMES * 2.0; }
        else if (this.activePowerUps['ChickenLauncher']) { currentCooldown = SHOOT_COOLDOWN_FRAMES * 1.2; }
        else if (this.activePowerUps['BubbleGun']) { currentCooldown = SHOOT_COOLDOWN_FRAMES * 1.1; }
        // Cloud Disguise does not affect cooldown

        if (this.shootCooldown <= 0 && this.isAlive && canShoot && audioStarted && soundNodesStarted) {
            let originOffsetDistance = this.size * 0.9;
            let primarySpawnAngle = this.angle; // Default forward
            let primaryOffsetVector = createVector(originOffsetDistance, 0);
            let hasReverseGun = this.activePowerUps['ReverseGun'];

            // Determine primary shooting direction
            if (hasReverseGun) { primarySpawnAngle += 180; primaryOffsetVector = createVector(-originOffsetDistance, 0); }
            let primaryRotatedOffset = primaryOffsetVector.copy().rotate(this.angle);
            let primarySpawnPos = p5.Vector.add(this.position, primaryRotatedOffset);

            // Fire primary projectile(s)
            let fired = false;
            if (this.activePowerUps['Bomb']) {
                let bombOffsetDist = -this.size * 0.3; let bombOffsetVec = createVector(bombOffsetDist, 0).rotate(this.angle); let bombSpawnPos = p5.Vector.add(this.position, bombOffsetVec);
                bombs.push(new Bomb(bombSpawnPos.x, bombSpawnPos.y, this.id, this.velocity)); if (bombDropSound && shootNoise) { bombDropSound.play(shootNoise); }
                bullets.push(new Bullet(primarySpawnPos.x, primarySpawnPos.y, primarySpawnAngle, this.id, this.bodyColor)); if (shootSoundEnv && shootNoise) { shootSoundEnv.play(shootNoise); } fired = true;
            } else if (this.activePowerUps['TripleShot']) {
                let angle1 = primarySpawnAngle - TRIPLE_SHOT_SPREAD_ANGLE; let angle2 = primarySpawnAngle; let angle3 = primarySpawnAngle + TRIPLE_SHOT_SPREAD_ANGLE;
                bullets.push(new Bullet(primarySpawnPos.x, primarySpawnPos.y, angle1, this.id, this.bodyColor)); bullets.push(new Bullet(primarySpawnPos.x, primarySpawnPos.y, angle2, this.id, this.bodyColor)); bullets.push(new Bullet(primarySpawnPos.x, primarySpawnPos.y, angle3, this.id, this.bodyColor));
                 if (shootSoundEnv && shootNoise) { shootSoundEnv.play(shootNoise); } fired = true;
            } else if (this.activePowerUps['ChickenLauncher']) {
                 bullets.push(new ChickenProjectile(primarySpawnPos.x, primarySpawnPos.y, primarySpawnAngle, this.id)); if (chickenSound && chickenEnv) { chickenSound.freq(random(700,1000)); chickenEnv.play(chickenSound); } fired = true;
            } else if (this.activePowerUps['BubbleGun']) {
                 bullets.push(new BubbleProjectile(primarySpawnPos.x, primarySpawnPos.y, primarySpawnAngle, this.id)); if (shootSoundEnv && shootNoise) { shootSoundEnv.play(shootNoise); } fired = true;
            } else { // Normal bullet (RapidFire/ReverseGun handled by cooldown/angle)
                 bullets.push(new Bullet(primarySpawnPos.x, primarySpawnPos.y, primarySpawnAngle, this.id, this.bodyColor)); if (shootSoundEnv && shootNoise) { shootSoundEnv.play(shootNoise); } fired = true;
            }

            // Fire EXTRA forward bullet if ReverseGun is active
            if (hasReverseGun) {
                 let forwardSpawnAngle = this.angle; let forwardOffsetVector = createVector(originOffsetDistance, 0);
                 let forwardRotatedOffset = forwardOffsetVector.copy().rotate(this.angle); let forwardSpawnPos = p5.Vector.add(this.position, forwardRotatedOffset);
                 bullets.push(new Bullet(forwardSpawnPos.x, forwardSpawnPos.y, forwardSpawnAngle, this.id, this.bodyColor));
                 fired = true;
            }

            if (fired) { this.shootCooldown = currentCooldown; }
        }
    }


    checkCollisionHut(hutObj) {
        // Cloud disguise does not prevent hut collision
        if (!this.isAlive || this.respawnTimer > 0 || !hutObj || hutObj.destroyed || this.isBubbled) return false;
        let collisionRadius = this.size; let hutMinX = hutObj.x - hutObj.w / 2; let hutMaxX = hutObj.x + hutObj.w / 2; let hutMinY = hutObj.y - hutObj.h / 2; let hutMaxY = hutObj.y + hutObj.h / 2; let closestX = constrain(this.position.x, hutMinX, hutMaxX); let closestY = constrain(this.position.y, hutMinY, hutMaxY); let distanceSq = (this.position.x - closestX)**2 + (this.position.y - closestY)**2;

        if (distanceSq < collisionRadius * collisionRadius) {
            let hitRoof = this.position.y < hutObj.y - hutObj.h * 0.3 && this.velocity.y > 0;
            if (this.activePowerUps['Trampoline'] && hitRoof && this.velocity.y > 0 && this.velocity.y < TRAMPOLINE_MAX_SPEED_THRESHOLD) { // Bounce off roof if Trampoline
                 this.velocity.y *= -TRAMPOLINE_BOUNCE_FORCE * 0.8; this.velocity.x *= 0.95;
                 if(this.activePowerUps['Trampoline']) this.activePowerUps['Trampoline'] = max(0, this.activePowerUps['Trampoline'] - POWERUP_DURATION_FRAMES * 0.1);
                 if (audioStarted && soundNodesStarted && boingSound && boingEnv) { boingSound.freq(random(400, 700)); boingEnv.play(boingSound); } return false;
            } else if (!this.activePowerUps['Shield']) { // Crash if not shielded (disguise doesn't help)
                this.hit(true);
                return true;
            }
            return false; // Shielded, pass through
        } return false; // No collision
    }


    hit(causedByCrashOrBomb, projectile = null) {
        if (!this.isAlive) return false;

        // Shield logic (Cloud Disguise does not protect)
        if (this.activePowerUps['Shield'] && !causedByCrashOrBomb && projectile && !(projectile instanceof BubbleProjectile)) {
             if (audioStarted && soundNodesStarted && shieldDeflectSound && shootNoise) { shieldDeflectSound.play(shootNoise); }
             if(this.activePowerUps['Shield']) this.activePowerUps['Shield'] = max(0, this.activePowerUps['Shield'] - POWERUP_DURATION_FRAMES * 0.15);
             return false; // Deflected
        }

        // Bubble projectile logic
        if (!causedByCrashOrBomb && projectile && projectile instanceof BubbleProjectile) {
             if (!this.isBubbled) {
                 this.isBubbled = true; this.bubbleTimer = BUBBLE_TRAP_DURATION; this.velocity.mult(0.1);
                 if (bubblePopSound && bubbleEnv && audioStarted && soundNodesStarted) { bubbleEnv.play(bubblePopSound); }
                 // Also remove cloud disguise if bubbled
                 if (this.activePowerUps['CloudDisguise']) {
                     delete this.activePowerUps['CloudDisguise'];
                     if (audioStarted && soundNodesStarted && cloudPoofSound && cloudPoofEnv) cloudPoofEnv.play(cloudPoofSound);
                 }
             }
             return false; // Bubbled, not "hit"
        }

        // --- Actual Hit ---
        this.isAlive = false; this.isOnGround = false; this.isStalled = false; this.isBubbled = false; this.bubbleTimer = 0;
        this.activePowerUps = {}; // Clear ALL powerups on hit, including disguise
        this.velocity = createVector(random(-1.5, 1.5), -2.5); this.respawnTimer = RESPAWN_DELAY_FRAMES;
        createExplosion(this.position.x, this.position.y, 35, EXPLOSION_COLORS);
        if (this.engineSound && audioStarted && soundNodesStarted) this.engineSound.amp(0, 0);

        let otherPlayerId = (this.id === 1) ? 2 : 1;
        let causedByOpponentProjectile = projectile && projectile.ownerId === otherPlayerId;
        if (causedByOpponentProjectile) { if (this.id === 1) { score2++; } else { score1++; } }
        // Note: Bomb score handled in Bomb.explode, Plane-Plane score handled in draw() collision check
        return true;
    }


    respawn() {
        let startY = GROUND_Y - this.size * 0.8; let startX = (this.id === 1) ? width * 0.1 : width * 0.9; this.startPos = createVector(startX, startY);
        this.position = this.startPos.copy(); this.velocity = createVector(0, 0); this.angle = (this.id === 2) ? 180 : 0; this.isAlive = true; this.isOnGround = true; this.isStalled = false; this.isBubbled = false; this.bubbleTimer = 0;
        this.activePowerUps = {}; // Clear powerups on respawn
        this.shootCooldown = SHOOT_COOLDOWN_FRAMES / 2;
        if (this.engineSound && audioStarted && soundNodesStarted) { this.engineSound.freq(BASE_ENGINE_FREQ, 0.1); this.engineSound.amp(BASE_ENGINE_AMP, 0.1); }
    }

    collectPowerUp(type) {
        if (!this.isAlive || this.respawnTimer > 0) return;
        // console.log(`Plane ${this.id} collected ${type}!`);
        this.activePowerUps[type] = POWERUP_DURATION_FRAMES; // Add or refresh timer

        if (type === 'CloudDisguise') {
             this.generateCloudPuffOffsets(); // Generate fresh puffs for this instance
             if (audioStarted && soundNodesStarted && cloudPoofSound && cloudPoofEnv) { cloudPoofEnv.play(cloudPoofSound); } // Play sound on collect
        } else {
             if (audioStarted && soundNodesStarted && powerUpCollectSound && explosionNoise) { powerUpCollectSound.play(explosionNoise); } // Normal collect sound
        }
    }
}


// ======================
// --- Bullet Class --- (No changes needed here for Cloud Disguise)
// ======================
class Bullet {
    constructor(x, y, angle, ownerId, planeColor) { // Removed planeSize
        this.position = createVector(x, y);
        this.velocity = p5.Vector.fromAngle(radians(angle), BULLET_SPEED);
        this.ownerId = ownerId;
        this.size = 8; // Fixed size
        this.life = 150;
        this.planeColor = planeColor;
        this.coreColor = color(BULLET_CORE_BRIGHTNESS);
        let trailAlpha = min(BULLET_TRAIL_ALPHA, alpha(planeColor));
        this.trailColor = color(red(planeColor), green(planeColor), blue(planeColor), trailAlpha);
    }
    update() { this.position.add(this.velocity); this.life--; }
    display() { push(); translate(this.position.x, this.position.y); rotate(degrees(this.velocity.heading())); strokeWeight(2.5); stroke(this.trailColor); line(-this.size * 0.6, 0, this.size * 0.4, 0); strokeWeight(1.5); stroke(this.coreColor); line(-this.size * 0.4, 0, this.size * 0.2, 0); pop(); noStroke(); }
    isOffscreen() { return (this.life <= 0 || this.position.x < -this.size || this.position.x > width + this.size || this.position.y < -this.size || this.position.y > height + this.size); }

    checkCollision(target, targetIsBalloon = false) { // Uses target.size for planes now
        if (!target || typeof target.isAlive === 'undefined' || !target.isAlive) return false;
        if (target instanceof Plane && (target.id === this.ownerId || target.respawnTimer > 0)) return false;
        if (!target.position || typeof target.position.x === 'undefined') return false;

        // Cloud Disguise doesn't change collision detection logic - it uses the plane's actual position/size
        let targetRadius;
        if (targetIsBalloon) { if (typeof target.radius === 'undefined') return false; targetRadius = target.radius; }
        else { if (typeof target.size === 'undefined') return false; targetRadius = target.size * 0.8; } // Use fixed plane size

        let distanceSq = (this.position.x - target.position.x)**2 + (this.position.y - target.position.y)**2;
        let radiiSq = (targetRadius + this.size / 2)**2;
        return distanceSq < radiiSq;
    }
    hitEffect(plane) { plane.hit(false, this); }
    checkCollisionHut(hutObj) { if (!hutObj || hutObj.destroyed) return false; let hit = (this.position.x > hutObj.x - hutObj.w / 2 && this.position.x < hutObj.x + hutObj.w / 2 && this.position.y > hutObj.y - hutObj.h / 2 && this.position.y < hutObj.y + hutObj.h / 2); if(hit) { createExplosion(this.position.x, this.position.y, 5, HUT_WALL); } return hit; }
}

// ============================
// --- ChickenProjectile Class --- (No changes needed)
// ============================
class ChickenProjectile { // Unchanged from previous version as size was fixed
    constructor(x, y, angle, ownerId) { this.position = createVector(x, y); this.velocity = p5.Vector.fromAngle(radians(angle), CHICKEN_SPEED); this.ownerId = ownerId; this.size = 15; this.life = 180; this.bounces = 0; this.maxBounces = 3; this.rotation = random(360); this.rotationSpeed = random(-5, 5); this.gravity = GRAVITY_FORCE * 0.8; }
    update() { this.velocity.y += this.gravity; this.position.add(this.velocity); this.rotation += this.rotationSpeed; this.life--; if (this.position.y > GROUND_Y - this.size / 2 && this.velocity.y > 0) { if (this.bounces < this.maxBounces) { this.position.y = GROUND_Y - this.size / 2; this.velocity.y *= -CHICKEN_BOUNCE_FACTOR; this.velocity.x *= 0.9; this.bounces++; this.rotationSpeed *= -0.8; if (chickenSound && chickenEnv && audioStarted && soundNodesStarted) { chickenSound.freq(random(500,800)); chickenEnv.play(chickenSound); } } else { this.position.y = GROUND_Y - this.size / 2; this.velocity.y = 0; this.velocity.x *= 0.8; this.gravity = 0; this.rotationSpeed *= 0.5; } } }
    display() { push(); translate(this.position.x, this.position.y); rotate(this.rotation); noStroke(); fill(CHICKEN_BODY_COLOR); ellipse(0, 0, this.size, this.size * 0.7); ellipse(this.size * 0.4, -this.size * 0.1, this.size * 0.5, this.size * 0.4); fill(255, 180, 0); triangle(this.size * 0.6, -this.size * 0.1, this.size * 0.75, -this.size * 0.2, this.size * 0.75, 0); fill(CHICKEN_ACCENT_COLOR); rect(this.size * 0.35, -this.size * 0.35, this.size * 0.2, this.size * 0.15, 2); ellipse(this.size * 0.45, -this.size * 0.3, this.size * 0.15, this.size * 0.15); fill(0); ellipse(this.size * 0.5, -this.size * 0.15, 2, 2); pop(); }
    isOffscreen() { return (this.life <= 0 || this.position.x < -this.size * 2 || this.position.x > width + this.size * 2 || this.position.y > height + this.size); }
    checkCollision(target, targetIsBalloon = false) { // Uses target.size for planes
        if (!target || typeof target.isAlive === 'undefined' || !target.isAlive) return false;
        if (target instanceof Plane && (target.id === this.ownerId || target.respawnTimer > 0)) return false;
        if (!target.position || typeof target.position.x === 'undefined') return false;
        let targetRadius;
        if (targetIsBalloon) { if (typeof target.radius === 'undefined') return false; targetRadius = target.radius; }
        else { if (typeof target.size === 'undefined') return false; targetRadius = target.size * 0.8; } // Use fixed plane size
        let distanceSq = (this.position.x - target.position.x)**2 + (this.position.y - target.position.y)**2;
        let radiiSq = (targetRadius + this.size / 2)**2;
        return distanceSq < radiiSq;
    }
    // Lethal Chicken Hit Effect
    hitEffect(plane) {
        if (chickenSound && chickenEnv && audioStarted && soundNodesStarted) { chickenSound.freq(random(900,1200)); chickenEnv.play(chickenSound); }
        plane.hit(false, this); // false = not crash, pass chicken projectile info
    }
    checkCollisionHut(hutObj) { if (!hutObj || hutObj.destroyed) return false; let hit = (this.position.x > hutObj.x - hutObj.w / 2 && this.position.x < hutObj.x + hutObj.w / 2 && this.position.y > hutObj.y - hutObj.h / 2 && this.position.y < hutObj.y + hutObj.h / 2); if(hit) { this.velocity.mult(-0.5); if (chickenSound && chickenEnv && audioStarted && soundNodesStarted) { chickenSound.freq(random(500,800)); chickenEnv.play(chickenSound); } } return false; }
}


// ==========================
// --- BubbleProjectile Class --- (No changes needed)
// ==========================
class BubbleProjectile { // Unchanged from previous version
    constructor(x, y, angle, ownerId) { this.position = createVector(x, y); this.velocity = p5.Vector.fromAngle(radians(angle), BUBBLE_SPEED); this.ownerId = ownerId; this.size = 25; this.life = 240; this.wobbleOffset = random(100); this.wobbleMagnitude = this.size * 0.05; }
    update() { this.velocity.y -= GRAVITY_FORCE * 0.05; this.velocity.mult(0.995); this.position.add(this.velocity); this.life--; }
    display() { push(); translate(this.position.x, this.position.y); let wobbleX = sin(frameCount * 3 + this.wobbleOffset) * this.wobbleMagnitude; let wobbleY = cos(frameCount * 2.5 + this.wobbleOffset * 1.2) * this.wobbleMagnitude; let currentSize = this.size * (1 + sin(frameCount + this.wobbleOffset) * 0.03); noFill(); strokeWeight(2.5); stroke(BUBBLE_STROKE_COLOR[0],BUBBLE_STROKE_COLOR[1],BUBBLE_STROKE_COLOR[2], BUBBLE_STROKE_COLOR[3]); ellipse(wobbleX, wobbleY, currentSize, currentSize); fill(BUBBLE_FILL_COLOR[0],BUBBLE_FILL_COLOR[1],BUBBLE_FILL_COLOR[2], BUBBLE_FILL_COLOR[3]); noStroke(); ellipse(wobbleX, wobbleY, currentSize, currentSize); noFill(); stroke(255, 255, 255, 150); strokeWeight(1.5); arc(wobbleX - currentSize * 0.2, wobbleY - currentSize * 0.2, currentSize * 0.6, currentSize * 0.6, 150, 300); pop(); }
    isOffscreen() { return (this.life <= 0 || this.position.x < -this.size * 2 || this.position.x > width + this.size * 2 || this.position.y < -this.size * 2 || this.position.y > height + this.size); }
    checkCollision(target, targetIsBalloon = false) { // Uses target.size for planes
        if (!target || typeof target.isAlive === 'undefined' || !target.isAlive) return false;
        if (target instanceof Plane && (target.id === this.ownerId || target.respawnTimer > 0)) return false;
        if (!target.position || typeof target.position.x === 'undefined') return false;
        let targetRadius;
        if (targetIsBalloon) { if (typeof target.radius === 'undefined') return false; targetRadius = target.radius; }
        else { if (typeof target.size === 'undefined') return false; targetRadius = target.size * 0.8; } // Use fixed plane size
        let distanceSq = (this.position.x - target.position.x)**2 + (this.position.y - target.position.y)**2;
        let radiiSq = (targetRadius + this.size / 2)**2;
        return distanceSq < radiiSq;
    }
    hitEffect(plane) { plane.hit(false, this); } // Let plane.hit handle the bubbling logic
    checkCollisionHut(hutObj) { return false; }
}

// =====================
// --- Cloud Class --- (Unchanged)
// =====================
 class Cloud { constructor() { this.pos = createVector(0,0); this.vel = createVector(0,0); this.size = 100; this.puffOffsets = []; this.numPuffs = 7; this.opacity = 200; this.speedFactor = 1; this.direction = 1; this.reset(); this.pos.x = random(width); } reset() { this.direction = random() < 0.5 ? -1 : 1; this.size = random(100, 190); let startX = this.direction > 0 ? -this.size * 1.5 : width + this.size * 1.5; this.pos = createVector(startX, random(height * 0.1, height * 0.6)); this.speedFactor = random(0.5, 1.5); this.vel = createVector(CLOUD_BASE_SPEED * this.direction * this.speedFactor, 0); this.numPuffs = floor(random(6, 12)); this.puffOffsets = []; for (let i = 0; i < this.numPuffs; i++) { let puffX = random(-this.size * 0.7, this.size * 0.7); let puffY = random(-this.size * 0.3, this.size * 0.3); let puffR = random(this.size * 0.4, this.size * 0.9) * random(0.8, 1.2); this.puffOffsets.push({ x: puffX, y: puffY, r: puffR }); } this.opacity = random(190, 240); } update() { this.pos.add(this.vel); if ( (this.vel.x > 0 && this.pos.x - this.size * 1.5 > width) || (this.vel.x < 0 && this.pos.x + this.size * 1.5 < 0) ) { this.reset(); } if (this.pos.y < -this.size || this.pos.y > height + this.size) { this.reset(); } } display() { push(); noStroke(); translate(this.pos.x, this.pos.y); fill(CLOUD_SHADOW[0], CLOUD_SHADOW[1], CLOUD_SHADOW[2], this.opacity * 0.6); ellipse(0, this.size * 0.25, this.size * 1.3, this.size * 0.7); fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], this.opacity); for (let puff of this.puffOffsets) { ellipse(puff.x, puff.y, puff.r, puff.r * 0.85); } pop(); } }

// ==========================
// --- Hot Air Balloon Class --- (Unchanged)
// ==========================
class Balloon { constructor(x, y) { this.basePos = createVector(x, y); this.pos = this.basePos.copy(); this.position = this.pos; this.bobbleOffset = 0; this.bobbleSpeed = 0.6; this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.radius = 30; this.visualRadius = 30; this.basketSize = { w: 25, h: 18 }; this.ropeLength = 25; this.isAlive = true; this.respawnTimer = 0; }
    update() { if (this.respawnTimer > 0) { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); } return; } if (!this.isAlive) return; this.bobbleOffset = sin(frameCount * this.bobbleSpeed) * 6; this.basePos.x += this.driftSpeed; if (this.driftSpeed > 0 && this.basePos.x > width + this.visualRadius * 2) { this.basePos.x = -this.visualRadius * 2; } else if (this.driftSpeed < 0 && this.basePos.x < -this.visualRadius * 2) { this.basePos.x = width + this.visualRadius * 2; } this.pos.y = this.basePos.y + this.bobbleOffset; this.pos.x = this.basePos.x; }
    display() { if (this.respawnTimer > 0 && !this.isAlive) { if (floor(this.respawnTimer / 8) % 2 !== 0) { return; } } else if (!this.isAlive && this.respawnTimer <= 0) { return; } push(); translate(this.pos.x, this.pos.y); noStroke(); let basketTopY = this.visualRadius * 0.8 + this.ropeLength; let basketBottomY = basketTopY + this.basketSize.h; let basketCenterX = 0; stroke(BALLOON_ROPE); strokeWeight(1.5); line(basketCenterX - this.basketSize.w * 0.4, basketTopY, -this.visualRadius * 0.5, this.visualRadius * 0.7); line(basketCenterX + this.basketSize.w * 0.4, basketTopY, this.visualRadius * 0.5, this.visualRadius * 0.7); line(basketCenterX, basketTopY - 3, 0, this.visualRadius * 0.8); fill(BALLOON_BASKET); rect(basketCenterX, basketTopY + this.basketSize.h / 2, this.basketSize.w, this.basketSize.h, 3); fill(BALLOON_BASKET[0]*0.8, BALLOON_BASKET[1]*0.8, BALLOON_BASKET[2]*0.8); rect(basketCenterX, basketTopY + 2, this.basketSize.w, 4, 2); stroke(BALLOON_BASKET[0]*0.7, BALLOON_BASKET[1]*0.7, BALLOON_BASKET[2]*0.7, 180); strokeWeight(1); for(let i = 1; i < 4; i++){ line(basketCenterX - this.basketSize.w/2, basketTopY + i * (this.basketSize.h/4), basketCenterX + this.basketSize.w/2, basketTopY + i*(this.basketSize.h/4)); } for(let i = 1; i < 5; i++){ line(basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketTopY, basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketBottomY); } noStroke(); let numPanels = BALLOON_COLORS.length * 2; for (let i = 0; i < numPanels; i++) { fill(BALLOON_COLORS[i % BALLOON_COLORS.length]); arc(0, 0, this.visualRadius * 2.1, this.visualRadius * 2.3, i * (360.0 / numPanels) - 90 - (360.0/numPanels)*0.1, (i + 1) * (360.0 / numPanels) - 90 + (360.0/numPanels)*0.1, PIE); } noFill(); stroke(255, 255, 255, 30); strokeWeight(this.visualRadius * 0.5); arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, -150, -30); stroke(0, 0, 0, 40); strokeWeight(this.visualRadius * 0.6); arc(0,0, this.visualRadius*1.8, this.visualRadius*2.0, 30, 150); pop(); noStroke(); }
    hit() { if (!this.isAlive) return; this.isAlive = false; this.respawnTimer = BALLOON_RESPAWN_FRAMES; createExplosion(this.pos.x, this.pos.y, 25, EXPLOSION_COLORS.slice(0, 3).concat([BALLOON_BASKET])); let powerUpType = random(POWERUP_TYPES); let newPowerUp = new PowerUp(this.pos.x, this.pos.y, powerUpType); powerUps.push(newPowerUp); if(audioStarted && soundNodesStarted && powerUpSpawnSound && explosionNoise) { powerUpSpawnSound.play(explosionNoise); } }
    respawn() { this.isAlive = true; this.basePos.x = random(width * 0.1, width * 0.9); this.basePos.y = random(height * 0.15, height * 0.55); this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.pos = this.basePos.copy(); this.position = this.pos; this.bobbleOffset = 0; }
 }

// =======================
// --- Particle Class --- (Unchanged)
// =======================
 class Particle { constructor(x, y, baseColor) { this.pos = createVector(x, y); let angle = random(360); let speed = random(1, 5); this.vel = p5.Vector.fromAngle(radians(angle), speed); this.vel.y += random(-0.5, 0.5); this.lifespan = random(30, 70); this.baseColor = color(baseColor); this.size = random(4, 12); this.decay = random(0.88, 0.96); this.gravity = 0.05; } update() { this.pos.add(this.vel); this.vel.mult(0.95); this.vel.y += this.gravity; this.lifespan -= 1; this.size *= this.decay; } display() { push(); noStroke(); let currentAlpha = map(this.lifespan, 0, 50, 0, alpha(this.baseColor)); fill(red(this.baseColor), green(this.baseColor), blue(this.baseColor), max(0, currentAlpha)); ellipse(this.pos.x, this.pos.y, this.size, this.size); pop(); } isDead() { return this.lifespan <= 0 || this.size < 1; } }

// ==============================
// --- RainbowParticle Class --- (Unchanged)
// ==============================
class RainbowParticle { constructor(x, y, assignedColor) { this.pos = createVector(x, y); this.vel = p5.Vector.random2D().mult(random(0.1, 0.4)); this.vel.y -= random(0.05, 0.15); this.lifespan = RAINBOW_TRAIL_PARTICLE_LIFESPAN; this.initialLifespan = this.lifespan; this.baseColor = color(assignedColor); this.size = random(3, 7); this.gravity = 0.01; } update() { this.pos.add(this.vel); this.vel.mult(0.97); this.vel.y += this.gravity; this.lifespan -= 1; } display() { push(); noStroke(); let currentAlpha = map(this.lifespan, 0, this.initialLifespan, 0, alpha(this.baseColor)); let shimmer = sin(frameCount * 5 + this.pos.x * 0.1) * 0.1 + 0.95; fill(red(this.baseColor) * shimmer, green(this.baseColor) * shimmer, blue(this.baseColor) * shimmer, max(0, currentAlpha)); ellipse(this.pos.x, this.pos.y, this.size, this.size); pop(); } isDead() { return this.lifespan <= 0; } }

// ===============================================
// --- Helper Function to Create Explosions --- (Unchanged)
// ===============================================
 function createExplosion(x, y, count, colors, isBomb = false) { if (audioStarted && soundNodesStarted) { if (isBomb && bombExplosionSoundEnv && bombExplosionNoise) { bombExplosionSoundEnv.play(bombExplosionNoise); } else if (!isBomb && explosionSoundEnv && explosionNoise) { explosionSoundEnv.play(explosionNoise); } } if (particles.length > MAX_PARTICLES) return; for (let i = 0; i < count; i++) { let chosenColor = random(colors); if (particles.length < MAX_PARTICLES) { particles.push(new Particle(x, y, chosenColor)); } else { break; } } }

// ==========================
// --- PowerUp Class --- (Added Cloud Disguise display)
// ==========================
class PowerUp { constructor(x, y, type) { this.position = createVector(x, y); this.velocity = createVector(random(-0.5, 0.5), POWERUP_FALL_SPEED); this.type = type; this.color = color(POWERUP_COLORS[type] || [255, 255, 255]); this.size = POWERUP_SIZE; this.lifespan = POWERUP_DURATION_FRAMES * 1.5; this.rotation = 0; this.rotationSpeed = random(-2, 2); }
    update() { this.position.add(this.velocity); this.velocity.y += GRAVITY_FORCE * 0.2; this.velocity.mult(0.99); this.lifespan--; this.rotation += this.rotationSpeed; if (this.position.y > GROUND_Y - this.size / 2) { this.position.y = GROUND_Y - this.size / 2; this.velocity.y *= -0.4; this.velocity.x *= 0.8; } }
    display() { push(); translate(this.position.x, this.position.y); rotate(this.rotation); stroke(0); strokeWeight(2); fill(this.color); let s = this.size;
        if (this.type === 'RapidFire') { for (let i = 0; i < 4; i++) { rect(0, 0, s * 0.3, s * 0.8, 2); rotate(45); } fill(255,255,255); noStroke(); ellipse(0,0, s*0.3, s*0.3); }
        else if (this.type === 'SpeedBoost') { beginShape(); vertex(0, -s * 0.6); vertex(s * 0.5, 0); vertex(0, s * 0.2); vertex(-s * 0.5, 0); endShape(CLOSE); stroke(255,255,255, 150); strokeWeight(1.5); line(0, -s*0.2, 0, s*0.5); line(-s*0.2, s*0.1, -s*0.2, s*0.6); line(s*0.2, s*0.1, s*0.2, s*0.6); }
        else if (this.type === 'Shield') { ellipse(0, 0, s, s); fill(255, 255, 255, 180); noStroke(); ellipse(0, 0, s * 0.6, s * 0.6); }
        else if (this.type === 'TripleShot') { let w = s * 0.2; let h = s * 0.5; let spacing = w * 1.5; rect(-spacing, 0, w, h, 1); rect(0, 0, w, h, 1); rect(spacing, 0, w, h, 1); }
        else if (this.type === 'Bomb') { ellipse(0, 0, s, s); fill(0); noStroke(); ellipse(0, 0, s*1.05, s*1.05); fill(this.color); ellipse(0, 0, s, s); stroke(255, 200, 0); strokeWeight(2.5); noFill(); arc(0, -s * 0.4, s*0.4, s*0.4, 180, 300); fill(255, 50, 0); noStroke(); ellipse(s*0.2*cos(300), -s*0.4 + s*0.2*sin(300), 4, 4); }
        else if (this.type === 'Trampoline') { noFill(); strokeWeight(3); arc(0, s*0.1, s*0.8, s*0.6, 180, 360); line(-s*0.4, s*0.1, -s*0.5, s*0.4); line(s*0.4, s*0.1, s*0.5, s*0.4); line(-s*0.5, s*0.4, s*0.5, s*0.4); }
        else if (this.type === 'ChickenLauncher') { fill(CHICKEN_BODY_COLOR); ellipse(0, s*0.1, s*0.8, s*0.6); ellipse(s*0.3, -s*0.1, s*0.4, s*0.3); fill(CHICKEN_ACCENT_COLOR); rect(s*0.25, -s*0.3, s*0.15, s*0.1, 1); }
        else if (this.type === 'BubbleGun') { ellipse(0, 0, s, s); noFill(); stroke(255, 255, 255, 150); strokeWeight(1.5); arc(-s*0.2, -s*0.2, s*0.5, s*0.5, 150, 300); }
        else if (this.type === 'ReverseGun') { beginShape(); vertex(s*0.4, 0); vertex(-s*0.1, -s*0.3); vertex(-s*0.1, s*0.3); endShape(CLOSE); rect(-s*0.3, 0, s*0.3, s*0.2); }
        else if (this.type === 'RainbowTrail') { noFill(); strokeWeight(s * 0.15); for(let i=0; i<RAINBOW_COLORS.length; i++) { stroke(RAINBOW_COLORS[i]); arc(0,0, s*0.8, s*0.8, -90 + i*(180/RAINBOW_COLORS.length), -90 + (i+1)*(180/RAINBOW_COLORS.length)); } }
        // --- Cloud Disguise Powerup Item Display ---
        else if (this.type === 'CloudDisguise') {
            noStroke();
            let c = this.color;
            fill(c.levels[0], c.levels[1], c.levels[2], 200); // Use the light gray-blue
            // Draw a few simple overlapping ellipses to represent a cloud
            ellipse(0, 0, s * 0.9, s * 0.7);
            ellipse(-s * 0.35, s * 0.15, s * 0.6, s * 0.5);
            ellipse(s * 0.35, s * 0.1, s * 0.7, s * 0.6);
            // Optional: Add a subtle highlight
            fill(255, 255, 255, 80);
            ellipse(s*0.1, -s*0.1, s*0.4, s*0.3);
        }
        else { rect(0, 0, s, s); } // Default box
        pop(); noStroke(); }
    isOffscreen() { return this.lifespan <= 0 || this.position.y > height + this.size * 2; }
    checkCollision(plane) { // Uses fixed plane.size
        if (!plane || !plane.isAlive || plane.respawnTimer > 0 || typeof plane.size === 'undefined' || typeof plane.position === 'undefined') return false;
        // Collision uses plane's actual size, not visual disguise size
        let distanceSq = (this.position.x - plane.position.x)**2 + (this.position.y - plane.position.y)**2;
        let radiiSq = (plane.size * 0.8 + this.size / 2)**2; // Use fixed plane size
        return distanceSq < radiiSq;
    }
}


// ==========================
// --- Bomb Class --- (No changes needed)
// ==========================
class Bomb {
    constructor(x, y, ownerId, planeVelocity) { this.position = createVector(x, y); this.velocity = planeVelocity.copy().mult(0.5); this.velocity.y += BOMB_DROP_VELOCITY_Y; this.ownerId = ownerId; this.size = 12; this.fuseTimer = BOMB_FUSE_FRAMES; this.rotation = random(360); this.rotationSpeed = random(-1, 1) * (this.velocity.x > 0 ? 1 : -1); }
    update() { this.position.add(this.velocity); this.velocity.y += GRAVITY_FORCE * 1.5; this.velocity.mult(0.985); this.fuseTimer--; this.rotation += this.rotationSpeed; }
    display() { push(); translate(this.position.x, this.position.y); rotate(this.rotation); fill(50); stroke(80); strokeWeight(1); ellipse(0, 0, this.size * 1.2, this.size); fill(90); noStroke(); triangle(-this.size * 0.6, 0, -this.size * 0.9, -this.size * 0.3, -this.size * 0.9, this.size * 0.3); if (floor(this.fuseTimer / max(5, this.fuseTimer * 0.2)) % 2 === 0) { fill(255, 50 + (BOMB_FUSE_FRAMES - this.fuseTimer)*2, 0); ellipse(this.size * 0.5, 0, 4, 4); } pop(); noStroke(); }
    explode(hutObj) { createExplosion(this.position.x, this.position.y, BOMB_EXPLOSION_PARTICLES, BOMB_EXPLOSION_COLORS, true);
        for (let plane of [plane1, plane2]) {
             // Explosion checks use plane's real position/size, ignore disguise
             if (plane.isAlive && typeof plane.size !== 'undefined' && typeof plane.position !== 'undefined') {
                 let distSq = (this.position.x - plane.position.x)**2 + (this.position.y - plane.position.y)**2;
                 let radiusSq = (BOMB_EXPLOSION_RADIUS + plane.size * 0.5)**2;
                 if (distSq < radiusSq) { let hitSuccess = plane.hit(true, null); if (hitSuccess && this.ownerId !== plane.id) { if (plane.id === 1) { score2++; } else { score1++; } } }
             }
        }
        if (hutObj && typeof hutObj.x !== 'undefined') { let hutDistSq = (this.position.x - hutObj.x)**2 + (this.position.y - hutObj.y)**2; let collisionThresholdHut = BOMB_EXPLOSION_RADIUS + max(hutObj.w, hutObj.h) * 0.5; if (!hutObj.destroyed && hutDistSq < collisionThresholdHut * collisionThresholdHut) { destroyHut(hutObj); } else if (hutObj.destroyed && hutDistSq < collisionThresholdHut * collisionThresholdHut) { createExplosion(this.position.x, this.position.y, 10, HUT_RUBBLE_COLORS, true); } } }
    checkCollision(plane) {
        // Direct bomb collision uses plane's real position/size
        if (!plane || !plane.isAlive || plane.respawnTimer > 0 || typeof plane.size === 'undefined' || typeof plane.position === 'undefined') return false;
        let distanceSq = (this.position.x - plane.position.x)**2 + (this.position.y - plane.position.y)**2; let radiiSq = (plane.size * 0.7 + this.size / 2)**2; return distanceSq < radiiSq;
    }
    checkCollisionHut(hutObj) { if (!hutObj || hutObj.destroyed) return false; return (this.position.x > hutObj.x - hutObj.w / 2 && this.position.x < hutObj.x + hutObj.w / 2 && this.position.y > hutObj.y - hutObj.h / 2 && this.position.y < hutObj.y + hutObj.h / 2); }
    checkCollisionGround() { return this.position.y >= GROUND_Y - this.size / 2; }
    isOffscreen() { return (this.fuseTimer < -300 && (this.position.y > height + this.size * 5 || this.position.x < -width || this.position.x > width*2)); }
}

// ===============================
// --- RainDrop Class --- (Unchanged)
// ===============================
class RainDrop { constructor() { this.reset(); } reset() { this.z = random(0.2, 1); this.pos = createVector(random(width * 1.2), random(-height * 0.5, -20)); this.len = map(this.z, 0.2, 1, 4, 12); this.ySpeed = map(this.z, 0.2, 1, 4, 10); this.vel = createVector(0, this.ySpeed); } update() { this.pos.add(this.vel); if (this.pos.y > GROUND_Y + this.len) { this.reset(); } } display() { push(); let alpha = map(this.z, 0.2, 1, 80, 200); let weight = map(this.z, 0.2, 1, 0.5, 1.5); stroke(RAINDROP_COLOR[0], RAINDROP_COLOR[1], RAINDROP_COLOR[2], alpha); strokeWeight(weight); line(this.pos.x, this.pos.y, this.pos.x, this.pos.y + this.len); pop(); noStroke(); } }

// --- END OF FILE sketch.js ---