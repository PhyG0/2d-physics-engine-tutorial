class Vector {
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
        return `Vector Object : [${this.x}, ${this.y}]`;
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
}
