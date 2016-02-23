// use semantic constant variables to make code simpler and easier to understand
var CANVAS_WIDTH = 505;
var CANVAS_HEIGHT = 606;
var CANVAS_CENTER = CANVAS_WIDTH / 2;
var NUM_COLS = 5;
var NUM_ROWS = 6;
var COL_WIDTH = 101;
var ROW_HEIGHT = 83;
var COL_X = ['dummy']; // use col & row arrays to find canvas x, y values by col, row indexes
var ROW_Y = ['dummy']; // dummy values make col and row indexes 1-based
for (var x = 0; x < NUM_COLS; x++) {
    COL_X.push(x * COL_WIDTH);
}
for (var y = 0; y < NUM_ROWS; y++) {
    ROW_Y.push(y * ROW_HEIGHT);
}

// check for a collision between a single object and an array of objects
var collides = function(obj1, array2) {
    var obj1x = obj1.x + ((COL_WIDTH - obj1.width) / 2); // x of object1 left edge
    var arrayLength = array2.length;
    var collision = 0;
    for (var i = 0; i < arrayLength; i++) {
        var obj2 = array2[i];
        if (obj1 === obj2) {
            continue;
        } // can't collide with yourself
        var obj2x = obj2.x + ((COL_WIDTH - obj2.width) / 2); // x of object2 left edge
        // use bounding box collision detection
        collision = collision || obj1.y == obj2.y && obj1x < (obj2x + obj2.width) && (obj1x + obj1.width) > obj2x;
    }
    return collision;
};

//------------------------------------------------------------ GameElement Super Class
var GameElement = function(sprite, width) {
    this.sprite = sprite;
    this.width = width;
    this.x = 0;
    this.y = 0;
};

// draw the element on the screen
GameElement.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 20);
};

//------------------------------------------------------------ Enemy Class
var Enemy = function() {
    GameElement.call(this, 'images/enemy-bug.png', 96);
    this.randomize(); // generate a random left of screen location
    allEnemies.push(this); // add this enemy to the allEnemies array
};
Enemy.prototype = Object.create(GameElement.prototype);
Enemy.prototype.constructor = Enemy;

// generate a left of screen location without overlap
Enemy.prototype.randomize = function() {
    do {
        this.x = (Math.floor((Math.random() * 1000) + COL_WIDTH)) * -1; // x = -COL_WIDTH to -(999+COL_WIDTH)
        this.y = (Math.floor((Math.random() * 3) + 1)) * ROW_HEIGHT; // y = row 1 to 3
    } while (collides(this, allEnemies));
};

// update an enemy position
// parameter: dt, a time delta between ticks
// enemies move left to right
Enemy.prototype.update = function(dt) {
    // movements are multiplied by dt to ensure consistent game speed across all computers
    this.x += dt * (((this.y / ROW_HEIGHT) * 100));
    if (collides(this, [player])) { // if enemy collides with player
        player.score = Math.max(0, player.score - 100); //   -100 points    
        player.startLocation(); //   place player at starting location
    }
    if (this.x > CANVAS_WIDTH) { // if enemy moves off right of screen
        this.randomize(); //   generate a random left of screen location
    }
};

//---------------------------------------------------------- Gem Class
var Gem = function() {
    GameElement.call(this, 'images/Gem Blue.png', 96);
    this.visible = 0;
    this.randomize();
};
Gem.prototype = Object.create(GameElement.prototype);
Gem.prototype.constructor = Gem;

// generate a random location, delay, and duration
Gem.prototype.randomize = function() {
    this.x = COL_X[Math.floor((Math.random() * 5) + 1)]; // col 1 to 5
    this.y = ROW_Y[Math.floor((Math.random() * 3) + 2)]; // row 2 to 4
    this.displayDelay = Math.floor((Math.random() * 6) + 3); // delay   for 3 to 8 seconds
    this.displayDuration = Math.floor((Math.random() * 3) + 3); // display for 3 to 5 seconds
};

// update the gem display
// parameter: dt, a time delta between ticks
Gem.prototype.update = function(dt) {
    if (this.visible && collides(this, [player])) { // if visible gem collides with player
        player.score += 200; //   +200 points
        this.visible = 0; //   hide gem
        this.randomize(); //   generate a random location, delay, and duration
    } else if (this.visible) { // if gem is visible
        this.displayDuration -= dt; //   decrement display duration
        if (this.displayDuration <= 0) { //   if display duration <= 0
            this.visible = 0; //     hide gem
            this.randomize(); //     generate a random location, delay, and duration
        }
    } else if (!this.visible) { // if gem is not visible
        this.displayDelay -= dt; //   decrement display delay
        if (this.displayDelay <= 0) { //   if display delay <= 0
            this.visible = 1; //     display gem
        }
    }
};

// draw the gem on the screen
Gem.prototype.render = function() {
    if (this.visible) {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 20);
    }
};

//---------------------------------------------------------- Player Class
var Player = function() {
    GameElement.call(this, 'images/char-boy.png', 66);
    this.startLocation(); // place player at starting location
    this.lastTime = 0; // time of last player update (ms)
    this.remainingTime = 0; // time remaining in player game (ms)
    this.score = 0; // player score
    this.pause = 1; // player pause
    this.showInstructions = 1;
};
Player.prototype = Object.create(GameElement.prototype);
Player.prototype.constructor = Player;

// place player at starting location
Player.prototype.startLocation = function() {
    this.x = COL_X[3];
    this.y = ROW_Y[6];
};

// update the player position and game situation
Player.prototype.update = function(key) {
    if (this.pause && key == 'space') { // new game
        this.showInstructions = 0; // only display instructions once
        ctx.globalAlpha = 1; // un-dim game
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (allEnemies.length > 5) { // reduce enemies to 5
            allEnemies.splice(5, allEnemies.length - 5);
        }
        this.lastTime = Date.now(); // time of last player update (ms)
        this.remainingTime = 60000; // time remaining (ms)
        this.score = 0; // score 0
        this.pause = 0; // unpause
    } else if (this.pause && key !== 'space') { // ignore all but spacebar if paused
    } else if (key == 'up' && this.y > ROW_Y[1]) { // move up
        this.y -= ROW_HEIGHT; // decrement y
        if (this.y == ROW_Y[1]) { // if crossed road
            this.score += 500; //   +500 points
            for (var i = 0; i < 2; i++) { //   add 2 enemies
                var enemy = new Enemy();
            }
            this.startLocation(); // place player at starting location
        }
    } else if (key == 'down' && this.y < ROW_Y[6]) {
        this.y += ROW_HEIGHT;
    } // move down
    else if (key == 'left' && this.x > COL_X[1]) {
        this.x -= COL_WIDTH;
    } // move left
    else if (key == 'right' && this.x < COL_X[5]) {
        this.x += COL_WIDTH;
    } // move right 

    if (!this.pause) {
        var currentTime = Date.now(); // current time
        var elapsedTime = currentTime - this.lastTime; // time since last update (ms)
        this.remainingTime -= elapsedTime; // decrement remaining time
        this.lastTime = currentTime; // remember current time
        if (this.remainingTime <= 0) { // if game over
            this.pause = 1; //   pause
            this.startLocation(); //   place player at starting location
        }
    }
};

// draw the player on the screen
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 10);
    ctx.clearRect(0, 0, CANVAS_WIDTH, 50); // display score & time
    ctx.font = '30px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + ('0000' + player.score.toString()).slice(-4), 60, 40);
    var displayRemaining = Math.ceil(player.remainingTime / 1000);
    ctx.fillText('TIME: ' + ('00' + displayRemaining.toString()).slice(-2), 300, 40);

    if (this.pause) { // if player paused
        ctx.globalAlpha = 0.5; //   dim screen
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.font = '30px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        if (this.showInstructions) { //   show instructions for 1st game
            ctx.fillText('Use the arrow keys to move', CANVAS_CENTER, 160);
            ctx.fillText('your character across the road', CANVAS_CENTER, 195);
            ctx.fillText('to the water. (+500 pts)', CANVAS_CENTER, 230);
            ctx.fillText('Avoid enemy bugs. (-100 pts)', CANVAS_CENTER, 280);
            ctx.fillText('Capture blue gems', CANVAS_CENTER, 330);
            ctx.fillText('for bonus points. (+200 pts)', CANVAS_CENTER, 365);
            ctx.fillText('Press spacebar to start.', CANVAS_CENTER, 440);
        } else { //   show play again instructions
            ctx.fillText('Press spacebar to play again.', CANVAS_CENTER, 440);
        }
    }
};

//----------------------------------------------------------
// instantiate enemy, gem, and player objects
var allEnemies = []; // enemy objects are contained in array allEnemies
for (var i = 0; i < 5; i++) { // start with 5 enemies
    var enemy = new Enemy();
}
var gem = new Gem();
var player = new Player();

// handle keyboard input
var handleInput = function(key) {
    if (['up', 'down', 'left', 'right', 'space'].indexOf(key) != -1) {
        player.update(key);
    }
};

// listen for keyboard input
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    handleInput(allowedKeys[e.keyCode]);
});
