class Tile {
	constructor(x, y, num) {
		this.x = x;
		this.y = y;
		this.num = num;
		this.offset = null;
		this.current = null;
	}

	insertTile() {
		let attr = `class="tile position-${this.x}-${this.y}" num="${this.num}" id="tile-${this.num}"`;
		$('#tiles-container').append(`<div ${attr}>${this.num}</div>`);

		let position = getGridOffset(this.x, this.y);
		position.left += 6;
		position.top += 6;
		this.offset = position;
		$('#tile-' + this.num).css({
			'left': position.left,
			'top': position.top
		});
		$('#tile-' + this.num).fadeIn('slow');
		this.current = getPositionIndex(this.x, this.y);
	}

	move() {
		let position = getFreePositionNearTile(this);
		if (position == null) return;
		let offsetEnd = getGridOffset(position.x, position.y);
		offsetEnd.left += 6;
		offsetEnd.top += 6;

		let direction = position.x == this.x
			? position.y > this.y ? 'right' : 'left'
			: position.x > this.x ? 'down' : 'up';

		console.log(direction);

		$('#tile-' + this.num).addClass('move-' + direction);
		$('#tile-' + this.num).css({
			'top': offsetEnd.top,
			'left': offsetEnd.left,
		});
		$('#tile-' + this.num).removeClass('move-' + direction);

		position.free = false;
		let oldPosition = getPosition(this.x, this.y);
		oldPosition.free = true;
		this.x = position.x;
		this.y = position.y;
		this.offset = offsetEnd;
		this.current = getPositionIndex(this.x, this.y);
		addMove();
		checkGoal();
		// $('#tile-' + this.num).removeClass('move' +  direction);
	}
};

function getGridOffset(x, y) {
	let selectedCell = `position-${x}-${y}`;
	return $('#' + selectedCell).position();
}

// Return the empty position near tile selected, if exists
function getFreePositionNearTile(tile) {
	let neighbours = [
		[tile.x, tile.y - 1],
		[tile.x, tile.y + 1],
		[tile.x - 1, tile.y],
		[tile.x + 1, tile.y],
	];
	let freePosition = getFreePosition();
	let isNeighbouringFree = neighbours.some(([x, y]) => x === freePosition.x && y === freePosition.y);
	return isNeighbouringFree ? freePosition : null;
}

/*
 * Define position class
 */

class Position {
	constructor(x, y, free) {
		this.x = x;
		this.y = y;
		this.free = free;
	}
}

function getPosition(x, y) {
	return positions.find(p => p.x == x && p.y == y);
}

function getPositionIndex(x, y) {
	return 4 * (x - 1) + y;
}

function getTileInPosition(x, y) {
	return tiles.find(t => t.x == x && t.y == y);
}

function getFreePosition() {
	return positions.find(p => p.free);
}

function checkGoal() {
	if (tiles.every(t => t.num == t.current)) {
		end_game();
	}
}