// Initial file content
const initialFiles = {
  'screen.js': `class Screen {
    // Use this class if you want a full-screen canvas that resizes automatically.
    constructor(width = 1920, height = 1080) {
        this.width = width;
        this.height = height;
        this.aspectRatio = width / height;
        
        this.container = document.createElement('div');
        this.container.className = 'screen-container';
        // Set up the container div to fill the window.
        this._initializeContainer();

        // Create canvas fullscreen
        this._createFullScreen();

        document.body.appendChild(this.container);

        // Listen for window resize events.
        this._setupResponsive();
        this._resize();
        this._applyBodyStyles();
    }

    _initializeContainer() {
        Object.assign(this.container.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            background: '#000000', overflow: 'hidden', display: 'flex',
        });
    }

    _createFullScreen() {
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.className = 'canvas-wrapper';
        Object.assign(this.canvasWrapper.style, {
            flex: '1', position: 'relative', overflow: 'hidden', display: 'flex',
            alignItems: 'center', justifyContent: 'center', background: '#111' // Distinct background
        });

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'screen-canvas';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.border = "1px solid #333"; // Subtle border

        Object.assign(this.canvas.style, {
            display: 'block', maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain', // Keep aspect ratio
            boxShadow: '0 0 20px rgba(0,0,0,0.5)' // Elevation
        });

        this.canvasWrapper.appendChild(this.canvas);
        this.container.appendChild(this.canvasWrapper);
    }

    // Remove default margins and scrollbars from the body.
    _applyBodyStyles() {
        Object.assign(document.body.style, {
            margin: '0', padding: '0', overflow: 'hidden', background: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            minHeight: '100vh', touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none',
        });
    }

    _setupResponsive() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            // Wait a bit before resizing to avoid lag.
            resizeTimeout = setTimeout(() => this._resize(), 16);
        };
        window.addEventListener('resize', handleResize);
    }

    _resize() {
        const event = new CustomEvent('screen-resize', { detail: this.getCanvasDimensions() });
        this.canvas.dispatchEvent(event);
    }

    getContext(type = '2d', options = {}) {
        return this.canvas.getContext(type, { alpha: false, desynchronized: true, ...options });
    }

    getCanvasDimensions() {
        return {
            width: this.canvas.width, height: this.canvas.height,
            displayWidth: this.canvas.offsetWidth, displayHeight: this.canvas.offsetHeight,
        };
    }
}`,
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Physics Engine - Simple Demo</title>
</head>
<body>
</body>
</html>`,
  'style.css': `body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #f0f0f0;
}

canvas {
    display: block;
    background-color: #fff;
    margin: 0;
    border: none;
}`,
  'vector.js': `class Vector {
    // Basic vector class: holds x and y coordinates.
    // Think of it as an arrow pointing from (0,0) to (x,y).
    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
    }

    // Getters and Setters
    get x() {
        return this._x;
    }

    set x(value) {
        if (typeof value !== "number") {
            throw new Error("Error while setting x: Invalid value provided - " + value);
        }
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        if (typeof value !== "number") {
            throw new Error("Error while setting y: Invalid value provided - " + value);
        }
        this._y = value;
    }

    static isValidVector(vec) {
        return vec instanceof Vector && typeof vec.x === 'number' && typeof vec.y === 'number';
    }

    // -- Methods -- 

    // Set x and y manually.
    set(x, y) {
        if (x instanceof Vector) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        return this;
    }

    // Make a fresh clone of this vector so we don't mess up the original.
    copy() {
        return new Vector(this.x, this.y);
    }

    // Add another vector to this one.
    // Visual: put the tail of 'v' at the head of this one.
    add(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
        } else {
            this.x += v;
            this.y += v;
        }
        return this;
    }

    // Subtract another vector from this one.
    // Visual: vector from 'v's head to this vector's head.
    sub(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
        } else {
            this.x -= v;
            this.y -= v;
        }
        return this;
    }

    // Multiply (scale) the vector.
    // n=2 makes it twice as long. n=0.5 makes it half as long.
    mult(n) {
        if (n instanceof Vector) {
            throw new Error("Vector.mult: separate vector multiplication is not supported (use dot product instead by calling .dot())");
        }
        this.x *= n;
        this.y *= n;
        return this;
    }

    // Divide (shrink) the vector.
    div(n) {
        if (n instanceof Vector) {
            throw new Error("Vector.div: separate vector division is not supported");
        }
        if (n === 0) {
            console.warn("Vector.div: division by zero");
            return this;
        }
        this.x /= n;
        this.y /= n;
        return this;
    }

    // Magnitude: how long is the arrow?
    mag() {
        return Math.sqrt(this.magSq());
    }

    // Magnitude squared. Faster than mag() because no square root.
    // Good for comparing lengths (is A longer than B?).
    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    // Dot product: how much do two vectors align?
    // > 0: similar direction
    // 0: perpendicular (90 degrees)
    // < 0: opposite direction
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    // Distance between two vectors (points).
    dist(v) {
        const v1 = this.copy();
        const v2 = v.copy();
        v1.sub(v2);
        return v1.mag();
    }

    // Normalize: keep direction, but make length = 1.
    // Also called a "unit vector".
    normalize() {
        const len = this.mag();
        if (len !== 0) this.div(len);
        return this;
    }

    // Cap the length at a maximum value.
    limit(max) {
        const mSq = this.magSq();
        if (mSq > max * max) {
            this.div(Math.sqrt(mSq)).mult(max);
        }
        return this;
    }

    // Set the length to a specific value.
    setMag(n) {
        return this.normalize().mult(n);
    }

    // What angle is this vector pointing at? (in radians)
    heading() {
        return Math.atan2(this.y, this.x);
    }

    // Rotate the vector by an angle (in radians).
    rotate(angle) {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this;
    }

    // Linear Interpolation: Move partway towards another vector.
    // amt = 0.5 means halfway there.
    lerp(v, amt) {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this;
    }

    array() {
        return [this.x, this.y];
    }

    equals(v) {
        return this.x === v.x && this.y === v.y;
    }

    toString() {
        return \`Vector Object : [\${this.x}, \${this.y}]\`;
    }

    // -- Static Methods --
    // These create NEW vectors instead of changing existing ones.

    static add(v1, v2) {
        const target = v1.copy();
        if (v2 instanceof Vector) {
            target.add(v2);
        } else {
            target.x += v2;
            target.y += v2;
        }
        return target;
    }

    static sub(v1, v2) {
        const target = v1.copy();
        if (v2 instanceof Vector) {
            target.sub(v2);
        } else {
            target.x -= v2;
            target.y -= v2;
        }
        return target;
    }

    static mult(v, n) {
        const target = v.copy();
        target.mult(n);
        return target;
    }

    static div(v, n) {
        const target = v.copy();
        target.div(n);
        return target;
    }

    static dot(v1, v2) {
        return v1.dot(v2);
    }

    static dist(v1, v2) {
        return v1.dist(v2);
    }

    static lerp(v1, v2, amt) {
        const target = v1.copy();
        target.lerp(v2, amt);
        return target;
    }

    // Create a vector from an angle. 
    // 0 is right, PI/2 is down, PI is left.
    static fromAngle(angle, length = 1) {
        return new Vector(length * Math.cos(angle), length * Math.sin(angle));
    }

    static random2D() {
        return Vector.fromAngle(Math.random() * Math.PI * 2);
    }
}`,
  'body.js': `class Body {
    static bodyCount = 0;

    constructor(x, y, mass = 1, inertia = 1000) {
        this.id = Body.bodyCount++;
        this.name = "Body-" + this.id;

        // Position: where it is.
        this.pos = new Vector(x, y);
        // Velocity: how fast it's moving.
        this.vel = new Vector(0, 0);
        // Acceleration: how fast the speed is changing.
        this.acc = new Vector(0, 0);

        // Rotation (Angle) properties
        this.angle = 0;       // Current angle (radians)
        this.angVel = 0;      // Spinning speed
        this.angAcc = 0;      // Spinning acceleration

        this.mass = mass;
        // We store 1/mass because in physics math (F=ma => a=F/m),
        // we divide by mass a lot. Multiplying by (1/m) is faster.
        // If mass is 0 (static object), invMass is 0.
        this.invMass = mass === 0 ? 0 : 1 / mass;

        this.inertia = inertia; // How hard it is to spin.
        this.invInertia = inertia === 0 ? 0 : 1 / inertia;

        this.force = new Vector(0, 0);
        this.torque = 0;

        this.restitution = 0.2; // Bounciness
        this.friction = 0.4;    // Roughness
    }

    // Make an object "static" (unmovable).
    // infinite mass = 0 inverse mass.
    setStatic() {
        this.mass = 0;
        this.invMass = 0;
        this.inertia = 0;
        this.invInertia = 0;
        this.vel.set(0, 0);
        this.angVel = 0;
    }

    applyForce(force) {
        this.force.add(force);
    }

    applyForceAtPoint(force, point) {
        this.force.add(force);
        // Torque = cross product of radius vector and force
        const r = Vector.sub(point, this.pos);
        this.torque += r.x * force.y - r.y * force.x;
    }

    // Step 1: Update speed based on forces (gravity, etc.)
    integrateVelocity(dt) {
        if (this.invMass === 0) return; // Don't move if static

        // velocity += force * (1/mass) * time
        this.vel.add(new Vector(this.force.x * this.invMass * dt, this.force.y * this.invMass * dt));
        this.angVel += this.torque * this.invInertia * dt;
    }

    // Step 2: Update position based on speed
    integratePosition(dt) {
        if (this.invMass === 0) return;

        // position += velocity * time
        this.pos.add(Vector.mult(this.vel, dt));
        this.angle += this.angVel * dt;
    }

    clearForces() {
        this.force.set(0, 0);
        this.torque = 0;
    }

    // Run simple physics integration
    update(dt) {
        if (this.invMass === 0) return;
        this.integrateVelocity(dt);
        this.integratePosition(dt);
        this.clearForces();
    }
}`,
  'circle.js': `class Circle extends Body {
    // A circle is just a point with a radius.
    // We extend 'Body' so it gets physics properties like velocity and position.
    constructor(x, y, radius, mass = 1, material = {}) {
        // Inertia (resistance to rotation) for a solid disk.
        // Formula: 1/2 * mass * radius^2
        const inertia = 0.5 * mass * radius * radius;
        super(x, y, mass, inertia);

        this.radius = radius;

        // Material properties:
        // Restitution = bounciness (0 = no bounce, 1 = super bouncy)
        // Friction = how much it slides (0 = ice, 1 = sandpaper)
        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;

        this.type = "Circle";
    }

    // Draw the circle on the canvas.
    draw(ctx) {
        ctx.save();
        
        // Move to the circle's position and rotate it.
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        // ctx.arc(x, y, radius, startAngle, endAngle)
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);

        // Styling
        ctx.fillStyle = "#ccc"; // light gray
        ctx.fill();
        ctx.strokeStyle = "#000"; // black border
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw a line from the center to the edge so we can see it spinning.
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();

        // Draw a red dot at the center.
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore(); // Undo the translation/rotation for the next object.
    }
}`,
  'polygon.js': `class Polygon extends Body {
    // Vertices are the corners of the polygon, relative to its center (0,0).
    constructor(x, y, vertices, mass = 1, material = {}) {
        
        // Calculate rough bounding box to estimate inertia (how hard it is to spin).
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        // Approximate inertia for a box. Correct for rectangles, okay approximation for others.
        const inertia = (1 / 12) * mass * (width * width + height * height);

        super(x, y, mass, inertia);

        this.vertices = vertices;
        this.type = "Polygon";

        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;
    }

    // Get the actual position of corners in the world (after rotation/movement).
    getWorldVertices() {
        const worldVertices = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i].copy();
            v.rotate(this.angle); // Rotate first
            v.add(this.pos);      // Then translate (move to position)
            worldVertices.push(v);
        }
        return worldVertices;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        if (this.vertices.length > 0) {
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            // Connect all the dots
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath(); // Go back to the start
        }

        ctx.fillStyle = "#aaa";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw center point for reference (red dot)
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }
}`,
  'main.js': `
// Initialize Screen for responsive canvas
const screen = new Screen(window.innerWidth, window.innerHeight);
const ctx = screen.getContext(); // 'ctx' is like our paintbrush.

// Set the canvas size to fill most of the window.
const width = screen.width;
const height = screen.height;

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
    new Vector(-width/2, -20),
    new Vector(width/2, -20),
    new Vector(width/2, 20),
    new Vector(-width/2, 20)
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
requestAnimationFrame(update);`
};

// Global State
let files = { ...initialFiles };
let activeFile = 'main.js';

// DOM Elements
const tabBar = document.getElementById('file-tabs');
const editorContainer = document.getElementById('editor-container');
const previewFrame = document.getElementById('preview-frame');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize CodeMirror
const editor = CodeMirror(editorContainer, {
  value: files[activeFile],
  mode: 'javascript',
  theme: 'dracula',
  lineNumbers: true,
  tabSize: 2,
  lineWrapping: true,
  autoCloseTags: true,
  autoCloseBrackets: true
});

// Sync changes back to state
editor.on('change', () => {
  files[activeFile] = editor.getValue();
});

// Functions
function getFileMode(filename) {
  if (filename.endsWith('.html')) return 'htmlmixed';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.js')) return 'javascript';
  return 'text/plain';
}

function renderTabs() {
  tabBar.innerHTML = '';
  // Defined order for tabs
  const order = ['index.html', 'style.css', 'vector.js', 'body.js', 'circle.js', 'polygon.js', 'main.js'];
  // Merge with any new files unique keys if we had dynamic file creation
  const keys = Object.keys(files);
  const sortedKeys = order.filter(k => keys.includes(k)).concat(keys.filter(k => !order.includes(k)));

  sortedKeys.forEach(filename => {
    const tab = document.createElement('div');
    tab.className = `tab ${filename === activeFile ? 'active' : ''}`;
    tab.textContent = filename;
    tab.onclick = () => switchFile(filename);
    tabBar.appendChild(tab);
  });
}

function switchFile(filename) {
  activeFile = filename;
  editor.setValue(files[filename]);
  editor.setOption('mode', getFileMode(filename));
  renderTabs();
}

function updatePreview() {
  const htmlContent = files['index.html'];

  // Create a new document to inject content
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Inject CSS
  const styleTag = doc.createElement('style');
  // Combine all CSS files
  const cssContent = Object.keys(files)
    .filter(f => f.endsWith('.css'))
    .map(f => files[f])
    .join('\n');
  styleTag.textContent = cssContent;
  doc.head.appendChild(styleTag);

  // Inject JS
  // Strict order required for dependencies
  const jsOrder = ['vector.js', 'body.js', 'circle.js', 'polygon.js', 'screen.js', 'main.js'];
  const jsFiles = Object.keys(files).filter(f => f.endsWith('.js'));

  // Sort files based on jsOrder, put unknowns last
  const sortedJsFiles = jsOrder.filter(f => jsFiles.includes(f))
    .concat(jsFiles.filter(f => !jsOrder.includes(f)));

  // Create a single script block with try-catch
  const scriptTag = doc.createElement('script');
  const combinedScript = sortedJsFiles.map(f => {
    return `// File: ${f}\n${files[f]}`;
  }).join('\n\n');

  scriptTag.textContent = `
    try {
        ${combinedScript}
    } catch (e) {
        console.error("Runtime Error:", e);
    }
    `;
  doc.body.appendChild(scriptTag);

  // Set iframe content
  const blob = new Blob([doc.documentElement.outerHTML], { type: 'text/html' });
  previewFrame.src = URL.createObjectURL(blob);
}

function resetProject() {
  if (confirm('Reset all code to default?')) {
    files = { ...initialFiles };
    switchFile('main.js'); // Switch to main file
    updatePreview();
  }
}

// Event Listeners
runBtn.addEventListener('click', () => {
  // updatePreview() is now handled by switchView
  switchView('view-preview');
});
resetBtn.addEventListener('click', resetProject);

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.pane');

// Store scroll positions
const scrollPositions = {
  'view-tutorial': 0,
  'view-code': { left: 0, top: 0 },
  'view-preview': 0
};

function switchView(viewId) {
  // 1. Save scroll position of current active view
  const currentActive = document.querySelector('.pane.active');
  if (currentActive) {
    if (currentActive.id === 'view-code') {
      if (typeof editor !== 'undefined') {
        const info = editor.getScrollInfo();
        scrollPositions['view-code'] = { left: info.left, top: info.top };
      }
    } else if (currentActive.id === 'view-tutorial') {
      // access the iframe
      const iframe = currentActive.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        scrollPositions['view-tutorial'] = iframe.contentWindow.scrollY;
      }
    } else {
      scrollPositions[currentActive.id] = currentActive.scrollTop;
    }
  }

  // Update Views
  views.forEach(view => {
    if (view.id === viewId) {
      view.classList.add('active');

      // 2. Restore scroll position for new active view
      setTimeout(() => {
        if (viewId === 'view-code') {
          if (typeof editor !== 'undefined') {
            editor.refresh();
            const pos = scrollPositions['view-code'] || { left: 0, top: 0 };
            editor.scrollTo(pos.left, pos.top);
          }
        } else if (viewId === 'view-tutorial') {
          const iframe = view.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.scrollTo(0, scrollPositions['view-tutorial'] || 0);
          }
        } else {
          view.scrollTop = scrollPositions[viewId] || 0;
        }
      }, 10);

    } else {
      view.classList.remove('active');
    }
  });

  // Update Nav Buttons
  navItems.forEach(item => {
    if (item.dataset.target === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Auto-run/refresh preview when entering preview tab
  if (viewId === 'view-preview') {
    updatePreview();
  }
}


navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchView(item.dataset.target);
  });
});

// Initialization
renderTabs();
switchFile('main.js');
updatePreview();
switchView('view-tutorial'); // Enforce tutorial view start
