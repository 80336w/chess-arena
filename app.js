/**
 * 国际象棋 AI 对战平台核心逻辑
 * 包含：游戏状态管理、Minimax AI、开局识别、历史记录
 */

const app = (() => {
    // --- 配置与状态 ---
    let board = null;
    let game = new Chess();
    let playerColor = 'w'; // 'w' or 'b'
    let isGameActive = false;
    let aiDepth = 3;
    let moveHistory = [];
    let startTime = null;
    let timerInterval = null;

    // --- 开局库 (简化版 ECO) ---
    const openingBook = {
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b kq - 0 1": "王兵开局 (King's Pawn Game)",
        "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b kq - 0 1": "后兵开局 (Queen's Pawn Game)",
        "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w kq - 0 2": "西西里防御 (Sicilian Defense)",
        "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w kq - 0 2": "法兰西防御 (French Defense)",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w kq - 0 2": "王兵开局: 王兵应着",
        "rnbqkbnr/pppp2pp/8/4pp2/4P3/8/PPPP1PPP/RNBQKBNR w kq - 0 3": "拉脱维亚弃兵 (Latvian Gambit)",
        "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w kq - 1 3": "王兵开局: 骑士防御",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQKBNR w kq - 2 3": "王兵开局: 尼姆佐维奇防御",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b kq - 1 2": "王兵开局: 阿廖欣防御",
        "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/3P4/PPP2PPP/RNBQKBNR b kq - 0 3": "菲利多尔防御 (Philidor Defense)",
        "rnbqkbnr/ppp2ppp/4p3/3p4/4P3/8/PPPP1PPP/RNBQKBNR w kq - 0 3": "斯堪的纳维亚防御 (Scandinavian Defense)",
        "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b kq - 2 3": "维也纳游戏 (Vienna Game)",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w kq - 2 3": "四马开局 (Four Knights Game) 前置",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b kq - 2 3": "三马开局 (Three Knights Game)",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w kq - 2 3": "意大利开局 (Italian Game) 前置",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w kq - 2 3": "西班牙开局 (Ruy Lopez) 前置",
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w kq - 2 3": "苏格兰开局 (Scotch Game) 前置"
    };

    // --- 初始化 ---
    function init() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };
        board = Chessboard('board', config);

        window.addEventListener('resize', () => {
            board.resize();
        });

        loadHistory();
        startNewGame();
    }

    // --- 游戏控制 ---
    function startNewGame() {
        game.reset();
        board.position('start');
        moveHistory = [];
        isGameActive = true;
        aiDepth = parseInt(document.getElementById('difficulty').value);

        playerColor = Math.random() < 0.5 ? 'w' : 'b';
        updateStatus(`新对局开始！你执${playerColor === 'w' ? '白' : '黑'}棋。`);
        document.getElementById('player-color-badge').innerText = playerColor === 'w' ? '白方' : '黑方';
        document.getElementById('player-color-badge').className = `px-2 py-1 rounded text-xs font-bold ${playerColor === 'w' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`;

        updateBoardOrientation();
        updateAnalysis();
        startTimer();

        if (playerColor === 'b') {
            window.setTimeout(makeAiMove, 500);
        }
    }

    function resetGame() {
        stopTimer();
        startNewGame();
    }

    function updateBoardOrientation() {
        board.orientation(playerColor === 'w' ? 'white' : 'black');
    }

    // --- 交互逻辑 ---
    function onDragStart(source, piece) {
        if (!isGameActive) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        if (game.turn() !== playerColor) return false;
    }

    function onDrop(source, target) {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        recordMove(move);
        updateAnalysis();
        checkGameOver();

        if (isGameActive) {
            window.setTimeout(makeAiMove, 250);
        }
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    // --- AI 引擎 (Minimax + Alpha-Beta) ---
    function makeAiMove() {
        if (!isGameActive) return;

        updateStatus("AI 思考中...");

        setTimeout(() => {
            const bestMove = getBestMove(game, aiDepth);
            game.move(bestMove);
            board.position(game.fen());
            recordMove(bestMove);
            updateAnalysis();
            checkGameOver();
        }, 100);
    }

    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    const pst_w = {
        p: [
            [100, 100, 100, 100, 105, 100, 100, 100],
            [78, 83, 86, 73, 102, 82, 85, 90],
            [7, 29, 21, 44, 40, 31, 44, 7],
            [-17, 16, -2, 15, 14, 0, 15, -13],
            [-26, 3, 10, 9, 6, 1, 0, -23],
            [-22, 9, 5, -11, -10, -2, 3, -19],
            [-31, 8, -7, -37, -36, -14, 3, -31],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        n: [
            [-66, -53, -75, -75, -10, -55, -58, -70],
            [-3, -6, 100, -36, 4, 62, -4, -14],
            [10, 67, 1, 74, 73, 27, 62, -2],
            [24, 24, 45, 37, 33, 41, 25, 17],
            [-1, 5, 31, 21, 22, 35, 2, 0],
            [-18, 10, 13, 22, 18, 15, 11, -14],
            [-23, -15, 2, 0, 2, 0, -23, -20],
            [-74, -23, -26, -24, -19, -35, -22, -69]
        ],
        b: [
            [-59, -78, -82, -76, -23, -107, -37, -50],
            [-11, 20, 35, -42, -39, 31, 2, -22],
            [-9, 39, -32, 41, 52, -10, 28, -14],
            [25, 17, 20, 34, 26, 25, 15, 10],
            [13, 10, 17, 23, 17, 16, 0, 7],
            [14, 25, 24, 15, 8, 25, 20, 15],
            [19, 20, 11, 6, 7, 6, 20, 16],
            [-7, 2, -15, -12, -14, -15, -10, -10]
        ],
        r: [
            [35, 29, 33, 4, 37, 33, 56, 50],
            [55, 29, 56, 67, 55, 62, 34, 60],
            [19, 35, 28, 33, 45, 27, 25, 15],
            [0, 5, 16, 13, 18, -4, -9, -6],
            [-28, -35, -16, -21, -13, -29, -46, -30],
            [-42, -28, -42, -25, -25, -35, -26, -46],
            [-53, -38, -31, -26, -29, -43, -44, -53],
            [-30, -24, -18, 5, -2, -18, -31, -32]
        ],
        q: [
            [6, 1, -8, -104, 69, 24, 88, 26],
            [14, 32, 60, -10, 20, 76, 57, 24],
            [-2, 43, 32, 60, 72, 63, 43, 2],
            [1, -16, 22, 17, 25, 20, -13, -6],
            [-14, -15, -2, -5, -1, -10, -20, -22],
            [-30, -6, -13, -11, -16, -11, -16, -27],
            [-36, -18, 0, -19, -15, -15, -21, -38],
            [-39, -30, -31, -13, -31, -36, -34, -42]
        ],
        k: [
            [4, 54, 47, -99, -99, 60, 83, -62],
            [-32, 10, 55, 56, 56, 55, 10, 3],
            [-62, 12, -57, 44, -67, 28, 37, -31],
            [-55, 50, 11, -4, -19, 13, 0, -49],
            [-55, -43, -52, -28, -51, -47, -8, -50],
            [-47, -42, -43, -79, -64, -32, -29, -32],
            [-4, 3, -14, -50, -57, -18, 13, 4],
            [17, 30, -3, -14, 6, -1, 40, 18]
        ]
    };

    const pst_b = {};
    for (let piece in pst_w) {
        pst_b[piece] = pst_w[piece].slice().reverse();
    }

    function evaluateBoard(gameInstance) {
        let totalEvaluation = 0;
        const boardArr = gameInstance.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = boardArr[i][j];
                if (piece) {
                    const value = pieceValues[piece.type];
                    const isWhite = piece.color === 'w';

                    let positionValue = 0;
                    if (isWhite) {
                        positionValue = pst_w[piece.type][i][j];
                    } else {
                        positionValue = pst_b[piece.type][i][j];
                    }

                    if (isWhite) {
                        totalEvaluation += (value + positionValue);
                    } else {
                        totalEvaluation -= (value + positionValue);
                    }
                }
            }
        }
        return totalEvaluation;
    }

    function minimax(gameInstance, depth, alpha, beta, isMaximizingPlayer) {
        if (depth === 0 || gameInstance.game_over()) {
            return evaluateBoard(gameInstance);
        }

        const moves = gameInstance.moves();

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                gameInstance.move(moves[i]);
                const eval = minimax(gameInstance, depth - 1, alpha, beta, false);
                gameInstance.undo();
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
                gameInstance.move(moves[i]);
                const eval = minimax(gameInstance, depth - 1, alpha, beta, true);
                gameInstance.undo();
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function getBestMove(gameInstance, depth) {
        const moves = gameInstance.moves();
        let bestMove = null;
        let bestValue = gameInstance.turn() === 'w' ? -Infinity : Infinity;

        for (let i = 0; i < moves.length; i++) {
            gameInstance.move(moves[i]);
            const boardValue = minimax(gameInstance, depth - 1, -Infinity, Infinity, gameInstance.turn() === 'w');
            gameInstance.undo();

            if (gameInstance.turn() === 'w') {
                if (boardValue > bestValue) {
                    bestValue = boardValue;
                    bestMove = moves[i];
                }
            } else {
                if (boardValue < bestValue) {
                    bestValue = boardValue;
                    bestMove = moves[i];
                }
            }
        }

        return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }

    // --- 辅助功能 ---
    function recordMove(move) {
        moveHistory.push(move.san);
        document.getElementById('pgn-display').value = game.pgn();
    }

    function updateStatus(message) {
        document.getElementById('status').innerText = message;
    }

    function checkGameOver() {
        if (game.in_checkmate()) {
            isGameActive = false;
            const winner = game.turn() === 'w' ? '黑方' : '白方';
            const result = winner === (playerColor === 'w' ? '白方' : '黑方') ? '胜利' : '失败';
            updateStatus(`游戏结束！${winner}获胜 (将死)`);
            saveHistory(result);
            stopTimer();
        } else if (game.in_draw()) {
            isGameActive = false;
            updateStatus("游戏结束！和棋");
            saveHistory('和棋');
            stopTimer();
        } else if (game.in_check()) {
            updateStatus("将军！");
        } else {
            updateStatus(game.turn() === 'w' ? "白方回合" : "黑方回合");
        }
    }

    // --- 开局识别 ---
    function updateAnalysis() {
        let openingName = "未知开局";
        let openingDesc = "继续走棋以获取更多信息...";

        const history = game.history();
        const movesStr = history.join(' ');

        if (movesStr.startsWith('e4 e5 Nf3 Nc6 Bb5')) {
            openingName = "西班牙开局 (Ruy Lopez)";
            openingDesc = "最古老且最受尊敬的开局之一，白方对黑方中心施加压力。";
        } else if (movesStr.startsWith('e4 e5 Nf3 Nc6 Bc4')) {
            openingName = "意大利开局 (Italian Game)";
            openingDesc = "白方象瞄准 f7 弱点，旨在快速出子控制中心。";
        } else if (movesStr.startsWith('e4 c5')) {
            openingName = "西西里防御 (Sicilian Defense)";
            openingDesc = "黑方不对称反击，导致激烈复杂的局面。";
        } else if (movesStr.startsWith('e4 e6')) {
            openingName = "法兰西防御 (French Defense)";
            openingDesc = "黑方巩固中心，但通常导致封闭局面。";
        } else if (movesStr.startsWith('d4 d5')) {
            openingName = "后兵拒弃兵 (Queen's Gambit Declined)";
            openingDesc = "经典的稳固防御，黑方坚守中心。";
        } else if (movesStr.startsWith('d4 Nf6')) {
            openingName = "印度防御体系 (Indian Defense)";
            openingDesc = "黑方允许白方占据中心，计划随后反击。";
        } else if (movesStr.startsWith('e4 e5 Nf3 Nc6')) {
            openingName = "双马防御/四马开局前置";
            openingDesc = "常见的开放性开局发展。";
        }

        document.getElementById('opening-name').innerText = openingName;
        document.getElementById('opening-desc').innerText = openingDesc;

        const evalScore = evaluateBoard(game) / 100;
        document.getElementById('eval-score').innerText = (evalScore > 0 ? "+" : "") + evalScore.toFixed(2);

        let percent = 50 + (evalScore * 5);
        percent = Math.max(5, Math.min(95, percent));
        document.getElementById('eval-bar').style.width = `${percent}%`;
        if (evalScore > 2) {
            document.getElementById('eval-bar').className = "h-2.5 rounded-full bg-green-600";
        } else if (evalScore < -2) {
            document.getElementById('eval-bar').className = "h-2.5 rounded-full bg-red-600";
        } else {
            document.getElementById('eval-bar').className = "h-2.5 rounded-full bg-blue-600";
        }
    }

    // --- 计时器 ---
    function startTimer() {
        stopTimer();
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const delta = Math.floor((Date.now() - startTime) / 1000);
            const m = Math.floor(delta / 60).toString().padStart(2, '0');
            const s = (delta % 60).toString().padStart(2, '0');
            document.getElementById('timer').innerText = `${m}:${s}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    // --- 历史记录 (LocalStorage) ---
    function saveHistory(result) {
        const historyItem = {
            date: new Date().toLocaleString(),
            result: result,
            difficulty: aiDepth,
            pgn: game.pgn()
        };
        let history = JSON.parse(localStorage.getItem('chess_history') || '[]');
        history.unshift(historyItem);
        if (history.length > 20) history.pop();
        localStorage.setItem('chess_history', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        const list = document.getElementById('history-list');
        const history = JSON.parse(localStorage.getItem('chess_history') || '[]');
        list.innerHTML = '';

        if (history.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">暂无对局记录</td></tr>';
            return;
        }

        history.forEach(item => {
            const row = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${item.result === '胜利' ? 'text-green-600' : (item.result === '失败' ? 'text-red-600' : 'text-gray-600')}">${item.result}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Level ${item.difficulty}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button class="text-blue-600 hover:text-blue-900" onclick="alert('PGN:\n${item.pgn.replace(/'/g, "\\'") }')">查看</button>
                    </td>
                </tr>
            `;
            list.innerHTML += row;
        });
    }

    function toggleHistoryModal() {
        const modal = document.getElementById('history-modal');
        modal.classList.toggle('hidden');
    }

    return {
        init,
        startNewGame,
        resetGame,
        toggleHistoryModal
    };
})();

document.addEventListener('DOMContentLoaded', app.init);
