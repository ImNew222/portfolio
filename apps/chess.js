/* chess.exe - homemade legality + stockfish (GPLv3, vendored single-thread wasm).
   You tap a piece, legal dots appear, tap a target. The engine thinks at your chosen
   skill level and answers with bestmove. Auto-queen promotion, castling, en passant. */
(function () {
  var FILES = "abcdefgh";
  var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
  var SKILLS = [{ l: "chill", v: 2 }, { l: "fair", v: 8 }, { l: "rude", v: 15 }, { l: "uh oh", v: 20 }];

  function sq(i) { return FILES[i % 8] + (8 - ((i / 8) | 0)); }
  function parse(b) {
    var arr = new Array(64).fill(".");
    var i = 0;
    b.split("/").forEach(function (row) {
      row.split("").forEach(function (c) {
        if (c >= "1" && c <= "8") i += +c; else arr[i++] = c;
      });
    });
    return arr;
  }
  function clone(b) { return b.slice(); }

  function isW(c) { return c !== "." && c === c.toUpperCase(); }
  function sideOf(c) { return c === "." ? null : isW(c) ? "w" : "b"; }

  var KN = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
  var KG = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  var BR = [[-1,-1],[-1,1],[1,-1],[1,1]];
  var RO = [[-1,0],[1,0],[0,-1],[0,1]];

  function onFile(x, y) { return ((x % 8) + 8) % 8 === ((y % 8) + 8) % 8; }

  /* attacked(board, s, by): true if side `by` attacks square s.
     Inverse model: pawn/knight/king candidate squares looked up directly;
     sliders walk outward from s until blocked. */
  function attacked(board, s, by) {
    var x = s % 8, y = (s / 8) | 0, i, j, d, nx, ny, g;
    var pf = by === "w" ? [s + 7, s + 9] : [s - 7, s - 9];
    for (i = 0; i < 2; i++) {
      j = pf[i];
      if (j < 0 || j > 63) continue;
      if (Math.abs((j % 8) - x) !== 1) continue;
      if (board[j] === (by === "w" ? "P" : "p")) return true;
    }
    for (i = 0; i < KN.length; i++) {
      nx = x + KN[i][0]; ny = y + KN[i][1];
      if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
      if (board[ny * 8 + nx] === (by === "w" ? "N" : "n")) return true;
    }
    for (i = 0; i < KG.length; i++) {
      nx = x + KG[i][0]; ny = y + KG[i][1];
      if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
      if (board[ny * 8 + nx] === (by === "w" ? "K" : "k")) return true;
    }
    for (i = 0; i < BR.length; i++) {
      for (d = 1; d < 8; d++) {
        nx = x + BR[i][0] * d; ny = y + BR[i][1] * d;
        if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
        g = board[ny * 8 + nx];
        if (g === ".") continue;
        if (sideOf(g) === by && (g.toLowerCase() === "q" || g.toLowerCase() === "b")) return true;
        break;
      }
    }
    for (i = 0; i < RO.length; i++) {
      for (d = 1; d < 8; d++) {
        nx = x + RO[i][0] * d; ny = y + RO[i][1] * d;
        if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
        g = board[ny * 8 + nx];
        if (g === ".") continue;
        if (sideOf(g) === by && (g.toLowerCase() === "q" || g.toLowerCase() === "r")) return true;
        break;
      }
    }
    return false;
  }
  function kingSq(board, side) {
    var k = side === "w" ? "K" : "k";
    for (var i = 0; i < 64; i++) if (board[i] === k) return i;
    return -1;
  }

  /* state = {b, rights:{K,Q,k,q}, ep} ; returns pseudo moves [{f,t,flag}] for side */
  function pseudoMoves(st, side) {
    var mv = [], b = st.b, i, c, t;
    function push(f, tt, flag) { mv.push({ f: f, t: tt, flag: flag || "" }); }
    for (i = 0; i < 64; i++) {
      c = b[i];
      if (c === "." || sideOf(c) !== side) continue;
      t = c.toLowerCase();
      var x = i % 8, y = (i / 8) | 0;
      if (t === "p") {
        var dir = side === "w" ? -8 : 8, one = i + dir;
        if (one >= 0 && one < 64 && b[one] === ".") {
          var lastRank = side === "w" ? 0 : 7;
          if (((one / 8) | 0) === lastRank) push(i, one, "q"); else push(i, one);
          var startRank = side === "w" ? 6 : 1;
          var two = i + dir * 2;
          if (((i / 8) | 0) === startRank && b[two] === ".") push(i, two, "2");
        }
        [-1, 1].forEach(function (df) {
          var j = one + df;
          if (j < 0 || j > 63) return;
          if (Math.abs((j % 8) - (i % 8)) !== 1) return;
          if (b[j] !== "." && sideOf(b[j]) !== side) {
            var lr = side === "w" ? 0 : 7;
            if (((j / 8) | 0) === lr) push(i, j, "q"); else push(i, j);
          } else if (b[j] === "." && j === st.ep) push(i, j, "ep");
        });
      } else if (t === "n" || t === "k") {
        var offs = t === "n" ? KN : KG;
        for (var k = 0; k < offs.length; k++) {
          var nx = x + offs[k][0], ny = y + offs[k][1];
          if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
          var j = ny * 8 + nx;
          if (b[j] === "." || sideOf(b[j]) !== side) push(i, j);
        }
        if (t === "k") {
          var home = side === "w" ? 60 : 4;
          if (i === home && !attacked(b, home, side === "w" ? "b" : "w")) {
            var rR = side === "w" ? 63 : 7, rL = side === "w" ? 56 : 0;
            var rr = side === "w" ? "R" : "r", rrq = side === "w" ? "R" : "r";
            var foe = side === "w" ? "b" : "w";
            if (st.rights[(side === "w" ? "K" : "k")] && b[rR] === rr && b[home + 1] === "." && b[home + 2] === "." &&
              !attacked(b, home + 1, foe) && !attacked(b, home + 2, foe)) push(i, home + 2, "ck");
            if (st.rights[(side === "w" ? "Q" : "q")] && b[rL] === rrq && b[home - 1] === "." && b[home - 2] === "." && b[home - 3] === "." &&
              !attacked(b, home - 1, foe) && !attacked(b, home - 2, foe)) push(i, home - 2, "cq");
          }
        }
      } else {
        var rays = t === "b" ? BR : t === "r" ? RO : BR.concat(RO);
        for (var r = 0; r < rays.length; r++) {
          for (var d = 1; d < 8; d++) {
            nx = x + rays[r][0] * d; ny = y + rays[r][1] * d;
            if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
            var jj = ny * 8 + nx;
            if (b[jj] === ".") push(i, jj);
            else { if (sideOf(b[jj]) !== side) push(i, jj); break; }
          }
        }
      }
    }
    return mv;
  }

  function applyMove(st, m) {
    var b = clone(st.b), c = b[m.f], p = c.toLowerCase();
    b[m.f] = ".";
    if (m.flag === "ep") b[m.t + (c === "P" ? 8 : -8)] = ".";
    b[m.t] = (m.flag === "q") ? (c === "P" ? "Q" : "q") : c;
    /* castling: relocate rook */
    if (m.flag === "ck") { b[m.t + 1] = "."; b[m.t - 1] = (c === "K" ? "R" : "r"); }
    if (m.flag === "cq") { b[m.t - 2] = "."; b[m.t + 1] = (c === "K" ? "R" : "r"); }
    var rights = Object.assign({}, st.rights);
    if (p === "k") {
      if (c === "K") { rights.K = false; rights.Q = false; }
      else { rights.k = false; rights.q = false; }
    }
    if (m.f === 63 || m.t === 63 || m.f === 60 || m.t === 60) rights.K = false;
    if (m.f === 56 || m.t === 56 || m.f === 60 || m.t === 60) rights.Q = false;
    if (m.f === 7 || m.t === 7 || m.f === 4 || m.t === 4) rights.k = false;
    if (m.f === 0 || m.t === 0 || m.f === 4 || m.t === 4) rights.q = false;
    var ep = -1;
    if (m.flag === "2") ep = (m.f + m.t) / 2;
    return { b: b, rights: rights, ep: ep };
  }

  function legalMoves(st, side) {
    var foe = side === "w" ? "b" : "w";
    return pseudoMoves(st, side).filter(function (m) {
      var ns = applyMove(st, m);
      return !attacked(ns.b, kingSq(ns.b, side), foe);
    });
  }
  function inCheck(st, side) {
    return attacked(st.b, kingSq(st.b, side), side === "w" ? "b" : "w");
  }

  /* ---------- tiny svg piece set ---------- */
  var SW = 'stroke="#4a3b4f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  function pieceSvg(c) {
    var fill = c === c.toUpperCase() ? "#fff7ea" : "#4a3b4f";
    var F = 'fill="' + fill + '"';
    switch (c.toLowerCase()) {
      case "p": return '<svg viewBox="0 0 32 32" class="ch-pc"><circle cx="16" cy="12" r="6" ' + F + " " + SW + '/><path d="M10 27 q0-8 6-8 q6 0 6 8 z" ' + F + " " + SW + "/></svg>";
      case "n": return '<svg viewBox="0 0 32 32" class="ch-pc"><path d="M9 26 h14 v-3 q0-3-3-4 l2-6 q-1-8-8-9 l-1 3 h-3 v3 q-4 2-5 7 l2 2 q2-2 4-2 z" ' + F + " " + SW + '/><circle cx="16" cy="10.5" r="1.2" fill="#4a3b4f" opacity=".0"/></svg>';
      case "b": return '<svg viewBox="0 0 32 32" class="ch-pc"><path d="M16 5 q4 2 4 6 q0 4-4 6 q-4-2-4-6 q0-4 4-6 z" ' + F + " " + SW + '/><path d="M11 27 q0-5 5-5 q5 0 5 5 z" ' + F + " " + SW + '/></svg>';
      case "r": return '<svg viewBox="0 0 32 32" class="ch-pc"><path d="M8 12 v15 h16 v-15 z" ' + F + " " + SW + '/><path d="M8 12 v-4 h3 v3 h4 v-3 h2 v3 h4 v-3 h3 v4 z" ' + F + " " + SW + "/></svg>";
      case "q": return '<svg viewBox="0 0 32 32" class="ch-pc"><path d="M6 10 l3 5 h14 l3-5 l-1 13 h-18 z" ' + F + " " + SW + '/><path d="M7 27 h18" ' + SW + '/><circle cx="6" cy="10" r="1.8" ' + F + " " + SW + '/><circle cx="16" cy="8" r="1.8" ' + F + " " + SW + '/><circle cx="26" cy="10" r="1.8" ' + F + " " + SW + "/></svg>";
      case "k": return '<svg viewBox="0 0 32 32" class="ch-pc"><path d="M16 5 v4 q0 2 2 3 q-2 1-2 3 q0-2-2-3 q2-1 2-3 z" ' + F + " " + SW + '/><path d="M8 15 q3-6 8-6 q5 0 8 6 l-2 7 h-12 z" ' + F + " " + SW + '/><path d="M9 27 h14" ' + SW + "/></svg>";
    }
    return "";
  }

  function mount(host, isDead) {
    host.innerHTML =
      '<div class="ch-wrap">' +
        '<div class="ch-head"><span class="ch-status" data-ch-status>engine: not loaded yet</span>' +
        '<button class="gm-btn" data-ch="menu">back</button></div>' +
        '<div data-ch-menu>' +
          '<div class="gm-panel" style="margin-bottom:10px">' +
            '<p style="margin:0 0 6px">pick a mood for the bot. it gets real skill, real fast.</p>' +
            '<div class="ch-pad" data-ch-skill>' +
              SKILLS.map(function (s, i) { return '<button class="gm-btn' + (i === 1 ? " on" : "") + '" data-i="' + i + '">' + s.l + '</button>'; }).join("") +
            '</div>' +
            '<p style="margin:10px 0 6px">and you play as:</p>' +
            '<div class="ch-pad" data-ch-side>' +
              '<button class="gm-btn on" data-s="w">white</button><button class="gm-btn" data-s="b">black</button>' +
            '</div>' +
            '<div class="ch-pad" style="margin-top:10px"><button class="gm-btn" data-ch="start">play</button></div>' +
            '<p class="flp-hint" style="margin-top:8px">tap a piece, tap a glowing target. the engine is stockfish (GPL, open source), loaded once when you press play.</p>' +
          '</div>' +
        '</div>' +
        '<div data-ch-play style="display:none">' +
          '<div class="ch-board-wrap"><div class="ch-board" data-ch-board></div></div>' +
          '<div class="ch-pad" style="margin-top:10px">' +
            '<button class="gm-btn" data-ch="new">new game</button>' +
            '<span class="ch-side" data-ch-side-note></span>' +
          '</div>' +
        '</div>' +
      '</div>';

    var menuEl = host.querySelector("[data-ch-menu]"), playEl = host.querySelector("[data-ch-play]");
    var statusEl = host.querySelector("[data-ch-status]");
    var boardEl = host.querySelector("[data-ch-board]");
    var skill = 8, player = "w";

    var st, history, sel = -1, dots = [], worker = null, ready = false, thinking = "no";
    var dead = isDead;

    var engine = {
      start: function (skillV) {
        if (worker) { try { worker.terminate(); } catch (e) {} }
        ready = false;
        statusEl.textContent = "engine: loading stockfish wasm...";
        try { worker = new Worker("apps/chess/stockfish.js"); } catch (e) {
          statusEl.textContent = "engine: could not start (blocked?)"; return;
        }
        worker.onmessage = function (ev) {
          var line = "" + ev.data;
          if (line.indexOf("uciok") > -1) {
            worker.postMessage("setoption name Skill Level value " + skillV);
            worker.postMessage("isready");
          } else if (line.indexOf("readyok") > -1) {
            if (!ready) {
              ready = true;
              statusEl.textContent = "engine: ready. " + (player === "w" ? "your move." : "engine opens.");
              if (player === "b") engine.toMove();
            }
          } else if (line.indexOf("bestmove") === 0) {
            var uci = line.split(" ")[1] || "";
            thinking = "no";
            if (uci && uci !== "(none)") {
              engine.uciToMove(uci);
            }
          }
        };
        worker.onerror = function () {
          statusEl.textContent = "engine: load failed. check internet, then press play again.";
          ready = false;
        };
        worker.postMessage("uci");
      },
      uciToMove: function (uci) {
        var from = FILES.indexOf(uci[0]) + (8 - (+uci[1])) * 8;
        var to = FILES.indexOf(uci[2]) + (8 - (+uci[3])) * 8;
        var find = legalMoves(st, sideOf(st.b[from])).find(function (m) { return m.f === from && m.t === to; });
        if (!find) { newGame(); return; }
        doMove(find, "bot");
      },
      toMove: function () {
        if (!ready || dead()) return;
        thinking = "yes";
        statusEl.textContent = "engine: thinking about your life choices...";
        worker.postMessage("position startpos moves " + history.join(" "));
        worker.postMessage("go movetime 650");
      },
      engineToMove: function () { engine.toMove(); }
    };

    function newGame() {
      st = { b: parse(START), rights: { K: true, Q: true, k: true, q: true }, ep: -1 };
      history = []; sel = -1; dots = [];
      menuEl.style.display = "none"; playEl.style.display = "block";
      host.querySelector("[data-ch-side-note]").textContent = "you are " + (player === "w" ? "white." : "black.");
      buildBoard();
      render();
      if (player === "b") engine.engineToMove();
    }

    function buildBoard() {
      boardEl.innerHTML = "";
      for (var i = 0; i < 64; i++) {
        var d = document.createElement("div");
        d.className = "ch-cell " + ((((i / 8) | 0) + i % 8) % 2 ? "dark" : "light");
        d.setAttribute("data-sq", i);
        boardEl.appendChild(d);
      }
    }
    function onCell(e) {
      if (!st || thinking === "yes") return;
      var cell = e.target.closest(".ch-cell");
      if (!cell) return;
      var i = +cell.getAttribute("data-sq"), c = st.b[i];
      if (dots.length && dots.indexOf(i) > -1) {
        var mv = legalMoves(st, player).find(function (m) { return m.f === sel && m.t === i; });
        if (mv) { doMove(mv, "you"); }
        sel = -1; dots = []; render(); return;
      }
      if (c !== "." && sideOf(c) === player) {
        sel = i;
        dots = legalMoves(st, player).filter(function (m) { return m.f === i; }).map(function (m) { return m.t; });
        window.KipSound.click();
      } else { sel = -1; dots = []; }
      render();
    }
    function doMove(m, who) {
      var wasCap = st.b[m.t] !== "." || m.flag === "ep";
      st = applyMove(st, m);
      history.push(uciOf(m));
      sel = -1; dots = [];
      render();
      window.KipSound[wasCap ? "click" : "tick"]();
      afterTurn(who);
    }
    function uciOf(m) {
      return sq(m.f) + sq(m.t) + (m.flag === "q" ? "q" : "");
    }
    function afterTurn(who) {
      var next = who === "you" ? player : (player === "w" ? "b" : "w");
      var moves = legalMoves(st, next);
      var chk = inCheck(st, next);
      if (moves.length === 0) {
        if (chk) {
          statusEl.textContent = next === player
            ? "checkmate. the bot did you politely."
            : "you mated the bot. historic behavior.";
        } else {
          statusEl.textContent = "stalemate. the bot respects it.";
        }
        window.KipSound.open();
        return;
      }
      if (chk) {
        statusEl.textContent = next === player
          ? "check. your king is being studied."
          : "check. the bot is being studied.";
        window.KipSound.shock();
      } else if (next === player) {
        statusEl.textContent = "engine moved: your move.";
      }
      if (next !== player) engine.toMove();
    }
    function render() {
      for (var i = 0; i < 64; i++) {
        var cell = boardEl.children[i];
        if (!cell) continue;
        cell.className = "ch-cell " + ((((i / 8) | 0) + i % 8) % 2 ? "dark" : "light");
        if (history.length) {
          var last = history[history.length - 1];
          var lf = FILES.indexOf(last[0]) + (8 - (+last[1])) * 8;
          var lt = FILES.indexOf(last[2]) + (8 - (+last[3])) * 8;
          if (i === lf || i === lt) cell.classList.add("last");
        }
        var c = st.b[i];
        cell.innerHTML = c === "." ? "" : pieceSvg(c);
        if (dots.indexOf(i) > -1) {
          var dd = document.createElement("span"); dd.className = "ch-dot"; cell.appendChild(dd);
        }
        if (i === sel) { var rr = document.createElement("span"); rr.className = "ch-ring"; cell.appendChild(rr); }
      }
    }
    /* skill + side buttons */
    boardEl.addEventListener("click", onCell);
    host.querySelectorAll("[data-ch-skill] .gm-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        window.KipSound.click();
        skill = SKILLS[+b.getAttribute("data-i")].v;
        host.querySelectorAll("[data-ch-skill] .gm-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      });
    });
    host.querySelectorAll("[data-ch-side] .gm-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        window.KipSound.click();
        player = b.getAttribute("data-s");
        host.querySelectorAll("[data-ch-side] .gm-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      });
    });
    host.querySelector('[data-ch="start"]').addEventListener("click", function () {
      window.KipSound.open();
      menuEl.style.display = "none"; playEl.style.display = "block";
      engine.start(skill);
      newGame();
    });
    host.querySelector('[data-ch="menu"]').addEventListener("click", function () {
      window.KipSound.click();
      menuEl.style.display = "block"; playEl.style.display = "none";
      if (worker) { try { worker.terminate(); } catch (err) {} worker = null; ready = false; }
    });
    host.querySelector('[data-ch="new"]').addEventListener("click", function () {
      window.KipSound.open();
      newGame();
    });

    return {
      destroy: function () {
        if (worker) { try { worker.terminate(); } catch (e) {} }
      }
    };
  }

  window.KipGames.modules.chess = { mount: mount, destroy: function () {} };
})();
