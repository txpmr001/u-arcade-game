// Enemies our player must avoid
var Enemy = function(point) {
    // Variables applied to each of our instances go here,
    this.x = point.x;
    this.y = point.y;
    this.sprite = 'images/enemy-bug.png';
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
	this.x += dt * 200;
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(x, y) {
    // Variables applied to each of our instances go here,
    this.x = x;
    this.y = y;
    this.sprite = 'images/char-boy.png';
};

// HANDLE INPUT
Player.prototype.handleInput = function(key) {
	if (key == 'up' & this.y >= 83) {
		this.y -= 83;
	} else if (key == 'down' & this.y <= 332) {
		this.y += 83;
	} else if (key == 'left' & this.x >= 101) {
		this.x -= 101;
	} else if (key == 'right' & this.x <= 303) {
		this.x += 101;
	}
};

// Update the player's position, required method for game
Player.prototype.update = function() {
};

// Draw the player on the screen, required method for game
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

genPoint = function() {
	var x = (Math.floor((Math.random() * 5000) + 1)) *  -1;
	var y = (Math.floor((Math.random() *    3) + 1)) *  83;
	return {'x': x, 'y': y};
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i=0; i<30; i++) {
	allEnemies.push(new Enemy(genPoint()));
}
var player = new Player(202, 415);

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
