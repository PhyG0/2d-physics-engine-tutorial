class Circle extends Body {
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
}
