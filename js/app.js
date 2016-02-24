/* global object to hold variables and functions */
var app = app || {};

/* use semantic constant variables to make code simpler and easier to understand */
app.CANVAS_WIDTH = 505;
app.CANVAS_HEIGHT = 606;
app.CANVAS_CENTER = app.CANVAS_WIDTH / 2;
app.NUM_COLS = 5;
app.NUM_ROWS = 6;
app.COL_WIDTH = 101;
app.ROW_HEIGHT = 83;
app.COL_X = ['dummy']; // use col & row arrays to find canvas x, y values by col, row indexes
app.ROW_Y = ['dummy']; // dummy values make col and row indexes 1-based
for (var x = 0; x < app.NUM_COLS; x++) {
    app.COL_X.push(x * app.COL_WIDTH);
}
for (var y = 0; y < app.NUM_ROWS; y++) {
    app.ROW_Y.push(y * app.ROW_HEIGHT);
}

/**
 * @description Handle keyboard input
 * @param {string} key - the key that was pressed
 */
app.handleInput = function(key) {
    if (['up', 'down', 'left', 'right', 'space'].indexOf(key) != -1) {
        app.player.update(key); // if key in array, update player
    }
};

/**
 * @description Check for collisions between objects
 * @param {Object} obj1 - a single game object
 * @param {Array} array2 - an array of game objects
 * @returns {boolean} true if any collisions, false if no collisions
 */
app.collides = function(obj1, array2) {
    var obj1x = obj1.x + ((app.COL_WIDTH - obj1.width) / 2); // x of object1 left edge
    var arrayLength = array2.length;
    var collision = false;
    for (var i = 0; i < arrayLength; i++) {
        var obj2 = array2[i];
        if (obj1 === obj2) {
            continue; // can't collide with yourself
        }
        var obj2x = obj2.x + ((app.COL_WIDTH - obj2.width) / 2); // x of object2 left edge
        /* use bounding box collision detection */
        collision = collision || obj1.y == obj2.y && obj1x < (obj2x + obj2.width) && (obj1x + obj1.width) > obj2x;
    }
    return collision;
};

/**
 * @description Superclass for Enemy, Gem, and Player constructors
 * @param {string} sprite - filename of element image
 * @param {number} width - width of image in pixels
 */
var GameElement = function(sprite, width) {
    this.sprite = sprite;
    this.width = width;
    this.x = 0;
    this.y = 0;
};

/**
 * @description Draw the game element on the screen
 */
GameElement.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 20);
};

/**
 * @description Represents an enemy bug to be avoided by the player
 * @constructor
 */
var Enemy = function() {
    GameElement.call(this, 'images/enemy-bug.png', 96); // Enemy superclass is GameElement
    this.randomize(); // generate a random left of screen location
    app.allEnemies.push(this); // add this enemy to the allEnemies array
};
Enemy.prototype = Object.create(GameElement.prototype);
Enemy.prototype.constructor = Enemy;

/**
 * @description Generate a left of screen location without overlap
 */
Enemy.prototype.randomize = function() {
    do {
        this.x = (Math.floor((Math.random() * 1000) + app.COL_WIDTH)) * -1; // x = -app.COL_WIDTH to -(999+app.COL_WIDTH)
        this.y = (Math.floor((Math.random() * 3) + 1)) * app.ROW_HEIGHT; // y = row 1 to 3
    } while (app.collides(this, app.allEnemies)); // repeat if enemies overlap
};

/**
 * @description Update enemy position, check for collision, relocate if off right of screen
 * @param {number} dt - a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    /* enemies move left to right
     * movements are multiplied by dt to ensure consistent game speed across all computers
     */
    this.x += dt * (((this.y / app.ROW_HEIGHT) * 100));
    if (app.collides(this, [app.player])) {
        app.player.score = Math.max(0, app.player.score - 100); // if enemy colides with player, -100 points    
        app.player.startLocation(); // place player at starting location
    }
    if (this.x > app.CANVAS_WIDTH) {
        this.randomize(); // if enemy off right of screen, generate a random left of screen location
    }
};

/**
 * @description Represents a gem to be captured by the player for bonus points
 * @constructor
 */
var Gem = function() {
    GameElement.call(this, 'images/Gem Blue.png', 96); // Gem superclass is GameElement
    this.visible = 0; // initially hidden
    this.randomize(); // generate a random location, display delay, and display duration
};
Gem.prototype = Object.create(GameElement.prototype);
Gem.prototype.constructor = Gem;

/**
 * @description Generate a random location, delay, and duration
 */
Gem.prototype.randomize = function() {
    this.x = app.COL_X[Math.floor((Math.random() * 5) + 1)]; // col 1 to 5
    this.y = app.ROW_Y[Math.floor((Math.random() * 3) + 2)]; // row 2 to 4
    this.displayDelay = Math.floor((Math.random() * 6) + 3); // delay for 3 to 8 seconds
    this.displayDuration = Math.floor((Math.random() * 3) + 3); // display for 3 to 5 seconds
};

/**
 * @description Update gem display, check for collision, determine whether to hide or display 
 * @param {number} dt - a time delta between ticks
 */
Gem.prototype.update = function(dt) {
    if (this.visible && app.collides(this, [app.player])) { // if visible gem collides with player
        app.player.score += 200; // +200 points
        this.visible = 0; // hide gem
        this.randomize(); // generate a random location, delay, and duration
    } else if (this.visible) { // if gem is visible
        this.displayDuration -= dt; // decrement display duration
        if (this.displayDuration <= 0) { // if display duration <= 0
            this.visible = 0; // hide gem
            this.randomize(); // generate a random location, delay, and duration
        }
    } else if (!this.visible) { // if gem is not visible
        this.displayDelay -= dt; // decrement display delay
        if (this.displayDelay <= 0) { // if display delay <= 0
            this.visible = 1; // display gem
        }
    }
};

/**
 * @description Draw the gem on the screen if visible
 */
Gem.prototype.render = function() {
    if (this.visible) {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 20);
    }
};

/**
 * @description Represents the game player
 * @constructor
 */
var Player = function() {
    GameElement.call(this, 'images/char-boy.png', 66); // Player superclass is GameElement
    this.startLocation(); // place player at starting location
    this.lastTime = 0; // time of last player update (ms)
    this.remainingTime = 0; // time remaining in player game (ms)
    this.score = 0; // player score
    this.pause = 1; // player paused
    this.showInstructions = 1; // show instructions before 1st game
};
Player.prototype = Object.create(GameElement.prototype);
Player.prototype.constructor = Player;

/**
 * @description Place player at starting location
 */
Player.prototype.startLocation = function() {
    this.x = app.COL_X[3];
    this.y = app.ROW_Y[6];
};

/**
 * @description Update player position, show instructions when paused, update game situation 
 * @param {string} key - the key that was pressed, or 'dt' for timed update
 */
Player.prototype.update = function(key) {
    if (this.pause && key == 'space') {
        /* new game */
        this.showInstructions = 0; // only show instructions once
        ctx.globalAlpha = 1; // un-dim game
        ctx.fillRect(0, 0, app.CANVAS_WIDTH, app.CANVAS_HEIGHT);
        if (app.allEnemies.length > 5) {
            app.allEnemies.splice(5, app.allEnemies.length - 5); // reduce enemies to 5
        }
        this.lastTime = Date.now(); // time of last player update (ms)
        this.remainingTime = 60000; // time remaining (ms)
        this.score = 0; // score 0
        this.pause = 0; // unpause game
    } else if (this.pause && key !== 'space') {
        /* ignore all but spacebar if paused */
    } else if (key == 'up' && this.y > app.ROW_Y[1]) {
        /* move up and check to see if across the road */
        this.y -= app.ROW_HEIGHT; // decrement y
        if (this.y == app.ROW_Y[1]) {
            /* accross the road */
            this.score += 500; // +500 points
            for (var i = 0; i < 2; i++) {
                app.enemy = new Enemy(); // add 2 enemies
            }
            this.startLocation(); // place player at starting location
        }
    } else if (key == 'down' && this.y < app.ROW_Y[6]) {
        this.y += app.ROW_HEIGHT; // move down if not in last row
    } else if (key == 'left' && this.x > app.COL_X[1]) {
        this.x -= app.COL_WIDTH; // move left if not in first column
    } else if (key == 'right' && this.x < app.COL_X[5]) {
        this.x += app.COL_WIDTH; // move right if not in last column
    }

    /* if game is not paused, decrement remaining time and check to see if game is over */
    if (!this.pause) {
        /* game not paused */
        var currentTime = Date.now(); // current time
        var elapsedTime = currentTime - this.lastTime; // time since last update (ms)
        this.remainingTime -= elapsedTime; // decrement remaining time
        this.lastTime = currentTime; // remember current time
        if (this.remainingTime <= 0) {
            /* game over */
            this.pause = 1; // pause game
            this.startLocation(); // place player at starting location
        }
    }
};

/**
 * @description Draw player, score, remaining time, and instructions (if game paused) on the screen
 */
Player.prototype.render = function() {
    /* display player, score, and time */
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 10);
    ctx.clearRect(0, 0, app.CANVAS_WIDTH, 50);
    ctx.font = '30px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + ('0000' + this.score.toString()).slice(-4), 60, 40);
    var displayRemaining = Math.ceil(this.remainingTime / 1000);
    ctx.fillText('TIME: ' + ('00' + displayRemaining.toString()).slice(-2), 300, 40);

    if (this.pause) {
        /* game paused */
        ctx.globalAlpha = 0.5; // dim screen
        ctx.fillRect(0, 0, app.CANVAS_WIDTH, app.CANVAS_HEIGHT);
        ctx.font = '30px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        if (this.showInstructions) {
            /* show all instructions for 1st game */
            ctx.fillText('Use the arrow keys to move', app.CANVAS_CENTER, 160);
            ctx.fillText('your character across the road', app.CANVAS_CENTER, 195);
            ctx.fillText('to the water. (+500 pts)', app.CANVAS_CENTER, 230);
            ctx.fillText('Avoid enemy bugs. (-100 pts)', app.CANVAS_CENTER, 280);
            ctx.fillText('Capture blue gems', app.CANVAS_CENTER, 330);
            ctx.fillText('for bonus points. (+200 pts)', app.CANVAS_CENTER, 365);
            ctx.fillText('Press spacebar to start.', app.CANVAS_CENTER, 440);
        } else {
            /* show play again instructions for subsequent games */
            ctx.fillText('Press spacebar to play again.', app.CANVAS_CENTER, 440);
        }
    }
};

/* instantiate enemy, gem, and player objects */
app.allEnemies = []; // enemy objects are contained in array allEnemies
for (var i = 0; i < 5; i++) {
    app.enemy = new Enemy(); // start with 5 enemies
}
app.gem = new Gem();
app.player = new Player();

/* listen for keyboard input */
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    app.handleInput(allowedKeys[e.keyCode]);
});
