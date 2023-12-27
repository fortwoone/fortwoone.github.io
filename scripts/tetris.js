// https://tetris.fandom.com/wiki/Tetris_Guideline

let canvas = null;
let context = null;

// Return the current time.
function now(){
    return new Date().getTime();
}

function on_load(){
    canvas = document.getElementById('game');
    context = canvas.getContext('2d');
    document.getElementById("rhythm_enabled").onclick = set_rhythm;
}

document.onload = on_load;

class Water{
    constructor() {
        this.height = 0;
        this.row_delta = 0;
        this.tetromino_count = 0;
    }

    reset(){
        this.height = 0;
        this.row_delta = 0;
        this.tetromino_count = 0;
    }

    rise_water(){
        this.row_delta++;
        this.tetromino_count = 0;
        this.height += 32 + 8 * (!!this.row_delta ? 0 : 1);
    }

    render_water(){
        context.fillStyle = "#0DCAF07F";
        context.fillRect(0, 640-this.height, 320, this.height);
    }
}

let water = new Water();

// get a random integer between the range of [min,max]
// @see https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate a new tetromino sequence
// @see https://tetris.fandom.com/wiki/Random_Generator
function generateSequence() {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    while (sequence.length) {
        const rand = getRandomInt(0, sequence.length - 1);
        const name = sequence.splice(rand, 1)[0];
        tetrominoSequence.push(name);
    }
}

// get the next tetromino in the sequence
function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }

    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    // I and O start centered, all others start in left-middle
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

    // I starts on row 21 (-1), all others start on row 22 (-2)
    const row = (name === 'I' ? -1 : -2) - water.row_delta;

    return {
        name: name,      // name of the piece (L, O, etc.)
        matrix: matrix,  // the current rotation matrix
        row: row,        // current row (starts offscreen)
        col: col         // current col
    };
}

// rotate an NxN matrix 90deg
// @see https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
    const N = matrix.length - 1;
    return matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
}

// check to see if the new matrix/row/col is valid
function isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                // outside the game bounds
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                // collides with another piece
                playfield[cellRow + row][cellCol + col])
            ) {
                return false;
            }
        }
    }

    return true;
}

// Points awarded based on how many lines were cleared in one placement.
// See https://tetris.wiki/Scoring/Original_Nintendo_scoring_system for more details.
// (currently, there is no such thing as a level, so the points don't increase)
const SCORE_VALUES = [
    40, // One line
    100, // Two lines
    300, // Three lines
    1200 // Four lines or more
]

const LEVEL_RHYTHM_DELAYS = [
    403, // Normal speed
    268, // 1.5x speed
    201, // 2x speed
    134, // 3x speed
]

let level = 1; // Current level

function advance_one_level(){
    for (let row = -2; row < 20; row++) {
        playfield[row] = [];

        for (let col = 0; col < 10; col++) {
            playfield[row][col] = 0;
        }
    }
    tetromino = getNextTetromino();

    switch (level){
        case 1:
            tetris.pause();
            break;
        case 2:
            tetris2.pause();
            break;
        case 3:
            tetris3.pause();
            break;
        case 4:
            tetris4.pause();
            break;
    }
    level++;
    actual_level++;
    if (level > 4){
        level = 1;
    }
    switch (level){
        case 1:
            tetris.play().then(() => console.log("Playing OST 1"));
            break;
        case 2:
            tetris2.play().then(() => console.log("Playing OST 2"));
            break;
        case 3:
            tetris3.play().then(() => console.log("Playing OST 3"));
            break;
        case 4:
            tetris4.play().then(() => console.log("Playing OST 4"));
            break;
    }

    water.reset();

    if (rhythm_enabled){
        set_event_listeners_for_current_level();
    }
}

// place the tetromino on the playfield
function placeTetromino() {
    let additional_points = rhythm_enabled ? 20 : 0; // Grant additional points if the player is using rhythm mode
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {

                // game over if piece has any part offscreen
                if (tetromino.row + row - water.row_delta < 0) {
                    return additional_points + showGameOver();
                }

                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }

    let clears = 0; // Number of row clears with the tetromino

    // check for line clears starting from the bottom and working our way up
    for (let row = playfield.length - 1; row >= 0; ) {
        if (playfield[row].every(cell => !!cell)) {
            clears++;
            lines_cleared++;
            cleared_until_level++; // Increment that to increase the level every 10 lines
            water.tetromino_count = 0; // Reset the water rising counter if at least one line has been cleared
            // drop every row above this one
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playfield[r].length; c++) {
                    playfield[r][c] = playfield[r-1][c];
                }
            }
        }
        else {
            row--;
        }
    }

    tetromino = getNextTetromino();

    if (cleared_until_level >= 10 / (1 + (level === 1 ? 1 : 0))){
        cleared_until_level %= 10 / (1 + (level === 1 ? 1 : 0));
        advance_one_level();
    }

    if (!!clears){
        return additional_points + SCORE_VALUES[clears - 1];
    }
    return additional_points;
}

// Stop all the music
function stop_music(){
    tetris.pause();
    tetris2.pause();
    tetris3.pause();
    tetris4.pause();
}

// show the game over screen
function showGameOver() {
    cancelAnimationFrame(rAF);
    gameOver = true;

    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
    stop_music();
    return 0; // Doing that to ensure we're not jipping the score display
}

let time = now();
const grid = 32;
const tetrominoSequence = [];
const tetris = new Audio("assets/nooff.mp3");
tetris.preload = "auto";
tetris.loop = true;
const tetris2 = new Audio("assets/level2.mp3");
tetris2.preload = "auto";
tetris2.loop = true;
const tetris3 = new Audio("assets/level3.mp3");
tetris3.preload = "auto";
tetris3.loop = true;
const tetris4 = new Audio("assets/level4.mp3");
tetris4.preload = "auto";
tetris4.loop = true;

// keep track of what is in every cell of the game using a 2d array
// tetris playfield is 10x20, with a few rows offscreen
let rhythm_enabled = false;
const playfield = [];
console.log("Creating playfield");

// populate the empty state
for (let row = -2; row < 20; row++) {
    playfield[row] = [];

    for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
    }
}

// how to draw each tetromino
// @see https://tetris.fandom.com/wiki/SRS
const tetrominos = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0],
    ],
    'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0],
    ],
    'O': [
        [1,1],
        [1,1],
    ],
    'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0],
    ],
    'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0],
    ],
    'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0],
    ]
};

// color of each tetromino
const colors = {
    'I': 'cyan',
    'O': 'yellow',
    'T': 'purple',
    'S': 'green',
    'Z': 'red',
    'J': 'blue',
    'L': 'orange'
};

let count = 0;
let score = 0;
let cleared_until_level = 0;
let lines_cleared = 0;
let actual_level = 0;
let tetromino = getNextTetromino();
let rAF = null;  // keep track of the animation frame so we can cancel it
let gameOver = false;
let can_turn_piece = false;
let down = false;

function set_rhythm(){
    if (gameOver){ // Prevent cheating
        return;
    }
    rhythm_enabled = document.getElementById("rhythm_enabled").checked;
    if (rhythm_enabled){
        document.getElementById("timing_indicator").style.display = "flex";
    }
    else{
        document.getElementById("timing_indicator").style.display = "none";
    }
}

// Pad an object from the left using another string.
function pad(pad, str) {
    if (typeof str === 'undefined')
        return pad;
    return (pad + str).slice(-pad.length);
}

let prevTime = now();

function update_score(){
    document.getElementById("score_display").innerHTML = pad("000000", score);
    document.getElementById("line_count").innerHTML = pad("", lines_cleared);
    document.getElementById("level_no").innerHTML = pad("", actual_level);
}


function toggle_can_turn(){
    can_turn_piece = !can_turn_piece;
    document.getElementById("timing_indicator").className = can_turn_piece ? "timing_active" : "";
}

function set_event_listeners_for_current_level(){
    clearInterval(toggle_can_turn);
    can_turn_piece = false;
    toggle_can_turn();
    setInterval(toggle_can_turn, LEVEL_RHYTHM_DELAYS[level]*0.5);
}

// game loop
function loop() {
    rAF = requestAnimationFrame(loop);
    update_score();
    context.clearRect(0,0,canvas.width,canvas.height);

    // draw the playfield
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col];
                context.fillStyle = colors[name];

                // drawing 1 px smaller than the grid creates a grid effect
                context.fillRect(col * grid, (row-water.row_delta) * grid, grid-1, grid-1);
            }
        }
    }

    // draw the active tetromino
    if (tetromino) {
        if (down) {
            for (let i = tetromino.row; i < 20; i++){
                console.log("down");
                if (!isValidMove(tetromino.matrix, i, tetromino.col)) {
                    tetromino.row = i-1;
                    water.tetromino_count++;
                    score += placeTetromino();
                    if (water.tetromino_count >= 6){
                        water.rise_water();
                    }
                    break;
                }
            }
            down = false;

            tetromino.row++;
        }

        // tetromino falls every 35 frames
        // get the timestamp
        time = now();
        // if time passed since prevTime is greater than 35ms
        if (time - prevTime > LEVEL_RHYTHM_DELAYS[level-1]) {
            prevTime = time;
            tetromino.row++;
            count = 0;

            // place piece if it runs into anything
            if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                tetromino.row--;
                water.tetromino_count++;
                if (water.tetromino_count >= 6){
                    water.rise_water();
                }
                score += placeTetromino();
            }
        }

        context.fillStyle = colors[tetromino.name];

        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    // drawing 1 px smaller than the grid creates a grid effect
                    context.fillRect((tetromino.col + col) * grid, (tetromino.row + row - water.row_delta) * grid, grid-1, grid-1);

                }
            }
        }
    }
    water.render_water();
}


// listen to keyboard events to move the active tetromino
document.addEventListener('keydown', function(e) {
    if (gameOver) return;

    // left and right arrow keys (move)
    if (e.which === 37 || e.which === 39) {
        const col = e.which === 37
            ? tetromino.col - 1
            : tetromino.col + 1;

        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }

    // up arrow key (rotate)
    if (e.which === 38 && (!rhythm_enabled || can_turn_piece)) { // if not synced with the music, the player can't turn the piece
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    }

    // down arrow key (drop)
    if(e.which === 40) {
        const row = tetromino.row + 1;
        down = true;

        for (i = row; i > 0; i--){
            console.log("down");
            if (!isValidMove(tetromino.matrix, i, tetromino.col)) {
                tetromino.row = i-1;
                water.tetromino_count++;
                score += placeTetromino();
                if (water.tetromino_count >= 6){
                    water.rise_water();
                }
            }
        }
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;
            water.tetromino_count++;
            score += placeTetromino();
            if (water.tetromino_count >= 6){
                water.rise_water();
            }
            return;
        }

        tetromino.row = row;
    }
});

document.addEventListener('keyup', function(e) {
    if (e.which === 40) {
        down = false;
    }
});

function reset(){

    // populate the empty state
    for (let row = -2; row < 20; row++) {
        playfield[row] = [];

        for (let col = 0; col < 10; col++) {
            playfield[row][col] = 0;
        }
    }

    if (canvas === null || context === null){
        canvas = document.querySelector("canvas");
        context = canvas.getContext("2d");
    }

    tetromino = getNextTetromino();
    water.reset();
    set_rhythm();
    if (rhythm_enabled){
        set_event_listeners_for_current_level();
    }

    rAF = requestAnimationFrame(loop);
    score = 0;
    level = 1;
    actual_level = 1;
    lines_cleared = 0;
    cleared_until_level = 0;
    tetris.play().then(() => console.log("Playing the OST"));
    console.log("play");
    gameOver = false;

}

function instructions(){
    alert("To play, press Left / Right to move falling tetrominos, Down to drop them and Up to rotate them !\n" +
        " If you enable the Rhythm Mode, you will need to press Up in timing with the music to rotate tetrominos (or else they won't),\n" +
        "but you'll win 20 points per placed piece! Oh, and here's another advice, avoid rising the water by randomly placing tetrominoes, you might reap bad things...")
}
