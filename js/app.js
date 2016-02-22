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

//------------------------------------------------------------ Enemy Class
// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here,
    this.sprite = 'images/enemy-bug.png';
    this.width  = 96;
	this.randomize();
	allEnemies.push(this);
};

Enemy.prototype.randomize = function() {
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
	this.x += dt * (((this.y/rowHeight)*100));
	if (collides(this, [player])) {
		player.score = Math.max(0, player.score-100);
		player.startLocation();
	};
	if (this.x > canvasWidth) {
		this.randomize();
	};
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y-20);
};

//---------------------------------------------------------- Gem Class
var Gem = function() {
    // Variables applied to each of our instances go here,
    this.sprite      = 'images/Gem Blue.png';
	this.width       = 96;
    this.visible     = 0;
	this.randomize();
};

Gem.prototype.randomize = function() {
	this.x = col[Math.floor((Math.random() * 5) + 1)];			/* col 1 to 5     */
	this.y = row[Math.floor((Math.random() * 3) + 2)];			/* row 2 to 4     */
	this.displayWait = Math.floor((Math.random() * 5) + 3);		/* 3 to 7 seconds */
	this.displayTime = Math.floor((Math.random() * 3) + 3);		/* 3 to 5 seconds */
};

Gem.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
	if (this.visible & collides(this, [player])) {
		player.score += 200;
		this.visible = 0;
		this.randomize();
	}
	else if (this.visible) {
		this.displayTime -= dt;
		if (this.displayTime <= 0) {
			this.visible = 0;
			this.randomize();
		};
	}
    else if (!this.visible & this.displayWait > 0) {
		this.displayWait -= dt;
		if (this.displayWait <= 0) {
			this.visible = 1;
		};
    };
};

// Draw the enemy on the screen, required method for game
Gem.prototype.render = function() {
	if (this.visible) {
    	ctx.drawImage(Resources.get(this.sprite), this.x, this.y-20);
	}
};

//---------------------------------------------------------- Player Class
// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
    // Variables applied to each of our instances go here,
    this.startLocation();
    this.sprite        = 'images/char-boy.png';
	this.width         = 66;
    this.lastTime      = 0;
    this.remainingTime = 0;
    this.score         = 0;
    this.pause         = 1;
    this.showInstructions = 1;
};

//
Player.prototype.startLocation = function() {
	this.x = col[3];
	this.y = row[6];
};

// Update the player's position, required method for game
Player.prototype.update = function(key) {
	if (this.pause & key == 'space') {
		this.showInstructions = 0;
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		if (allEnemies.length > 5) {
			allEnemies.splice(5, allEnemies.length - 5);
		}
		this.lastTime       = Date.now();
		this.remainingTime  = 60000;
		this.score          = 0;
		this.pause          = 0;
	}
	else if (this.pause & key !== 'space') {
	}
	else if (key == 'up' & this.y > row[1]) {
		this.y -= rowHeight;
		if (this.y == row[1]) {
			this.score += 500;
			for (var i=0; i<2; i++) {
				enemy = new Enemy();
			};
			this.startLocation();
		};
	}
	else if (key == 'down'  & this.y < row[6]) { this.y += rowHeight; }
	else if (key == 'left'  & this.x > col[1]) { this.x -= colWidth; }
	else if (key == 'right' & this.x < col[5]) { this.x += colWidth; };

	if (!this.pause) {
		var thisTime    = Date.now();
		var elapsedTime = Date.now() - this.lastTime;
		this.remainingTime -= elapsedTime;
		this.lastTime = thisTime;
		console.log(elapsedTime + '     ' + player.remainingTime);
		if (this.remainingTime <= 0) {
			this.pause = 1;
			this.startLocation();
		};
	};
};

// Draw the player on the screen, required method for game
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y-10);
	ctx.clearRect(0, 0, canvasWidth, 50);
	ctx.font      = '30px sans-serif';
	ctx.fillStyle = 'black';
	ctx.textAlign = 'left';
	ctx.fillText('SCORE: ' + ('0000'+player.score.toString()).slice(-4), 60, 40);

	var displayTime = Math.floor((player.remainingTime + 999) / 1000);
	ctx.fillText('TIME: ' + ('00'+displayTime.toString()).slice(-2), 300, 40);

	if (player.pause) {
		ctx.globalAlpha = .5;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
 		ctx.font      = '30px sans-serif';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		if (player.showInstructions) {
			ctx.fillText('Use the arrow keys to move', canvasWidth/2, 160);
			ctx.fillText('your character across the road', canvasWidth/2, 195);
			ctx.fillText('to the water. (+500 pts)', canvasWidth/2, 230);
			ctx.fillText('Avoid enemy bugs. (-100 pts)', canvasWidth/2, 280);
			ctx.fillText('Capture blue gems', canvasWidth/2, 330);
			ctx.fillText('for bonus points. (+200 pts)', canvasWidth/2, 365);
			ctx.fillText('Press spacebar to start.', canvasWidth/2, 440);
		} else {
			ctx.fillText('Press spacebar to play again.', canvasWidth/2, 440);
		};
	};
};

//----------------------------------------------------------
// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i=0; i<5; i++) {
	enemy = new Enemy();
};
var gem = new Gem();
var player = new Player();

// Decide what to do when a key is pressed
var handleInput = function(key) {
	if (['up', 'down', 'left', 'right', 'space'].indexOf(key) != -1) {
		player.update(key);
	}
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
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




