/* KipSound: wind chimes + gentle lofi loop, all synthesized. zero audio files. */
(function () {
  "use strict";

  var SCALE = [698.46, 783.99, 880.0, 1046.5, 1174.66];

  var state = {
    ctx: null,
    master: null,
    musicBus: null,
    crackleBus: null,
    sfxOn: localStorage.getItem("kip-sfx") !== "off",
    musicOn: localStorage.getItem("kip-music") === "on",
    started: false,
    schedTimer: null,
    bar: 0,
    nextTime: 0
  };

  function ctxGet() {
    if (!state.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      state.ctx = new AC();
      state.master = state.ctx.createGain();
      state.master.gain.value = 0.9;
      state.master.connect(state.ctx.destination);
      state.musicBus = state.ctx.createGain();
      state.musicBus.gain.value = 0;
      state.musicBus.connect(state.master);
    }
    if (state.ctx.state === "suspended") state.ctx.resume();
    return state.ctx;
  }

  function chime(freq, when, dur, dest, vol) {
    var ctx = state.ctx;
    var partials = [ [1, 1], [2.76, 0.42], [5.4, 0.18], [8.93, 0.08] ];
    partials.forEach(function (p, idx) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * p[0];
      o.detune.value = (Math.random() * 6 - 3) * (idx + 1);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || 0.09) * p[1]), when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) {
        pan.pan.value = (Math.random() * 1.2 - 0.6) * (idx === 0 ? 0.4 : 0.8);
        o.connect(g); g.connect(pan); pan.connect(dest);
      } else {
        o.connect(g); g.connect(dest);
      }
      o.start(when); o.stop(when + dur + 0.06);
    });
  }

  function chimeSet(base, when, dur, dest, vol, spread) {
    [0, 1, 2].forEach(function (i) {
      if (Math.random() < 0.75) {
        chime(base * (spread || [1, 1.335, 1.782][i]), when + i * 0.085, dur, dest, vol);
      }
    });
  }

  function randNote() { return SCALE[Math.floor(Math.random() * SCALE.length)]; }

  function sfx(fn) {
    if (!state.sfxOn || !ctxGet()) return;
    fn();
  }

  /* crackle buffer for lofi warmth */
  function crackleBuffer(seconds) {
    var ctx = state.ctx;
    var rate = ctx.sampleRate;
    var buf = ctx.createBuffer(1, rate * seconds, rate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < d.length; i++) {
      var brownish = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      last = brownish; d[i] = brownish * 3.5;
      if (Math.random() < 0.00022) d[i] = Math.random() * 0.5;
    }
    return buf;
  }

  function startMusic() {
    if (!ctxGet()) return;
    if (!state.crackleBus) {
      var src = state.ctx.createBufferSource();
      src.buffer = crackleBuffer(4);
      src.loop = true;
      var hp = state.ctx.createBiquadFilter();
      hp.type = "bandpass"; hp.frequency.value = 3200; hp.Q.value = 0.7;
      var g = state.ctx.createGain(); g.gain.value = 0.010;
      src.connect(hp); hp.connect(g); g.connect(state.musicBus);
      src.start(0);
      state.crackleBus = true;
    }
    state.musicBus.gain.cancelScheduledValues(state.ctx.currentTime);
    state.musicBus.gain.setTargetAtTime(0.16, state.ctx.currentTime, 1.2);
    if (!state.schedTimer) {
      state.nextTime = state.ctx.currentTime + 0.15;
      state.schedTimer = setInterval(schedule, 200);
    }
    schedule();
  }

  function stopMusic() {
    if (state.musicBus) state.musicBus.gain.setTargetAtTime(0, state.ctx.currentTime, 0.4);
    if (state.schedTimer) { clearInterval(state.schedTimer); state.schedTimer = null; }
  }

  var LOOP = [
    { pads: [174.61, 220.0, 261.63, 329.63], lead: [349.23, 440.0, 523.25, 698.46] },
    { pads: [220.0, 261.63, 329.63, 392.0], lead: [523.25, 622.25, 783.99, 880.0] },
    { pads: [146.83, 233.08, 261.63, 349.23], lead: [349.23, 466.16, 523.25, 698.46] },
    { pads: [130.81, 196.0, 261.63, 329.63], lead: [523.25, 659.25, 783.99, 1046.5] }
  ];

  function schedule() {
    var ctx = state.ctx;
    var barLen = 60 / 72 * 4;
    while (state.nextTime < ctx.currentTime + 0.9) {
      playBar(state.nextTime, LOOP[state.bar % 4], barLen);
      state.bar++;
      state.nextTime += barLen;
    }
  }

  function playBar(t, chord, barLen) {
    var beat = barLen / 4;
    chord.pads.forEach(function (f) {
      var o = state.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      var lpf = state.ctx.createBiquadFilter();
      lpf.type = "lowpass"; lpf.frequency.value = 950;
      var g = state.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.028, t + 0.4);
      g.gain.linearRampToValueAtTime(0.018, t + barLen * 0.85);
      g.gain.linearRampToValueAtTime(0.0001, t + barLen);
      o.connect(lpf); lpf.connect(g); g.connect(state.musicBus);
      o.start(t); o.stop(t + barLen + 0.1);
    });
    var count = 2 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
      var f = chord.lead[Math.floor(Math.random() * chord.lead.length)];
      var when = t + beat * (0.5 + Math.floor(Math.random() * 4) * 0.85);
      if (when < t + barLen - beat) chimeSet(f, when, 1.6, state.musicBus, 0.05, [1, 2, 3]);
    }
  }

  window.KipSound = {
    giveMeLife: function () { ctxGet(); },
    click: function () {
      sfx(function () {
        chime(randNote(), state.ctx.currentTime, 1.05 + Math.random() * 0.4, state.master, 0.1);
      });
    },
    tick: function () { this.click(); },
    open: function () {
      sfx(function () {
        var t = state.ctx.currentTime;
        chime(698.46, t, 1.2, state.master, 0.1);
        chime(880, t + 0.09, 1.2, state.master, 0.11);
        chime(1046.5, t + 0.18, 1.5, state.master, 0.12);
      });
    },
    close: function () {
      sfx(function () {
        var t = state.ctx.currentTime;
        chime(880, t, 0.9, state.master, 0.1);
        chime(698.46, t + 0.09, 1.1, state.master, 0.1);
      });
    },
    shock: function () {
      sfx(function () {
        var t = state.ctx.currentTime;
        [392, 523.25, 622.25, 783.99, 1046.5].forEach(function (f, i) {
          chime(f, t + i * 0.07, 1.4, state.master, 0.11);
        });
      });
    },
    setSfx: function (on) {
      state.sfxOn = on;
      localStorage.setItem("kip-sfx", on ? "on" : "off");
      if (on) this.click();
    },
    sfxOn: function () { return state.sfxOn; },
    setMusic: function (on) {
      state.musicOn = on;
      localStorage.setItem("kip-music", on ? "on" : "off");
      if (on && ctxGet()) startMusic(); else stopMusic();
    },
    musicOn: function () { return state.musicOn; }
  };

  if (KipSound.musicOn()) {
    document.addEventListener("pointerdown", function once() {
      document.removeEventListener("pointerdown", once);
      setTimeout(function () { KipSound.setMusic(true); }, 350);
    }, { once: true });
  }
})();
