// Get the canvas element from the HTML so we can draw on it.
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // 'ctx' is like our paintbrush.

// Set the canvas size to fill most of the window.
const width = Math.min(window.innerWidth, 800);
const height = Math.min(window.innerHeight, 600);

canvas.width = width;
canvas.height = height;

// This array will hold all the physics objects (circles, boxes, etc.)
const bodies = [];

// -- Create some bodies for the simulation --

// Circle 1
const circle1 = new Circle(width * 0.25, height * 0.3, 30);
circle1.vel.set(20, -10); // Give it some initial speed
bodies.push(circle1);

// Circle 2 (Heavier)
// Notice the mass is 5 (default is 1). Heavy objects are harder to push.
const circle2 = new Circle(width * 0.75, height * 0.4, 50, 5);
circle2.vel.set(-10, 10);
bodies.push(circle2);

// Rotating Polygon (Centered)
// Polygons are defined by a list of points relative to their center.
const poly1 = new Polygon(width * 0.5, height * 0.5, [
    new Vector(-30, -30),
    new Vector(30, -30),
    new Vector(30, 30),
    new Vector(-30, 30)
]);
poly1.angVel = 0.5; // Give it a spin
bodies.push(poly1);

// Triangle
const triangle = new Polygon(width * 0.3, height * 0.2, [
    new Vector(0, -30),   // Top
    new Vector(30, 30),   // Bottom Right
    new Vector(-30, 30)   // Bottom Left
]);
triangle.restitution = 0.5; // Bounciness
triangle.angVel = -0.2;
bodies.push(triangle);

// Box
const box = new Polygon(width * 0.6, height * 0.2, [
    new Vector(-25, -25),
    new Vector(25, -25),
    new Vector(25, 25),
    new Vector(-25, 25)
]);
box.vel.set(5, 0); // Moving to the right
bodies.push(box);

// Ground (Static platform)
const ground = new Polygon(width * 0.5, height - 20, [
    new Vector(-width / 2, -20),
    new Vector(width / 2, -20),
    new Vector(width / 2, 20),
    new Vector(-width / 2, 20)
]);
// 'setStatic()' makes it unmovable (infinite mass).
ground.setStatic();
bodies.push(ground);

// Add some random chaos (falling circles)
for (let i = 0; i < 5; i++) {
    const r = 15 + Math.random() * 20; // Random size
    const x = Math.random() * width;
    const y = Math.random() * (height * 0.5); // Random position in top half
    const c = new Circle(x, y, r);
    // Random velocity
    c.vel.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    c.restitution = 0.8; // Bouncy!
    bodies.push(c);
}


let lastTime = 0;

// The Main Game Loop
// This function runs every frame (approx 60 times per second).
function update(time) {
    // Calculate how much time passed since the last frame.
    // 'dt' stands for "delta time". We use it to make movement smooth.
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Clear the screen so we can draw the new frame.
    // If we didn't do this, we'd see trails of everything.
    ctx.clearRect(0, 0, width, height);

    // Update and draw each body
    for (const body of bodies) {
        // -- Simple Screen Wrapping / Bouncing --
        // Keep objects inside the screen.

        // Left wall
        if (body.pos.x < 0) {
            body.pos.x = 0;
            body.vel.x *= -1; // Reverse speed (bounce)
        }
        // Right wall
        if (body.pos.x > width) {
            body.pos.x = width;
            body.vel.x *= -1;
        }
        // Ceiling
        if (body.pos.y < 0) {
            body.pos.y = 0;
            body.vel.y *= -1;
        }
        // Floor
        if (body.pos.y > height) {
            body.pos.y = height;
            body.vel.y *= -0.5; // Lose speed when hitting the floor (damping)
        }

        // 1. Move the objects (Physics step)
        body.update(dt || 0.016); // Fallback to ~60fps if dt is weird

        // 2. Draw them on the canvas
        body.draw(ctx);
    }

    // Ask the browser to call 'update' again when it's ready for the next frame.
    requestAnimationFrame(update);
}

// Start the loop!
requestAnimationFrame(update);
