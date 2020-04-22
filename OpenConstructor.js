// OpenConstructor.js
// Open source HTML5 remake of Sodaplay's classic Sodaconstructor by Ed Burton.

// 2D vector class
class Vect {
    constructor (x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.rad = 5;
    }
    // replace values of vector with given vector
    equ (A) {
        this.x = A.x;
        this.y = A.y;
    }
    // resets vector to zero
    clr () {
        this.x = 0;
        this.y = 0;
    }
    // mutating sum
    sumTo (A) {
        this.x += A.x;
        this.y += A.y;
    }
    // mutating subtraction
    subTo (A) {
        this.x -= A.x;
        this.y -= A.y;
    }
    // mutating scale
    mulTo (A) {
        this.x *= A.x;
        this.y *= A.y;
    }
    // mutating division
    divTo (A) {
        this.x /= A.x;
        this.y /= A.y;
    }
    // multiplies vector by a scalar value
    mul (s) {
        return new Vect(this.x * s, this.y * s);
    }
    // divides vector by a scalar value
    div (s) {
        return s !== 0 ? new Vect(this.x / s, this.y / s) : new Vect();
    }
    // sums vector with another vector
    sum (A) {
        return new Vect(this.x + A.x, this.y + A.y);
    }
    // subtracts given vector from this vector
    sub (A) {
        return new Vect(this.x - A.x, this.y - A.y);
    }
    // find square of magnitude
    magSq () {
        return this.x * this.x + this.y * this.y;
    }
    // find magnitude
    mag () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    // find unit vector of current
    unit () {
        return this.mag() > 0 ? this.div(this.mag()) : new Vect();
    }
};

class Mass
{
    constructor(pos, vel, rad, isFixed)
    {
        this.pos = new Vect(pos.x, pos.y);
        this.vel = new Vect(vel.x, vel.y);
        this.force = new Vect();
        this.rad = rad;
        this.fix = isFixed || false;
        this.adj = []; // Holds adjacent masses and springs.
    }
    move(f, fric)
    {
        if (!this.fix)
        {
            this.vel.sumTo(this.force.sum(f));
            this.pos.sumTo(this.vel.mul(fric));
        }
    }
    draw(ctx)
    {
        ctx.fillStyle = "black";
        if (!this.fix)
        {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.rad, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        }
        else
        {
            ctx.beginPath();
            ctx.fillRect(this.pos.x - this.rad, this.pos.y - this.rad,
                this.rad * 2, this.rad * 2);
            ctx.closePath();
        }
    }
};

class Spring
{
    constructor(rest)
    {
        this.rest = rest;
        this.width = 1;
    }
    force(posA, posB, k)
    {
        const AB = posA.sub(posB);
        return AB.unit().mul(k * (this.rest - AB.mag()));
    }
    draw(ctx, posA, posB)
    {
        ctx.beginPath();
        ctx.moveTo(posA.x, posA.y);
        ctx.lineTo(posB.x, posB.y);
        ctx.closePath();
        ctx.stroke();
    }
};

class Model
{
    constructor(gravity, friction, stiffness, reflection, surfaceFriction)
    {
        this.g = new Vect(0, gravity);
        this.f = friction; // Value between 0 and 1
        this.k = stiffness;
        this.r = reflection;
        this.sf = surfaceFriction;
        this.m = [];
        this.s = [];
    }
    addMass(mass)
    {
        return this.m.push(mass);
    }
    addSpring(A, B, spr)
    {
        if (A !== B && A < this.m.length && B < this.m.length && A >= 0 && B >= 0)
        {
            this.m[A].adj.push({m: this.m[B], s: spr});
            this.m[B].adj.push({m: this.m[A], s: spr});
        }
    }
    update(bx, by, bw, bh)
    {
        // Calculate spring forces.
        for (let i = 0; i < this.m.length; i++)
        {
            let curM = this.m[i];
            for (let j = 0; j < curM.adj.length; j++)
            {
                const curAdj = curM.adj[j];
                curM.force.sumTo(curAdj.s.force(curM.pos, curAdj.m.pos, this.k));
            }
        }
        for (let i = 0; i < this.m.length; i++)
        {
            const curM = this.m[i];

            curM.move(this.g, this.f);
            curM.force.clr();

            // Top and bottom boundary collisions and surface friction.
            if (curM.pos.y + curM.rad > bh - by)
            {
                curM.pos.y = (bh - by) - curM.rad;
                curM.vel.y *= -this.r;
                curM.vel.x *= this.sf;
            }
            else if (curM.pos.y - curM.rad < by)
            {
                curM.pos.y = by + curM.rad;
                curM.vel.y *= -this.r;
                curM.vel.x *= this.sf;
            }
            // Left and right boundary collisions and surface friction.
            if (curM.pos.x + curM.rad > bw - bx)
            {
                curM.pos.x = (bw - bx) - curM.rad;
                curM.vel.x *= -this.r;
                curM.vel.y *= this.sf;
            }
            else if (curM.pos.x - curM.rad < bx)
            {
                curM.pos.x = bx + curM.rad;
                curM.vel.x *= -this.r;
                curM.vel.y *= this.sf;
            }
        }
    }
    draw(ctx)
    {
        const drawn = [];
        for (let i = 0; i < this.m.length; i++)
        {
            const curM = this.m[i];
            for (let j = 0; j < curM.adj.length ; j++)
            {
                const curAdj = curM.adj[j];
                // Don't allow springs to be drawn twice.
                let k;
                for (k = 0; k < drawn.length; k++)
                {
                    if (curAdj.s === drawn[i]) break;
                }
                if (k === drawn.length)
                {
                    curAdj.s.draw(ctx, curM.pos, curAdj.m.pos);
                    drawn.push(curAdj.s);
                }
            }

            this.m[i].draw(ctx);
        }
    }
};

// Initialize canvas element. 
const canvas = document.getElementById("OCWindow");
const ctx = canvas.getContext("2d");

// Initialize model
const model = new Model(0.1, 1, 0.1, 0.8, 0.2);

// Build model
const origin = {x: canvas.width / 2, y: canvas.height / 2};
model.addMass(new Mass({x: origin.x - 50, y: origin.y - 50}, {x: -5, y: 5}, 5));
model.addMass(new Mass({x: origin.x - 50 + 100, y: origin.y - 50}, {x: -5, y: -5}, 5));
model.addMass(new Mass({x: origin.x - 50 + 100, y: origin.y - 50 + 100}, {x: 5, y: -5}, 5));
model.addMass(new Mass({x: origin.x - 50, y: origin.y - 50 + 100}, {x: 5, y: 5}, 5));
model.addSpring(0, 1, new Spring(100));
model.addSpring(1, 2, new Spring(100));
model.addSpring(2, 3, new Spring(100));
model.addSpring(3, 0, new Spring(100));
model.addSpring(0, 2, new Spring(Math.sqrt(100 * 100 + 100 * 100)));
model.addSpring(1, 3, new Spring(Math.sqrt(100 * 100 + 100 * 100)));


// Animation and simulation.
const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    model.draw(ctx);
    model.update(0, 0, canvas.width, canvas.height);

    window.requestAnimationFrame(frame);
}

frame();