from flask import Flask, render_template, request, jsonify
import chess
import math

app = Flask(__name__)
board = chess.Board()
game_mode = "two"  # "two" for two-player, "ai" for player vs AI

# ---------------- BOT SETUP ----------------
PIECE_VALUES = {chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
                chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 20000}

PST_PAWN = [
    0, 5, 5, -10, -10, 5, 5, 0,
    5, 10, 10, 0, 0, 10, 10, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, 5, 10, 25, 25, 10, 5, 5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
    70, 70, 70, 70, 70, 70, 70, 70,
    0, 0, 0, 0, 0, 0, 0, 0,
]
PST = {chess.PAWN: PST_PAWN, chess.KNIGHT: PST_PAWN, chess.BISHOP: PST_PAWN,
       chess.ROOK: PST_PAWN, chess.QUEEN: PST_PAWN, chess.KING: PST_PAWN}


def evaluate_board(b: chess.Board) -> int:
    score = 0
    for square in chess.SQUARES:
        piece = b.piece_at(square)
        if piece is None: continue
        val = PIECE_VALUES[piece.piece_type]
        pst = PST.get(piece.piece_type, [0] * 64)
        pst_val = pst[square] if piece.color else -pst[chess.square_mirror(square)]
        score += val + pst_val if piece.color else -(val + pst_val)
    return score


def order_moves(b: chess.Board, moves):
    return sorted(moves, key=lambda m: 0 if b.is_capture(m) else 1)


def alphabeta(b, depth, alpha, beta, maximizing):
    if depth == 0 or b.is_game_over():
        return evaluate_board(b), None
    best_move = None
    if maximizing:
        value = -math.inf
        for move in order_moves(b, list(b.legal_moves)):
            b.push(move)
            score, _ = alphabeta(b, depth - 1, alpha, beta, False)
            b.pop()
            if score > value:
                value = score
                best_move = move
            alpha = max(alpha, value)
            if alpha >= beta: break
        return value, best_move
    else:
        value = math.inf
        for move in order_moves(b, list(b.legal_moves)):
            b.push(move)
            score, _ = alphabeta(b, depth - 1, alpha, beta, True)
            b.pop()
            if score < value:
                value = score
                best_move = move
            beta = min(beta, value)
            if alpha >= beta: break
        return value, best_move


def choose_move(b, depth=2):
    _, move = alphabeta(b, depth, -math.inf, math.inf, b.turn)
    return move


# ---------------- FLASK ROUTES ----------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/set_mode', methods=['POST'])
def set_mode():
    """Set game mode: 'two' or 'ai'"""
    global game_mode, board
    data = request.get_json()
    if not data or 'mode' not in data:
        return jsonify(success=False)
    game_mode = data['mode']
    board = chess.Board()  # reset board when mode changes
    return jsonify(success=True)


@app.route('/state')
def state():
    return jsonify(
        fen=board.fen(),
        turn='w' if board.turn else 'b',
        is_check=board.is_check(),
        is_checkmate=board.is_checkmate(),
        is_stalemate=board.is_stalemate()
    )


@app.route('/legal')
def legal():
    return jsonify(moves=[str(m) for m in board.legal_moves])


@app.route('/move', methods=['POST'])
def move():
    global board
    data = request.get_json()
    if not data or 'move' not in data:
        return jsonify(success=False)

    uci = data['move']
    try:
        mv = chess.Move.from_uci(uci)
    except ValueError:
        return jsonify(success=False)

    if mv in board.legal_moves:
        board.push(mv)
        # ---- BOT TURN IF AI MODE ----
        if game_mode == "ai" and not board.is_game_over() and not board.turn:
            bot_mv = choose_move(board, depth=2)
            if bot_mv:
                board.push(bot_mv)
        return jsonify(success=True)
    return jsonify(success=False)


@app.route('/reset', methods=['POST'])
def reset():
    global board
    board = chess.Board()
    return jsonify(success=True)


if __name__ == '__main__':
    app.run(debug=True)
