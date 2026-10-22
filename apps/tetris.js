/* tetris.exe - hand-rolled blocks, zero libraries. registers into KipGames. */
(function () {
  var CELLC = 24, COLS = 10, ROWS = 20;
  var PIECES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[1,1,1],[0,1,0]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
  };
  var COLORS = { I: "#ffd98a", O: "#ffcad9", T: "#a8d4f7", S: "#bdeccf", Z: "#ff9fb2", J: "#cbb8ff", L: "#ffe59a" };

  function mod() { return window.KipGames.modules.tetris || {}; }

  function mount(host, isDead) {
    host.innerHTML =
      '<div class="tet-wrap">' +
        '<canvas class="tet-canvas" width="' + (CELLC * COLS) + '" height="' + (CELLC * ROWS) + '"></canvas>' +
        '<div class="tet-side">' +
          '<div class="tet-score gm-panel"><div class="gm-best">score</div><h3 class="pixel" data-tet-score>0</h3>' +
          '<div class="gm-best">best</div><div class="pixel" data-tet-best>0</div></div>' +
          '<canvas class="tet-nxt" width="96" height="96"></canvas>' +
          '<div class="tet-pad">' +
            '<button class="gm-btn" data-tet="left">left</button>' +
            '<button class="gm-btn" data-tet="rot">rot</button>' +
            '<button class="gm-btn" data-tet="right">right</button>' +
            '<button class="gm-btn" data-tet="drop">drop</button>' +
          '</div>' +
          '<button class="gm-btn" data-tet="pause">pause</button>' +
        '</div>' +
      '</div>' +
      '<p class="flp-hint">arrows or the buttons. space = hard drop. blocks fall faster as you fail upward.</p>';

    var cv = host.querySelector(".tet-canvas"), nx = host.querySelector(".tet-nxt");
    var ctx = cv.getContext("2d"), nctx = nx.getContext("2d");
    var bestEl = host.querySelector("[data-tet-best]"), scoreEl = host.querySelector("[data-tet-score]");
    var best = +(localStorage.getItem("kip-tetris-best") || 0);
    bestEl.textContent = best;

    var grid, cur, nxt, bag, score, lines, level, over, paused, raf = 0, last = 0, dropT = 0;

    function newBag() {
      var k = ["I","O","T","S","Z","J","L"], i, j, t;
      for (i = 0; i < 7; i++) { j = i + Math.floor(Math.random() * (7 - i)); t = k[i]; k[i] = k[j]; k[j] = t; }
      return k;
    }
    function refill() { if (!bag.length) bag = newBag(); return bag.pop(); }

    function spawn() {
      cur = nxt || trackPiece({ k: refill(), r: 0, x: 3, y: -1 });
      nxt = trackPiece({ k: refill(), r: 0, x: 0, y: 0 });
      if (hits(grid, cur.shape(), cur.x, cur.y)) endGame();
    }
    function shapeOf(k, r) {
      var m = PIECES[k], c = m.map(function (row) { return row.slice(); }), n = c.length;
      for (var i = 0; i < r % 4; i++) {
        for (var y = 0; y < n; y++) for (var x = 0; x < y; x++) {
          var t = c[y][x]; c[y][x] = c[x][y]; c[x][y] = t;
        }
        c.forEach(function (row) { row.reverse(); });
      }
      return c;
    }
    function trackPiece(p) {
      p.shape = function () { return shapeOf(p.k, p.r); };
      return p;
    }

    function hits(g, sh, px, py) {
      for (var y = 0; y < sh.length; y++) for (var x = 0; x < sh[y].length; x++) {
        if (!sh[y][x]) continue;
        var gx = px + x, gy = py + y;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && g[gy][gx]) return true;
      }
      return false;
    }
    function lock() {
      var sh = cur.shape(), i, j, cleared = 0;
      sh.forEach(function (row, y) { row.forEach(function (v, x) {
        if (v && cur.y + y >= 0) grid[cur.y + y][cur.x + x] = cur.k;
      }); });
      for (var y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(Boolean)) {
          grid.splice(y, 1); grid.unshift(new Array(COLS).fill(null)); cleared++; y++;
        }
      }
      if (cleared) {
        score += [0, 100, 300, 500, 800][cleared] * level;
        lines += cleared;
        level = 1 + Math.floor(lines / 8);
        window.KipSound[cleared >= 4 ? "shock" : "open"]();
        scoreEl.textContent = score;
        if (score > best) { best = score; localStorage.setItem("kip-tetris-best", best); bestEl.textContent = best; }
      } else window.KipSound.tick();
      spawn();
      drawNext();
    }
    function step() {
      if (hits(grid, cur.shape(), cur.x, cur.y + 1)) lock(); else cur.y++;
    }
    function hardDrop() {
      while (!hits(grid, cur.shape(), cur.x, cur.y + 1)) cur.y++;
      lock();
    }
    function shift(dx) { if (!hits(grid, cur.shape(), cur.x + dx, cur.y)) cur.x += dx; }
    function tryRot() {
      var p = trackPiece({ k: cur.k, r: (cur.r + 1) % 4, x: cur.x, y: cur.y });
      var kicks = [0, -1, 1, -2, 2], k;
      for (k = 0; k < kicks.length; k++) {
        if (!hits(grid, p.shape(), p.x + kicks[k], p.y)) { p.x += kicks[k]; cur = p; return; }
      }
    }
    function endGame() {
      over = true;
      window.KipSound.shock();
      if (score > best) { best = score; localStorage.setItem("kip-tetris-best", best); bestEl.textContent = best; }
      overPanel();
    }
    function overPanel() {
      var ov = document.createElement("div");
      ov.className = "gm-panel tet-over";
      ov.style.marginTop = "10px";
      ov.innerHTML = '<h4 class="pixel">the stack got you.</h4><p class="gm-best">score: ' + score + ' - best: ' + best + '</p>' +
        '<button class="gm-btn" data-tet="again" style="margin-top:8px">one more</button>';
      cv.parentNode.appendChild(ov);
      ov.querySelector("[data-tet=again]").addEventListener("click", function () { ov.remove(); start(); });
    }
    function drawNext() {
      nctx.clearRect(0, 0, 96, 96);
      if (!nxt) return;
      var sh = shapeOf(nxt.k, 0), s = 18, w = sh[0].length, h = sh.length, ox = (96 - w * s) / 2, oy = (96 - h * s) / 2;
      sh.forEach(function (row, y) { row.forEach(function (v, x) {
        if (!v) return;
        nctx.fillStyle = COLORS[nxt.k]; nctx.strokeStyle = "#4a3b4f"; nctx.lineWidth = 2;
        nctx.fillRect(ox + x * s + 2, oy + y * s + 2, s - 4, s - 4);
        nctx.strokeRect(ox + x * s + 2, oy + y * s + 2, s - 4, s - 4);
      }); });
    }
    function draw() {
      ctx.fillStyle = "#2b2138"; ctx.fillRect(0, 0, cv.width, cv.height);
      var y, x, sh = cur ? cur.shape() : [], gy = cur ? cur.y : 0;
      for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
        if (grid[y][x]) cell(x, y, COLORS[grid[y][x]]);
      }
      if (cur && !over) {
        var ghost = 0; while (!hits(grid, sh, cur.x, gy + ghost + 1)) ghost++;
        for (y = 0; y < sh.length; y++) for (x = 0; x < sh[y].length; x++) {
          if (sh[y][x] && gy + ghost + y >= 0) {
            ctx.globalAlpha = .22; cell(cur.x + x, gy + ghost + y, "#ffffff"); ctx.globalAlpha = 1;
          }
        }
        for (y = 0; y < sh.length; y++) for (x = 0; x < sh[y].length; x++) {
          if (sh[y][x] && gy + y >= 0) cell(cur.x + x, gy + y, COLORS[cur.k]);
        }
      }
    }
    function cell(x, y, col) {
      ctx.fillStyle = col; ctx.strokeStyle = "#4a3b4f"; ctx.lineWidth = 1.5;
      ctx.fillRect(x * CELLC + 1, y * CELLC + 1, CELLC - 2, CELLC - 2);
      ctx.strokeRect(x * CELLC + 1.5, y * CELLC + 1.5, CELLC - 3, CELLC - 3);
    }
    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (isDead()) { cancelAnimationFrame(raf); return; }
      if (!over && !paused) {
        var sp = Math.max(90, 620 - level * 46);
        if (t - dropT > sp) { dropT = t; step(); }
      }
      ctx.save(); draw(); ctx.restore();
    }
    function start() {
      grid = Array.from({ length: ROWS }, function () { return new Array(COLS).fill(null); });
      bag = newBag(); score = 0; lines = 0; level = 1; over = paused = false;
      cur = null; nxt = null;
      spawn(); scoreEl.textContent = "0"; drawNext();
    }
    function key(e) {
      if (over) return;
      if (paused && e.key !== "p") return;
      if (["ArrowLeft","a","A"].indexOf(e.key) > -1) { shift(-1); e.preventDefault(); }
      else if (["ArrowRight","d","D"].indexOf(e.key) > -1) { shift(1); e.preventDefault(); }
      else if (["ArrowUp","w","W"].indexOf(e.key) > -1) { tryRot(); e.preventDefault(); }
      else if (e.key === " ") { hardDrop(); e.preventDefault(); }
      else if (e.key === "p") { paused = !paused; }
    }
    document.addEventListener("keydown", key);

    host.querySelectorAll("[data-tet]").forEach(function (btn) {
      var a = btn.getAttribute("data-tet");
      btn.addEventListener("click", function () {
        window.KipSound.click();
        if (a === "left") shift(-1);
        else if (a === "right") shift(1);
        else if (a === "rot") tryRot();
        else if (a === "drop") hardDrop();
        else if (a === "pause") { paused = !paused; btn.classList.toggle("on", paused); }
      });
    });

    start();
    raf = requestAnimationFrame(loop);

    return {
      destroy: function () {
        document.removeEventListener("keydown", key);
        cancelAnimationFrame(raf);
      }
    };
  }

  window.KipGames.modules.tetris = {
    mount: mount,
    destroy: function () {}
  };
})();
