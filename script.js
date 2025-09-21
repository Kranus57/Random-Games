/* =========================
   Shared helpers
   ========================= */
function el(id) { return document.getElementById(id); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* Optional: helper to report score/result to backend if you add an endpoint.
   You can wire this to a Flask route like POST /game/result that updates leaderboard.
*/
async function reportResult(game, result, score=0) {
  // Example (uncomment when backend route exists):
  // await fetch('/game/result', {
  //   method: 'POST',
  //   headers: {'Content-Type':'application/json'},
  //   body: JSON.stringify({game, result, score})
  // });
}

/* =========================
   SNAKE
   ========================= */
function setupSnake() {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 20;                 // cell size
  const cols = canvas.width / size;
  const rows = canvas.height / size;

  let snake, dir, food, running, timer, speed, score;
  const scoreEl = el('snakeScore');
  const startBtn = el('snakeStartBtn');
  const pauseBtn = el('snakePauseBtn');

  function init() {
    snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}];
    dir = {x:1, y:0};
    placeFood();
    running = false;
    speed = 120; // ms
    score = 0;
    scoreEl.textContent = `Score: ${score}`;
    draw();
  }

  function placeFood() {
    let ok=false;
    while(!ok) {
      food = {x: randInt(0, cols-1), y: randInt(0, rows-1)};
      ok = !snake.some(s => s.x===food.x && s.y===food.y);
    }
  }

  function step() {
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    // wrap
    if (head.x < 0) head.x = cols-1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows-1;
    if (head.y >= rows) head.y = 0;
    // collision with self
    if (snake.some(s => s.x===head.x && s.y===head.y)) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = `Score: ${score}`;
      placeFood();
      // speed up a bit
      speed = Math.max(50, speed - 3);
    } else {
      snake.pop();
    }
    draw();
    if (running) timer = setTimeout(step, speed);
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // food
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(food.x*size+2, food.y*size+2, size-4, size-4);
    // snake
    snake.forEach((s,i) => {
      ctx.fillStyle = i===0 ? '#00ffcc' : '#1e1e1e';
      ctx.fillRect(s.x*size+1, s.y*size+1, size-2, size-2);
    });
  }

  function gameOver() {
    running = false;
    clearTimeout(timer);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvas.height/2 - 30, canvas.width, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Game Over • Score: ${score}`, canvas.width/2, canvas.height/2+8);
    // optional report
    // reportResult('Snake', 'loss', score);
  }

  // Controls
  window.addEventListener('keydown', (e) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) return;
    const key = e.key;
    if (key==='ArrowUp' || key==='w')   { if (dir.y !== 1) dir = {x:0, y:-1}; }
    if (key==='ArrowDown' || key==='s') { if (dir.y !== -1) dir = {x:0, y:1}; }
    if (key==='ArrowLeft' || key==='a') { if (dir.x !== 1) dir = {x:-1, y:0}; }
    if (key==='ArrowRight' || key==='d') { if (dir.x !== -1) dir = {x:1, y:0}; }
    if (!running) { running = true; clearTimeout(timer); timer = setTimeout(step, speed); }
  });

  startBtn.onclick = () => {
    init();
    running = true;
    clearTimeout(timer);
    timer = setTimeout(step, speed);
  };
  pauseBtn.onclick = () => {
    running = !running;
    if (running) timer = setTimeout(step, speed); else clearTimeout(timer);
    pauseBtn.textContent = running ? 'Pause' : 'Resume';
  };

  init();
}

/* =========================
   MEMORY MATCH
   ========================= */
function setupMemory() {
  const grid = document.getElementById('memoryGrid');
  const triesEl = el('memoryTries');
  const message = el('memoryMessage');
  const resetBtn = el('memoryReset');
  if (!grid) return;

  const symbols = ['🍎','🍌','🍇','🍒','🍉','🍍','🥝','🍑']; // 8 pairs -> 16 cards
  let cards, first, second, lock, tries, matches;

  function newGame() {
    const deck = symbols.concat(symbols).sort(() => Math.random() - 0.5);
    grid.innerHTML = '';
    deck.forEach((sym, i) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.symbol = sym;
      card.dataset.index = i;
      card.textContent = ''; // hidden
      card.style.userSelect = 'none';
      card.onclick = () => flip(card);
      grid.appendChild(card);
    });
    cards = Array.from(document.querySelectorAll('.memory-card'));
    first = null; second = null; lock = false; tries = 0; matches = 0;
    triesEl.textContent = `Tries: ${tries}`;
    message.textContent = '';
    // make responsive grid columns: 4x4
    grid.style.gridTemplateColumns = 'repeat(4, 100px)';
  }

  function flip(card) {
    if (lock || card === first || card.classList.contains('matched')) return;
    card.textContent = card.dataset.symbol;
    card.style.background = '#00ffcc22';
    if (!first) {
      first = card;
    } else {
      second = card;
      lock = true;
      tries++;
      triesEl.textContent = `Tries: ${tries}`;
      if (first.dataset.symbol === second.dataset.symbol) {
        first.classList.add('matched');
        second.classList.add('matched');
        matches++;
        lock = false; first = null; second = null;
        if (matches === symbols.length) {
          message.textContent = `You win! Completed in ${tries} tries.`;
          // reportResult('Memory', 'win');
        }
      } else {
        setTimeout(() => {
          first.textContent = ''; second.textContent = '';
          first.style.background = ''; second.style.background = '';
          first = null; second = null; lock = false;
        }, 700);
      }
    }
  }

  resetBtn.onclick = newGame;
  newGame();
}

/* =========================
   2048
   ========================= */
function setup2048() {
  const boardEl = document.getElementById('board2048');
  const scoreEl = el('score2048');
  const newBtn = el('new2048');
  const msg = el('msg2048');
  if (!boardEl) return;

  const size = 4;
  let grid, score;

  function init() {
    grid = Array.from({length:size}, () => Array(size).fill(0));
    score = 0; updateScore();
    addTile(); addTile();
    render();
    msg.textContent = '';
  }

  function addTile() {
    const empties = [];
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) if (grid[r][c]===0) empties.push([r,c]);
    if (empties.length===0) return;
    const [r,c] = empties[Math.floor(Math.random()*empties.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function updateScore() { scoreEl.textContent = score; }

  function moveLeft(row) {
    let arr = row.filter(v => v!==0);
    for (let i=0;i<arr.length-1;i++) {
      if (arr[i]===arr[i+1]) {
        arr[i]*=2; score+=arr[i]; arr.splice(i+1,1);
      }
    }
    while(arr.length < size) arr.push(0);
    return arr;
  }

  function rotateGrid(g) {
    // rotate clockwise
    const newG = Array.from({length:size}, ()=>Array(size).fill(0));
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) newG[c][size-1-r] = g[r][c];
    return newG;
  }

  function moved(oldG, newG) {
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) if (oldG[r][c]!==newG[r][c]) return true;
    return false;
  }

  function move(direction) {
    // 0:left,1:up,2:right,3:down
    let rotated = grid.map(row=>row.slice());
    for (let i=0;i<direction;i++) rotated = rotateGrid(rotated);
    const before = JSON.stringify(rotated);
    const newGrid = rotated.map(r => moveLeft(r));
    if (before === JSON.stringify(newGrid)) return false;
    // rotate back
    let finalGrid = newGrid;
    for (let i=0;i<(4-direction)%4;i++) finalGrid = rotateGrid(finalGrid);
    grid = finalGrid;
    return true;
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r=0;r<size;r++) {
      const row = document.createElement('div'); row.className='grid-row';
      for (let c=0;c<size;c++) {
        const tile = document.createElement('div'); tile.className = 'tile';
        const val = grid[r][c];
        tile.textContent = val === 0 ? '' : val;
        tile.style.background = tileColor(val);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
    updateScore();
  }

  function tileColor(val) {
    const map = {
      0:'#1e1e1e',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',
      32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',
      1024:'#edc53f',2048:'#edc22e'
    };
    return map[val] || '#3c3a32';
  }

  document.addEventListener('keydown', (e) => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    const dir = {'ArrowLeft':0,'ArrowUp':1,'ArrowRight':2,'ArrowDown':3}[e.key];
    if (move(dir)) {
      addTile(); render();
      if (checkWin()) { msg.textContent = 'You reached 2048!'; /* reportResult('2048','win',score); */ }
      else if (checkLose()) { msg.textContent = 'Game Over'; /* reportResult('2048','loss',score); */ }
    }
  });

  function checkWin() {
    return grid.some(row => row.some(v => v >= 2048));
  }
  function checkLose() {
    // no empty and no merges possible
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) if (grid[r][c]===0) return false;
    for (let r=0;r<size;r++) for (let c=0;c<size-1;c++) if (grid[r][c]===grid[r][c+1]) return false;
    for (let c=0;c<size;c++) for (let r=0;r<size-1;r++) if (grid[r][c]===grid[r+1][c]) return false;
    return true;
  }

  newBtn.onclick = () => init();
  init();
}

/* =========================
   FLAPPY BIRD
   ========================= */
function setupFlappy() {
  const canvas = document.getElementById('flappyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const startBtn = el('flappyStart');
  const pauseBtn = el('flappyPause');
  const scoreEl = el('flappyScore');
  const W = canvas.width, H = canvas.height;

  let bird, pipes, timer, running, gravity, lift, score, gap, speed;

  function init() {
    bird = {x:80, y: H/2, vx:0, vy:0, r:12};
    gravity = 0.6; lift = -10; gap = 160; speed = 2.2;
    pipes = []; score = 0; running = false;
    scoreEl.textContent = `Score: ${score}`;
    spawnPipe();
    draw();
  }

  function spawnPipe() {
    const top = randInt(60, H - gap - 60);
    pipes.push({x: W, top: top, bottom: top + gap, passed:false});
  }

  function step() {
    // physics
    bird.vy += gravity;
    bird.y += bird.vy;
    // pipes
    for (let p of pipes) { p.x -= speed; }
    if (pipes.length === 0 || pipes[pipes.length-1].x < W - 200) spawnPipe();
    // check collisions & score
    for (let p of pipes) {
      if (!p.passed && p.x + 50 < bird.x) { p.passed = true; score++; scoreEl.textContent = `Score: ${score}`; }
      // collision bounding box
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + 50) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.bottom) { gameOver(); return; }
      }
    }
    // offscreen or ground
    if (bird.y - bird.r < 0 || bird.y + bird.r > H) { gameOver(); return; }
    // remove off-screen pipes
    if (pipes.length && pipes[0].x < -100) pipes.shift();
    draw();
    if (running) timer = requestAnimationFrame(step);
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    // pipes
    for (let p of pipes) {
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(p.x, 0, 50, p.top);
      ctx.fillRect(p.x, p.bottom, 50, H - p.bottom);
    }
    // bird
    ctx.beginPath(); ctx.fillStyle = '#ffde00';
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill();
    // score
    ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 12, 28);
  }

  function flap() { bird.vy = lift; if (!running) { start(); } }

  function start() { if (running) return; running = true; cancelAnimationFrame(timer); timer = requestAnimationFrame(step); }
  function pause() { running = !running; if (running) timer = requestAnimationFrame(step); else cancelAnimationFrame(timer); }
  function gameOver() {
    running = false; cancelAnimationFrame(timer);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H/2 - 40, W, 80);
    ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Game Over • Score: ${score}`, W/2, H/2+10);
    // optional report:
    // reportResult('Flappy', score >= 10 ? 'win':'loss', score);
  }

  // Input
  canvas.addEventListener('click', () => flap());
  document.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } });

  startBtn.onclick = () => { init(); start(); };
  pauseBtn.onclick = () => { pause(); pauseBtn.textContent = running ? 'Pause' : 'Resume'; };

  init();
}

/* =========================
   Auto-detect pages and init
   ========================= */
window.addEventListener('DOMContentLoaded', () => {
  // If individual pages directly call their setup functions (we used inline calls),
  // they will initialize. This block provides an extra safety net:
  if (document.getElementById('snakeCanvas')) { /*setupSnake();*/ }
  if (document.getElementById('memoryGrid')) { /*setupMemory();*/ }
  if (document.getElementById('board2048')) { /*setup2048();*/ }
  if (document.getElementById('flappyCanvas')) { /*setupFlappy();*/ }
});
