class Body {
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
}
