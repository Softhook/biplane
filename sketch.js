// --- Game Configuration ---
const GRAVITY_FORCE = 0.07;
const THRUST_FORCE = 0.16;
const TURN_SPEED = 2.5;
const DAMPING_FACTOR = 0.99;
const GROUND_FRICTION = 0.93;
const BULLET_SPEED = 7;
const SHOOT_COOLDOWN_FRAMES = 18;
const RESPAWN_DELAY_FRAMES = 120; // Plane respawn
const BALLOON_RESPAWN_FRAMES = 360; // Balloon respawn longer
const MAX_CLOUDS = 5;
const CLOUD_BASE_SPEED = 0.3;
const MIN_TAKEOFF_SPEED = 0.5;
const MAX_LANDING_SPEED = 2.5;
const MAX_PARTICLES = 150;
const PLANE_COLLISION_THRESHOLD_FACTOR = 0.8;
const STALL_ANGLE_THRESHOLD = -70;
const STALL_RECOVERY_ANGLE = -60;
const STALL_EFFECT_FACTOR = 0.2;
const MAX_SPEED_FOR_SOUND = 8;
// --- Adjusted Sound Parameters ---
const BASE_ENGINE_FREQ = 40;
const MAX_ENGINE_FREQ = 120;
const BASE_ENGINE_AMP = 0.04;
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

// --- Sound Variables ---
let engineSound1, engineSound2;
let shootSoundEnv, shootNoise;
let explosionSoundEnv, explosionNoise;
let audioStarted = false;


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
    let planeStartY = GROUND_Y - 10;
    plane1 = new Plane(width * 0.2, planeStartY, PLANE1_COLOR_BODY, PLANE1_COLOR_WING, PLANE1_COLOR_ACCENT, CONTROLS_P1, 1);
    plane2 = new Plane(width * 0.8, planeStartY, PLANE2_COLOR_BODY, PLANE2_COLOR_WING, PLANE2_COLOR_ACCENT, CONTROLS_P2, 2);

    // Initialize Scenery
    clouds = []; for (let i = 0; i < MAX_CLOUDS; i++) { clouds.push(new Cloud()); }
    balloon = new Balloon(width * 0.75, height * 0.4);
    stars = []; for (let i = 0; i < 150; i++) { stars.push({ x: random(width), y: random(height * 0.7), size: random(1, 2.5), brightness: random(150, 255) }); }

    keys = {};

    // --- Initialize Sounds (with new parameters) ---
    engineSound1 = new p5.Oscillator('sawtooth'); engineSound1.freq(BASE_ENGINE_FREQ); engineSound1.amp(0);
    engineSound2 = new p5.Oscillator('sawtooth'); engineSound2.freq(BASE_ENGINE_FREQ); engineSound2.amp(0);
    shootNoise = new p5.Noise('pink'); shootNoise.amp(0);
    shootSoundEnv = new p5.Envelope(); shootSoundEnv.setADSR(0.001, 0.03, 0, 0.06); shootSoundEnv.setRange(0.5, 0);
    explosionNoise = new p5.Noise('pink'); explosionNoise.amp(0);
    explosionSoundEnv = new p5.Envelope(); explosionSoundEnv.setADSR(0.03, 0.5, 0.1, 0.7); explosionSoundEnv.setRange(0.7, 0);

    // Assign engine sounds
    plane1.assignEngineSound(engineSound1);
    plane2.assignEngineSound(engineSound2);
}

// --- Helper to Calculate Layout ---
function calculateLayout() {
    GROUND_Y = height * GROUND_LEVEL_Y_FRAC; hutX = width / 2; hutY = GROUND_Y - HUT_HEIGHT / 2; hut = { x: hutX, y: hutY, w: HUT_WIDTH, h: HUT_HEIGHT };
    if (stars && stars.length > 0) { for (let star of stars) { star.x = random(width); star.y = random(height * 0.7); } }
}

// --- p5.js Draw Function (Main Game Loop) ---
function draw() {
    drawBackground();
    drawEnvironment();

    // Update and Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].display(); if (particles[i].isDead()) { particles.splice(i, 1); } }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (plane1.isAlive && bullets[i].checkCollision(plane1)) { if (bullets[i].ownerId !== plane1.id) { plane1.hit(false); score2++; createExplosion(plane1.position.x, plane1.position.y, 35, EXPLOSION_COLORS); bullets.splice(i, 1); continue; } }
        if (plane2.isAlive && bullets[i].checkCollision(plane2)) { if (bullets[i].ownerId !== plane2.id) { plane2.hit(false); score1++; createExplosion(plane2.position.x, plane2.position.y, 35, EXPLOSION_COLORS); bullets.splice(i, 1); continue; } }
        if (balloon.isAlive && balloon.checkCollision(bullets[i])) { createExplosion(balloon.pos.x, balloon.pos.y, 20, EXPLOSION_COLORS.slice(0,3)); balloon.hit(); if (bullets[i].ownerId === 1) { score1++; } else { score2++; } bullets.splice(i, 1); continue; }
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
    balloon.update(); balloon.display();
    drawHut();

    drawUI();
}

// --- Input Handling ---
function keyPressed() { keys[keyCode] = true; }
function keyReleased() { keys[keyCode] = false; }

// --- Fullscreen & Audio Start ---
function mousePressed() {
  if (!audioStarted && getAudioContext().state !== 'running') {
     console.log("Attempting to start audio...");
     userStartAudio().then(() => {
        if (getAudioContext().state === 'running') {
            console.log("Audio Context is running. Starting sound nodes...");
            engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start();
            audioStarted = true;
            console.log("Sound nodes started.");
        } else { console.error("Audio context failed to resume or start."); }
     }).catch(e => { console.error("Error starting audio:", e); });
  } else if (!audioStarted && getAudioContext().state === 'running') {
      console.log("Audio Context was already running. Starting sound nodes...");
      engineSound1.start(); engineSound2.start(); shootNoise.start(); explosionNoise.start();
      audioStarted = true;
      console.log("Sound nodes started.");
  }

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) { let fs = fullscreen(); fullscreen(!fs); }
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
    constructor(x, y, bodyCol, wingCol, accentCol, controls, id) { this.id = id; this.startPos = createVector(x, y); this.bodyColor = color(bodyCol); this.wingColor = color(wingCol); this.accentColor = color(accentCol); this.controls = controls; this.size = 22; this.position = this.startPos.copy(); this.velocity = createVector(0, 0); this.angle = 0; this.isAlive = true; this.isOnGround = true; this.respawnTimer = 0; this.shootCooldown = 0; this.isThrusting = false; this.isTurningLeft = false; this.isTurningRight = false; this.planePoints = this.createPlaneShape(); this.propellerAngle = 0; this.engineSound = null; this.isStalled = false; }
    assignEngineSound(soundObject) { this.engineSound = soundObject; }
    createPlaneShape() { let s = this.size; return { fuselage: [ {x: s * 0.8, y: 0}, {x: s * 0.6, y: -s * 0.1}, {x: -s * 0.7, y: -s * 0.15}, {x: -s * 0.95, y: -s * 0.05}, {x: -s * 0.9, y: 0}, {x: -s * 0.95, y: s * 0.05}, {x: -s * 0.7, y: s * 0.15}, {x: s * 0.6, y: s * 0.1} ], topWing: [ {x: s * 0.35, y: -s * 0.25}, {x: s * 0.25, y: -s * 0.7}, {x: -s * 0.45, y: -s * 0.7}, {x: -s * 0.4, y: -s * 0.25} ], bottomWing: [ {x: s * 0.25, y: s * 0.25}, {x: s * 0.15, y: s * 0.6}, {x: -s * 0.35, y: s * 0.6}, {x: -s * 0.3, y: s * 0.25} ], tailplane: [ {x: -s * 0.75, y: -s * 0.1}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 1.0, y: 0}, {x: -s * 1.05, y: s * 0.35}, {x: -s * 0.75, y: s * 0.1} ], rudder: [ {x: -s * 0.9, y: 0}, {x: -s * 1.15, y: -s * 0.4}, {x: -s * 1.05, y: -s * 0.35}, {x: -s * 0.75, y: -s * 0.1} ], cockpit: [ {x: s * 0.4, y: -s * 0.1}, {x: s * 0.1, y: -s*0.35}, {x: -s*0.1, y: -s*0.25} ], wheels: [ {x: s*0.15, y: s*0.7}, {x: -s*0.2, y: s*0.7} ], wheelRadius: s * 0.18 }; }
    handleInput(keys) { if (!this.isAlive || this.respawnTimer > 0) { this.isThrusting = false; this.isTurningLeft = false; this.isTurningRight = false; return; } this.isThrusting = keys[this.controls.thrust] || false; this.isTurningLeft = keys[this.controls.left] || false; this.isTurningRight = keys[this.controls.right] || false; if (keys[this.controls.shoot]) { this.shoot(); } }
    applyForce(force) { this.velocity.add(force); }

    // --- Revised update() with robust ground/air state handling ---
    update() {
        // Respawn Logic
        if (this.respawnTimer > 0) { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); } return; }
        if (!this.isAlive) { if (this.engineSound && audioStarted) this.engineSound.amp(0, 0.05); return; }
        if (this.shootCooldown > 0) { this.shootCooldown--; }

        // Determine Forces (based on previous frame's state)
        let effectiveGravity = GRAVITY_FORCE; let thrustVector = createVector(0, 0); let currentThrustForce = THRUST_FORCE;
        if (this.isStalled) { currentThrustForce *= STALL_EFFECT_FACTOR; }
        if (this.isTurningLeft) { this.angle -= TURN_SPEED; } if (this.isTurningRight) { this.angle += TURN_SPEED; }
        if (this.isThrusting) { thrustVector = p5.Vector.fromAngle(radians(this.angle), currentThrustForce); }

        // Apply Forces
        if (this.isOnGround) { this.velocity.x *= GROUND_FRICTION; this.applyForce(createVector(thrustVector.x, thrustVector.y * 0.1)); if (!this.isThrusting || this.angle >= -5 || this.angle <= -175) { this.applyForce(createVector(0, effectiveGravity)); } }
        else { this.applyForce(thrustVector); this.applyForce(createVector(0, effectiveGravity)); this.velocity.mult(DAMPING_FACTOR); }

        // Update Position
        this.position.add(this.velocity);

        // Check and Handle Ground Interaction / State Changes (AFTER position update)
        let groundCheckY = GROUND_Y - this.size * 0.8;
        if (this.position.y >= groundCheckY) {
             // --- Landing/Crash Detection ---
             if (!this.isOnGround) { // Was airborne last frame?
                 if (this.velocity.y > MAX_LANDING_SPEED) { console.log(`Plane ${this.id} CRASH LANDED! Speed: ${this.velocity.y.toFixed(2)}`); this.hit(true); return; }
                 else { this.isOnGround = true; this.isStalled = false; console.log(`Plane ${this.id} landed safely.`); }
             }
             // --- Ground Clamping & State Update ---
             this.isOnGround = true; this.position.y = groundCheckY; this.velocity.y = 0;
             // --- Takeoff Check ---
             if (this.isOnGround) { let speed = this.velocity.mag(); if (this.isThrusting && this.angle < -5 && this.angle > -175 && speed > MIN_TAKEOFF_SPEED) { this.isOnGround = false; this.isStalled = false; this.velocity.y -= THRUST_FORCE * 0.6; console.log(`Plane ${this.id} took off.`); } }
        } else {
            // --- Airborne State Update ---
            this.isOnGround = false;
            // --- Stall Check (Only when airborne) ---
            if (this.angle < STALL_ANGLE_THRESHOLD) { if (!this.isStalled) console.log(`Plane ${this.id} stalled!`); this.isStalled = true; }
            else if (this.angle > STALL_RECOVERY_ANGLE) { if (this.isStalled) console.log(`Plane ${this.id} recovered from stall.`); this.isStalled = false; }
        }

        // Boundary Constraints
        if (this.position.x > width + this.size) { this.position.x = -this.size; } else if (this.position.x < -this.size) { this.position.x = width + this.size; }
        if (this.position.y > groundCheckY && this.isOnGround){ this.position.y = groundCheckY; }
        if (this.position.y < this.size / 2) { this.position.y = this.size / 2; if (this.velocity.y < 0) { this.velocity.y = 0; } }

        // Update Propeller Angle
        if (this.isThrusting || this.velocity.magSq() > 0.1) { this.propellerAngle += 45; } else if (this.isOnGround) { this.propellerAngle = 0; } else { this.propellerAngle += 5; }

        // Check Hut Collision
        this.checkCollisionHut(hut);

        // Update Engine Sound
        if (this.engineSound && audioStarted) { let speed = this.velocity.mag(); let targetFreq = map(speed, 0, MAX_SPEED_FOR_SOUND, BASE_ENGINE_FREQ, MAX_ENGINE_FREQ, true); let targetAmp = this.isThrusting ? MAX_ENGINE_AMP : BASE_ENGINE_AMP; if (this.isStalled) { targetAmp *= 0.5; targetFreq *= 0.8; } if (abs(this.engineSound.getAmp() - targetAmp) > 0.001) { this.engineSound.amp(targetAmp, 0.1); } this.engineSound.freq(targetFreq, 0.1); }
        else if (this.engineSound && !audioStarted) { this.engineSound.amp(0); }
    } // End of update()

    display() { push(); translate(this.position.x, this.position.y); rotate(this.angle); if (this.respawnTimer > 0 && floor(this.respawnTimer / 8) % 2 === 0) { } else { stroke(0); strokeWeight(1.5); let pp = this.planePoints; fill(red(this.wingColor)*0.8, green(this.wingColor)*0.8, blue(this.wingColor)*0.8); beginShape(); for(let p of pp.bottomWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.accentColor); beginShape(); for(let p of pp.tailplane) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.fuselage) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.wingColor); beginShape(); for(let p of pp.topWing) { vertex(p.x, p.y); } endShape(CLOSE); fill(this.bodyColor); beginShape(); for(let p of pp.rudder) { vertex(p.x, p.y); } endShape(CLOSE); noFill(); stroke(0, 150); strokeWeight(1.5); beginShape(); for(let p of pp.cockpit) { curveVertex(p.x, p.y); } endShape(); if (this.isOnGround || (!this.isOnGround && this.position.y > GROUND_Y - this.size * 5) || this.velocity.y > 1.0) { fill(40); noStroke(); ellipse(pp.wheels[0].x, pp.wheels[0].y, pp.wheelRadius * 2, pp.wheelRadius * 2); ellipse(pp.wheels[1].x, pp.wheels[1].y, pp.wheelRadius * 2, pp.wheelRadius * 2); stroke(60); strokeWeight(3); line(pp.wheels[0].x, pp.wheels[0].y - pp.wheelRadius, pp.bottomWing[1].x * 0.8, pp.bottomWing[1].y - this.size * 0.1); line(pp.wheels[1].x, pp.wheels[1].y - pp.wheelRadius, pp.bottomWing[2].x * 0.8, pp.bottomWing[2].y - this.size * 0.1); } noStroke(); fill(120, 120, 120, 200); push(); translate(this.size * 0.85, 0); rotate(this.propellerAngle); rect(0, 0, this.size * 0.1, this.size * 0.8); rect(0, 0, this.size * 0.8, this.size * 0.1); pop(); fill(this.accentColor); ellipse(this.size * 0.85, 0, this.size * 0.2, this.size * 0.2); } pop(); noStroke(); }
    shoot() { let canShoot = !this.isOnGround || (this.isOnGround && this.angle < -10 && this.angle > -170); if (this.shootCooldown <= 0 && this.isAlive && canShoot) { let noseOffset = createVector(this.size * 0.9, 0); let rotatedOffset = noseOffset.copy().rotate(this.angle); let bulletPos = p5.Vector.add(this.position, rotatedOffset); let bulletAngle = this.angle; let newBullet = new Bullet(bulletPos.x, bulletPos.y, bulletAngle, this.id, this.bodyColor); bullets.push(newBullet); this.shootCooldown = SHOOT_COOLDOWN_FRAMES; if (audioStarted) { shootSoundEnv.play(shootNoise); } } }
    checkCollisionHut(hutRect) { if (!this.isAlive || this.respawnTimer > 0) return false; let planeWidth = this.size * 2.6; let planeHeight = this.size * 1.5; if (this.position.x + planeWidth/2 > hutRect.x - hutRect.w / 2 && this.position.x - planeWidth/2 < hutRect.x + hutRect.w / 2 && this.position.y + planeHeight/2 > hutRect.y - hutRect.h / 2 && this.position.y - planeHeight/2 < hutRect.y + hutRect.h / 2) { let buffer = this.size * 0.4; if (this.position.x > hutRect.x - hutRect.w / 2 - buffer && this.position.x < hutRect.x + hutRect.w / 2 + buffer && this.position.y > hutRect.y - hutRect.h / 2 - buffer && this.position.y < hutRect.y + hutRect.h / 2 + this.size * 0.5 ) { console.log(`Plane ${this.id} hit hut!`); this.hit(true); return true; } } return false; }
    hit(causedByCrash) { if (!this.isAlive) return; console.log(`Plane ${this.id} HIT! ${causedByCrash ? "(Crash/Hut/PlaneCollision)" : "(Bullet)"}`); this.isAlive = false; this.isOnGround = false; this.isStalled = false; this.velocity = createVector(random(-1.5, 1.5), -2.5); this.respawnTimer = RESPAWN_DELAY_FRAMES; createExplosion(this.position.x, this.position.y, 35, EXPLOSION_COLORS); if (this.engineSound && audioStarted) this.engineSound.amp(0, 0.05); if (causedByCrash) { if (this.id === 1) { score2++; console.log("Point for Player 2!"); } else { score1++; console.log("Point for Player 1!"); } } }
    respawn() { let startX = (this.id === 1) ? width * 0.2 : width * 0.8; this.startPos = createVector(startX, GROUND_Y - 10); this.position = this.startPos.copy(); this.velocity = createVector(0, 0); this.angle = 0; this.isAlive = true; this.isOnGround = true; this.isStalled = false; this.shootCooldown = SHOOT_COOLDOWN_FRAMES / 2; console.log(`Plane ${this.id} Respawned.`); if (this.engineSound && audioStarted) { this.engineSound.freq(BASE_ENGINE_FREQ, 0.1); this.engineSound.amp(BASE_ENGINE_AMP, 0.1); } }
}

// ======================
// --- Bullet Class ---
// ======================
class Bullet { constructor(x, y, angle, ownerId, planeColor) { this.position = createVector(x, y); this.velocity = p5.Vector.fromAngle(radians(angle), BULLET_SPEED); this.ownerId = ownerId; this.size = 8; this.life = 150; this.planeColor = planeColor; this.coreColor = color(BULLET_CORE_BRIGHTNESS); this.trailColor = color(red(planeColor), green(planeColor), blue(planeColor), BULLET_TRAIL_ALPHA); } update() { this.position.add(this.velocity); this.life--; } display() { push(); translate(this.position.x, this.position.y); rotate(degrees(this.velocity.heading())); strokeWeight(2.5); stroke(this.trailColor); line(-this.size * 0.6, 0, this.size * 0.4, 0); strokeWeight(1.5); stroke(this.coreColor); line(-this.size * 0.4, 0, this.size * 0.2, 0); pop(); noStroke(); } isOffscreen() { return (this.life <= 0 || this.position.x < -this.size || this.position.x > width + this.size || this.position.y < -this.size || this.position.y > height + this.size); } checkCollision(plane) { if (plane.id === this.ownerId || !plane.isAlive || plane.respawnTimer > 0) { return false; } let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y); return distance < (plane.size * 0.8); } checkCollisionHut(hutRect) { return (this.position.x > hutRect.x - hutRect.w / 2 && this.position.x < hutRect.x + hutRect.w / 2 && this.position.y > hutRect.y - hutRect.h / 2 && this.position.y < hutRect.y + hutRect.h / 2); } }

// =====================
// --- Cloud Class ---
// =====================
 class Cloud { constructor() { this.pos = createVector(0,0); this.vel = createVector(0,0); this.size = 100; this.puffOffsets = []; this.numPuffs = 7; this.opacity = 200; this.speedFactor = 1; this.direction = 1; this.reset(); this.pos.x = random(width); } reset() { this.direction = random() < 0.5 ? -1 : 1; this.size = random(100, 190); let startX = this.direction > 0 ? -this.size * 1.5 : width + this.size * 1.5; this.pos = createVector(startX, random(height * 0.1, height * 0.6)); this.speedFactor = random(0.5, 1.5); this.vel = createVector(CLOUD_BASE_SPEED * this.direction * this.speedFactor, 0); this.numPuffs = floor(random(6, 12)); this.puffOffsets = []; for (let i = 0; i < this.numPuffs; i++) { let puffX = random(-this.size * 0.7, this.size * 0.7); let puffY = random(-this.size * 0.3, this.size * 0.3); let puffR = random(this.size * 0.4, this.size * 0.9) * random(0.8, 1.2); this.puffOffsets.push({ x: puffX, y: puffY, r: puffR }); } this.opacity = random(190, 240); } update() { this.pos.add(this.vel); if (this.direction > 0 && this.pos.x - this.size * 1.5 > width) { this.reset(); } else if (this.direction < 0 && this.pos.x + this.size * 1.5 < 0) { this.reset(); } } display() { push(); noStroke(); translate(this.pos.x, this.pos.y); fill(CLOUD_SHADOW[0], CLOUD_SHADOW[1], CLOUD_SHADOW[2], this.opacity * 0.6); ellipse(0, this.size * 0.25, this.size * 1.3, this.size * 0.7); fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], this.opacity); for (let puff of this.puffOffsets) { ellipse(puff.x, puff.y, puff.r, puff.r * 0.85); } pop(); } }

// ==========================
// --- Hot Air Balloon Class ---
// ==========================
class Balloon { constructor(x, y) { this.basePos = createVector(x, y); this.pos = this.basePos.copy(); this.bobbleOffset = 0; this.bobbleSpeed = 0.6; this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.radius = 30; this.basketSize = { w: 25, h: 18 }; this.ropeLength = 25; this.isAlive = true; this.respawnTimer = 0; } update() { if (this.respawnTimer > 0) { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); } return; } if (!this.isAlive) return; this.bobbleOffset = sin(frameCount * this.bobbleSpeed) * 6; this.basePos.x += this.driftSpeed; if (this.driftSpeed > 0 && this.basePos.x > width + this.radius * 2) { this.basePos.x = -this.radius * 2; } else if (this.driftSpeed < 0 && this.basePos.x < -this.radius * 2) { this.basePos.x = width + this.radius * 2; } this.pos.y = this.basePos.y + this.bobbleOffset; this.pos.x = this.basePos.x; } display() { if (!this.isAlive) return; push(); translate(this.pos.x, this.pos.y); noStroke(); let basketTopY = this.radius * 0.8 + this.ropeLength; let basketBottomY = basketTopY + this.basketSize.h; let basketCenterX = 0; stroke(BALLOON_ROPE); strokeWeight(1.5); line(basketCenterX - this.basketSize.w * 0.4, basketTopY, -this.radius * 0.5, this.radius * 0.7); line(basketCenterX + this.basketSize.w * 0.4, basketTopY, this.radius * 0.5, this.radius * 0.7); line(basketCenterX, basketTopY - 3, 0, this.radius * 0.8); fill(BALLOON_BASKET); rect(basketCenterX, basketTopY + this.basketSize.h / 2, this.basketSize.w, this.basketSize.h, 3); fill(BALLOON_BASKET[0]*0.8, BALLOON_BASKET[1]*0.8, BALLOON_BASKET[2]*0.8); rect(basketCenterX, basketTopY + 2, this.basketSize.w, 4, 2); stroke(BALLOON_BASKET[0]*0.7, BALLOON_BASKET[1]*0.7, BALLOON_BASKET[2]*0.7, 180); strokeWeight(1); for(let i = 1; i < 4; i++){ line(basketCenterX - this.basketSize.w/2, basketTopY + i * (this.basketSize.h/4), basketCenterX + this.basketSize.w/2, basketTopY + i*(this.basketSize.h/4)); } for(let i = 1; i < 5; i++){ line(basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketTopY, basketCenterX - this.basketSize.w/2 + i*(this.basketSize.w/5), basketBottomY); } noStroke(); let numPanels = BALLOON_COLORS.length * 2; for (let i = 0; i < numPanels; i++) { fill(BALLOON_COLORS[i % BALLOON_COLORS.length]); arc(0, 0, this.radius * 2.1, this.radius * 2.3, i * (360.0 / numPanels) - 90 - (360.0/numPanels)*0.1, (i + 1) * (360.0 / numPanels) - 90 + (360.0/numPanels)*0.1, PIE); } noFill(); stroke(255, 255, 255, 30); strokeWeight(this.radius * 0.5); arc(0,0, this.radius*1.8, this.radius*2.0, -150, -30); stroke(0, 0, 0, 40); strokeWeight(this.radius * 0.6); arc(0,0, this.radius*1.8, this.radius*2.0, 30, 150); pop(); noStroke(); } hit() { if (!this.isAlive) return; this.isAlive = false; this.respawnTimer = BALLOON_RESPAWN_FRAMES; } respawn() { this.isAlive = true; this.basePos.x = random(width * 0.1, width * 0.9); this.basePos.y = random(height * 0.15, height * 0.55); this.driftSpeed = random(0.1, 0.3) * (random() > 0.5 ? 1 : -1); this.pos = this.basePos.copy(); console.log("Balloon Respawned at", this.basePos.x.toFixed(0), this.basePos.y.toFixed(0)); } checkCollision(bullet) { if (!this.isAlive) return false; let distance = dist(this.pos.x, this.pos.y, bullet.position.x, bullet.position.y); return distance < this.radius + bullet.size / 2; } }

// =======================
// --- Particle Class ---
// =======================
 class Particle { constructor(x, y, baseColor) { this.pos = createVector(x, y); let angle = random(360); let speed = random(1, 5); this.vel = p5.Vector.fromAngle(radians(angle), speed); this.vel.y += random(-0.5, 0.5); this.lifespan = random(30, 70); this.baseColor = color(baseColor); this.size = random(4, 12); this.decay = random(0.88, 0.96); } update() { this.pos.add(this.vel); this.vel.mult(0.95); this.vel.y += 0.05; this.lifespan -= 1; this.size *= this.decay; } display() { push(); noStroke(); let currentAlpha = map(this.lifespan, 0, 50, 0, alpha(this.baseColor)); fill(red(this.baseColor), green(this.baseColor), blue(this.baseColor), max(0, currentAlpha)); ellipse(this.pos.x, this.pos.y, this.size, this.size); pop(); } isDead() { return this.lifespan <= 0 || this.size < 1; } }

// ===============================================
// --- Helper Function to Create Explosions ---
// ===============================================
 function createExplosion(x, y, count, colors) {
     if (audioStarted) { explosionSoundEnv.play(explosionNoise); } // Play sound
     if (particles.length > MAX_PARTICLES) return; // Create particles
     for (let i = 0; i < count; i++) { let chosenColor = random(colors); if (particles.length < MAX_PARTICLES) { particles.push(new Particle(x, y, chosenColor)); } else { break; } }
 }