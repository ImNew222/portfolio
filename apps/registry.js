/* KipGames - tiny app registry for the games folder.
   Each game file (apps/<id>.js) registers itself here as:
   KipGames.modules[id] = { mount(hostEl), destroy() }          */
window.KipGames = (function () {
  var GAMES = [
    { id: "chess",     name: "chess.exe",     blurb: "real stockfish engine inside. pick a mood.", icon: "chess" },
    { id: "tetris",    name: "tetris.exe",    blurb: "the blocks never pay rent here.",           icon: "tetris" },
    { id: "flappy",    name: "flappy.exe",    blurb: "one tap, one flap, zero mercy.",            icon: "flappy" },
    { id: "republika", name: "republika.exe", blurb: "try running the country. it fights back.",  icon: "republika" }
  ];

  var modules = {};   /* id -> {mount, destroy} */
  var loaded  = {};   /* id -> script injected */
  var live    = {};   /* hostEl -> instanced module (for cleanup) */
  var pending = 0;

  function hostOf(el) {
    return el ? el.querySelector(".game-host[data-game]") : null;
  }

  function ensureScript(id) {
    if (loaded[id]) return;
    loaded[id] = true;
    var s = document.createElement("script");
    s.src = "apps/" + id + ".js";
    s.onload = function () { pending--; flush(); };
    s.onerror = function () {
      pending--;
      document.querySelectorAll('.game-host[data-game="' + id + '"]').forEach(function (host) {
        host.innerHTML = '<p class="gm-load">could not load ' + id + '.js. did the wifi escape again?</p>';
      });
    };
    document.head.appendChild(s);
    pending++;
  }

  function mountModule(id, host) {
    var mod = modules[id];
    if (!mod || !mod.mount) {
      host.innerHTML = '<p class="gm-load">warming up ' + id + '...</p>';
      return;
    }
    live[host] = mod;
    var dead = false;
    var inst = {
      destroy: function () { dead = true; if (mod.destroy) mod.destroy(); }
    };
    live[host] = inst;
    mod.mount(host, function () { return dead; }, inst);
  }

  function flush() {
    if (pending > 0) return;
    document.querySelectorAll(".game-host[data-game]").forEach(function (host) {
      var id = host.getAttribute("data-game");
      if (!id || id === "games" || live[host]) return;
      if (id !== "games") mountModule(id, host);
    });
    /* folder view always renders (registry has the data) */
    document.querySelectorAll('.game-host[data-game="games"]').forEach(function (host) {
      if (host.dataset.ready) return;
      host.dataset.ready = "1";
      renderFolder(host);
    });
  }

  function renderFolder(host) {
    var tiles = GAMES.map(function (g) {
      return '<button class="gm-tile" data-launch="' + g.id + '">' +
        '<img src="images/oscicons/' + g.icon + '.svg?v=1" alt="" />' +
        '<span class="gm-name pixel">' + g.name + '</span>' +
        '<span class="gm-blurb">' + g.blurb + '</span></button>';
    }).join("");
    host.innerHTML =
      '<div class="gm-folder">' +
        '<p class="gm-folder-note pixel">you opened the folder. here is what escaped.</p>' +
        '<div class="gm-grid">' + tiles + '</div>' +
        '<p class="gm-folder-foot">four files, no downloads, no installers. everything runs on this machine.</p>' +
      '</div>';
    host.querySelectorAll("[data-launch]").forEach(function (btn) {
      btn.addEventListener("click", function () { launch(btn.getAttribute("data-launch")); });
    });
  }

  function launch(id) {
    if (window.kipOpen) window.kipOpen(id);
  }

  function maybeMount(winEl) {
    if (!winEl || !hostOf(winEl)) return false;
    var id = hostOf(winEl).getAttribute("data-game");
    if (id && id !== "games") ensureScript(id);
    flush();
    return true;
  }

  function maybeUnmount(winEl) {
    if (!winEl || !live[winEl]) return;
    try { live[winEl].destroy(); } catch (e) {}
    delete live[winEl];
  }

  return {
    list: GAMES, modules: modules,
    ensureScript: ensureScript,
    maybeMount: maybeMount,
    maybeUnmount: maybeUnmount,
    launch: launch
  };
})();
