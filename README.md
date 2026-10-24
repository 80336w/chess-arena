const state = {
  mode: 'chess',
  playerColor: 'white',
  selected: null,
  validMoves: [],
  chessGame: new Chess(),
  xiangqiGame: createInitialXiangqiGame(),
  aiThinking: false,
};

const boardWrap = document.getElementById('boardWrap');
const statusText = document.getElementById('statusText');
const gameModeSelect = document.getElementById('gameMode');
const playerColorSelect = document.getElementById('playerColor');
const resetButton = document.getElementById('resetBtn');

function createInitialXiangqiGame() {
  const board = Array.from({ length: 10 }, () => Array(9).fill(null));

  const initialRows = [
    ['rook', 'knight', 'bishop', 'advisor', 'king', 'advisor', 'bishop', 'knight', 'rook'],
    [null, null, null, null, null, null, null, null, null],
    [null, null, 'cannon', null, null, null, 'cannon', null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, 'cannon', null, null, null, 'cannon', null, null],
    [null, null, null, null, null, null, null, null, null],
    ['rook', 'knight', 'bishop', 'advisor', 'king', 'advisor', 'bishop', 'knight', 'rook'],
  ];

  // Fill the black side at the top and the red side at the bottom.
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const type = initialRows[row][col];
      if (!type) continue;
      board[row][col] = {
        side: row <= 4 ? 'black' : 'red',
        type,
      };
    }
  }

  // Standard Xiangqi pawn placement.
  for (let col = 0; col < 9; col += 1) {
    if (col % 2 === 0) {
      board[3][col] = { side: 'black', type: 'pawn' };
      board[6][col] = { side: 'red', type: 'pawn' };
    }
  }

  return {
    board,
    turn: 'red',
  };
}

function getChessPieceSymbol(piece) {
  if (!piece) return '';

  const whiteMap = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  };

  const blackMap = {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  };

  return piece.color === 'w' ? whiteMap[piece.type] : blackMap[piece.type];
}

function getXiangqiPieceSymbol(piece) {
  if (!piece) return '';

  const mapping = {
    red: {
      king: '帥',
      advisor: '仕',
      bishop: '相',
      knight: '馬',
      rook: '車',
      cannon: '砲',
      pawn: '兵',
    },
    black: {
      king: '將',
      advisor: '士',
      bishop: '象',
      knight: '馬',
      rook: '車',
      cannon: '炮',
      pawn: '卒',
    },
  };

  return mapping[piece.side][piece.type];
}

function getSquareColor(row, col) {
  return (row + col) % 2 === 0 ? 'light' : 'dark';
}

function updateStatus() {
  if (state.mode === 'chess') {
    const turn = state.chessGame.turn();
    const playerName = state.playerColor === 'white' ? '白方' : '黑方';
    const moveName = turn === 'w' ? '白方' : '黑方';

    if (state.chessGame.game_over()) {
      const winner = turn === 'w' ? '黑方' : '白方';
      statusText.textContent = `比赛结束，${winner}获胜 · 你执${playerName}`;
      return;
    }

    statusText.textContent = `${moveName} 行棋 · 你执${playerName}`;
    return;
  }

  const turnName = state.xiangqiGame.turn === 'red' ? '红方' : '黑方';
  statusText.textContent = `${turnName} 行棋 · 你执${state.playerColor === 'red' ? '红方' : '黑方'}`;
}

function render() {
  boardWrap.innerHTML = '';

  if (state.mode === 'chess') {
    renderChessBoard();
  } else {
    renderXiangqiBoard();
  }
}

function renderChessBoard() {
  const boardEl = document.createElement('div');
  boardEl.className = 'board chess-board';
  const board = state.chessGame.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = `square ${getSquareColor(row, col)}`;
      const piece = board[row][col];
      const isSelected = state.selected && state.selected.row === row && state.selected.col === col;
      const isValidMove = state.validMoves.some((move) => move.row === row && move.col === col);

      if (isSelected) square.classList.add('selected');
      if (isValidMove) {
        const move = state.validMoves.find((item) => item.row === row && item.col === col);
        square.classList.add(move.capture ? 'capture' : 'valid-move');
      }

      if (piece) {
        const pieceNode = document.createElement('span');
        pieceNode.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
        pieceNode.textContent = getChessPieceSymbol(piece);
        square.appendChild(pieceNode);
      }

      if (row === 7) {
        const coord = document.createElement('span');
        coord.className = 'coordinate';
        coord.textContent = files[col];
        square.appendChild(coord);
      }

      if (col === 0) {
        const coord = document.createElement('span');
        coord.className = 'coordinate';
        coord.textContent = String(8 - row);
        square.appendChild(coord);
      }

      square.addEventListener('click', () => handleChessSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }

  boardWrap.appendChild(boardEl);
  updateStatus();
}

function renderXiangqiBoard() {
  const boardEl = document.createElement('div');
  boardEl.className = 'board xiangqi-board';
  const board = state.xiangqiGame.board;

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = `square ${getSquareColor(row, col)}`;
      const piece = board[row][col];
      const isSelected = state.selected && state.selected.row === row && state.selected.col === col;
      const isValidMove = state.validMoves.some((move) => move.row === row && move.col === col);

      if (isSelected) square.classList.add('selected');
      if (isValidMove) {
        const move = state.validMoves.find((item) => item.row === row && item.col === col);
        square.classList.add(move.capture ? 'capture' : 'valid-move');
      }

      if (piece) {
        const pieceNode = document.createElement('span');
        pieceNode.className = `piece ${piece.side === 'red' ? 'red' : 'black-piece'}`;
        pieceNode.textContent = getXiangqiPieceSymbol(piece);
        square.appendChild(pieceNode);
      }

      square.addEventListener('click', () => handleXiangqiSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }

  boardWrap.appendChild(boardEl);
  updateStatus();
}

function resetBoard() {
  state.selected = null;
  state.validMoves = [];
  state.chessGame = new Chess();
  state.xiangqiGame = createInitialXiangqiGame();
  state.aiThinking = false;

  if (state.mode === 'chess' && state.playerColor === 'black') {
    setTimeout(() => aiMoveChess(), 200);
  }

  if (state.mode === 'xiangqi' && state.playerColor === 'black') {
    setTimeout(() => aiMoveXiangqi(), 200);
  }

  render();
}

function squareNameFromRowCol(row, col) {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function handleChessSquareClick(row, col) {
  if (state.aiThinking) return;

  const currentTurn = state.chessGame.turn();
  const humanSide = state.playerColor === 'white' ? 'w' : 'b';

  if (currentTurn !== humanSide) return;

  const piece = state.chessGame.get(squareNameFromRowCol(row, col));

  if (state.selected) {
    const valid = state.validMoves.some((move) => move.row === row && move.col === col);
    if (valid) {
      const from = squareNameFromRowCol(state.selected.row, state.selected.col);
      const to = squareNameFromRowCol(row, col);
      state.chessGame.move({ from, to, promotion: 'q' });

      state.selected = null;
      state.validMoves = [];
      render();

      if (!state.chessGame.game_over()) {
        setTimeout(() => aiMoveChess(), 300);
      }
      return;
    }
  }

  if (!piece || piece.color !== humanSide) {
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  const moves = state.chessGame.moves({ square: squareNameFromRowCol(row, col), verbose: true });
  state.selected = { row, col };
  state.validMoves = moves.map((move) => {
    const targetRow = 8 - Number(move.to[1]);
    const targetCol = move.to.charCodeAt(0) - 97;
    return {
      row: targetRow,
      col: targetCol,
      capture: Boolean(move.captured),
    };
  });
  render();
}

function aiMoveChess() {
  if (state.mode !== 'chess' || state.aiThinking) return;

  const aiSide = state.playerColor === 'white' ? 'b' : 'w';
  if (state.chessGame.turn() !== aiSide) return;

  state.aiThinking = true;
  const moves = state.chessGame.moves({ verbose: true });

  if (!moves.length) {
    state.aiThinking = false;
    render();
    return;
  }

  const move = moves[Math.floor(Math.random() * moves.length)];
  state.chessGame.move({ from: move.from, to: move.to, promotion: 'q' });
  state.aiThinking = false;
  render();
}

function isInsideBoard(row, col) {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}

function isTargetOpen(board, row, col, side) {
  if (!isInsideBoard(row, col)) return false;
  const target = board[row][col];
  return !target || target.side !== side;
}

function generateXiangqiMovesForPiece(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const side = piece.side;

  if (piece.type === 'king') {
    const palace = side === 'red' ? { minRow: 7, maxRow: 9, minCol: 3, maxCol: 5 } : { minRow: 0, maxRow: 2, minCol: 3, maxCol: 5 };
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < palace.minRow || nr > palace.maxRow || nc < palace.minCol || nc > palace.maxCol) continue;
      if (isTargetOpen(board, nr, nc, side)) {
        moves.push({ row: nr, col: nc, capture: Boolean(board[nr][nc]) });
      }
    }
    return moves;
  }

  if (piece.type === 'advisor') {
    const palace = side === 'red' ? { minRow: 7, maxRow: 9, minCol: 3, maxCol: 5 } : { minRow: 0, maxRow: 2, minCol: 3, maxCol: 5 };
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < palace.minRow || nr > palace.maxRow || nc < palace.minCol || nc > palace.maxCol) continue;
      if (isTargetOpen(board, nr, nc, side)) {
        moves.push({ row: nr, col: nc, capture: Boolean(board[nr][nc]) });
      }
    }
    return moves;
  }

  if (piece.type === 'bishop') {
    for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const nr = row + dr;
      const nc = col + dc;
      const midRow = row + dr / 2;
      const midCol = col + dc / 2;
      if (!isInsideBoard(nr, nc)) continue;
      if (board[midRow][midCol]) continue;
      if ((side === 'red' && row + dr >= 5) || (side === 'black' && row + dr <= 4)) {
        if (isTargetOpen(board, nr, nc, side)) {
          moves.push({ row: nr, col: nc, capture: Boolean(board[nr][nc]) });
        }
      }
    }
    return moves;
  }

  if (piece.type === 'knight') {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      const nr = row + dr;
      const nc = col + dc;
      const midRow = row + dr / 2;
      const midCol = col + dc / 2;
      if (!isInsideBoard(nr, nc)) continue;
      if (!isInsideBoard(midRow, midCol)) continue;
      if (board[midRow][midCol]) continue;
      if (isTargetOpen(board, nr, nc, side)) {
        moves.push({ row: nr, col: nc, capture: Boolean(board[nr][nc]) });
      }
    }
    return moves;
  }

  if (piece.type === 'rook' || piece.type === 'cannon') {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nr = row + dr;
      let nc = col + dc;
      let blocked = false;

      while (isInsideBoard(nr, nc)) {
        const target = board[nr][nc];

        if (!target) {
          if (piece.type === 'rook') moves.push({ row: nr, col: nc, capture: false });
        } else {
          if (piece.type === 'cannon') {
            if (!blocked) {
              blocked = true;
            } else {
              if (target.side !== side) {
                moves.push({ row: nr, col: nc, capture: true });
              }
              break;
            }
          } else {
            if (target.side !== side) {
              moves.push({ row: nr, col: nc, capture: true });
            }
            break;
          }
        }

        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  if (piece.type === 'pawn') {
    const step = side === 'red' ? -1 : 1;
    const nextRow = row + step;
    if (isInsideBoard(nextRow, col) && isTargetOpen(board, nextRow, col, side)) {
      moves.push({ row: nextRow, col, capture: Boolean(board[nextRow][col]) });
    }

    const crossedRiver = side === 'red' ? row <= 4 : row >= 5;
    if (crossedRiver) {
      for (const dir of [-1, 1]) {
        const nextCol = col + dir;
        if (isInsideBoard(row, nextCol) && isTargetOpen(board, row, nextCol, side)) {
          moves.push({ row, col: nextCol, capture: Boolean(board[row][nextCol]) });
        }
      }
    }
    return moves;
  }

  return moves;
}

function generateAllMovesForSide(board, side) {
  const moves = [];

  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.side !== side) continue;

      const generated = generateXiangqiMovesForPiece(board, row, col);
      for (const move of generated) {
        moves.push({
          fromRow: row,
          fromCol: col,
          row: move.row,
          col: move.col,
          capture: move.capture,
        });
      }
    }
  }

  return moves;
}

function handleXiangqiSquareClick(row, col) {
  if (state.aiThinking) return;

  const board = state.xiangqiGame.board;
  const currentPiece = board[row][col];

  if (state.selected) {
    const valid = state.validMoves.some((move) => move.row === row && move.col === col);
    if (valid) {
      const fromRow = state.selected.row;
      const fromCol = state.selected.col;
      const movingPiece = board[fromRow][fromCol];
      board[row][col] = movingPiece;
      board[fromRow][fromCol] = null;
      state.selected = null;
      state.validMoves = [];
      state.xiangqiGame.turn = state.xiangqiGame.turn === 'red' ? 'black' : 'red';
      render();

      if (state.xiangqiGame.turn !== state.playerColor) {
        setTimeout(() => aiMoveXiangqi(), 300);
      }
      return;
    }
  }

  if (!currentPiece || currentPiece.side !== state.playerColor || state.xiangqiGame.turn !== state.playerColor) {
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  const possibleMoves = generateXiangqiMovesForPiece(board, row, col);
  state.selected = { row, col };
  state.validMoves = possibleMoves;
  render();
}

function aiMoveXiangqi() {
  if (state.mode !== 'xiangqi' || state.aiThinking) return;

  const aiSide = state.playerColor === 'red' ? 'black' : 'red';
  if (state.xiangqiGame.turn !== aiSide) return;

  state.aiThinking = true;
  const moves = generateAllMovesForSide(state.xiangqiGame.board, aiSide);

  if (!moves.length) {
    state.aiThinking = false;
    render();
    return;
  }

  const chosen = moves[Math.floor(Math.random() * moves.length)];
  const board = state.xiangqiGame.board;
  const piece = board[chosen.fromRow][chosen.fromCol];

  if (!piece) {
    state.aiThinking = false;
    render();
    return;
  }

  board[chosen.row][chosen.col] = piece;
  board[chosen.fromRow][chosen.fromCol] = null;
  state.xiangqiGame.turn = aiSide === 'red' ? 'black' : 'red';
  state.aiThinking = false;
  render();
}

function bindEvents() {
  gameModeSelect.addEventListener('change', (event) => {
    state.mode = event.target.value;
    state.playerColor = state.mode === 'chess' ? 'white' : 'red';
    playerColorSelect.value = state.playerColor;
    resetBoard();
  });

  playerColorSelect.addEventListener('change', (event) => {
    state.playerColor = event.target.value;
    resetBoard();
  });

  resetButton.addEventListener('click', resetBoard);
}

bindEvents();
render();

window.addEventListener('load', () => {
  if (state.mode === 'chess' && state.playerColor === 'black') {
    setTimeout(() => aiMoveChess(), 200);
  }

  if (state.mode === 'xiangqi' && state.playerColor === 'black') {
    setTimeout(() => aiMoveXiangqi(), 200);
  }
});
