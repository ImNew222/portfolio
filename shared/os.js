/* KipOS: shell controller - boot, windows, taskbar, toggles, eggs */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var openWindows = {};   /* app -> {el, chip} */
  var zTop = 20;

  function $(s, c) { return (c || document).querySelector(s); }
  function all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var click = function () { try { window.KipSound.click(); } catch (e) {} };
  document.addEventListener("click", function () { try { window.KipSound.giveMeLife(); } catch (e) {} }, { once: true });

  /* ---------- boot ---------- */
  var boot = $("#boot");
  if (REDUCED) { boot.remove(); } else {
    setTimeout(function () { boot.classList.add("gone"); setTimeout(function () { boot.remove(); }, 600); }, 1600);
    boot.addEventListener("click", function () { boot.classList.add("gone"); setTimeout(function () { boot.remove(); }, 400); });
  }

  /* ---------- wallpaper: clouds + petals ---------- */
  (function wallpaper() {
    var wrap = $(".clouds");
    if (wrap && !REDUCED) {
      for (var i = 0; i < 7; i++) {
        var c = document.createElement("i");
        c.className = "cloud";
        c.style.top = (4 + Math.random() * 70) + "%";
        c.style.width = (60 + Math.random() * 130) + "px";
        c.style.height = (16 + Math.random() * 18) + "px";
        c.style.animationDuration = (46 + Math.random() * 40) + "s";
        c.style.animationDelay = (-Math.random() * 60) + "s";
        c.style.opacity = 0.35 + Math.random() * 0.4;
        wrap.appendChild(c);
      }
      var pw = $(".petals");
      for (var j = 0; j < 9; j++) {
        var p = document.createElement("i");
        p.className = "petal" + (j % 3 ? "" : " b-blue");
        p.style.left = (Math.random() * 100) + "%";
        p.style.animationDuration = (9 + Math.random() * 12) + "s";
        p.style.animationDelay = (-Math.random() * 12) + "s";
        p.style.transform = "scale(" + (0.7 + Math.random() * 0.8) + ")";
        pw.appendChild(p);
      }
    }
  })();

  /* ---------- theme ---------- */
  var qtheme = new URLSearchParams(location.search).get("theme");
  if (qtheme === "dark" || qtheme === "light") localStorage.setItem("kip-theme", qtheme);
  var htmlEl = document.documentElement;
  function applyTheme(t) {
    htmlEl.setAttribute("data-theme", t);
    localStorage.setItem("kip-theme", t);
    var img = $("#themeBtn img");
    if (img) img.src = "images/oscicons/" + (t === "dark" ? "sun" : "moon") + ".svg?v=1";
  }
  applyTheme(localStorage.getItem("kip-theme") || "light");
  $("#themeBtn").addEventListener("click", function () {
    applyTheme(htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark");
    click();
  });

  /* ---------- sfx + music toggles ---------- */
  var sfxBtn = $("#sfxBtn"), musicBtn = $("#musicBtn");
  function paintToggles() {
    sfxBtn.classList.toggle("off", !window.KipSound.sfxOn());
    musicBtn.classList.toggle("off", !window.KipSound.musicOn());
    musicBtn.querySelector("img").src = "images/oscicons/" + (window.KipSound.musicOn() ? "spk-on" : "spk-off") + ".svg?v=1";
  }
  sfxBtn.addEventListener("click", function () { window.KipSound.setSfx(!window.KipSound.sfxOn()); paintToggles(); });
  musicBtn.addEventListener("click", function () { window.KipSound.setMusic(!window.KipSound.musicOn()); paintToggles(); click(); });
  paintToggles();

  /* ---------- clock ---------- */
  var clockEl = $("#tbClock"), dateEl = $("#tbDate");
  function tick() {
    var d = new Date();
    var hh = d.getHours() % 12 || 12;
    clockEl.textContent = hh + ":" + String(d.getMinutes()).padStart(2, "0");
    dateEl.textContent = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getMonth()] + " " + d.getDate();
  }
  tick(); setInterval(tick, 20000);

  /* ---------- windows ---------- */
  function makeDraggable(win, handle) {
    var sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    handle.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".os-wbtn")) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
      var maxX = window.innerWidth - 90, maxY = window.innerHeight - 90;
      win.style.left = Math.max(-120, Math.min(nx, maxX)) + "px";
      win.style.top = Math.max(4, Math.min(ny, maxY)) + "px";
    });
    handle.addEventListener("pointerup", function () { dragging = false; });
  }

  function placeWindow(win, app) {
    var count = Object.keys(openWindows).length;
    var W = Math.min(win.offsetWidth || 640, window.innerWidth - 40);
    win.style.left = Math.max(90, (window.innerWidth - W) / 2 + (count % 4) * 26 - ((count % 2) * 52)) + "px";
    win.style.top = Math.max(16, (window.innerHeight - 460) / 2 + (count % 3) * 24) + "px";
    if (app === "terminal") win.style.top = Math.max(16, window.innerHeight - 520) + "px";
  }

  function openApp(app) {
    var tpl = $("#win-" + app);
    if (!tpl) return;
    if (openWindows[app]) {
      focusWin(app);
      return;
    }
    var clone = tpl.content.firstElementChild.cloneNode(true);
    $("#win-layer").appendChild(clone);
    var rec = { el: clone, chip: null };
    openWindows[app] = rec;
    clone.style.zIndex = ++zTop;
    makeDraggable(clone, $(".os-titlebar", clone));
    var closeBtn = $(".os-wbtn.x", clone);
    closeBtn.addEventListener("click", closeApp);
    closeBtn.addEventListener("click", click);
    var chip = document.createElement("button");
    chip.className = "tb-chip active";
    chip.innerHTML = '<img src="images/oscicons/' + app + '.svg?v=1" alt="">' + app;
    chip.addEventListener("click", function () {
      window.KipSound.tick();
      winToTop(app);
    });
    $("#chips").appendChild(chip);
    rec.chip = chip;
    clone.classList.add("open");
    placeWindow(clone, app);
    window.KipSound.open();
    if (app === "terminal") initTerminal(clone);
  }

  function winToTop(app) {
    var rec = openWindows[app];
    if (!rec) return;
    rec.el.style.zIndex = ++zTop;
    all(".tb-chip").forEach(function (c) { c.classList.remove("active"); });
    if (rec.chip) rec.chip.classList.add("active");
  }

  function focusWin(app) { winToTop(app); }

  function closeApp(evt) {
    var btn = evt && evt.currentTarget;
    var win = btn && btn.closest ? btn.closest(".os-window") : null;
    if (!win) return;
    var app = win.getAttribute("data-app");
    var rec = openWindows[app];
    if (!rec) return;
    window.KipSound.close();
    win.classList.add("closing");
    setTimeout(function () { win.remove(); }, 220);
    if (rec.chip) rec.chip.remove();
    delete openWindows[app];
  }

  all("[data-open]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      click();
      openApp(el.getAttribute("data-open"));
      $("#startme").classList.remove("open");
    });
  });
  all("[data-open]").forEach(function (el) {
    el.addEventListener("mouseenter", click);
  });

  /* ---------- start menu ---------- */
  var startBtn = $("#tbStart"), startme = $("#startme");
  startBtn.addEventListener("click", function () {
    startme.classList.toggle("open");
    click();
  });
  document.addEventListener("click", function (e) {
    if (!startme.contains(e.target) && !startBtn.contains(e.target)) startme.classList.remove("open");
  });

  /* ---------- escape closes top window ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var top = null, tz = -1;
    Object.keys(openWindows).forEach(function (k) {
      var z = +openWindows[k].el.style.zIndex;
      if (z > tz) { tz = z; top = k; }
    });
    if (top) {
      var fakeBtn = $(".os-wbtn.x", openWindows[top].el);
      closeApp({ currentTarget: fakeBtn });
    }
  });

  /* ---------- sparkles ---------- */
  var lastSpark = 0;
  document.addEventListener("pointermove", function (e) {
    if (!window.KipSound.sfxOn() || REDUCED) return;
    var now = Date.now();
    if (now - lastSpark < 90) return;
    lastSpark = now;
    var s = document.createElement("div");
    s.className = "spark " + (["", "b", "c"][Math.floor(Math.random() * 3)]);
    s.style.left = e.clientX - 4 + "px";
    s.style.top = e.clientY - 4 + "px";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 620);
  });

  /* ---------- toast ---------- */
  var toastT = null;
  function toast(msg) {
    var t = $("#toast");
    $("#toastMsg").textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- rain egg ---------- */
  function rain(seconds) {
    var d = setInterval(function () {
      var r = document.createElement("div");
      r.className = "rain-drop";
      r.style.left = (Math.random() * 100) + "vw";
      r.style.animationDuration = (0.9 + Math.random() * 0.7) + "s";
      r.style.opacity = 0.5 + Math.random() * 0.4;
      document.body.appendChild(r);
      setTimeout(function () { r.remove(); }, 1600);
    }, 55);
    setTimeout(function () { clearInterval(d); }, seconds * 1000);
  }

  /* typed eggs */
  var buf = "";
  document.addEventListener("keydown", function (e) {
    if (!/^[a-z]$/i.test(e.key || "")) return;
    buf = (buf + e.key.toLowerCase()).slice(-6);
    if (buf.slice(-3) === "yui") {
      document.body.classList.add("yui-flash");
      setTimeout(function () { document.body.classList.remove("yui-flash"); }, 1300);
      window.KipSound.shock();
      toast("giita mode. play it loud, Mukai-chan.");
    }
    if (buf.slice(-3) === "kip") {
      window.KipSound.shock();
      toast("weak on grass. unstoppable in water. lock in.");
    }
    if (buf.slice(-6) === "mudkip") {
      rain(5);
      window.KipSound.shock();
      toast("Kip: SWAMP SONG ACTIVATED.");
    }
  });

  /* ---------- terminal ---------- */
  function initTerminal(win) {
    var field = $(".t-field", win);
    var log = $(".term-log", win);
    if (!field || !log) return;

    var hist = [];
    function print(text, cls) {
      var line = document.createElement("div");
      line.className = "t-line " + (cls || "t-out");
      line.textContent = text;
      log.appendChild(line);
      win.querySelector(".os-body").scrollTop = win.querySelector(".os-body").scrollHeight;
    }

    function title(s) { print(s, "t-in"); }

    var CMDS = {
      help: function () {
        print("commands: help, whoami, story, projects, hack4gov, cheatengine, mudkip, yui, contact, theme, clear");
      },
      whoami: function () {
        print("Mike Alinghawa (kips agreed: 1). KipOS 95 user #002. Weak on grass, locked in in water.");
      },
      story: function () {
        title("arcade.exe origin story:");
        print("age 5-6: 1-3 peso magic. pc cafe + a mother who somehow always knew.");
        print("2018-19: found python because i wanted to cheat better.");
        print("1 year pause: life happens. resumed stronger.");
        print("today: BSIT student, building games + random websites, top-9 hackathon survivor.");
      },
      projects: function () {
        title("executable inventory:");
        print("nexora-lms.exe    [offline gamified LMS, ollama, judge0]");
        print("universityfinds   [laravel + mapbox 3d campus maps]");
        print("waking-nightmare  [24h unity solo horror, PLAYABLE]");
        print("tungsahurzone     [godot pixel rpg, subway boss, P5H]");
        print("findmoser         [ESP32 capstone, hardware tagged]");
        print("propconnect       [blade, real estate]");
      },
      hack4gov: function () {
        print("hack4gov 2026 cebu regional: TEAM ELLIPSE. overall top 9.");
        print("codename: TungSahur. we did not bring an axe, we brought roles.");
      },
      cheatengine: function () {
        print("legacy tool: CHEAT ENGINE.");
        print("status: knowledge archived (forgotten how).");
        print("lesson learned: it trained the exact skill that became a career.");
      },
      mudkip: function () {
        print("kip pressed [F] to pay respects... with a wave.");
        print("weak on grass, locked in in water. icon behavior.");
      },
      yui: function () {
        print("YUI MODE.");
        print("   ___");
        print("  [o.o]   giita!");
        print("  \\_^_/");
        print("b-sides and strawberries. k-on forever.");
      },
      contact: function () {
        print("gmail: alinghawamike@gmail.com");
        print("github: github.com/ImNew222");
        print("open contact.exe for the fancy version.");
      },
      theme: function () { applyTheme(htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark"); print("theme toggled. kip approves."); },
      clear: function () { log.textContent = ""; },
      sudo: function () { print("nice try. kip is the admin here.", "t-err"); }
    };

    field.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var raw = field.value.trim();
      field.value = "";
      if (!raw) return;
      print("> " + raw, "t-in");
      hist.push(raw);
      var cmd = raw.toLowerCase().split(/\s+/)[0];
      if (CMDS[cmd]) CMDS[cmd]();
      else if (cmd === "") return;
      else print("command not found: " + cmd + " ( try help )", "t-err");
    });

    print("KipOS 95 - chime services ready.", "t-out");
    print('type "help" to start. two eggs are hidden. not telling.', "t-err");
    field.focus();
  }

  /* type-ahead open for screenshots: ?open=about */
  var q = new URLSearchParams(location.search).get("open");
  if (q) {
    q = q.replace(/[^a-z]/g, "");
    if (document.getElementById("win-" + q)) {
      setTimeout(function () {
        openApp(q);
        var m = new URLSearchParams(location.search).get("max");
        if (m) {
          var rec = openWindows[q];
          if (rec) { rec.el.style.top = "10px"; }
        }
      }, REDUCED ? 50 : 900);
    }
  }

  window.addEventListener("resize", function () {
    Object.keys(openWindows).forEach(function (k) {
      var el = openWindows[k].el;
      if (+el.style.left.replace("px", "") > window.innerWidth - 120) el.style.left = "160px";
    });
  });
})();
