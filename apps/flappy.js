/* flappy.exe - one kip, many pipes. registers into KipGames. */
(function () {
  var W = 360, H = 480;

  function mount(host, isDead) {
    host.innerHTML =
      '<div class="flp-wrap">' +
        '<canvas class="flp-canvas" width="' + W + '" height="' + H + '"></canvas>' +
        '<div class="ch-pad">' +
          '<span class="gm-tag">score <b data-flp-score>0</b></span>' +
          '<span class="gm-tag">best <b data-flp-best>0</b></span>' +
          '<button class="gm-btn" data-flp="again">restart</button>' +
        '</div>' +
        '<p class="flp-hint">tap the board or press space. gap russian roulette protocol active.</p>' +
      '</div>';

    var cv = host.querySelector(".flp-canvas"), ctx = cv.getContext("2d");
    var scEl = host.querySelector("[data-flp-score]"), bsEl = host.querySelector("[data-flp-best]");
    var best = +(localStorage.getItem("kip-flappy-best") || 0);
    bsEl.textContent = best;

    var y, vy, pipes, frame, score, alive, started, raf = 0, GAP = 132, SPEED = 2.6;

    function reset() {
      y = H * 0.42; vy = -6; pipes = [{ x: W + 60, gap: gapY(), done: false }];
      frame = 0; score = 0; alive = true; started = false;
      scEl.textContent = "0";
    }
    function gapY() { return 60 + Math.random() * (H - GAP - 140); }

    function flap() {
      if (!alive) return true;
      if (!started) started = true;
      vy = -7.2;
      window.KipSound.tick();
      return true;
    }
    function die() {
      alive = false;
      window.KipSound.shock();
      if (score > best) {
        best = score; localStorage.setItem("kip-flappy-best", best); bsEl.textContent = best;
        window.KipSound.open();
      }
    }
    function step() {
      if (!alive) return;
      frame++;
      if (started) {
        vy += 0.44; y += vy;
        if (y > H - 46 || y < -8) { y = Math.min(Math.max(y, -8), H - 46); die(); }
        var px = W * 0.22;
        pipes.forEach(function (p) { p.x -= SPEED; });
        if (pipes[0].x < -60) { pipes.shift(); pipes.push({ x: pipes[pipes.length - 1].x + 210, gap: gapY(), done: false }); }
        pipes.forEach(function (p) {
          if (!p.done && p.x + 52 < px) {
            p.done = true; score++;
            scEl.textContent = score;
            window.KipSound.open();
            if (score % 5 === 0) SPEED += 0.25;
          }
          var hx = px + 18, inX = p.x < hx && p.x + 52 > px + 2;
          if (inX && (y - 16 < p.gap || y + 16 > p.gap + GAP)) die();
        });
      } else {
        y = H * 0.42 + Math.sin(frame / 22) * 9;
      }
    }
    function pipe(p) {
      var topH = p.gap, botY = p.gap + GAP;
      ctx.fillStyle = "#bdeccf"; ctx.strokeStyle = "#4a3b4f"; ctx.lineWidth = 3;
      ctx.fillRect(p.x + 4, -8, 44, topH + 8); ctx.strokeRect(p.x + 4, -8, 44, topH + 8);
      ctx.fillStyle = "#a5ddb4"; ctx.fillRect(p.x, topH - 18, 52, 18); ctx.strokeRect(p.x, topH - 18, 52, 18);
      ctx.fillStyle = "#bdeccf"; ctx.fillRect(p.x + 4, botY, 44, H - botY + 8); ctx.strokeRect(p.x + 4, botY, 44, H - botY + 8);
      ctx.fillStyle = "#a5ddb4"; ctx.fillRect(p.x, botY, 52, 18); ctx.strokeRect(p.x, botY, 52, 18);
    }
    function kipAt(px, py) {
      ctx.lineWidth = 3; ctx.strokeStyle = "#4a3b4f";
      ctx.fillStyle = "#a8d4f7";
      ctx.beginPath(); ctx.ellipse(px, py, 20, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffb9d3";
      ctx.beginPath(); ctx.ellipse(px - 18, py + 2, 5, 9, 0.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd98a";
      ctx.beginPath(); ctx.moveTo(px + 16, py - 2); ctx.lineTo(px + 34, py + 1); ctx.lineTo(px + 16, py + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4a3b4f";
      ctx.beginPath(); ctx.arc(px + 6, py - 5, 3.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px - 4, py + 5, 4, 5 + Math.min(6, Math.max(-4, vy * 1.6)), -0.4, 0, 7);
      ctx.fill(); ctx.stroke();
    }
    function draw() {
      ctx.fillStyle = "#5b4a63"; ctx.font = "700 16px 'Pixelify Sans', monospace";
      ctx.textAlign = "left";
      ctx.fillText("KipOS flappy  //  best " + best, 12, 22);
      pipes.forEach(pipe);
      if (started) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        for (var i = 0; i < 5; i++) {
          var cx = (W * i + frame * 0.5) % (W + 40) - 30;
          ctx.beginPath(); ctx.arc(cx, 330 + (i % 2) * 26, 3, 0, 7); ctx.fill();
        }
      }
      kipAt(W * 0.22, y);
      if (!alive) {
        ctx.fillStyle = "rgba(43,33,56,0.72)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffd9e8"; ctx.textAlign = "center";
        ctx.fillStyle = "#fff"; ctx.font = "700 24px 'Pixelify Sans', monospace";
        ctx.fillText("gravity files a complaint.", W / 2, H / 2 - 8);
        ctx.font = "16px 'Pixelify Sans', monospace";
        ctx.fillText("score " + score + " - best " + best, W / 2, H / 2 + 22);
        ctx.fillText("tap to hatch again", W / 2, H / 2 + 50);
      } else if (!started) {
        ctx.fillStyle = "rgba(43,33,56,0.38)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.font = "700 22px 'Pixelify Sans', monospace";
        ctx.fillText("tap or space to flap", W / 2, H / 2 - 30);
        ctx.font = "14px 'Pixelify Sans', monospace";
        ctx.fillText("kip believes in you. moderately.", W / 2, H / 2);
      }
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      if (isDead()) { cancelAnimationFrame(raf); return; }
      step(); draw();
    }
    function key(e) { if (e.key === " " || e.key === "ArrowUp") { flap(); e.preventDefault(); } }
    document.addEventListener("keydown", key);
    cv.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!alive) { reset(); } else flap(); });

    host.querySelector('[data-flp="again"]').addEventListener("click", reset);
    reset();
    raf = requestAnimationFrame(loop);

    return { destroy: function () { document.removeEventListener("keydown", key); cancelAnimationFrame(raf); } };
  }

  window.KipGames.modules.flappy = { mount: mount, destroy: function () {} };
})();
