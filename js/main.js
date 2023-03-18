let positions = [];
let tiles = [];
let moves = 0;
let time = 0;
let counter = null;

const PLAYING = 0;
const PAUSED = 1;
const SOLVING = 2;

let state = PAUSED;
let won = false;

const RQST_SOLVE = 0;
const RQST_RANDOM_TILES = 1;

const worker = new Worker("js/worker.js", { type: "module" });

worker.postMessage = (worker.webkitPostMessage || worker.postMessage);
worker.onmessage = (message) => {
	const { request, result } = message.data;

	switch (request) {
		case RQST_SOLVE:
			applySolution(result);
			break;
		case RQST_RANDOM_TILES:
			setRandomTiles(result);
			break;
	}
}

$(document).on('click', '.tile', function() {
	if (state !== PLAYING) return;
	let num = $(this).attr('num');
	let tile = tiles.find(t => t.num == num);
	tile.move();
});

function enableStartButton() {
	$(document).on('click', '#start-button', () => {
		state === PAUSED
			? startGame()
			: pauseGame();
	});
}

enableStartButton();

$(document).on('click', '#reset-button', resetGame);

$(document).on('click', '#solve-button', () => {
	if (state === SOLVING || tiles.length == 0) return;
	solveGame();
});

$(document).on('click', '#overlay-button', startGame);

function startGame() {
	state = PLAYING;
	$('#start-button .text').html('PAUSE');
	hideOverlay();
	$(this).css('opacity', '1');
	if (tiles.length == 0) {
		resetContents();
	}
	runTimer();
}

function pauseGame() {
	state = PAUSED;
	$('#start-button .text').html('START');
	$('#overlay-button').html('PAUSED').show();
	$('#overlay').fadeIn('fast');
	stopTimer();
}

function resetGame() {
	pauseGame();
	resetContents();
	$('#overlay-button').html("PLAY").show();
	$('#overlay-result-message').hide();
	$('#overlay-submessage').hide();
}

function applySolution(solution) {
	stopTimer();

	const moveFn = {
		"u": move_down,
		"d": move_up,
		"r": move_left,
		"l": move_right,
	}
	const make_move = steps => {
		if (steps.length === 0) {
			clearInterval(s_timer);
			end_game();
			return;
		}
		const direction = steps.shift();
		const position = getFreePosition();
		moveFn[direction](position);
	}

	const interval = 300;
	let steps = solution.split("");

	const s_timer = setInterval(make_move, interval, steps);
	
	$('#overlay-button').hide();
	$('#overlay').fadeOut('fast');
	enableStartButton();
	$(document).on('click', '#reset-button', resetGame);
	$(document).on('click', '#overlay-button', startGame);
}

function solveGame() {
	state = SOLVING;

	$(document).off('click', '#overlay-button');
	$(document).off('click', '#start-button');
	$(document).off('click', '#reset-button');
	$('#start-button .text').html('START');
	$('#overlay-button').html('SOLVING...').show();
	$('#overlay').fadeIn('fast');

	resetMoves();
	resetTime();
	runTimer();
		
	const numbers = positions.map(p => getTileInPosition(p.x, p.y)?.num || 0);
	worker.postMessage({ request: RQST_SOLVE, input: numbers});
}

function hideOverlay() {
	$('#overlay').fadeOut('fast');
	$('#overlay-button').hide();
	$('#overlay-result-message').hide();
	$('#overlay-submessage').hide();
}

function resetContents() {
	tiles = [];
	generateTiles();
	resetTime();
	resetMoves();
	won = false;
}

function setRandomTiles(array) {
	for (const [index, number] of array.entries()) {
		let x = Math.floor(index / 4) + 1;
		let y = index % 4 + 1;
		let position = new Position(x, y, number === 0);
		positions.push(position);
		if (position.free) continue;
		let tile = new Tile(position.x, position.y, number);
		tiles.push(tile);
		tile.insertTile();
	}
}

function generateTiles() {
	console.log('Generating tiles');
	positions = [];
	tiles = [];
	worker.postMessage({ request: RQST_RANDOM_TILES });
}

function resetMoves() {
	moves = 0;
	$('#score-point .num').html('0');
}

function runTimer() {
	counter = setInterval(async function () {
		time++;
		displayCurrentTime();
	}, 1000);
}

function stopTimer() {
	clearInterval(counter);
}

function resetTime() {
	stopTimer();
	time = 0;
	$('#timepoint .num').html('00:00');
}

function displayCurrentTime() {
	let minutes = Math.floor(time / 60);
	let seconds = time - minutes * 60;
	const convert = (n) => n > 9 ? "" + n : "0" + n;

	$('#timepoint .num').html(convert(minutes) + ':' + convert(seconds));
}

function end_game() {
	if (state === PLAYING) {
		win();
	} else {
		show_solved();
	}
}

function win() {
	pauseGame();
	$('#overlay-button').hide();
	$('#overlay-inner').show();
	$('#overlay-inner #overlay-result-message').html('YOU WIN!').show();
	let finalTime = $('#timepoint .num').html();
	let finalMoves = $('#score-point .num').html();
	$('#overlay-inner #overlay-submessage').html('<b>Time</b>: ' + finalTime + '&nbsp&nbsp&nbsp<b>Moves</b>: ' + finalMoves).show();
	tiles = [];
	won = true;
}

function show_solved() {
	pauseGame();
	$('#overlay-button').hide();
	$('#overlay-inner').show();
	$('#overlay-inner #overlay-result-message').html('SOLVED!').show();
	let finalTime = $('#timepoint .num').html();
	let finalMoves = $('#score-point .num').html();
	$('#overlay-inner #overlay-submessage').html('<b>Time</b>: ' + finalTime + '&nbsp&nbsp&nbsp<b>Moves</b>: ' + finalMoves).show();
	tiles = [];
}

function addMove() {
	moves++;
	$('#score-point .num').html(moves);
}

function move_left(position) {
	if (position.y < 4) {
		getTileInPosition(position.x, position.y + 1)
			.move();
	}
}

function move_up(position) {
	if (position.x < 4) {
		getTileInPosition(position.x + 1, position.y)
			.move();
	}
}

function move_right(position) {
	if (position.y > 1) {
		getTileInPosition(position.x, position.y - 1)
			.move();
	}
}

function move_down(position) {
	if (position.x > 1) {
		getTileInPosition(position.x - 1, position.y)
			.move();
	}
}

function exit() {
	console.log('esc');
	pauseGame();
}

function enter() {
	console.log('enter');
	if (state === PAUSED && !won) {
		startGame();
	}
	if (won && !$('#overlay-button').is(":visible")) {
		resetGame();
	}
}

$(document).keydown(function (e) {
	let position = getFreePosition();
	let actions = {
		37: move_left,
		38: move_up,
		39: move_right,
		40: move_down,
		27: exit,
		13: enter,
	};

	let key = e.which;
	if (state === PLAYING) {
		e.preventDefault();
		if ([37, 38, 39, 40, 27].includes(key)) {
			actions[key](position);
		}
	} else {
		if ([27, 13].includes(key)) {
			actions[key](position);
		}
	}
});
