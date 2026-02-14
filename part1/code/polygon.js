class Polygon extends Body {
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
}
