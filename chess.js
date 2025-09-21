let board = null;
let game = new Chess();
let statusEl = document.getElementById("status");
let difficultySelect = document.getElementById("difficulty");

function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;
  if (game.turn() === 'b') return false; // player is always white
  if (piece.search(/^b/) !== -1) return false; // prevent dragging black pieces
}

function makeRandomMove() {
  let moves = game.moves();
  if (moves.length === 0) return;
  let move = moves[Math.floor(Math.random() * moves.length)];
  game.move(move);
  board.position(game.fen());
}

function bestMove(depth) {
  let bestMove = null;
  let bestValue = -9999;
  let moves = game.moves();

  for (let i = 0; i < moves.length; i++) {
    let move = moves[i];
    game.move(move);
    let value = -minimax(depth - 1, -10000, 10000, false);
    game.undo();
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(depth, alpha, beta, isMaximizingPlayer) {
  if (depth === 0 || game.game_over()) {
    return -evaluateBoard(game.board());
  }
  let moves = game.moves();
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (let move of moves) {
      game.move(move);
      let eval = minimax(depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      game.move(move);
      let eval = minimax(depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Piece values
const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

function evaluateBoard(board) {
  let total = 0;
  for (let row of board) {
    for (let piece of row) {
      if (piece !== null) {
        let value = pieceValues[piece.type];
        total += piece.color === 'w' ? value : -value;
      }
    }
  }
  return total;
}

function onDrop(source, target) {
  let move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();

  window.setTimeout(() => {
    let difficulty = parseInt(difficultySelect.value);
    let move;
    if (difficulty === 1) {
      makeRandomMove();
    } else {
      move = bestMove(difficulty + 1);
      game.move(move);
      board.position(game.fen());
    }
    updateStatus();
  }, 250);
}

function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  let status = '';
  let moveColor = game.turn() === 'w' ? 'White' : 'Black';

  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  } else if (game.in_draw()) {
    status = 'Game over, drawn position.';
  } else {
    status = moveColor + ' to move';
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check!';
    }
  }
  statusEl.textContent = status;
}

function resetGame() {
  game.reset();
  board.start();
  updateStatus();
}

board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});
updateStatus();
