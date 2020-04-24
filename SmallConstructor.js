// OpenConstructor.js
// Open source HTML5 remake of Sodaplay's classic Sodaconstructor by Ed Burton.

// Initialize canvas element. 
const canvas = document.getElementById("OCWindow");
const ctx = canvas.getContext("2d");


// Initialize model
const model = new Model(0.5, 1, 0.1, 0.75, 0.1);

// Initialize mousing events.
const userState = {
    mousePos: new Vect(),
    highlight: undefined,
    select: undefined,
    drag: undefined,
    drawHighlight: function() {
        if (this.highlight) {
            const x = this.highlight.pos.x;
            const y = this.highlight.pos.y;
            const r = this.highlight.rad;
            ctx.strokeStyle = "grey";
            ctx.beginPath();
            ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }
    },
    drawSelect: function() {
        if (this.select)
        {
            const x = this.select.pos.x;
            const y = this.select.pos.y;
            const r = this.select.rad;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }
    },
    drawStatusLog: function(x, y) {
        ctx.fillText(this.mousePos.log(), x, y);
    }
};
canvas.addEventListener("mousemove", event => {
    const b = canvas.getBoundingClientRect();
    userState.mousePos.set(event.clientX - b.left, event.clientY - b.top);
    userState.highlight = model.locateMass(userState.mousePos, 10);
    if (userState.drag){
        userState.drag.pos.sumTo(new Vect(event.movementX, event.movementY));
        userState.drag.ignore = true;
    }
});
canvas.addEventListener("mousedown", event => {
    userState.select = model.locateMass(userState.mousePos, 10);
    userState.drag = userState.select;
});
canvas.addEventListener("mouseup", event => {
    if (userState.drag) {
        userState.drag.ignore = false;
        userState.drag = undefined;
    }
});

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

    userState.drawStatusLog(20, 20);
    userState.drawHighlight();
    userState.drawSelect();
    model.draw(ctx);
    model.update(0, 0, canvas.width, canvas.height);


    window.requestAnimationFrame(frame);
}

frame();