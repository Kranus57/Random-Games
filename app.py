from flask import Flask, render_template, request, jsonify
import json, os

app = Flask(__name__)

# Load or create leaderboard
if not os.path.exists("leaderboard.json"):
    with open("leaderboard.json", "w") as f:
        json.dump({}, f)

def load_leaderboard():
    with open("leaderboard.json", "r") as f:
        return json.load(f)

def save_leaderboard(data):
    with open("leaderboard.json", "w") as f:
        json.dump(data, f, indent=4)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/snake")
def snake():
    return render_template("snake.html")

@app.route("/rps")
def rps():
    return render_template("rps.html")

@app.route("/tic_tac_toe")
def tic_tac_toe():
    return render_template("tic_tac_toe.html")

@app.route("/chess")
def chess():
    return render_template("chess.html")

@app.route("/memory")
def memory():
    return render_template("memory.html")

@app.route("/game2048")
def game2048():
    return render_template("game2048.html")

@app.route("/flappy")
def flappy():
    return render_template("flappy.html")

@app.route("/leaderboard")
def leaderboard():
    data = load_leaderboard()
    return render_template("leaderboard.html", leaderboard=data)

@app.route("/report_result", methods=["POST"])
def report_result():
    content = request.json
    game = content["game"]
    result = content["result"]
    score = content.get("score", 0)

    leaderboard = load_leaderboard()
    if game not in leaderboard:
        leaderboard[game] = []
    leaderboard[game].append({"result": result, "score": score})
    save_leaderboard(leaderboard)

    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)
