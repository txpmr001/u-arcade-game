// use semantic variables to make code simpler and easier to understand
var canvasWidth  = 505;
var canvasHeight = 606;
var numCols      =   5;
var numRows      =   6;
var colWidth     = 101;
var rowHeight    =  83;
var col = ['dummy'];	// use col & row arrays to find canvas x, y values by col, row indexes
var row = ['dummy'];	// dummy values make col and row indexes 1-based
for (var x=0; x<numCols; x++) {col.push(x*colWidth);};
for (var y=0; y<numRows; y++) {row.push(y*rowHeight);};

// check for a collision between a single object and an array of objects
var collides = function(obj1, array2) {
	obj1x = obj1.x + ((colWidth - obj1.width) / 2);			// x of object1 left edge
	var arrayLength = array2.length;
	var collision   = 0;
	for (var i=0; i<arrayLength; i++) {
		obj2  = array2[i];
		if (obj1 === obj2) { continue; };					// can't collide with yourself
		obj2x = obj2.x + ((colWidth - obj2.width) / 2);		// x of object2 left edge
		// use bounding box collision detection
		collision = collision || obj1.y == obj2.y && obj1x < (obj2x+obj2.width) && (obj1x+obj1.width) > obj2x;
	};
	return collision;
};

//------------------------------------------------------------ Enemy Class
var Enemy = function() {
    this.sprite = 'images/enemy-bug.png';
    this.width  = 96;
	this.randomize();		// generate a random left of screen location
	allEnemies.push(this);	// add this enemy to the allEnemies array
};

// generate a left of screen location without overlap
Enemy.prototype.randomize = function() {
	do {
		this.x = (Math.floor((Math.random() * 1000) + colWidth)) * -1;	// x = -colWidth to -(999+colWidth)
		this.y = (Math.floor((Math.random() *    3) + 1)) * rowHeight;	// y = row 1 to 3
	} while (collides(this, allEnemies));
};

// update an enemy position
// parameter: dt, a time delta between ticks
// enemies move left to right
Enemy.prototype.update = function(dt) {
    // movements are multiplied by dt to ensure consistent game speed across all computers
	this.x += dt * (((this.y/rowHeight)*100));
	if (collides(this, [player])) {							// if enemy collides with player
		player.score = Math.max(0, player.score-100);		//   -100 points	
		player.startLocation();								//   place player at starting location
	};
	if (this.x > canvasWidth) {		// if enemy moves off right of screen
		this.randomize();			//   generate a random left of screen location
	};
};

// draw an enemy on the screen
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y-20);
};

//---------------------------------------------------------- Gem Class
var Gem = function() {
    this.sprite      = 'images/Gem Blue.png';
	this.width       = 96;
    this.visible     = 0;
	this.randomize();		// generate a random location, delay, and duration
};

// generate a random location, delay, and duration
Gem.prototype.randomize = function() {
	this.x = col[Math.floor((Math.random() * 5) + 1)];				// col 1 to 5
	this.y = row[Math.floor((Math.random() * 3) + 2)];				// row 2 to 4
	this.displayDelay    = Math.floor((Math.random() * 6) + 3);		// delay   for 3 to 8 seconds
	this.displayDuration = Math.floor((Math.random() * 3) + 3);		// display for 3 to 5 seconds
};

// update the gem display
// parameter: dt, a time delta between ticks
Gem.prototype.update = function(dt) {
	if (this.visible & collides(this, [player])) {	// if visible gem collides with player
		player.score += 200;						//   +200 points
		this.visible = 0;							//   hide gem
		this.randomize();							//   generate a random location, delay, and duration
	}
	else if (this.visible) {						// if gem is visible
		this.displayDuration -= dt;					//   decrement display duration
		if (this.displayDuration <= 0) {			//   if display duration <= 0
			this.visible = 0;						//     hide gem
			this.randomize();						//     generate a random location, delay, and duration
		};
	}
    else if (!this.visible) {						// if gem is not visible
		this.displayDelay -= dt;					//   decrement display delay
		if (this.displayDelay <= 0) {				//   if display delay <= 0
			this.visible = 1;						//     display gem
		};
    };
};

// draw the gem on the screen
Gem.prototype.render = function() {
	if (this.visible) {
    	ctx.drawImage(Resources.get(this.sprite), this.x, this.y-20);
	}
};

//---------------------------------------------------------- Player Class
var Player = function() {
    this.startLocation();		// place player at starting location
    this.sprite        = 'images/char-boy.png';
	this.width         = 66;
    this.lastTime      = 0;		// time of last player update (ms)
    this.remainingTime = 0;		// time remaining in player game (ms)
    this.score         = 0;		// player score
    this.pause         = 1;		// player pause
    this.showInstructions = 1;
};

// place player at starting location
Player.prototype.startLocation = function() {
	this.x = col[3];
	this.y = row[6];
};

// update the player position and game situation
Player.prototype.update = function(key) {
	if (this.pause & key == 'space') {					// new game
		this.showInstructions = 0;						// only display instructions once
		ctx.globalAlpha = 1;							// un-dim game
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		if (allEnemies.length > 5) {					// reduce enemies to 5
			allEnemies.splice(5, allEnemies.length - 5);
		}
		this.lastTime       = Date.now();				// time of last player update (ms)
		this.remainingTime  = 60000;					// time remaining (ms)
		this.score          = 0;						// score 0
		this.pause          = 0;						// unpause
	}
	else if (this.pause & key !== 'space') {			// ignore all but spacebar if paused
	}
	else if (key == 'up' & this.y > row[1]) {			// move up
		this.y -= rowHeight;							// decrement y
		if (this.y == row[1]) {							// if crossed road
			this.score += 500;							//   +500 points
			for (var i=0; i<2; i++) {					//	 add 2 enemies
				enemy = new Enemy();
			};
			this.startLocation();						// place player at starting location
		};
	}
	else if (key == 'down'  & this.y < row[6]) { this.y += rowHeight; }		// move down
	else if (key == 'left'  & this.x > col[1]) { this.x -= colWidth;  }		// move left
	else if (key == 'right' & this.x < col[5]) { this.x += colWidth;  };	// move right	

	if (!this.pause) {
		currentTime = Date.now();						// current time
		var elapsedTime = currentTime - this.lastTime;	// time since last update (ms)
		this.remainingTime -= elapsedTime;				// decrement remaining time
		this.lastTime = currentTime;					// remember current time
		if (this.remainingTime <= 0) {					// if game over
			this.pause = 1;								// 	 pause
			this.startLocation();						//   place player at starting location
		};
	};
};

// draw the player on the screen
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y-10);
	ctx.clearRect(0, 0, canvasWidth, 50);		// display score & time
	ctx.font      = '30px sans-serif';
	ctx.fillStyle = 'black';
	ctx.textAlign = 'left';
	ctx.fillText('SCORE: ' + ('0000'+player.score.toString()).slice(-4), 60, 40);
	var displayRemaining = Math.ceil(player.remainingTime / 1000);
	ctx.fillText('TIME: ' + ('00'+displayRemaining.toString()).slice(-2), 300, 40);

	if (player.pause) {									// if player paused
		ctx.globalAlpha = .5;							//   dim screen
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
 		ctx.font      = '30px sans-serif';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		if (player.showInstructions) {					//   show instructions for 1st game
			ctx.fillText('Use the arrow keys to move', canvasWidth/2, 160);
			ctx.fillText('your character across the road', canvasWidth/2, 195);
			ctx.fillText('to the water. (+500 pts)', canvasWidth/2, 230);
			ctx.fillText('Avoid enemy bugs. (-100 pts)', canvasWidth/2, 280);
			ctx.fillText('Capture blue gems', canvasWidth/2, 330);
			ctx.fillText('for bonus points. (+200 pts)', canvasWidth/2, 365);
			ctx.fillText('Press spacebar to start.', canvasWidth/2, 440);
		} else {										//   show play again instructions
			ctx.fillText('Press spacebar to play again.', canvasWidth/2, 440);
		};
	};
};

//----------------------------------------------------------
// instantiate enemy, gem, and player objects
var allEnemies = [];		// enemy objects are contained in array allEnemies
for (var i=0; i<5; i++) {	// start with 5 enemies
	enemy = new Enemy();
};
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
