
const initialFiles = {
    'screen.js': `class Screen {
    constructor(width = 1000, height = 1000){
        this.width = width;
        this.height = height;
        this.div = document.createElement("div");
        this.div.style.position = "absolute";
        this.div.style.top = "50%";
        this.div.style.left = "50%";
        this.Main = document.createElement("canvas");
        this.Main.style.width = "100%";
        this.Main.style.height = "100%";
        this.Main.width = width;
        this.Main.height = height;
        this.Main.style.position = "absolute";
        this.div.appendChild(this.Main);
        document.body.appendChild(this.div);

        this._setupResponsive();
        this._Resize();
    }

    _setupResponsive() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this._Resize();
                const event = new CustomEvent('screen-resize', { detail: this.getCanvasDimensions() });
                this.Main.dispatchEvent(event);
            }, 16);
        };
        window.addEventListener('resize', handleResize);
    }

    _Resize(){
        var widthToHeight = this.width / this.height;
        var newWidth = window.innerWidth;
        var newHeight = window.innerHeight;
        var newWidthToHeight = newWidth / newHeight;
        if(newWidthToHeight > widthToHeight) newWidth = newHeight * widthToHeight;
        else newHeight = newWidth / widthToHeight;
        this.div.style.width = newWidth + "px";
        this.div.style.height = newHeight + "px";
        this.div.style.marginTop = (-newHeight / 2) + "px";
        this.div.style.marginLeft = (-newWidth / 2) + "px";
    }

    // Kept for compatibility with main.js
    getContext(type = '2d', options = {}) {
        return this.Main.getContext(type, { alpha: false, desynchronized: true, ...options });
    }

    getCanvasDimensions() {
        return {
            width: this.Main.width, height: this.Main.height,
            displayWidth: this.Main.offsetWidth, displayHeight: this.Main.offsetHeight,
        };
    }
}`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Physics Engine - Part 3</title>
</head>
<body>
    <div id="scene-controls">
        <button id="btn-scene-random" class="scene-btn active">Random Pool</button>
        <button id="btn-scene-balls" class="scene-btn">Ball Pool</button>
        <button id="btn-scene-stack" class="scene-btn">Stack of Boxes</button>
    </div>
</body>
</html>`,
    'style.css': `body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #111;
}

canvas {
    display: block;
    background-color: #fff;
    margin: 0;
    border: none;
}

#scene-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 100;
}

.scene-btn {
    background: rgba(40, 40, 40, 0.8);
    color: #ccc;
    border: 1px solid #444;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
}

.scene-btn:hover {
    background: rgba(60, 60, 60, 0.9);
    color: #fff;
}

.scene-btn.active {
    background: #3b82f6;
    color: #fff;
    border-color: #60a5fa;
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
        
        // -- Draw Contact Points (Slick green dots) --
        ctx.fillStyle = "rgba(0, 255, 136, 0.8)";
        for (let c of this.contacts) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // -- Draw Collision Normal (Slick red arrow) --
        // We find the geometric center (average) of all contact points to draw the arrow from.
        let avg = new Vector(0, 0);
        for (let c of this.contacts) avg.add(c);
        avg.div(this.contacts.length);

        // Draw a 15-pixel long line pointing in the direction of the normal.
        const tip = avg.copy().add(this.normal.copy().mult(15));
        ctx.strokeStyle = "rgba(255, 50, 50, 0.8)";
        ctx.lineWidth = 1.5;
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
    'solver.js': `// ═══════════════════════════════════════════════════════════════
// Solver — Iterative impulse-based collision resolution
// This is the brain of our physics engine's collision response.
// It takes manifolds from collision detection and makes objects
// bounce, slide, and stop realistically.
// ═══════════════════════════════════════════════════════════════

class Solver {

    constructor(iterations = 10) {
        // More iterations = more accurate physics (but slower).
        // 10 is a good balance for most scenes.
        this.iterations = iterations;
        this.manifolds = [];
    }

    // ── Step 1: Detect all collisions this frame ──────────────
    // Uses brute-force O(n²) pair checking.
    // (We'll optimize this with QuadTree in a later part.)
    detectCollisions(bodies) {
        this.manifolds = [];

        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const result = Collisions.findCollision(bodies[i], bodies[j]);
                if (result) {
                    const manifolds = Array.isArray(result) ? result : [result];
                    for (const m of manifolds) {
                        if (m.contacts.length > 0) {
                            // Pre-compute values we'll reuse during solving
                            this.preCompute(m);
                            this.manifolds.push(m);
                        }
                    }
                }
            }
        }
    }

    // ── Step 2: Pre-compute contact data ──────────────────────
    // Before solving, we cache expensive calculations that don't
    // change between solver iterations for each contact.
    preCompute(m) {
        const a = m.bodyA, b = m.bodyB;
        const n = m.normal;

        // Tangent: perpendicular to the normal.
        // Normal handles bouncing, tangent handles friction/sliding.
        const t = new Vector(-n.y, n.x);

        // Combined material properties:
        // Restitution (bounciness): use the MINIMUM — least bouncy surface wins.
        m.e = Math.min(a.restitution, b.restitution);
        // Friction: geometric mean gives a balanced combination.
        m.mu = Math.sqrt(a.friction * b.friction);
        m.tangent = t;

        // For each contact point, pre-compute the "effective mass"
        // along normal and tangent directions.
        m.contactData = [];
        for (let c of m.contacts) {
            // rA / rB: vectors from each body's center to the contact point
            const rA = Vector.sub(c, a.pos);
            const rB = Vector.sub(c, b.pos);

            // Cross products: rA × n and rB × n
            // These capture how much rotational inertia affects the collision
            const rAxN = rA.x * n.y - rA.y * n.x;
            const rBxN = rB.x * n.y - rB.y * n.x;

            // Effective mass along normal direction:
            // Combines linear masses + rotational contribution
            const kN = a.invMass + b.invMass
                + rAxN * rAxN * a.invInertia
                + rBxN * rBxN * b.invInertia;

            // Same for tangent direction (for friction)
            const rAxT = rA.x * t.y - rA.y * t.x;
            const rBxT = rB.x * t.y - rB.y * t.x;
            const kT = a.invMass + b.invMass
                + rAxT * rAxT * a.invInertia
                + rBxT * rBxT * b.invInertia;

            m.contactData.push({
                rA, rB,
                massN: kN > 0 ? 1 / kN : 0,  // Inverse of effective mass (normal)
                massT: kT > 0 ? 1 / kT : 0,  // Inverse of effective mass (tangent)
                jnAcc: 0,  // Accumulated normal impulse (for clamping)
                jtAcc: 0   // Accumulated tangential impulse (for friction clamping)
            });
        }
    }

    // ── Step 3: Iterative impulse solving ─────────────────────
    // Run multiple passes to converge on a stable solution.
    solve() {
        for (let iter = 0; iter < this.iterations; iter++) {
            for (let m of this.manifolds) {
                this.solveManifold(m);
            }
        }
    }

    // ── The Core: Solve one manifold ──────────────────────────
    // This is where the magic happens.
    // For each contact point, we compute and apply impulses
    // in both normal (bounce) and tangent (friction) directions.
    solveManifold(m) {
        const a = m.bodyA, b = m.bodyB;
        const n = m.normal, t = m.tangent;

        for (let cd of m.contactData) {
            const { rA, rB } = cd;

            // ── Calculate relative velocity at contact point ──
            // This accounts for both linear velocity AND angular velocity
            const dvx = (b.vel.x - b.angVel * rB.y) - (a.vel.x - a.angVel * rA.y);
            const dvy = (b.vel.y + b.angVel * rB.x) - (a.vel.y + a.angVel * rA.x);

            // ══════════════════════════════════════════════════
            // NORMAL IMPULSE (Bouncing)
            // ══════════════════════════════════════════════════

            // Project relative velocity onto normal direction
            const vn = dvx * n.x + dvy * n.y;

            // Only apply restitution (bounce) for significant impacts.
            // Tiny velocities get no bounce (prevents jitter).
            const e = (-vn > 1.0) ? m.e : 0;

            // Impulse magnitude: j = -(1 + e) * vn / effectiveMass
            let jn = cd.massN * (-(1 + e) * vn);

            // Accumulated clamping: total impulse must be >= 0
            // (we only push apart, never pull together)
            const jnOld = cd.jnAcc;
            cd.jnAcc = Math.max(jnOld + jn, 0);
            jn = cd.jnAcc - jnOld;

            // Apply the normal impulse to both bodies
            const pnx = n.x * jn, pny = n.y * jn;
            a.vel.x -= pnx * a.invMass;
            a.vel.y -= pny * a.invMass;
            a.angVel -= (rA.x * pny - rA.y * pnx) * a.invInertia;
            b.vel.x += pnx * b.invMass;
            b.vel.y += pny * b.invMass;
            b.angVel += (rB.x * pny - rB.y * pnx) * b.invInertia;

            // ══════════════════════════════════════════════════
            // TANGENTIAL IMPULSE (Friction)
            // ══════════════════════════════════════════════════

            // Recalculate relative velocity (it changed after normal impulse)
            const dvx2 = (b.vel.x - b.angVel * rB.y) - (a.vel.x - a.angVel * rA.y);
            const dvy2 = (b.vel.y + b.angVel * rB.x) - (a.vel.y + a.angVel * rA.x);

            // Project onto tangent direction (the sliding direction)
            const vt = dvx2 * t.x + dvy2 * t.y;
            let jt = cd.massT * (-vt);

            // Coulomb's friction law: friction force <= mu * normal force
            // This prevents friction from being stronger than gravity.
            const maxF = cd.jnAcc * m.mu;
            const jtOld = cd.jtAcc;
            cd.jtAcc = Math.max(-maxF, Math.min(jtOld + jt, maxF));
            jt = cd.jtAcc - jtOld;

            // Apply the friction impulse
            const ptx = t.x * jt, pty = t.y * jt;
            a.vel.x -= ptx * a.invMass;
            a.vel.y -= pty * a.invMass;
            a.angVel -= (rA.x * pty - rA.y * ptx) * a.invInertia;
            b.vel.x += ptx * b.invMass;
            b.vel.y += pty * b.invMass;
            b.angVel += (rB.x * pty - rB.y * ptx) * b.invInertia;
        }
    }

    // ── Step 4: Position Correction ───────────────────────────
    // After solving velocities, objects might still overlap.
    // We directly nudge them apart to prevent sinking.
    correctPositions() {
        const percent = 0.4;  // How much to correct per frame (0-1)
        const slop = 0.01;    // Allow tiny overlap to prevent jitter

        for (let m of this.manifolds) {
            const a = m.bodyA, b = m.bodyB;
            const totalInv = a.invMass + b.invMass;
            if (totalInv === 0) continue; // Both static — skip

            // Only correct if penetration exceeds the slop threshold
            const corr = Math.max(m.penetration - slop, 0) / totalInv * percent;

            // Push each body proportional to its inverse mass
            // (lighter objects move more, heavier objects move less)
            a.pos.x -= m.normal.x * corr * a.invMass;
            a.pos.y -= m.normal.y * corr * a.invMass;
            b.pos.x += m.normal.x * corr * b.invMass;
            b.pos.y += m.normal.y * corr * b.invMass;
        }
    }

    // ── Debug Drawing ─────────────────────────────────────────
    // Draws contact points and normals for all active collisions.
    drawDebug(ctx) {
        for (let m of this.manifolds) {
            m.draw(ctx);
        }
    }
}`,
    'main.js': `
// -- Setup: Create the screen and get the drawing environment --
const screen = new Screen(1600, 900);
const ctx = screen.getContext();
const width = screen.width;
const height = screen.height;

// ═══════════════════════════════════════════════════════════
// PHYSICS ENGINE CONFIGURATION
// ═══════════════════════════════════════════════════════════

// The Solver handles all collision resolution.
// More iterations = more accurate stacking and responses.
const solver = new Solver(10);

// Sub-steps: split each frame into smaller physics steps.
// This makes collisions more stable, especially at high speeds.
const SUB_STEPS = 4;

// Velocity damping: slightly reduce velocity each frame
// to simulate air resistance and prevent infinite bouncing.
const DAMPING = 0.999;

// Gravity: pulls everything downward
const GRAVITY = new Vector(0, 600);

// This array holds all objects in our world.
let bodies = [];

// ═══════════════════════════════════════════════════════════
// HELPER: Create a box polygon from center, width, and height
// ═══════════════════════════════════════════════════════════
function createBox(x, y, w, h, mass = 1) {
    const hw = w / 2, hh = h / 2;
    return new Polygon(x, y, [
        new Vector(-hw, -hh), new Vector(hw, -hh),
        new Vector(hw, hh), new Vector(-hw, hh)
    ], mass);
}

// ═══════════════════════════════════════════════════════════
// SCENE SETUP
// ═══════════════════════════════════════════════════════════

function initBoundaries() {
    // Ground
    const ground = createBox(width / 2, height - 20, width + 100, 40, 0);
    ground.setStatic();
    ground.friction = 0.5;
    bodies.push(ground);

    // Left wall
    const leftWall = createBox(-10, height / 2, 20, height + 100, 0);
    leftWall.setStatic();
    bodies.push(leftWall);

    // Right wall
    const rightWall = createBox(width + 10, height / 2, 20, height + 100, 0);
    rightWall.setStatic();
    bodies.push(rightWall);
}

function initRandomPool() {
    bodies = [];
    initBoundaries();

    // -- Static Obstacle: A tilted platform --
    const platform = createBox(width * 0.35, height * 0.55, 300, 20, 0);
    platform.setStatic();
    platform.angle = -0.2; // Slight tilt
    platform.friction = 0.5;
    bodies.push(platform);

    // -- Static Obstacle: A triangle ramp --
    const ramp = new Polygon(width * 0.75, height * 0.7, [
        new Vector(-80, 40), new Vector(80, -40), new Vector(80, 40)
    ], 0);
    ramp.setStatic();
    ramp.friction = 0.5;
    bodies.push(ramp);

    // -- Dynamic Circles --
    for (let i = 0; i < 24; i++) {
        const r = 25 + Math.random() * 20;
        const x = 150 + Math.random() * (width - 300);
        const y = 50 + Math.random() * (height * 0.3);
        const c = new Circle(x, y, r, 1);
        c.restitution = 0.3 + Math.random() * 0.4;
        c.friction = 0.4;
        bodies.push(c);
    }

    // -- Dynamic Boxes --
    for (let i = 0; i < 18; i++) {
        const size = 50 + Math.random() * 30;
        const x = 200 + Math.random() * (width - 400);
        const y = 100 + Math.random() * (height * 0.2);
        const box = createBox(x, y, size, size, 1);
        box.restitution = 0.1;
        box.friction = 0.3;
        box.angle = Math.random() * Math.PI;
        bodies.push(box);
    }

    // -- A heavier big circle --
    const bigBall = new Circle(width * 0.5, 80, 40, 5);
    bigBall.restitution = 0.5;
    bigBall.friction = 0.3;
    bodies.push(bigBall);
}

function initBallPool() {
    bodies = [];
    initBoundaries();

    // A funnel to push balls to the center
    const leftFunnel = createBox(width * 0.2, height * 0.4, 400, 20, 0);
    leftFunnel.setStatic();
    leftFunnel.angle = 0.3;
    bodies.push(leftFunnel);

    const rightFunnel = createBox(width * 0.8, height * 0.4, 400, 20, 0);
    rightFunnel.setStatic();
    rightFunnel.angle = -0.3;
    bodies.push(rightFunnel);

    // Drop dozens of balls
    for (let i = 0; i < 120; i++) {
        const r = 15 + Math.random() * 15;
        const x = width / 2 - 200 + Math.random() * 400;
        const y = 50 + Math.random() * (height * 0.6) - 300;
        const c = new Circle(x, y, r, 1);
        c.restitution = 0.6; // Bouncy!
        c.friction = 0.2;
        bodies.push(c);
    }
}

function initStackOfBoxes() {
    bodies = [];
    initBoundaries();

    const boxSize = 40;
    const startX = width / 2;
    const startY = height - 50;

    // Build a pyramid stack
    const rows = 8;
    for (let row = 0; row < rows; row++) {
        const boxesInRow = rows - row;
        const offsetX = startX - (boxesInRow * boxSize) / 2 + (boxSize / 2);
        
        for (let col = 0; col < boxesInRow; col++) {
            const x = offsetX + col * boxSize;
            const y = startY - row * boxSize;
            const box = createBox(x, y, boxSize - 2, boxSize - 2, 1);
            box.restitution = 0.05; // Low bounce for stability
            box.friction = 0.8;    // High friction to grip
            bodies.push(box);
        }
    }
    
    // Drop a heavy ball to smash it
    const wreckingBall = new Circle(width * 0.2, height * 0.75, 50, 20);
    wreckingBall.restitution = 0.2;
    wreckingBall.vel.x = 2000; // Throw it hard to the right
    bodies.push(wreckingBall);
}

// ═══════════════════════════════════════════════════════════
// SCENE UI CONTROLS
// ═══════════════════════════════════════════════════════════
const btnRandom = document.getElementById('btn-scene-random');
const btnBalls = document.getElementById('btn-scene-balls');
const btnStack = document.getElementById('btn-scene-stack');

function clearActiveButtons() {
    if(btnRandom) btnRandom.classList.remove('active');
    if(btnBalls) btnBalls.classList.remove('active');
    if(btnStack) btnStack.classList.remove('active');
}

if(btnRandom) {
    btnRandom.onclick = () => { clearActiveButtons(); btnRandom.classList.add('active'); initRandomPool(); };
}
if(btnBalls) {
    btnBalls.onclick = () => { clearActiveButtons(); btnBalls.classList.add('active'); initBallPool(); };
}
if(btnStack) {
    btnStack.onclick = () => { clearActiveButtons(); btnStack.classList.add('active'); initStackOfBoxes(); };
}

// Load default scene
initRandomPool();

// ═══════════════════════════════════════════════════════════
// INPUT: Click/Tap to spawn a new object
// ═══════════════════════════════════════════════════════════
let spawnCount = 0;

function getCanvasPos(clientX, clientY) {
    const rect = screen.Main.getBoundingClientRect();
    const scaleX = screen.width / rect.width;
    const scaleY = screen.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

screen.Main.addEventListener('click', (e) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    spawnCount++;
    
    if (spawnCount % 2 === 0) {
        // Spawn a circle
        const r = 25 + Math.random() * 20;
        const c = new Circle(pos.x, pos.y, r, 1);
        c.restitution = 0.4;
        c.friction = 0.3;
        bodies.push(c);
    } else {
        // Spawn a box
        const size = 40 + Math.random() * 30;
        const box = createBox(pos.x, pos.y, size, size, 1);
        box.restitution = 0.2;
        box.friction = 0.3;
        box.angle = Math.random() * Math.PI;
        bodies.push(box);
    }
});

// Touch support for mobile
screen.Main.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    spawnCount++;
    
    if (spawnCount % 2 === 0) {
        const r = 25 + Math.random() * 20;
        const c = new Circle(pos.x, pos.y, r, 1);
        c.restitution = 0.4;
        bodies.push(c);
    } else {
        const size = 40 + Math.random() * 30;
        const box = createBox(pos.x, pos.y, size, size, 1);
        box.restitution = 0.2;
        box.angle = Math.random() * Math.PI;
        bodies.push(box);
    }
});


let lastTime = 0;

// ═══════════════════════════════════════════════════════════
// MAIN SIMULATION LOOP
// ═══════════════════════════════════════════════════════════
function update(time) {
    // 1. Calculate time delta (dt) in seconds.
    // We cap it at 0.016s (60fps) to prevent physics explosions 
    // if the user switches tabs and the browser pauses the loop.
    const dt = Math.min((time - lastTime) / 1000, 0.016);
    lastTime = time;

    // Clear canvas
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // ── Sub-stepping: divide the frame into smaller steps ──
    const subDt = dt / SUB_STEPS;

    for (let step = 0; step < SUB_STEPS; step++) {

        // 1. Apply gravity to all dynamic bodies
        for (const body of bodies) {
            if (body.invMass === 0) continue; // Skip static
            body.applyForce(Vector.mult(GRAVITY, body.mass));
        }

        // 2. Integrate velocities (forces → velocity changes)
        for (const body of bodies) {
            body.integrateVelocity(subDt);
        }

        // 3. Detect all collisions
        solver.detectCollisions(bodies);

        // 4. Solve collisions (apply impulses — multiple iterations)
        solver.solve();

        // 5. Integrate positions (velocity → position changes)
        for (const body of bodies) {
            body.integratePosition(subDt);
        }

        // 6. Correct any remaining overlap
        solver.correctPositions();

        // 7. Clear forces for next sub-step
        for (const body of bodies) {
            body.clearForces();
        }

        // 8. Apply damping (simulates air resistance)
        for (const body of bodies) {
            if (body.invMass === 0) continue;
            body.vel.mult(DAMPING);
            body.angVel *= DAMPING;
        }
    }

    // ── Remove bodies that fall off screen ──
    for (let i = bodies.length - 1; i >= 0; i--) {
        if (bodies[i].pos.y > height + 200) {
            bodies.splice(i, 1);
        }
    }

    // ═══════════════════════════════════════════════════════
    // DRAWING
    // ═══════════════════════════════════════════════════════

    // Draw all bodies
    for (const body of bodies) {
        body.draw(ctx);
    }

    // Draw collision debug info (contact points & normals)
    solver.drawDebug(ctx);

    // UI
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Click/tap to spawn objects. Bodies: " + bodies.length, 20, 25);
    ctx.fillText("Sub-steps: " + SUB_STEPS + " | Solver iterations: " + solver.iterations, 20, 45);

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
    // Save scroll position for tutorial
    const tutorialFrame = document.querySelector('.tutorial-frame');
    views.forEach(v => {
        if (v.classList.contains('active') && v.id === 'view-tutorial' && tutorialFrame) {
            try {
                scrollPositions['tutorial'] = tutorialFrame.contentWindow.scrollY || 0;
            } catch (e) { }
        }
    });

    views.forEach(v => v.classList.remove('active'));
    navItems.forEach(ni => ni.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    navItems.forEach(ni => {
        if (ni.dataset.target === viewId) ni.classList.add('active');
    });

    // Restore scroll position
    if (viewId === 'view-tutorial' && tutorialFrame) {
        setTimeout(() => {
            try {
                tutorialFrame.contentWindow.scrollTo(0, scrollPositions['tutorial'] || 0);
            } catch (e) { }
        }, 50);
    }

    if (viewId === 'view-code') {
        setTimeout(() => editor.refresh(), 50);
    }
}

const editorContainer = document.getElementById('editor-container');
const previewFrame = document.getElementById('preview-frame');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');

let files = JSON.parse(JSON.stringify(initialFiles));
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
    return 'javascript';
}

function renderTabs() {
    const tabBar = document.getElementById('file-tabs');
    tabBar.innerHTML = '';
    for (const name of Object.keys(files)) {
        const tab = document.createElement('div');
        tab.className = 'tab' + (name === activeFile ? ' active' : '');
        tab.textContent = name;
        tab.onclick = () => switchFile(name);
        tabBar.appendChild(tab);
    }
}

function switchFile(filename) {
    activeFile = filename;
    editor.setValue(files[filename]);
    editor.setOption('mode', getFileMode(filename));
    renderTabs();
}

function updatePreview() {
    const htmlContent = files['index.html'] || '<!DOCTYPE html><html><head></head><body></body></html>';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const styleTag = doc.createElement('style');
    const cssContent = files['style.css'] || '';
    styleTag.textContent = cssContent;
    doc.head.appendChild(styleTag);

    // Gather JS files in the correct dependency order
    const jsOrder = ['vector.js', 'body.js', 'circle.js', 'polygon.js', 'manifold.js', 'collisions.js', 'solver.js', 'screen.js', 'main.js'];

    const scriptTag = doc.createElement('script');
    const combinedScript = jsOrder.filter(f => files[f]).map(f => {
        return "// File: " + f + "\n" + files[f];
    }).join('\n\n');

    scriptTag.textContent = combinedScript;
    doc.body.appendChild(scriptTag);

    const blob = new Blob([doc.documentElement.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    previewFrame.src = url;
}

runBtn.onclick = () => {
    updatePreview();
    switchView('view-preview');
};

resetBtn.onclick = () => {
    if (confirm('Reset all code to initial state?')) {
        files = JSON.parse(JSON.stringify(initialFiles));
        editor.setValue(files[activeFile]);
        renderTabs();
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
