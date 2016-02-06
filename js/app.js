// use semantic variables to make player location simpler and easier to understand
var canvasWidth  = 505;
var canvasHeight = 606;
var numCols      =   5;
var numRows      =   6;
var colWidth     = 101;
var rowHeight    =  83;
var col = ['dummy'];	// dummy values make col and row indexes 1-based
var row = ['dummy'];
for (var x=0; x<numCols; x++) {col.push(x*colWidth);};
for (var y=0; y<numRows; y++) {row.push(y*rowHeight);};

var collides = function(obj1, array2) {
	obj1x = obj1.x + ((colWidth - obj1.width) / 2);
	var arrayLength = array2.length;
	var collision   = 0;
	for (var i=0; i<arrayLength; i++) {
		obj2  = array2[i];
		if (obj1 === obj2) { continue; };
		obj2x = obj2.x + ((colWidth - obj2.width) / 2);
		collision = collision || obj1.y == obj2.y && obj1x < (obj2x+obj2.width) && (obj1x+obj1.width) > obj2x;
	};
	return collision;
};

// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here,
    this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype.width = 96;

Enemy.prototype.randomLocation = function() {
	do {
		this.x = (Math.floor((Math.random() * 1000) + colWidth)) * -1;
		this.y = (Math.floor((Math.random() *    3) + 1)) * rowHeight;
	} while (collides(this, allEnemies));
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
	this.x += dt * 200;
	if (collides(this, [player])) {
		player.x = col[3];
		player.y = row[6];		
	}
	if (this.x > canvasWidth) {
		this.randomLocation();
	}
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(location) {
    // Variables applied to each of our instances go here,
    this.x = location.x;
    this.y = location.y;
    this.sprite = 'images/char-boy.png';
};

Player.prototype.width = 66;

// Update the player's position, required method for game
Player.prototype.update = function(key) {
	if      (key == 'up'    & this.y > row[1]) { this.y -= rowHeight; }
	else if (key == 'down'  & this.y < row[6]) { this.y += rowHeight; }
	else if (key == 'left'  & this.x > col[1]) { this.x -= colWidth; }
	else if (key == 'right' & this.x < col[5]) { this.x += colWidth; }
};

// Draw the player on the screen, required method for game
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i=0; i<10; i++) {
	enemy = new Enemy();
	enemy.randomLocation();
	allEnemies.push(enemy);
};
var player = new Player({'x': col[3], 'y': row[6]});

// Decide what to do when a key is pressed
var handleInput = function(key) {
	if (['up', 'down', 'left', 'right'].indexOf(key) != -1) {
		player.update(key);
	}
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    handleInput(allowedKeys[e.keyCode]);
});


