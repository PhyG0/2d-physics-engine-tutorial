
const initialFiles = {
    'screen.js': `class Screen {
    // This class handles the canvas setup and makes it responsive.
    // It ensures our physics simulation looks good on any screen size.
    constructor(width = 1920, height = 1080) {
        this.width = width;
        this.height = height;
        this.aspectRatio = width / height;
        
        // Use a container div to manage layout and full-screen display.
        this.container = document.createElement('div');
        this.container.className = 'screen-container';
        this._initializeContainer();

        this._createFullScreen();

        document.body.appendChild(this.container);

        // Resize the canvas whenever the window dimensions change.
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

    // Prepare global CSS styles for the page.
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
            // Throttle resize events for better performance.
            resizeTimeout = setTimeout(() => this._resize(), 16);
        };
        window.addEventListener('resize', handleResize);
    }

    _resize() {
        const event = new CustomEvent('screen-resize', { detail: this.getCanvasDimensions() });
        this.canvas.dispatchEvent(event);
    }

    // Standard helper to get the 2D drawing context.
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
    // Basic vector class: holds x and y coordinates.
    // Think of it as an arrow pointing from (0,0) to (x,y).
    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
    }

    // Getters and Setters: These allow us to access x and y while adding safety checks.
    get x() { return this._x; }
    set x(value) {
        if (typeof value !== "number") throw new Error("Invalid x: must be a number");
        this._x = value;
    }

    get y() { return this._y; }
    set y(value) {
        if (typeof value !== "number") throw new Error("Invalid y: must be a number");
        this._y = value;
    }

    static isValidVector(vec) {
        return vec instanceof Vector && typeof vec.x === 'number' && typeof vec.y === 'number';
    }

    // -- Methods --

    // Set x and y manually.
    set(x, y) {
        if (x instanceof Vector) { this.x = x.x; this.y = x.y; }
        else { this.x = x; this.y = y; }
        return this;
    }

    // Make a fresh clone of this vector so we don't accidentally change the original.
    copy() { return new Vector(this.x, this.y); }

    // Add another vector or a scalar to this one.
    // Visual: put the tail of 'v' at the head of this one.
    add(v) {
        if (v instanceof Vector) { this.x += v.x; this.y += v.y; }
        else { this.x += v; this.y += v; }
        return this;
    }

    // Subtract another vector from this one.
    // Visual: vector from 'v's head to this vector's head.
    sub(v) {
        if (v instanceof Vector) { this.x -= v.x; this.y -= v.y; }
        else { this.x -= v; this.y -= v; }
        return this;
    }

    // Multiply (scale) the vector.
    // n=2 makes it twice as long. n=0.5 makes it half as long.
    mult(n) {
        if (n instanceof Vector) throw new Error("Vector.mult: separate vector multiplication not supported (use dot product instead by calling .dot())");
        this.x *= n; this.y *= n;
        return this;
    }

    // Divide (shrink) the vector.
    div(n) {
        if (n instanceof Vector) throw new Error("Vector.div: separate vector division not supported");
        if (n === 0) { console.warn("Vector.div: division by zero"); return this; }
        this.x /= n; this.y /= n;
        return this;
    }

    // Magnitude: how long is the arrow?
    mag() { return Math.sqrt(this.magSq()); }
    
    // Magnitude squared. Faster than mag() because no square root.
    // Good for comparing lengths (is A longer than B?).
    magSq() { return this.x * this.x + this.y * this.y; }

    // Dot product: how much do two vectors align?
    // > 0: similar direction
    // 0: perpendicular (90 degrees)
    // < 0: opposite direction
    dot(v) { return this.x * v.x + this.y * v.y; }

    // Distance between two vectors (points).
    dist(v) {
        const v1 = this.copy();
        const v2 = v.copy();
        v1.sub(v2);
        return v1.mag();
    }

    // Normalize: keep direction, but make length = 1.
    // Also called a "unit vector". Essential for direction calculation.
    normalize() {
        const len = this.mag();
        if (len !== 0) this.div(len);
        return this;
    }

    // Cap the length at a maximum value.
    limit(max) {
        const mSq = this.magSq();
        if (mSq > max * max) { this.div(Math.sqrt(mSq)).mult(max); }
        return this;
    }

    // Set the length to a specific value.
    setMag(n) { return this.normalize().mult(n); }
    
    // What angle is this vector pointing at? (in radians)
    heading() { return Math.atan2(this.y, this.x); }

    // Rotate the vector by an angle (in radians).
    rotate(angle) {
        const newHeading = this.heading() + angle;
        const mag = this.mag();
        this.x = Math.cos(newHeading) * mag;
        this.y = Math.sin(newHeading) * mag;
        return this;
    }

    // Linear Interpolation: Move partway towards another vector.
    // amt = 0.5 means halfway there. Great for smooth movement.
    lerp(v, amt) {
        this.x += (v.x - this.x) * amt;
        this.y += (v.y - this.y) * amt;
        return this;
    }

    array() { return [this.x, this.y]; }
    equals(v) { return this.x === v.x && this.y === v.y; }
    toString() { return \`Vector Object : [\${this.x}, \${this.y}]\`; }

    // -- Static Methods --
    // These create NEW vectors instead of changing existing ones.

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
    
    // Create a vector from an angle. 
    // 0 is right, PI/2 is down, PI is left.
    static fromAngle(angle, length = 1) { return new Vector(length * Math.cos(angle), length * Math.sin(angle)); }
    
    // Create a random unit vector.
    static random2D() { return Vector.fromAngle(Math.random() * Math.PI * 2); }
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

        this.restitution = 0.2; // Bounciness (0 = no bounce, 1 = super bouncy)
        this.friction = 0.4;    // Roughness (0 = ice, 1 = sandpaper)
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

    // Apply a linear force to the body's center of mass.
    applyForce(force) {
        this.force.add(force);
    }

    // Apply a force at a specific point on the body, which might create torque (spin).
    applyForceAtPoint(force, point) {
        this.force.add(force);
        // Torque = cross product of radius vector and force
        const r = Vector.sub(point, this.pos);
        this.torque += r.x * force.y - r.y * force.x;
    }

    // Update speed based on current forces (acceleration).
    integrateVelocity(dt) {
        if (this.invMass === 0) return; // Don't move if static

        // velocity += force * (1/mass) * time
        this.vel.add(new Vector(this.force.x * this.invMass * dt, this.force.y * this.invMass * dt));
        this.angVel += this.torque * this.invInertia * dt;
    }

    // Update position based on current velocity.
    integratePosition(dt) {
        if (this.invMass === 0) return;

        // position += velocity * time
        this.pos.add(Vector.mult(this.vel, dt));
        this.angle += this.angVel * dt;
    }

    // Reset forces for the next frame.
    clearForces() {
        this.force.set(0, 0);
        this.torque = 0;
    }

    // Run the standard physics update.
    update(dt) {
        if (this.invMass === 0) return;
        this.integrateVelocity(dt);
        this.integratePosition(dt);
        this.clearForces();
    }
}`,
    'circle.js': `class Circle extends Body {
    // A circle is a basic shape defined by a center point and a radius.
    // We extend 'Body' so it inherits physics properties like velocity and mass.
    constructor(x, y, radius, mass = 1, material = {}) {
        // Inertia (resistance to rotation) for a solid disk.
        // Formula: 1/2 * mass * radius^2
        const inertia = 0.5 * mass * radius * radius;
        super(x, y, mass, inertia);
        
        this.radius = radius;
        this.type = "Circle";

        // Material properties affect how the circle reacts to impacts.
        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;
    }

    // Draw the circle on the canvas.
    draw(ctx) {
        ctx.save();
        
        // Move to the position and rotate according to the body's angle.
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        // ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);

        // Styling: Hollow look with a semi-transparent fill and light stroke.
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw a line from the center to the edge so we can visually track rotation.
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();

        ctx.restore();
    }
}`,
    'polygon.js': `class Polygon extends Body {
    // A polygon is a shape defined by a collection of points (vertices).
    constructor(x, y, vertices, mass = 1, material = {}) {
        // Calculate the bounding box to estimate inertia (resistance to spin).
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        const width = maxX - minX;
        const height = maxY - minY;
        // Approximation for a box's inertia.
        const inertia = (1 / 12) * mass * (width * width + height * height);

        super(x, y, mass, inertia);
        
        this.vertices = vertices; // Corners relative to the center (0,0)
        this.type = "Polygon";

        if (material.restitution !== undefined) this.restitution = material.restitution;
        if (material.friction !== undefined) this.friction = material.friction;
    }

    // Convert local vertices (relative to center) to world-space coordinates.
    getWorldVertices() {
        const worldVertices = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i].copy();
            v.rotate(this.angle); // Apply rotation first
            v.add(this.pos);      // Then move to the current position
            worldVertices.push(v);
        }
        return worldVertices;
    }

    // Draw the polygon paths onto the canvas.
    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        if (this.vertices.length > 0) {
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            // Connect each vertex to draw the polygon outline.
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
        }

        // Styling: Semi-transparent fill with a light gray outline.
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}`,
    'manifold.js': `class Manifold {
    // A Manifold is a container for all relevant data about a single collision.
    // It's like a "collision report" the solver uses to push things apart.
    constructor(bodyA, bodyB, normal, penetration, contacts) {
        this.bodyA = bodyA;           // First body in the collision
        this.bodyB = bodyB;           // Second body in the collision
        this.normal = normal;         // Direction to push A to separate it from B
        this.penetration = penetration; // How far the objects are overlapping
        this.contacts = contacts || []; // Array of contact point vectors
    }

    // Helper method to draw the collision info for debugging.
    draw(ctx) {
        if (this.contacts.length === 0) return;

        ctx.save();
        
        // -- Draw Contact Points (Green Circles) --
        ctx.fillStyle = "#00ff88";
        ctx.strokeStyle = "#004422";
        ctx.lineWidth = 1;
        for (let c of this.contacts) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // -- Draw Collision Normal (Red Arrow) --
        // We find the geometric center (average) of all contact points to draw the arrow from.
        let avg = new Vector(0, 0);
        for (let c of this.contacts) avg.add(c);
        avg.div(this.contacts.length);

        // Draw a 30-pixel long line pointing in the direction of the normal.
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
    // This is the core engine of our collision system. 
    // It decides which math algorithm to use based on the shapes involved.
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
            // Trick: We can reuse circleVsPolygon by swapping the bodies.
            // But we must flip the normal direction at the end so it's consistent.
            const m = Collisions.circleVsPolygon(bodyB, bodyA);
            if (m) {
                m.normal.mult(-1);
                [m.bodyA, m.bodyB] = [m.bodyB, m.bodyA];
            }
            return m;
        }
        return null;
    }

    // -- Circle vs Circle --
    // Two circles collide if the distance between their centers is less than the sum of their radii.
    static circleVsCircle(a, b) {
        const diff = Vector.sub(b.pos, a.pos);
        const dist = diff.mag();
        const rSum = a.radius + b.radius;

        if (dist >= rSum) return null; // No overlap

        // Normal points from A to B. If they are exactly on each other, default to (1,0).
        const normal = dist > 0 ? diff.copy().div(dist) : new Vector(1, 0);
        const pen = rSum - dist; // How much they overlap
        
        // The contact point is roughly midway between the two overlapping surfaces.
        const contact = a.pos.copy().add(normal.copy().mult(a.radius - pen / 2));
        return new Manifold(a, b, normal, pen, [contact]);
    }

    // -- Polygon vs Polygon --
    // This uses the Separating Axis Theorem (SAT) and Edge Clipping.
    static polygonVsPolygon(a, b) {
        const vertsA = a.getWorldVertices();
        const vertsB = b.getWorldVertices();

        // 1. Check if there is any separating axis between the two shapes.
        const resA = Collisions.findMinSeparation(vertsA, vertsB);
        if (resA.separation > 0) return null; // Found a gap! No collision.

        const resB = Collisions.findMinSeparation(vertsB, vertsA);
        if (resB.separation > 0) return null; // Found a gap! No collision.

        // 2. Determine which polygon has the "Reference Edge" (the one providing the collision normal).
        // The edge with the LEAST penetration (closest to zero) is our best axis.
        let ref, refVerts, incVerts, flip;
        if (resA.separation > resB.separation) {
            ref = resA; refVerts = vertsA; incVerts = vertsB; flip = false;
        } else {
            ref = resB; refVerts = vertsB; incVerts = vertsA; flip = true;
        }

        const i = ref.edgeIndex;
        const refV1 = refVerts[i];
        const refV2 = refVerts[(i + 1) % refVerts.length];
        const refNormal = ref.normal;

        // 3. Find the "Incident Edge" on the other polygon (the edge most facing our reference normal).
        const incEdge = Collisions.findIncidentEdge(incVerts, refNormal);

        // 4. Clip the incident edge against the reference edge planes to find contact points.
        let contacts = Collisions.clipEdge(refV1, refV2, refNormal, incEdge);
        
        // Ensure the normal always points from B toward A.
        let normal = refNormal.copy();
        if (flip) normal.mult(-1);

        // Rare fallback: If clipping failed (due to rounding errors), use the deepest vertex as a backup.
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

    // SAT Helper: Projects one polygon onto the normal axes of the other.
    static findMinSeparation(vertsA, vertsB) {
        let bestSeparation = -Infinity;
        let bestEdgeIndex = -1;
        let bestNormal = null;

        for (let i = 0; i < vertsA.length; i++) {
            const edgeStart = vertsA[i];
            const edgeEnd = vertsA[(i + 1) % vertsA.length];
            
            // Get the outward normal of the current edge.
            const edgeVector = Vector.sub(edgeEnd, edgeStart);
            const edgeNormal = new Vector(edgeVector.y, -edgeVector.x).normalize();

            // Find the vertex on the other polygon which is "deepest" along this normal.
            let minSeparation = Infinity;
            for (const vertex of vertsB) {
                const projection = Vector.sub(vertex, edgeStart).dot(edgeNormal);
                if (projection < minSeparation) minSeparation = projection;
            }

            // Keep track of the axis with the highest minSeparation (shortest path out).
            if (minSeparation > bestSeparation) {
                bestSeparation = minSeparation;
                bestNormal = edgeNormal;
                bestEdgeIndex = i;
            }
        }
        return { separation: bestSeparation, normal: bestNormal, edgeIndex: bestEdgeIndex };
    }

    // Clipping Helper 1: Find the edge on 'verts' that is most anti-parallel to 'refNormal'.
    static findIncidentEdge(verts, refNormal) {
        let minDot = Infinity;
        let index = 0;
        for (let i = 0; i < verts.length; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % verts.length];
            const edge = Vector.sub(v2, v1);
            const normal = new Vector(edge.y, -edge.x).normalize();
            
            // The dot product tells us how much two vectors align.
            const d = normal.dot(refNormal);
            if (d < minDot) { minDot = d; index = i; }
        }
        return { v1: verts[index], v2: verts[(index + 1) % verts.length] };
    }

    // Clipping Helper 2: Trims an edge against the reference edge side-planes.
    static clipEdge(refV1, refV2, refNormal, incEdge) {
        const tangent = Vector.sub(refV2, refV1).normalize();
        
        // Pass 1: Clip against the "left" side-plane.
        let cp = Collisions.clipSegment([incEdge.v1, incEdge.v2], refV1, tangent);
        if (cp.length < 2) return [];

        // Pass 2: Clip against the "right" side-plane.
        cp = Collisions.clipSegment(cp, refV2, tangent.copy().mult(-1));
        if (cp.length < 2) return [];

        // Pass 3: Only keep points effectively behind the reference edge.
        const refDist = refNormal.dot(refV1);
        const contacts = [];
        for (let p of cp) {
            const d = p.dot(refNormal) - refDist;
            if (d <= 0) contacts.push(p);
        }
        return contacts;
    }

    // Clipping Helper 3: Does a single line-plane clip.
    static clipSegment(points, planePoint, planeNormal) {
        const out = [];
        const dist = p => Vector.sub(p, planePoint).dot(planeNormal);
        let d0 = dist(points[0]);
        let d1 = dist(points[1]);

        if (d0 >= 0) out.push(points[0]);
        if (d1 >= 0) out.push(points[1]);

        // If the segment crosses the plane, calculate the exact crossing point.
        if ((d0 > 0 && d1 < 0) || (d0 < 0 && d1 > 0)) {
            const t = d0 / (d0 - d1);
            out.push(Vector.lerp(points[0], points[1], t));
        }
        return out;
    }

    // -- Circle vs Polygon --
    // A hybrid approach: checks edge normals plus a special axis to handle corners.
    static circleVsPolygon(circle, polygon) {
        const verts = polygon.getWorldVertices();
        let minOverlap = Infinity;
        let bestAxis = null;

        // Part 1: Test all polygon edge normals.
        for (let i = 0; i < verts.length; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % verts.length];
            const edge = Vector.sub(v2, v1);
            const axis = new Vector(edge.y, -edge.x).normalize();

            const pPoly = Collisions.projectVerts(verts, axis);
            const cProj = circle.pos.dot(axis);
            const pCircle = { min: cProj - circle.radius, max: cProj + circle.radius };

            if (pPoly.max < pCircle.min || pCircle.max < pPoly.min) return null; // Gap!

            const overlap = Math.min(pPoly.max - pCircle.min, pCircle.max - pPoly.min);
            if (overlap < minOverlap) { minOverlap = overlap; bestAxis = axis; }
        }

        // Part 2: Handle Corner Cases (The Closest-Vertex Axis).
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

        // Part 3: Normalize direction and contact point.
        if (Vector.sub(polygon.pos, circle.pos).dot(bestAxis) < 0) bestAxis.mult(-1);
        const contact = circle.pos.copy().add(bestAxis.copy().mult(circle.radius));
        return new Manifold(circle, polygon, bestAxis, minOverlap, [contact]);
    }

    // Helper: Find the min/max shadow of vertices along a single axis.
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
// -- Setup: Create the screen and get the drawing environment --
const screen = new Screen(window.innerWidth, window.innerHeight);
const ctx = screen.getContext();
const width = screen.width;
const height = screen.height;

// This array will hold all the objects in our world.
const bodies = [];

// -- Scene Setup: Create and configure all physical objects --

// 1. PLAYER Object (Controlled with Arrow Keys / WASD)
// We use a Triangle so it's easy to see which way it's facing.
const player = new Polygon(width * 0.5, height * 0.5, [
    new Vector(0, -40), new Vector(35, 30), new Vector(-35, 30)
]);
player.mass = 5;
player.invMass = 1/5;
player.friction = 0.5; 
bodies.push(player);

// 2. STATIC Obstacles (Objects that don't move)
// A static object has mass = 0 (infinite mass).
const box1 = new Polygon(width * 0.2, height * 0.4, [
    new Vector(-40, -40), new Vector(40, -40),
    new Vector(40, 40), new Vector(-40, 40)
], 0);
box1.setStatic(); 
bodies.push(box1);

const box2 = new Polygon(width * 0.8, height * 0.6, [
    new Vector(-30, -50), new Vector(30, -50),
    new Vector(50, 50), new Vector(-50, 50)
], 0);
box2.setStatic(); 
box2.angle = Math.PI / 4; // Tilt the box by 45 degrees
bodies.push(box2);

const tri = new Polygon(width * 0.3, height * 0.7, [
    new Vector(0, -50), new Vector(50, 50), new Vector(-50, 50)
]);
tri.setStatic();
bodies.push(tri);

const pent = new Polygon(width * 0.7, height * 0.2, [
    new Vector(0, -40), new Vector(38, -12), 
    new Vector(24, 32), new Vector(-24, 32), new Vector(-38, -12)
]);
pent.setStatic();
bodies.push(pent);

// 3. WORLD BOUNDARIES (Floor and Walls)
const longWall = new Polygon(width * 0.5, height * 0.85, [
    new Vector(-200, -10), new Vector(200, -10),
    new Vector(200, 10), new Vector(-200, 10)
]);
longWall.setStatic();
longWall.angle = -0.1;
bodies.push(longWall);

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


// 4. DYNAMIC Circles (Random bouncing objects)
for (let i = 0; i < 10; i++) {
    const r = 15 + Math.random() * 20;
    const x = Math.random() * width;
    const y = Math.random() * (height * 0.5);
    const c = new Circle(x, y, r);
    if (i === 0) {
        c.setStatic();
        c.pos.set(width/2, height/2); // One static circle in the center
    } else {
        // Give the circles a random starting speed.
        c.vel.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        c.restitution = 0.5;
    }
    bodies.push(c);
}


// -- Input Handling: Listen for keyboard state --
const keys = {};

window.addEventListener('keydown', (e) => {
    // Prevent Arrow keys from scrolling the browser window.
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});


let lastTime = 0;

// -- Main Game Loop: Runs every frame (~60 times per second) --
function update(time) {
    // Delta time (dt) is the number of seconds since the last frame.
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Clear the canvas to prepare for new drawings.
    ctx.clearRect(0, 0, width, height);

    // -- Handle Player Movement --
    const moveSpeed = 200 * (dt || 0.016);
    const rotateSpeed = 3 * (dt || 0.016);

    if (keys['ArrowUp'] || keys['KeyW']) player.pos.y -= moveSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) player.pos.y += moveSpeed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.pos.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) player.pos.x += moveSpeed;
    
    // Q/E to rotate the player triangle
    if (keys['KeyQ']) player.angle -= rotateSpeed;
    if (keys['KeyE']) player.angle += rotateSpeed;

    // We manually control the player, so we reset its velocity to avoid interference.
    player.vel.set(0, 0);
    player.angVel = 0;


    // 1. PHASE 1: INTEGRATION (Move bodies according to velocity)
    for (const body of bodies) {
        // Keep bodies within the screen boundaries (simple bounces).
        if (body.pos.y > height) { body.pos.y = height; body.vel.y *= -0.5; }
        if (body.pos.x < 0) { body.pos.x = 0; body.vel.x *= -0.5; }
        if (body.pos.x > width) { body.pos.x = width; body.vel.x *= -0.5; }
        if (body.pos.y < 0) { body.pos.y = 0; body.vel.y *= -0.5; }

        body.update(dt || 0.016);
    }

    // 2. PHASE 2: NARROW PHASE COLLISION DETECTION
    // Loop through every unique pair of bodies.
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const manifold = Collisions.findCollision(bodies[i], bodies[j]);
                if (manifold) {
                    // Draw the collision data (contact points and normal) for debugging.
                    manifold.draw(ctx);
                }
        }
    }

    // 3. PHASE 3: DRAWING
    for (const body of bodies) {
        body.draw(ctx);
    }

    // Draw UI Instructions
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.fillText("Use WASD/Arrows to move. Q/E to rotate.", 20, 30);

    // Call this function again on the next animation frame.
    requestAnimationFrame(update);
}

// Start the simulation!
requestAnimationFrame(update);
`,
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
