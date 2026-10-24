const MODE_OPTIONS = {
  chess: {
    label: '国际象棋',
    playerColor: 'white',
  },
  xiangqi: {
    label: '中国象棋',
    playerColor: 'red',
  },
};

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
const resetBtn = document.getElementById('resetBtn');

function createInitialXiangqiGame() {
  const board = [
    [
      makePiece('black', 'rook'),
      makePiece('black', 'knight'),
      makePiece('black', 'bishop'),
      makePiece('black', 'advisor'),
      makePiece('black', 'king'),
      makePiece('black', 'advisor'),
      makePiece('black', 'bishop'),
      makePiece('black', 'knight'),
      makePiece('black', 'rook'),
    ],
    [null, null, null, null, null, null, null, null, null],
    [null, null, makePiece('black', 'cannon'), null, null, null, makePiece('black', 'cannon'), null, null],
    [null, null, null, null, null, null, null, null, null],
    [makePiece('black', 'pawn'), null, null, null, null, null, null, null, makePiece('black', 'pawn')],
    [null, null, null, null, null, null, null, null, null],
    [makePiece('red', 'pawn'), null, null, null, null, null, null, null, makePiece('red', 'pawn')],
    [null, null, null, null, null, null, null, null, null],
    [null, null, makePiece('red', 'cannon'), null, null, null, makePiece('red', 'cannon'), null, null],
    [
      makePiece('red', 'rook'),
      makePiece('red', 'knight'),
      makePiece('red', 'bishop'),
      makePiece('red', 'advisor'),
      makePiece('red', 'king'),
      makePiece('red', 'advisor'),
      makePiece('red', 'bishop'),
      makePiece('red', 'knight'),
      makePiece('red', 'rook'),
    ],
  ];

  return {
    board,
    turn: 'red',
    winner: null,
  };
}

function makePiece(side, type) {
  return {
    side,
    type,
  };
}

function getHumanSideLabel(side) {
  return side === 'white' ? '白方' : '黑方';
}

function getXiangqiPieceSymbol(piece) {
  const mapping = {
    red: {
      king: '帅',
      advisor: '仕',
      bishop: '相',
      knight: '马',
      rook: '车',
      cannon: '炮',
      pawn: '兵',
    },
    black: {
      king: '将',
      advisor: '士',
      bishop: '象',
      knight: '馬',
      rook: '車',
      cannon: '砲',
      pawn: '卒',
    },
  };

  return mapping[piece.side][piece.type];
}

function getChessPieceSymbol(piece) {
  if (!piece) return '';

  const white = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  };

  const black = {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  };

  return piece.color === 'w' ? white[piece.type] : black[piece.type];
}

function getHumanDisplayName() {
  return state.mode === 'chess' ? getHumanSideLabel(state.playerColor) : getHumanSideLabel(state.playerColor);
}

function resetBoard() {
  state.selected = null;
  state.validMoves = [];
  state.chessGame = new Chess();
  state.xiangqiGame = createInitialXiangqiGame();
  state.aiThinking = false;

  if (state.mode === 'chess') {
    if (state.playerColor === 'black') {
      setTimeout(() => aiMoveChess(), 300);
    }
  } else if (state.mode === 'xiangqi') {
    if (state.playerColor === 'black') {
      setTimeout(() => aiMoveXiangqi(), 300);
    }
  }

  render();
}

function updateStatus(message) {
  statusText.textContent = message;
}

function getSquareColor(row, col) {
  const light = (row + col) % 2 === 0;
  return light ? 'light' : 'dark';
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
  const board = state.chessGame.board();
  const boardEl = document.createElement('div');
  boardEl.className = 'board chess-board';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = `square ${getSquareColor(row, col)}`;
      square.dataset.row = String(row);
      square.dataset.col = String(col);

      const notation = `${files[col]}${8 - row}`;
      const chessPiece = board[row][col];
      const isSelected = state.selected && state.selected.row === row && state.selected.col === col;
      const isValidMove = state.validMoves.some((move) => move.row === row && move.col === col);

      if (isSelected) square.classList.add('selected');
      if (isValidMove) {
        const move = state.validMoves.find((item) => item.row === row && item.col === col);
        const isCapture = move && move.capture;
        square.classList.add(isCapture ? 'capture' : 'valid-move');
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

      if (chessPiece) {
        const pieceEl = document.createElement('span');
        pieceEl.className = `piece ${chessPiece.color === 'w' ? 'white' : 'black'}`;
        pieceEl.textContent = getChessPieceSymbol(chessPiece);
        square.appendChild(pieceEl);
      }

      square.addEventListener('click', () => handleChessSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }

  boardWrap.appendChild(boardEl);

  const turn = state.chessGame.turn();
  const currentTurnText = turn === 'w' ? '白方' : '黑方';
  updateStatus(`${currentTurnText} 行棋` + (state.playerColor === 'white' ? ' · 你执白' : ' · 你执黑'));
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
      square.dataset.row = String(row);
      square.dataset.col = String(col);

      const piece = board[row][col];
      const isSelected = state.selected && state.selected.row === row && state.selected.col === col;
      const isValidMove = state.validMoves.some((move) => move.row === row && move.col === col);

      if (isSelected) square.classList.add('selected');
      if (isValidMove) {
        const move = state.validMoves.find((item) => item.row === row && item.col === col);
        const isCapture = move && move.capture;
        square.classList.add(isCapture ? 'capture' : 'valid-move');
      }

      if (piece) {
        const pieceEl = document.createElement('span');
        const pieceColorClass = piece.side === 'red' ? 'red' : 'black-piece';
        pieceEl.className = `piece ${pieceColorClass}`;
        pieceEl.textContent = getXiangqiPieceSymbol(piece);
        square.appendChild(pieceEl);
      }

      square.addEventListener('click', () => handleXiangqiSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }

  boardWrap.appendChild(boardEl);

  const turnLabel = state.xiangqiGame.turn === 'red' ? '红方' : '黑方';
  updateStatus(`${turnLabel} 行棋 · 你执${state.playerColor === 'red' ? '红方' : '黑方'}`);
}

function handleChessSquareClick(row, col) {
  if (state.aiThinking) return;

  const currentTurn = state.chessGame.turn();
  const isHumanTurn = currentTurn === state.playerColor[0];

  if (!isHumanTurn) return;

  const sourcePiece = state.chessGame.get(String.fromCharCode(97 + col) + String(8 - row));

  if (state.selected) {
    const target = { row, col };
    const isValid = state.validMoves.some((move) => move.row === target.row && move.col === target.col);

    if (isValid) {
      const from = state.selected;
      const fromSquare = `${String.fromCharCode(97 + from.col)}${8 - from.row}`;
      const toSquare = `${String.fromCharCode(97 + col)}${8 - row}`;
      const move = state.chessGame.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q',
      });

      if (move) {
        state.selected = null;
        state.validMoves = [];
        render();

        if (!state.chessGame.game_over()) {
          setTimeout(() => aiMoveChess(), 350);
        }
      }
      return;
    }
  }

  if (!sourcePiece || sourcePiece.color !== state.playerColor[0]) {
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  const moves = state.chessGame.moves({ square: `${String.fromCharCode(97 + col)}${8 - row}`, verbose: true });
  state.selected = { row, col };
  state.validMoves = moves.map((move) => {
    const targetRow = 8 - Number(move.to[1]);
    const targetCol = move.to.charCodeAt(0) - 97;
    return {
      row: targetRow,
      col: targetCol,
      capture: !!move.captured,
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

  const selectedMove = moves[Math.floor(Math.random() * moves.length)];
  state.chessGame.move({
    from: selectedMove.from,
    to: selectedMove.to,
    promotion: 'q',
  });

  state.aiThinking = false;
  render();
}

function handleXiangqiSquareClick(row, col) {
  if (state.aiThinking) return;

  const board = state.xiangqiGame.board;
  const currentPiece = board[row][col];

  if (state.selected) {
    const selected = state.selected;
    const targetPiece = board[row][col];
    const moveAllowed = state.validMoves.some((move) => move.row === row && move.col === col);

    if (moveAllowed) {
      const fromRow = selected.row;
      const fromCol = selected.col;
      const movedPiece = board[fromRow][fromCol];

      if (movedPiece && movedPiece.side === state.xiangqiGame.turn) {
        board[row][col] = movedPiece;
        board[fromRow][fromCol] = null;
        const nextSide = state.xiangqiGame.turn === 'red' ? 'black' : 'red';
        state.xiangqiGame.turn = nextSide;
        state.selected = null;
        state.validMoves = [];
        render();

        if (state.xiangqiGame.turn !== state.playerColor) {
          setTimeout(() => aiMoveXiangqi(), 350);
        }
      }
      return;
    }
  }

  if (!currentPiece || currentPiece.side !== state.playerColor) {
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  if (currentPiece.side !== state.xiangqiGame.turn) {
    state.selected = null;
    state.validMoves = [];
    render();
    return;
  }

  const moves = generateXiangqiMovesForSquare(state.xiangqiGame.board, row, col);
  state.selected = { row, col };
  state.validMoves = moves;
  render();
}

function aiMoveXiangqi() {
  if (state.mode !== 'xiangqi' || state.aiThinking) return;

  const aiSide = state.playerColor === 'red' ? 'black' : 'red';
  if (state.xiangqiGame.turn !== aiSide) return;

  state.aiThinking = true;

  const allMoves = generateLegalMovesForSide(state.xiangqiGame.board, aiSide);
  if (!allMoves.length) {
    state.aiThinking = false;
    render();
    return;
  }

  const move = allMoves[Math.floor(Math.random() * allMoves.length)];
  const board = state.xiangqiGame.board;
  const piece = board[move.fromRow][move.fromCol];
  board[move.row][move.col] = piece;
  board[move.fromRow][move.fromCol] = null;
  state.xiangqiGame.turn = move.side === 'red' ? 'black' : 'red';
  state.aiThinking = false;
  render();
}

function generateXiangqiMovesForSquare(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];

  const directions = {
    king: [[1, 0], [-1, 0], [0, 1], [0, -1]],
    advisor: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    bishop: [[2, 2], [2, -2], [-2, 2], [-2, -2]],
    knight: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
    rook: [],
    cannon: [],
    pawn: [],
  };

  if (piece.type === 'king') {
    const palace = piece.side === 'red' ? [[7, 3], [9, 5]] : [[0, 3], [2, 5]];
    for (const [dr, dc] of directions.king) {
      const nr = row + dr;
      const nc = col + dc;
      if (inPalace(nr, nc, palace) && isValidTarget(board, nr, nc, piece.side)) {
        moves.push({ row: nr, col: nc, capture: !!board[nr][nc] });
      }
    }
    return moves;
  }

  if (piece.type === 'advisor') {
    const palace = piece.side === 'red' ? [[7, 3], [9, 5]] : [[0, 3], [2, 5]];
    for (const [dr, dc] of directions.advisor) {
      const nr = row + dr;
      const nc = col + dc;
      if (inPalace(nr, nc, palace) && isValidTarget(board, nr, nc, piece.side)) {
        moves.push({ row: nr, col: nc, capture: !!board[nr][nc] });
      }
    }
    return moves;
  }

  if (piece.type === 'bishop') {
    for (const [dr, dc] of directions.bishop) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInsideBoard(nr, nc)) continue;
      const midRow = row + dr / 2;
      const midCol = col + dc / 2;
      if (board[midRow][midCol]) continue;
      if (isValidTarget(board, nr, nc, piece.side)) {
        moves.push({ row: nr, col: nc, capture: !!board[nr][nc] });
      }
    }
    return moves;
  }

  if (piece.type === 'knight') {
    for (const [dr, dc] of directions.knight) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInsideBoard(nr, nc)) continue;
      const midRow = row + (dr / 2);
      const midCol = col + (dc / 2);
      if (!isInsideBoard(midRow, midCol)) continue;
      if (board[midRow][midCol] !== null) continue;
      if (isValidTarget(board, nr, nc, piece.side)) {
        moves.push({ row: nr, col: nc, capture: !!board[nr][nc] });
      }
    }
    return moves;
  }

  if (piece.type === 'rook' || piece.type === 'cannon') {
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    for (const [dr, dc] of directions) {
      let nr = row + dr;
      let nc = col + dc;
      while (isInsideBoard(nr, nc)) {
        if (board[nr][nc] === null) {
          if (piece.type === 'rook') moves.push({ row: nr, col: nc, capture: false });
        } else {
          if (piece.type === 'cannon') {
            if (board[nr][nc].side !== piece.side) {
              moves.push({ row: nr, col: nc, capture: true });
            }
            break;
          }

          if (board[nr][nc].side !== piece.side) {
            moves.push({ row: nr, col: nc, capture: true });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    if (piece.type === 'cannon') {
      for (const [dr, dc] of directions) {
        let nr = row + dr;
        let nc = col + dc;
        let jumped = false;
        while (isInsideBoard(nr, nc)) {
          if (board[nr][nc] !== null) {
            if (!jumped) {
              jumped = true;
            } else {
              if (board[nr][nc].side !== piece.side) {
                moves.push({ row: nr, col: nc, capture: true });
              }
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
    }

    return moves;
  }

  if (piece.type === 'pawn') {
    const step = piece.side === 'red' ? -1 : 1;
    const nextRow = row + step;
    if (isInsideBoard(nextRow, col)) {
      if (isValidTarget(board, nextRow, col, piece.side)) {
        moves.push({ row: nextRow, col, capture: !!board[nextRow][col] });
      }
    }

    if (piece.side === 'red' && row <= 4 || piece.side === 'black' && row >= 5) {
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (isInsideBoard(row, nc) && isValidTarget(board, row, nc, piece.side)) {
          moves.push({ row, col: nc, capture: !!board[row][nc] });
        }
      }
    }

    return moves;
  }

  return moves;
}

function generateLegalMovesForSide(board, side) {
  const moves = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.side !== side) continue;
      const list = generateXiangqiMovesForSquare(board, row, col);
      for (const move of list) {
        moves.push({
          fromRow: row,
          fromCol: col,
          row: move.row,
          col: move.col,
          side,
          capture: move.capture,
        });
      }
    }
  }
  return moves;
}

function isValidTarget(board, row, col, side) {
  if (!isInsideBoard(row, col)) return false;
  const target = board[row][col];
  return !target || target.side !== side;
}

function inPalace(row, col, palace) {
  const [topLeft, bottomRight] = palace;
  return row >= topLeft[0] && row <= bottomRight[0] && col >= topLeft[1] && col <= bottomRight[1];
}

function isInsideBoard(row, col) {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
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

  resetBtn.addEventListener('click', resetBoard);
}

bindEvents();
resetBoard();
