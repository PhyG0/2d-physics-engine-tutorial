
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
            alignItems: 'center', justifyContent: 'center', background: '#111' 
        });

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'screen-canvas';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.border = "1px solid #333"; 

        Object.assign(this.canvas.style, {
            display: 'block', maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)' 
        });

        this.canvasWrapper.appendChild(this.canvas);
        this.container.appendChild(this.canvasWrapper);
    }

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
    <title>Physics Engine - Part 2</title>
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
    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
    }

    get x() { return this._x; }
    set x(value) {
        if (typeof value !== "number") throw new Error("Invalid x");
        this._x = value;
    }

    get y() { return this._y; }
    set y(value) {
        if (typeof value !== "number") throw new Error("Invalid y");
        this._y = value;
    }

    static isValidVector(vec) {
        return vec instanceof Vector && typeof vec.x === 'number' && typeof vec.y === 'number';
    }

    set(x, y) {
        if (x instanceof Vector) { this.x = x.x; this.y = x.y; }
        else { this.x = x; this.y = y; }
        return this;
    }

    copy() { return new Vector(this.x, this.y); }

    add(v) {
        if (v instanceof Vector) { this.x += v.x; this.y += v.y; }
        else { this.x += v; this.y += v; }
        return this;
    }

    sub(v) {
        if (v instanceof Vector) { this.x -= v.x; this.y -= v.y; }
        else { this.x -= v; this.y -= v; }
        return this;
    }

    mult(n) {
        if (n instanceof Vector) throw new Error("Vector.mult: separate vector multiplication not supported");
        this.x *= n; this.y *= n;
        return this;
    }

    div(n) {
        if (n instanceof Vector) throw new Error("Vector.div: separate vector division not supported");
        if (n === 0) { console.warn("Vector.div: division by zero"); return this; }
        this.x /= n; this.y /= n;
        return this;
    }

    mag() { return Math.sqrt(this.magSq()); }
    magSq() { return this.x * this.x + this.y * this.y; }

    dot(v) { return this.x * v.x + this.y * v.y; }

    dist(v) {
        const v1 = this.copy();
        const v2 = v.copy();
        v1.sub(v2);
        return v1.mag();
    }

    normalize() {
        const len = this.mag();
        if (len !== 0) this.div(len);
        return this;
    }

    limit(max) {
        const mSq = this.magSq();
        if (mSq > max * max) { this.div(Math.sqrt(mSq)).mult(max); }
        return this;
    }

    setMag(n) { return this.normalize().mult(n); }
    heading() { return Math.atan2(this.y, this.x); }

    rotate(angle) {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this;
    }

    lerp(v, amt) {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this;
    }

    array() { return [this.x, this.y]; }
    equals(v) { return this.x === v.x && this.y === v.y; }
    toString() { return \`Vector Object : [\${this.x}, \${this.y}]\`; }

    static add(v1, v2) {
        const target = v1.copy();
        if (v2 instanceof Vector) target.add(v2); else target.add(new Vector(v2, v2)); // Fix for scalar
        return target;
    }
    static sub(v1, v2) {
        const target = v1.copy();
        if (v2 instanceof Vector) target.sub(v2); else target.sub(new Vector(v2, v2));
        return target;
    }
    static mult(v, n) { const target = v.copy(); target.mult(n); return target; }
    static div(v, n) { const target = v.copy(); target.div(n); return target; }
    static dot(v1, v2) { return v1.dot(v2); }
    static dist(v1, v2) { return v1.dist(v2); }
    static lerp(v1, v2, amt) { const target = v1.copy(); target.lerp(v2, amt); return target; }
    static fromAngle(angle, length = 1) { return new Vector(length * Math.cos(angle), length * Math.sin(angle)); }
    static random2D() { return Vector.fromAngle(Math.random() * Math.PI * 2); }
}`,
    'body.js': `class Body {
    static bodyCount = 0;

    constructor(x, y, mass = 1, inertia = 1000) {
        this.id = Body.bodyCount++;
        this.name = "Body-" + this.id;

        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);

        this.angle = 0;
        this.angVel = 0;
        this.angAcc = 0;

        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass;

        this.inertia = inertia;
        this.invInertia = inertia === 0 ? 0 : 1 / inertia;

        this.force = new Vector(0, 0);
        this.torque = 0;

        this.restitution = 0.2;
        this.friction = 0.4;
    }

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
        const r = Vector.sub(point, this.pos);
        this.torque += r.x * force.y - r.y * force.x;
    }

    integrateVelocity(dt) {
        if (this.invMass === 0) return;
        this.vel.add(new Vector(this.force.x * this.invMass * dt, this.force.y * this.invMass * dt));
        this.angVel += this.torque * this.invInertia * dt;
    }

    integratePosition(dt) {
        if (this.invMass === 0) return;
        this.pos.add(Vector.mult(this.vel, dt));
        this.angle += this.angVel * dt;
    }

    clearForces() {
        this.force.set(0, 0);
        this.torque = 0;
    }

    update(dt) {
        if (this.invMass === 0) return;
        this.integrateVelocity(dt);
        this.integratePosition(dt);
        this.clearForces();
    }
}`,
    'circle.js': `class Circle extends Body {
    constructor(x, y, radius, mass = 1, material = {}) {
        const inertia = 0.5 * mass * radius * radius;
        super(x, y, mass, inertia);
        this.radius = radius;
        this.type = "Circle";
        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        // Hollow look: minimal fill, strong stroke
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();
        ctx.restore();
    }
}`,
    'polygon.js': `class Polygon extends Body {
    constructor(x, y, vertices, mass = 1, material = {}) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const inertia = (1 / 12) * mass * (width * width + height * height);

        super(x, y, mass, inertia);
        this.vertices = vertices;
        this.type = "Polygon";
        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;
    }

    getWorldVertices() {
        const worldVertices = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i].copy();
            v.rotate(this.angle);
            v.add(this.pos);
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
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
        }
        // Hollow look
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}`,
    'manifold.js': `class Manifold {
    constructor(bodyA, bodyB, normal, penetration, contacts) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.normal = normal;
        this.penetration = penetration;
        this.contacts = contacts || [];
    }

    draw(ctx) {
        if (this.contacts.length === 0) return;

        ctx.save();
        // Contact points
        ctx.fillStyle = "#00ff88";
        ctx.strokeStyle = "#004422";
        ctx.lineWidth = 1;
        for (let c of this.contacts) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        // Normal
        let avg = new Vector(0, 0);
        for (let c of this.contacts) avg.add(c);
        avg.div(this.contacts.length);
        const tip = avg.copy().add(this.normal.copy().mult(30));
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(avg.x, avg.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        ctx.restore();
    }
}`,
    'collisions.js': `class Collisions {
    static findCollision(bodyA, bodyB) {
        if (bodyA.type === "Circle" && bodyB.type === "Circle") {
            return Collisions.circleVsCircle(bodyA, bodyB);
        }
        if (bodyA.type === "Polygon" && bodyB.type === "Polygon") {
            return Collisions.polygonVsPolygon(bodyA, bodyB);
        }
        if (bodyA.type === "Circle" && bodyB.type === "Polygon") {
            return Collisions.circleVsPolygon(bodyA, bodyB);
        }
        if (bodyA.type === "Polygon" && bodyB.type === "Circle") {
            const m = Collisions.circleVsPolygon(bodyB, bodyA);
            if (m) {
                m.normal.mult(-1);
                [m.bodyA, m.bodyB] = [m.bodyB, m.bodyA];
            }
            return m;
        }
        return null;
    }

    static circleVsCircle(a, b) {
        const diff = Vector.sub(b.pos, a.pos);
        const dist = diff.mag();
        const rSum = a.radius + b.radius;
        if (dist >= rSum) return null;
        const normal = dist > 0 ? diff.copy().div(dist) : new Vector(1, 0);
        const pen = rSum - dist;
        const contact = a.pos.copy().add(normal.copy().mult(a.radius - pen / 2));
        return new Manifold(a, b, normal, pen, [contact]);
    }

    static polygonVsPolygon(a, b) {
        const vertsA = a.getWorldVertices();
        const vertsB = b.getWorldVertices();
        const resA = Collisions.findMinSeparation(vertsA, vertsB);
        if (resA.separation > 0) return null;
        const resB = Collisions.findMinSeparation(vertsB, vertsA);
        if (resB.separation > 0) return null;

        let ref, inc, refVerts, incVerts, flip;
        if (resA.separation > resB.separation) {
            ref = resA; refVerts = vertsA; incVerts = vertsB; flip = false;
        } else {
            ref = resB; refVerts = vertsB; incVerts = vertsA; flip = true;
        }

        const i = ref.edgeIndex;
        const refV1 = refVerts[i];
        const refV2 = refVerts[(i + 1) % refVerts.length];
        const refNormal = ref.normal;
        const incEdge = Collisions.findIncidentEdge(incVerts, refNormal);
        let contacts = Collisions.clipEdge(refV1, refV2, refNormal, incEdge);
        let normal = refNormal.copy();
        if (flip) normal.mult(-1);

        if (contacts.length === 0) {
            const refDist = refNormal.dot(refV1);
            let deepest = null, deepestD = 0;
            for (let v of incVerts) {
                const d = v.dot(refNormal) - refDist;
                if (d < deepestD) { deepestD = d; deepest = v; }
            }
            if (deepest) contacts = [deepest.copy()];
            else return null;
        }
        const pen = Math.abs(ref.separation);
        return new Manifold(a, b, normal, pen, contacts);
    }

    static findMinSeparation(vertsA, vertsB) {
        let bestSeparation = -Infinity;
        let bestEdgeIndex = -1;
        let bestNormal = null;

        for (let i = 0; i < vertsA.length; i++) {
            const edgeStart = vertsA[i];
            const edgeEnd = vertsA[(i + 1) % vertsA.length];
            const edgeVector = Vector.sub(edgeEnd, edgeStart);
            const edgeNormal = new Vector(edgeVector.y, -edgeVector.x).normalize();

            let minSeparation = Infinity;
            for (const vertex of vertsB) {
                const projection = Vector.sub(vertex, edgeStart).dot(edgeNormal);
                if (projection < minSeparation) minSeparation = projection;
            }

            if (minSeparation > bestSeparation) {
                bestSeparation = minSeparation;
                bestNormal = edgeNormal;
                bestEdgeIndex = i;
            }
        }
        return { separation: bestSeparation, normal: bestNormal, edgeIndex: bestEdgeIndex };
    }

    static findIncidentEdge(verts, refNormal) {
        let minDot = Infinity;
        let index = 0;
        for (let i = 0; i < verts.length; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % verts.length];
            const edge = Vector.sub(v2, v1);
            const normal = new Vector(edge.y, -edge.x).normalize();
            const d = normal.dot(refNormal);
            if (d < minDot) { minDot = d; index = i; }
        }
        return { v1: verts[index], v2: verts[(index + 1) % verts.length] };
    }

    static clipEdge(refV1, refV2, refNormal, incEdge) {
        const tangent = Vector.sub(refV2, refV1).normalize();
        let cp = Collisions.clipSegment([incEdge.v1, incEdge.v2], refV1, tangent);
        if (cp.length < 2) return [];
        cp = Collisions.clipSegment(cp, refV2, tangent.copy().mult(-1));
        if (cp.length < 2) return [];
        const refDist = refNormal.dot(refV1);
        const contacts = [];
        for (let p of cp) {
            const d = p.dot(refNormal) - refDist;
            if (d <= 0) contacts.push(p);
        }
        return contacts;
    }

    static clipSegment(points, planePoint, planeNormal) {
        const out = [];
        const dist = p => Vector.sub(p, planePoint).dot(planeNormal);
        let d0 = dist(points[0]);
        let d1 = dist(points[1]);
        if (d0 >= 0) out.push(points[0]);
        if (d1 >= 0) out.push(points[1]);
        if ((d0 > 0 && d1 < 0) || (d0 < 0 && d1 > 0)) {
            const t = d0 / (d0 - d1);
            out.push(Vector.lerp(points[0], points[1], t));
        }
        return out;
    }

    static circleVsPolygon(circle, polygon) {
        const verts = polygon.getWorldVertices();
        let minOverlap = Infinity;
        let bestAxis = null;
        for (let i = 0; i < verts.length; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % verts.length];
            const edge = Vector.sub(v2, v1);
            const axis = new Vector(edge.y, -edge.x).normalize();
            const pPoly = Collisions.projectVerts(verts, axis);
            const cProj = circle.pos.dot(axis);
            const pCircle = { min: cProj - circle.radius, max: cProj + circle.radius };
            if (pPoly.max < pCircle.min || pCircle.max < pPoly.min) return null;
            const overlap = Math.min(pPoly.max - pCircle.min, pCircle.max - pPoly.min);
            if (overlap < minOverlap) { minOverlap = overlap; bestAxis = axis; }
        }
        let closestVert = verts[0];
        let closestDist = Vector.sub(circle.pos, verts[0]).magSq();
        for (let i = 1; i < verts.length; i++) {
            const d = Vector.sub(circle.pos, verts[i]).magSq();
            if (d < closestDist) { closestDist = d; closestVert = verts[i]; }
        }
        const vertAxis = Vector.sub(closestVert, circle.pos);
        if (vertAxis.magSq() > 0.0001) {
            vertAxis.normalize();
            const pPoly = Collisions.projectVerts(verts, vertAxis);
            const cProj = circle.pos.dot(vertAxis);
            const pCircle = { min: cProj - circle.radius, max: cProj + circle.radius };
            if (pPoly.max < pCircle.min || pCircle.max < pPoly.min) return null;
            const overlap = Math.min(pPoly.max - pCircle.min, pCircle.max - pPoly.min);
            if (overlap < minOverlap) { minOverlap = overlap; bestAxis = vertAxis; }
        }
        if (Vector.sub(polygon.pos, circle.pos).dot(bestAxis) < 0) bestAxis.mult(-1);
        const contact = circle.pos.copy().add(bestAxis.copy().mult(circle.radius));
        return new Manifold(circle, polygon, bestAxis, minOverlap, [contact]);
    }

    static projectVerts(verts, axis) {
        let min = Infinity, max = -Infinity;
        for (let v of verts) {
            const p = v.dot(axis);
            if (p < min) min = p;
            if (p > max) max = p;
        }
        return { min, max };
    }
}`,
    'main.js': `
const screen = new Screen(window.innerWidth, window.innerHeight);
const ctx = screen.getContext();
const width = screen.width;
const height = screen.height;

const bodies = [];

// -- Bodies Setup --

// PLAYER Object (Controlled with Arrow Keys / WASD)
// Using a Triangle for the player to easily see rotation
const player = new Polygon(width * 0.5, height * 0.5, [
    new Vector(0, -40), new Vector(35, 30), new Vector(-35, 30)
]);
player.mass = 5;
player.invMass = 1/5;
player.friction = 0.5; 
bodies.push(player);

// STATIC Obstacles (Mass = 0)
const box1 = new Polygon(width * 0.2, height * 0.4, [
    new Vector(-40, -40), new Vector(40, -40),
    new Vector(40, 40), new Vector(-40, 40)
], 0); // 0 Mass = Static
box1.setStatic(); 
bodies.push(box1);

const box2 = new Polygon(width * 0.8, height * 0.6, [
    new Vector(-30, -50), new Vector(30, -50),
    new Vector(50, 50), new Vector(-50, 50)
], 0);
box2.setStatic(); 
box2.angle = Math.PI / 4; 
bodies.push(box2);

// Triangle
const tri = new Polygon(width * 0.3, height * 0.7, [
    new Vector(0, -50), new Vector(50, 50), new Vector(-50, 50)
]);
tri.setStatic();
bodies.push(tri);

// Pentagon
const pent = new Polygon(width * 0.7, height * 0.2, [
    new Vector(0, -40), new Vector(38, -12), 
    new Vector(24, 32), new Vector(-24, 32), new Vector(-38, -12)
]);
pent.setStatic();
bodies.push(pent);

// Long Wall
const longWall = new Polygon(width * 0.5, height * 0.85, [
    new Vector(-200, -10), new Vector(200, -10),
    new Vector(200, 10), new Vector(-200, 10)
]);
longWall.setStatic();
longWall.angle = -0.1;
bodies.push(longWall);

// Floor and Walls
const ground = new Polygon(width * 0.5, height - 20, [
    new Vector(-width/2, -20), new Vector(width/2, -20),
    new Vector(width/2, 20), new Vector(-width/2, 20)
]);
ground.setStatic();
bodies.push(ground);

const wall = new Polygon(100, height/2, [
    new Vector(-20, -height/2), new Vector(20, -height/2),
    new Vector(20, height/2), new Vector(-20, height/2)
]);
wall.setStatic();
bodies.push(wall);


// Circles
for (let i = 0; i < 10; i++) {
    const r = 15 + Math.random() * 20;
    const x = Math.random() * width;
    const y = Math.random() * (height * 0.5);
    const c = new Circle(x, y, r);
    if (i === 0) {
        c.setStatic();
        c.pos.set(width/2, height/2); // Center it for visibility
    } else {
        c.vel.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        c.restitution = 0.5;
    }
    bodies.push(c);
}


// -- Input Handling --
const keys = {};

window.addEventListener('keydown', (e) => {
    // Prevent scrolling with arrows
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});


let lastTime = 0;

function update(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    // Apply Player Input
    // Movement (Direct Position Control)
    const moveSpeed = 200 * (dt || 0.016);
    const rotateSpeed = 3 * (dt || 0.016);

    if (keys['ArrowUp'] || keys['KeyW']) player.pos.y -= moveSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) player.pos.y += moveSpeed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.pos.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) player.pos.x += moveSpeed;
    
    // Rotation (Q/E)
    if (keys['KeyQ']) player.angle -= rotateSpeed;
    if (keys['KeyE']) player.angle += rotateSpeed;

    // Reset dynamics so physics doesn't interfere
    player.vel.set(0, 0);
    player.angVel = 0;


    // 1. Move bodies
    for (const body of bodies) {
        // Simple bounds checking
        if (body.pos.y > height) { body.pos.y = height; body.vel.y *= -0.5; }
        if (body.pos.x < 0) { body.pos.x = 0; body.vel.x *= -0.5; }
        if (body.pos.x > width) { body.pos.x = width; body.vel.x *= -0.5; }
        if (body.pos.y < 0) { body.pos.y = 0; body.vel.y *= -0.5; }

        body.update(dt || 0.016);
    }

    // 2. Detect Collisions
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const manifold = Collisions.findCollision(bodies[i], bodies[j]);
                if (manifold) {
                    // If collision detected, draw it!
                    manifold.draw(ctx);
                }

        }
    }

    // 3. Draw bodies
    for (const body of bodies) {
        body.draw(ctx);
    }

    // Instructions
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.fillText("Use WASD/Arrows to move. Q/E to rotate.", 20, 30);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);
`
};

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.pane');
const scrollPositions = {};

function switchView(viewId) {
    const currentActive = document.querySelector('.pane.active');
    if (currentActive) {
        if (currentActive.id === 'view-code') {
            if (typeof editor !== 'undefined') {
                const info = editor.getScrollInfo();
                scrollPositions['view-code'] = { left: info.left, top: info.top };
            }
        } else if (currentActive.id === 'view-tutorial') {
            const iframe = currentActive.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                try { scrollPositions['view-tutorial'] = iframe.contentWindow.scrollY; } catch (e) { }
            }
        } else {
            scrollPositions[currentActive.id] = currentActive.scrollTop;
        }
    }

    views.forEach(view => {
        if (view.id === viewId) {
            view.classList.add('active');
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
                        try { iframe.contentWindow.scrollTo(0, scrollPositions['view-tutorial'] || 0); } catch (e) { }
                    }
                } else {
                    view.scrollTop = scrollPositions[viewId] || 0;
                }
            }, 10);
        } else {
            view.classList.remove('active');
        }
    });

    navItems.forEach(item => {
        if (item.dataset.target === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (viewId === 'view-preview') {
        updatePreview();
    }
}

const editorContainer = document.getElementById('editor-container');
const previewFrame = document.getElementById('preview-frame');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
const tabBar = document.getElementById('file-tabs');

let files = { ...initialFiles };
let activeFile = 'main.js';

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

editor.on('change', () => {
    files[activeFile] = editor.getValue();
});

function getFileMode(filename) {
    if (filename.endsWith('.html')) return 'htmlmixed';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'javascript';
    return 'text/plain';
}

function renderTabs() {
    tabBar.innerHTML = '';
    const order = ['index.html', 'style.css', 'vector.js', 'body.js', 'circle.js', 'polygon.js', 'manifold.js', 'collisions.js', 'main.js'];
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const styleTag = doc.createElement('style');
    const cssContent = Object.keys(files).filter(f => f.endsWith('.css')).map(f => files[f]).join('\n');
    styleTag.textContent = cssContent;
    doc.head.appendChild(styleTag);

    const jsOrder = ['vector.js', 'body.js', 'circle.js', 'polygon.js', 'manifold.js', 'collisions.js', 'screen.js', 'main.js'];
    const jsFiles = Object.keys(files).filter(f => f.endsWith('.js'));
    const sortedJsFiles = jsOrder.filter(f => jsFiles.includes(f)).concat(jsFiles.filter(f => !jsOrder.includes(f)));

    const scriptTag = doc.createElement('script');
    const combinedScript = sortedJsFiles.map(f => {
        return `// File: ${f}\n${files[f]}`;
    }).join('\n\n');

    scriptTag.textContent = combinedScript;
    doc.body.appendChild(scriptTag);

    const blob = new Blob([doc.documentElement.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    previewFrame.src = url;
}


runBtn.onclick = () => {
    switchView('view-preview');
};

resetBtn.onclick = () => {
    if (confirm('Reset all code to default?')) {
        files = { ...initialFiles };
        switchFile('main.js');
        updatePreview();
    }
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchView(item.dataset.target);
    });
});

renderTabs();
switchFile('main.js');
updatePreview();
switchView('view-tutorial');
