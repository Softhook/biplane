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
const MAX_CLOUDS = 4;
const CLOUD_SPEED = 0.4;
const MIN_TAKEOFF_SPEED = 0.5;
const MAX_LANDING_SPEED = 2.5;

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

// --- Environment Dimensions ---
const GROUND_LEVEL_Y_FRAC = 0.9;
let GROUND_Y;
const HUT_WIDTH = 70;
const HUT_HEIGHT = 50;
let hutX, hutY;

// --- Colors ---
// (Same colors as before)
const SKY_TOP = [10, 5, 20];
const SKY_UPPER_BAND = [75, 40, 20];
const SKY_MID_BLUE = [25, 45, 110];
const SKY_LOWER_BLUE = [60, 110, 190];
const GROUND_COLOR = [40, 25, 45];
const MOUNTAIN_DARK = [90, 90, 100];
const MOUNTAIN_LIGHT = [120, 120, 130];
const MOUNTAIN_GREEN = [60, 110, 60];
const HUT_WALL = [140, 110, 80];
const HUT_ROOF = [90, 60, 40];
const CLOUD_COLOR = [220, 220, 235];
const PLANE1_COLOR_BODY = [210, 130, 40];
const PLANE1_COLOR_WING = [240, 180, 90];
const PLANE2_COLOR_BODY = [160, 180, 90];
const PLANE2_COLOR_WING = [200, 210, 120];
const BULLET_COLOR = [100, 200, 255];
const SCORE_COLOR = [255, 210, 0];

// --- p5.js Setup Function ---
function setup() {
    createCanvas(windowWidth, windowHeight); // Use full window dimensions
    angleMode(DEGREES);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    noSmooth();

    // Calculate initial layout based on window size
    calculateLayout();

    // Initialize Planes
    let planeStartY = GROUND_Y - 8;
    plane1 = new Plane(width * 0.2, planeStartY, PLANE1_COLOR_BODY, PLANE1_COLOR_WING, CONTROLS_P1, 1);
    plane2 = new Plane(width * 0.8, planeStartY, PLANE2_COLOR_BODY, PLANE2_COLOR_WING, CONTROLS_P2, 2);

    // Initialize Clouds
    for (let i = 0; i < MAX_CLOUDS; i++) { clouds.push(new Cloud()); }
    // Initialize Balloon
    balloon = new Balloon(width * 0.75, height * 0.4);

    keys = {};
}

// --- Helper to Calculate Layout ---
// Call this in setup and windowResized
function calculateLayout() {
    GROUND_Y = height * GROUND_LEVEL_Y_FRAC;
    hutX = width / 2;
    hutY = GROUND_Y - HUT_HEIGHT / 2;
    hut = { x: hutX, y: hutY, w: HUT_WIDTH, h: HUT_HEIGHT };
    // Note: Existing clouds/balloons/planes aren't repositioned on resize,
    // only the ground and hut references are updated. This is usually fine.
}


// --- p5.js Draw Function (Main Game Loop) ---
function draw() {
    drawBackground();
    drawEnvironment();

    // --- Bullets ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();

        // Bullet-Plane Collision
        if (plane1.isAlive && bullets[i].checkCollision(plane1)) {
            if (bullets[i].ownerId !== plane1.id) {
                plane1.hit(false); score2++; bullets.splice(i, 1); continue;
            }
        }
        if (plane2.isAlive && bullets[i].checkCollision(plane2)) {
             if (bullets[i].ownerId !== plane2.id) {
                plane2.hit(false); score1++; bullets.splice(i, 1); continue;
            }
        }

        // --- Bullet-Balloon Collision ---
        if (balloon.isAlive && balloon.checkCollision(bullets[i])) {
             balloon.hit();
             // Award point to shooter
             if (bullets[i].ownerId === 1) { score1++; } else { score2++; }
             bullets.splice(i, 1); // Remove bullet
             console.log("Balloon Hit!");
             continue; // Skip other checks for this bullet
         }

        // Bullet-Hut Collision
        if (bullets[i].checkCollisionHut(hut)) {
             bullets.splice(i, 1); continue;
         }

        // Remove Offscreen & Display
        if (bullets[i].isOffscreen()) {
            bullets.splice(i, 1);
        } else {
             bullets[i].display();
        }
    }

    // --- Planes ---
    plane1.handleInput(keys);
    plane1.update();
    plane1.display();

    plane2.handleInput(keys);
    plane2.update();
    plane2.display();

    // --- Scenery ---
    for (let cloud of clouds) { cloud.update(); cloud.display(); }
    balloon.update(); // Update handles respawn timer
    balloon.display(); // Display only draws if alive

    drawUI();
}

// --- Input Handling ---
function keyPressed() { keys[keyCode] = true; }
function keyReleased() { keys[keyCode] = false; }

// --- Fullscreen Toggle ---
function mousePressed() {
  // Check if the click is within the canvas area
  // (This check might be redundant if the canvas fills the window, but good practice)
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let fs = fullscreen();
    fullscreen(!fs);
    // Optional: Suppress default browser behavior if needed
    // return false;
  }
}

// --- Window Resize Handling ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate positions based on new dimensions
  calculateLayout();
}


// --- Drawing Functions ---
// drawBackground, drawEnvironment, drawUI (Remain the same as the previous version)
function drawBackground() { /* ... (same as before) ... */
    noStroke();
    let bandHeight = height * 0.03; // Height of the thin color bands

    // Top dark color
    fill(SKY_TOP);
    rect(width / 2, (height * 0.075) / 2, width, height * 0.075);

    // Upper Brown/Orange Band
    fill(SKY_UPPER_BAND);
    rect(width / 2, height * 0.075 + bandHeight / 2, width, bandHeight);

    // Gradient from Mid Blue to Lower Blue
    for (let y = height * 0.075 + bandHeight; y < GROUND_Y; y++) {
        let inter = map(y, height * 0.075 + bandHeight, GROUND_Y, 0, 1);
        let c = lerpColor(color(SKY_MID_BLUE), color(SKY_LOWER_BLUE), inter);
        stroke(c);
        line(0, y, width, y);
    }
    noStroke();
}

function drawEnvironment() { /* ... (same as before) ... */
 // Mountains
    fill(MOUNTAIN_GREEN); // Green foothills
    beginShape();
    vertex(0, GROUND_Y);
    vertex(width * 0.1, GROUND_Y);
    vertex(width * 0.2, GROUND_Y * 0.85);
    vertex(width * 0.35, GROUND_Y);
    vertex(width * 0.55, GROUND_Y);
     vertex(width * 0.6, GROUND_Y * 0.8);
    vertex(width * 0.85, GROUND_Y);
    vertex(width, GROUND_Y);
    endShape(CLOSE);


    fill(MOUNTAIN_DARK); // Darker peak
    triangle(width * 0.05, GROUND_Y, width * 0.3, GROUND_Y * 0.55, width * 0.45, GROUND_Y);
    fill(MOUNTAIN_LIGHT); // Lighter peak
    triangle(width * 0.4, GROUND_Y, width * 0.65, GROUND_Y * 0.45, width * 0.9, GROUND_Y);


    // Ground
    fill(GROUND_COLOR);
    rect(width / 2, GROUND_Y + (height - GROUND_Y) / 2, width, height - GROUND_Y);

    // Draw Hut (simple representation)
    // Walls
    fill(HUT_WALL);
    rect(hutX, hutY, HUT_WIDTH, HUT_HEIGHT);
    // Roof
    fill(HUT_ROOF);
     triangle(hutX - HUT_WIDTH / 2, hutY - HUT_HEIGHT / 2,
              hutX + HUT_WIDTH / 2, hutY - HUT_HEIGHT / 2,
              hutX,                hutY - HUT_HEIGHT / 2 - HUT_HEIGHT * 0.5); // Pointier roof
    // Simple brick texture simulation
    stroke(HUT_ROOF[0] * 0.8, HUT_ROOF[1] * 0.8, HUT_ROOF[2] * 0.8); // Darker lines
    strokeWeight(1);
     for(let i = 0; i < 5; i++) { // Horizontal lines
         let lineY = hutY - HUT_HEIGHT/2 + (HUT_HEIGHT / 5) * (i + 0.5);
         line(hutX - HUT_WIDTH/2, lineY, hutX + HUT_WIDTH/2, lineY);
     }
      for(let i = 0; i < 6; i++) { // Vertical lines (offset rows)
          let lineX = hutX - HUT_WIDTH/2 + (HUT_WIDTH / 6) * (i + 0.5);
          for(let j = 0; j < 5; j++) {
              let yStart = hutY - HUT_HEIGHT/2 + (HUT_HEIGHT / 5) * j;
               let yEnd = yStart + HUT_HEIGHT/5;
               let xPos = lineX + ((j%2 == 0) ? 0: HUT_WIDTH / 12); // Offset every other row
               if (xPos < hutX + HUT_WIDTH/2 && xPos > hutX - HUT_WIDTH/2) {
                    line(xPos, yStart, xPos, yEnd);
               }
          }
     }
    noStroke(); // Reset stroke
}

function drawUI() { /* ... (same as before) ... */
    textSize(36); // Larger score text
    textFont('monospace'); // A blockier font
    fill(SCORE_COLOR);
    stroke(0); // Black outline for visibility
    strokeWeight(2);

    // Player 1 Score (Bottom Left)
    textAlign(LEFT, BOTTOM);
    text(nf(score1, 2), 15, height - 5);

    // Player 2 Score (Bottom Right)
    textAlign(RIGHT, BOTTOM);
    text(nf(score2, 2), width - 15, height - 5);

    noStroke(); // Reset stroke
}


// =====================
// --- Plane Class ---
// =====================
class Plane { /* ... (Mostly the same as the previous version) ... */
    constructor(x, y, bodyCol, wingCol, controls, id) {
        this.id = id;
        this.startPos = createVector(x, y);
        this.bodyColor = color(bodyCol);
        this.wingColor = color(wingCol);
        this.controls = controls;
        this.size = 20; // Reference size (adjust based on drawing)

        this.position = this.startPos.copy();
        this.velocity = createVector(0, 0);
        this.angle = 0; // Start horizontal

        this.isAlive = true;
        this.isOnGround = true;
        this.respawnTimer = 0;
        this.shootCooldown = 0;

        this.isThrusting = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;

        // Store points for drawing (relative to center 0,0)
        this.planePoints = this.createPlaneShape();
    }

     // Helper to define plane shape points for drawing
     createPlaneShape() {
         // Define points relative to center (0,0), assuming facing right (angle 0)
         let s = this.size;
         return {
             // Fuselage (x, y)
             fuselage: [
                 {x: s * 0.8, y: 0}, {x: s * 0.5, y: -s * 0.15},
                 {x: -s * 0.7, y: -s * 0.15}, {x: -s * 0.9, y: 0}, // Tail narrowing
                 {x: -s * 0.7, y: s * 0.15}, {x: s * 0.5, y: s * 0.15}
             ],
             // Top Wing
             topWing: [
                 {x: s * 0.3, y: -s * 0.25}, {x: s * 0.3, y: -s * 0.65},
                 {x: -s * 0.4, y: -s * 0.65}, {x: -s * 0.4, y: -s * 0.25}
             ],
             // Bottom Wing
             bottomWing: [
                 {x: s * 0.2, y: s * 0.25}, {x: s * 0.2, y: s * 0.55},
                 {x: -s * 0.3, y: s * 0.55}, {x: -s * 0.3, y: s * 0.25}
             ],
             // Tailplane (horizontal stabilizer)
             tailplane: [
                  {x: -s * 0.75, y: -s * 0.1}, {x: -s * 1.0, y: -s * 0.3},
                  {x: -s * 1.0, y: s * 0.3}, {x: -s * 0.75, y: s * 0.1}
              ],
             // Rudder (vertical stabilizer)
             rudder: [
                 {x: -s * 0.9, y: 0}, {x: -s * 1.1, y: -s * 0.3}, {x: -s * 1.1, y: 0}
             ],
             // Wheels (relative position)
             wheels: [ {x: s*0.1, y: s*0.65}, {x: -s*0.1, y: s*0.65} ], // Below bottom wing
             wheelRadius: s * 0.15
         };
     }


    handleInput(keys) {
        if (!this.isAlive || this.respawnTimer > 0) {
             this.isThrusting = false; this.isTurningLeft = false; this.isTurningRight = false;
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
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) { this.respawn(); }
            return;
        }
        if (!this.isAlive) return;

        // Cooldowns
        if (this.shootCooldown > 0) { this.shootCooldown--; }

        // --- Physics ---
        let effectiveGravity = GRAVITY_FORCE;
        let thrustVector = createVector(0, 0);

        // Turning
        if (this.isTurningLeft) { this.angle -= TURN_SPEED; }
        if (this.isTurningRight) { this.angle += TURN_SPEED; }

        // Thrust
        if (this.isThrusting) {
             thrustVector = p5.Vector.fromAngle(radians(this.angle), THRUST_FORCE);
         }

        // --- Ground/Air State ---
        if (this.isOnGround) {
            this.velocity.x *= GROUND_FRICTION; // Apply friction
            this.applyForce(createVector(thrustVector.x, thrustVector.y * 0.1)); // Thrust mainly horizontal

            // Clamp to ground
            let groundCheckY = GROUND_Y - this.size * 0.7; // Adjusted based on wheel position
            if (this.position.y >= groundCheckY) {
                this.position.y = groundCheckY;
                this.velocity.y = 0;
            }

             // Takeoff
            let speed = this.velocity.mag();
            if (this.isThrusting && this.angle < -5 && this.angle > -175 && speed > MIN_TAKEOFF_SPEED) {
                this.isOnGround = false;
                this.velocity.y -= THRUST_FORCE * 0.5; // Small boost
            } else {
                // Apply gravity if not thrusting upwards enough
                 if (!this.isThrusting || thrustVector.y > -GRAVITY_FORCE * 0.5) {
                    this.applyForce(createVector(0, effectiveGravity));
                 }
            }
        } else { // --- Airborne Physics ---
            this.applyForce(thrustVector); // Full thrust
            this.applyForce(createVector(0, effectiveGravity)); // Gravity
            this.velocity.mult(DAMPING_FACTOR); // Air resistance

            // Check for landing
            let groundCheckY = GROUND_Y - this.size * 0.7; // Y pos when wheels touch
            if (this.position.y >= groundCheckY && this.velocity.y > 0) {
                 // CRASH LANDING CHECK
                 if (this.velocity.y > MAX_LANDING_SPEED) {
                      console.log(`Plane ${this.id} CRASH LANDED! Speed: ${this.velocity.y.toFixed(2)}`);
                      this.hit(true); // true indicates a crash
                      return; // Stop further updates this frame after crash
                 } else {
                      // Safe landing
                      this.isOnGround = true;
                      this.position.y = groundCheckY;
                      this.velocity.y = 0;
                     // Keep horizontal velocity, friction applied next frame
                 }
            }
        }

        // Update Position
        this.position.add(this.velocity);

        // --- Boundary Constraints ---
        // Horizontal Wrap
        if (this.position.x > width + this.size) { this.position.x = -this.size; }
        else if (this.position.x < -this.size) { this.position.x = width + this.size; }

        // Top Screen Constraint
        if (this.position.y < this.size / 2) { // Check near top edge
             this.position.y = this.size / 2;
             if (this.velocity.y < 0) { // If moving up
                 this.velocity.y = 0; // Stop vertical movement upwards
             }
        }

        // Check Hut Collision (Moved here to happen after position update)
        this.checkCollisionHut(hut);
    }

    display() { /* ... (same as before - drawing the detailed plane) ... */
        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle);

        if (this.respawnTimer > 0 && floor(this.respawnTimer / 10) % 2 === 0) {
           // Flashing effect while respawning
        } else {
            stroke(0); // Black outline
            strokeWeight(1);

             // Draw parts using the defined points
             let pp = this.planePoints;

             // Wings
             fill(this.wingColor);
             beginShape(); // Top Wing
             for(let p of pp.topWing) { vertex(p.x, p.y); }
             endShape(CLOSE);
             beginShape(); // Bottom Wing
             for(let p of pp.bottomWing) { vertex(p.x, p.y); }
             endShape(CLOSE);

             // Tailplane & Rudder
             fill(this.bodyColor); // Usually same color as fuselage
             beginShape(); // Tailplane
             for(let p of pp.tailplane) { vertex(p.x, p.y); }
             endShape(CLOSE);
              beginShape(); // Rudder
             for(let p of pp.rudder) { vertex(p.x, p.y); }
             endShape(CLOSE);


             // Fuselage (drawn last to be on top)
             fill(this.bodyColor);
             beginShape();
             for(let p of pp.fuselage) { vertex(p.x, p.y); }
             endShape(CLOSE);


             // Wheels (Draw if on ground or low altitude)
             if (this.isOnGround || this.position.y > GROUND_Y - this.size * 3) {
                 fill(50); // Dark grey/black
                 noStroke();
                  ellipse(pp.wheels[0].x, pp.wheels[0].y, pp.wheelRadius * 2, pp.wheelRadius * 2);
                 ellipse(pp.wheels[1].x, pp.wheels[1].y, pp.wheelRadius * 2, pp.wheelRadius * 2);
                 // Simple struts
                 stroke(50);
                 strokeWeight(2);
                 line(pp.wheels[0].x, pp.wheels[0].y, pp.bottomWing[1].x, pp.bottomWing[1].y + pp.wheelRadius * 0.5);
                  line(pp.wheels[1].x, pp.wheels[1].y, pp.bottomWing[2].x, pp.bottomWing[2].y + pp.wheelRadius * 0.5);

             }


            // Propeller (very simple)
             if (this.isThrusting || this.velocity.magSq() > 0.1) {
                 noStroke();
                 fill(100);
                 ellipse(this.size * 0.9, 0, this.size * 0.15, this.size * 0.7); // Spinning illusion
             }
        }
        pop();
        noStroke();
    }

    shoot() { /* ... (same logic as before) ... */
        let canShoot = !this.isOnGround || (this.isOnGround && this.angle < -10 && this.angle > -170);

        if (this.shootCooldown <= 0 && this.isAlive && canShoot) {
            // Calculate bullet start position (tip of the fuselage)
            let noseOffset = createVector(this.size * 0.8, 0); // Offset along plane's local X
            let rotatedOffset = noseOffset.copy().rotate(this.angle);
            let bulletPos = p5.Vector.add(this.position, rotatedOffset);

            let bulletAngle = this.angle; // Bullet fires straight from plane angle

            let newBullet = new Bullet(bulletPos.x, bulletPos.y, bulletAngle, this.id);
            bullets.push(newBullet);
            this.shootCooldown = SHOOT_COOLDOWN_FRAMES;
        }
    }

    checkCollisionHut(hutRect) { /* ... (same logic as before) ... */
        if (!this.isAlive || this.respawnTimer > 0) return false;

         // Simple AABB check (might need refinement for rotated plane)
         // Check if plane's approximate bounding box overlaps hut's box
         let planeWidth = this.size * 2.5; // Approx width based on wings
         let planeHeight = this.size * 1.3; // Approx height based on wings/fuselage

         // Check rough overlap first
         if (this.position.x + planeWidth/2 > hutRect.x - hutRect.w / 2 &&
             this.position.x - planeWidth/2 < hutRect.x + hutRect.w / 2 &&
             this.position.y + planeHeight/2 > hutRect.y - hutRect.h / 2 &&
             this.position.y - planeHeight/2 < hutRect.y + hutRect.h / 2)
         {
             // More specific check: Is center within expanded hut bounds?
              if (this.position.x > hutRect.x - hutRect.w / 2 - this.size * 0.3 &&
                  this.position.x < hutRect.x + hutRect.w / 2 + this.size * 0.3 &&
                  this.position.y > hutRect.y - hutRect.h / 2 - this.size * 0.3 &&
                  this.position.y < hutRect.y + hutRect.h / 2 + this.size * 0.3 ) {

                 console.log(`Plane ${this.id} hit hut!`);
                 this.hit(true); // true indicates a crash
                 return true;
             }
         }
         return false;
    }

    hit(causedByCrash) { /* ... (same logic as before - scoring handled here) ... */
        if (!this.isAlive) return; // Already hit

        console.log(`Plane ${this.id} HIT! ${causedByCrash ? "(Crash/Hut)" : "(Bullet)"}`);
        this.isAlive = false;
        this.isOnGround = false;
        this.velocity = createVector(random(-1, 1), -2); // Small explosion effect
        this.respawnTimer = RESPAWN_DELAY_FRAMES;

        // --- Award point to opponent if it was a crash ---
        if (causedByCrash) {
            if (this.id === 1) {
                score2++;
                 console.log("Point for Player 2!");
            } else {
                score1++;
                 console.log("Point for Player 1!");
            }
        }
    }

    respawn() { /* ... (same logic as before) ... */
        // Respawn on the ground at original side
        // Ensure startPos reflects current screen size if resized? For now, assumes initial setup size.
        // A better approach might recalculate startPos based on width in calculateLayout
        let startX = (this.id === 1) ? width * 0.2 : width * 0.8;
        this.startPos = createVector(startX, GROUND_Y - 8); // Recalculate based on current width/ground

        this.position = this.startPos.copy();
        this.velocity = createVector(0, 0);
        this.angle = 0; // Reset angle to horizontal
        this.isAlive = true;
        this.isOnGround = true; // Start on ground again
        this.shootCooldown = SHOOT_COOLDOWN_FRAMES / 2;
         console.log(`Plane ${this.id} Respawned.`);
    }
}


// ======================
// --- Bullet Class ---
// ======================
class Bullet { /* ... (same as before) ... */
    constructor(x, y, angle, ownerId) {
        this.position = createVector(x, y);
        this.velocity = p5.Vector.fromAngle(radians(angle), BULLET_SPEED);
        this.ownerId = ownerId;
        this.size = 5;
    }

    update() { this.position.add(this.velocity); }

    display() {
        push();
        fill(BULLET_COLOR);
        noStroke();
        rect(this.position.x, this.position.y, this.size, this.size / 3);
        rect(this.position.x, this.position.y, this.size / 3, this.size);
        pop();
    }

    isOffscreen() {
        return (this.position.x < -this.size || this.position.x > width + this.size ||
                this.position.y < -this.size || this.position.y > height + this.size);
    }

    checkCollision(plane) {
        if (plane.id === this.ownerId || !plane.isAlive || plane.respawnTimer > 0) { return false; }
        let distance = dist(this.position.x, this.position.y, plane.position.x, plane.position.y);
        return distance < (this.size / 2 + plane.size * 0.7);
    }

     checkCollisionHut(hutRect) {
         return (this.position.x > hutRect.x - hutRect.w / 2 && this.position.x < hutRect.x + hutRect.w / 2 &&
                 this.position.y > hutRect.y - hutRect.h / 2 && this.position.y < hutRect.y + hutRect.h / 2);
     }
}

// =====================
// --- Cloud Class ---
// =====================
class Cloud { /* ... (same as before) ... */
     constructor() { this.reset(); this.pos.x = random(width); }
     reset() {
         let startSide = random() < 0.5 ? -1 : 1;
         this.size = random(70, 130);
         this.pos = createVector(startSide * (width*0.5 + random(100, 300)) + width/2, random(height * 0.15, height * 0.55));
         this.vel = createVector(CLOUD_SPEED * (startSide > 0 ? -1 : 1) * random(0.8, 1.2), 0);
         this.numPuffs = floor(random(4, 7));
         this.puffOffsets = [];
         for (let i = 0; i < this.numPuffs; i++) {
             this.puffOffsets.push({
                 x: random(-this.size * 0.5, this.size * 0.5),
                 y: random(-this.size * 0.15, this.size * 0.15),
                 r: random(this.size * 0.4, this.size * 0.7) * random(0.8, 1.2)
             });
         }
         this.opacity = random(200, 240);
     }
     update() {
         this.pos.add(this.vel);
         if (this.vel.x > 0 && this.pos.x - this.size > width) { this.reset(); this.pos.x = -this.size; }
         else if (this.vel.x < 0 && this.pos.x + this.size < 0) { this.reset(); this.pos.x = width + this.size; }
     }
     display() {
         push();
         noStroke();
         fill(CLOUD_COLOR[0], CLOUD_COLOR[1], CLOUD_COLOR[2], this.opacity);
         translate(this.pos.x, this.pos.y);
         for (let puff of this.puffOffsets) { ellipse(puff.x, puff.y, puff.r, puff.r * 0.8); }
         fill(CLOUD_COLOR[0]*0.9, CLOUD_COLOR[1]*0.9, CLOUD_COLOR[2]*0.9, this.opacity * 0.8);
         ellipse(0, this.size * 0.15, this.size, this.size * 0.4);
         pop();
     }
 }

// ==========================
// --- Hot Air Balloon Class --- (Modified for shooting)
// ==========================
class Balloon {
     constructor(x, y) {
         this.basePos = createVector(x, y); // Base position for drift
         this.pos = this.basePos.copy();    // Actual position with bobble
         this.bobbleOffset = 0;
         this.bobbleSpeed = 0.5;
         this.driftSpeed = 0.1;
         this.radius = 25; // For collision checking

         this.isAlive = true;
         this.respawnTimer = 0;
     }

     update() {
         // Handle Respawn Timer
         if (this.respawnTimer > 0) {
             this.respawnTimer--;
             if (this.respawnTimer <= 0) {
                 this.respawn();
             }
             return; // Don't update position/bobble while waiting to respawn
         }

         // If not alive and timer is done, something's wrong, but stay hidden
         if (!this.isAlive) return;

         // Normal Update (if alive and not waiting to respawn)
         this.bobbleOffset = sin(frameCount * this.bobbleSpeed) * 5;
         this.basePos.x += this.driftSpeed;
         if (this.basePos.x > width + this.radius * 2) {
             this.basePos.x = -this.radius * 2; // Wrap around screen
         } else if (this.basePos.x < -this.radius * 2) {
             this.basePos.x = width + this.radius * 2;
         }

         this.pos.y = this.basePos.y + this.bobbleOffset;
         this.pos.x = this.basePos.x;
     }

     display() {
         // Only draw if alive
         if (!this.isAlive) return;

         push();
         translate(this.pos.x, this.pos.y);
         noStroke();
         // Basket
         fill(139, 69, 19); rect(0, 30, 20, 15, 2);
         // Ropes
         stroke(50); strokeWeight(1); line(0, 30 - 7, -8, 10); line(0, 30 - 7, 8, 10);
         // Balloon part
         let colors = [color(255, 100, 0), color(0, 100, 200), color(255, 200, 0)];
         noStroke();
         for (let i = 0; i < 6; i++) {
             fill(colors[i % colors.length]);
             arc(0, 0, this.radius * 2, this.radius * 2.2, i * (180 / 3) - 90, (i + 1) * (180 / 3) - 90, PIE);
         }
         pop();
         noStroke();
     }

     hit() {
         if (!this.isAlive) return; // Can't hit if already dead
         this.isAlive = false;
         this.respawnTimer = BALLOON_RESPAWN_FRAMES;
         // Optional: Add visual effect for being hit
     }

     respawn() {
         this.isAlive = true;
         // Respawn at a new random horizontal position, similar altitude range
         this.basePos.x = random(width * 0.1, width * 0.9);
         this.basePos.y = random(height * 0.2, height * 0.5); // Reset vertical too? Or keep original base Y? Let's reset Y too.
         this.pos = this.basePos.copy(); // Sync pos immediately
         console.log("Balloon Respawned at", this.basePos.x.toFixed(0), this.basePos.y.toFixed(0));
     }

     checkCollision(bullet) {
         if (!this.isAlive) return false; // Cannot collide if not alive

         let distance = dist(this.pos.x, this.pos.y, bullet.position.x, bullet.position.y);
         return distance < this.radius + bullet.size / 2; // Check collision based on distance
     }
 }