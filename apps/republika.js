/* republika.exe - a made-up planning desk for a made-up version of a very real place.
   You are one Filipino with a plan. The system fights back. No real officials are named;
   the villain is the pattern, not a person. TREAT IT WITH HOPE. PLAY WITH HONESTY. */
(function () {
  var STATS = ["integrity", "economy", "education", "health", "trust"];
  var LABELS = { integrity: "integrity (anti-corruption)", economy: "economy", education: "education", health: "public health", trust: "public trust" };
  var START = { integrity: 38, economy: 55, education: 46, health: 50, trust: 42 };
  var YEARS = 16;

  /* risk: 0 never fights back, 1 the system grumbles, 2 the system bites */
  var EVENTS = [
    { t: "the flood control file", body: "Another rainy season, and the drainage projects that ate the budget look suspiciously dry in places they should be wet. An auditor friend sends you photos at 2am. This could blow up all the way to the top.", opts: [
      { l: "Full inquiry, live-streamed, whatever it costs.", h: "the system will scream about jobs", d: { integrity: +9, trust: +7, economy: -3 }, r: 2 },
      { l: "Quiet desk review first; build the case.", h: "slower, safer, smaller blast radius", d: { integrity: +4, trust: +2 }, r: 1 },
      { l: "Redirect flood funds to actual repairs, say nothing.", h: "hospitals dry, but hospitals get dry", d: { health: +5, integrity: +1, trust: -2 }, r: 1 }
    ]},
    { t: "jeepney math", body: "Consolidation gave commuters a compound hit: fewer routes, higher fares, angrier memes. Operators ask for restructuring you can actually defend in a hearing.", opts: [
      { l: "Real route plan with real financing, phased.", h: "boring paperwork, honest outcomes", d: { economy: +5, trust: +4, health: +1 }, r: 0 },
      { l: "Subsidize fares directly for two years.", h: "bandage, popular, expensive", d: { health: +3, economy: -4, trust: +6 }, r: 0 },
      { l: "Leave it to the market to figure out.", h: "you leave; the market leaves faster", d: { economy: +2, trust: -6, health: -2 }, r: 2 }
    ]},
    { t: "brownout summer", body: "This summer the grid groans louder than a jeep in first gear. Feed-in offers flood your desk: solar farms here, battery costs there, and one guy offering to sell volcanoes.", opts: [
      { l: "Green auction + storage pilot in stormbelt zones.", h: "pay now, stop paying later", d: { economy: +4, health: +3, integrity: +1 }, r: 1 },
      { l: "Emergency diesel contracts, apologize later.", h: "the three-letter suppliers circle you", d: { economy: +2, health: -3, integrity: -5 }, r: 2 },
      { l: "Demand-response app: pay citizens to conserve.", h: "nerdy, cheap, needs wifi in barangays", d: { education: +3, economy: +2, trust: +2 }, r: 1 }
    ]},
    { t: "classrooms missing", body: "The last PISA result could power a generator with the sighs it produced. Teachers teach in shifts under stairs; sometimes under overpass lights, which the kids call study lamp mode.", opts: [
      { l: "Build 12,000 classrooms, hire 20k teachers.", h: "long game, expensive, brutal to defend", d: { education: +9, economy: +2 }, r: 1 },
      { l: "Digital learning + free wifi in 500 schools.", h: "phones exist; electricity sometimes doesnt", d: { education: +5, economy: +1 }, r: 1 },
      { l: "Raise teacher pay and let them answer.", h: "no flashy ribbon, massive quiet upgrade", d: { education: +6, health: +1, trust: +3 }, r: 0 }
    ]},
    { t: "the rice carousel", body: "Cheapest rice went up 30% in a week. Import permits appear to travel in a circle from desk to desk and back with a small commission each lap. Your cousin calls it economics; your grandmother calls it robbery.", opts: [
      { l: "Crack the import-permit ring open.", h: "many desks will need new owners", d: { integrity: +8, economy: +2, trust: +5 }, r: 2 },
      { l: "Set farmer-first buying floor + buffer stock.", h: "pro-farmer beats pro-carousel", d: { economy: +3, health: +3, trust: +3 }, r: 1 },
      { l: "Price cap and hope.", h: "hope is not a policy but it is free", d: { health: +1, economy: -3, trust: -3 }, r: 1 }
    ]},
    { t: "typhoon season arrives early", body: "The landfall is days east and the country has three umbrellas and a prayer. Your disaster desk gets one blueprint, zero budget, and a briefing that begins with weather poetry.", opts: [
      { l: "Pre-position: bail-out kit for 4M households.", h: "expensive ammunition against arithmetic", d: { health: +7, trust: +6, economy: -4 }, r: 1 },
      { l: "Evac drill + solar radios across coastal towns.", h: "less wagies, more working warnings", d: { education: +3, health: +4, integrity: +1 }, r: 0 },
      { l: "Beg international for standby aid letters.", h: "dignity tax; effective emergency-only", d: { health: +3, economy: -2, trust: -4 }, r: 2 }
    ]},
    { t: "the ghost payrolls", body: "Payroll sanity check found people who share names with their children, their dogs, and one respected barangay goat. The goat has not answered queries but the payroll has been audited twice.", opts: [
      { l: "Pull the whole payroll into biometric roll.", h: "17,000 ghosts about to file complaints", d: { integrity: +9, economy: +2 }, r: 2 },
      { l: "Freeze suspicious entries, investigate quietly.", h: "unsettling calm before an audit", d: { integrity: +5, trust: +1 }, r: 1 },
      { l: "Publish the list; let netizens handle it.", h: "the internet occasionally does public service", d: { integrity: +3, trust: +7, economy: -2 }, r: 1 }
    ]},
    { t: "doctor desert", body: "Three provinces have one OB-GYN between them and waiting schedules deserve their own PISA category. The rural health units are technically equipped, spiritually understaffed.", opts: [
      { l: "Pay rural placements like tech salaries.", h: "doctors can cry in nice housing", d: { health: +8, economy: -3, trust: +3 }, r: 1 },
      { l: "Telemedicine hubs + nurse training surge.", h: "wifi needed; wifi coming", d: { education: +3, health: +5 }, r: 0 },
      { l: "Partner private hospitals with public tariffs.", h: "private beds, public rates", d: { health: +4, economy: +2, integrity: -1 }, r: 1 }
    ]},
    { t: "the BPO windfall", body: "Global firms discovered that Filipinos speak every accent and ship great code. Offices want 400k seats but the fiber will not pull itself. Counties outside Manila fight for the ring light too.", opts: [
      { l: "Decentralized IT parks with power guarantees.", h: "jobs to provinces, jealousy to Megamall", d: { economy: +8, education: +4, trust: +3 }, r: 1 },
      { l: "Focus manila; build the world class pipeline.", h: "efficiently concentrating everything", d: { economy: +6, education: -1, trust: -3 }, r: 0 },
      { l: "Hang taxation on services; fund retraining.", h: "brave math with 1% of the applause", d: { economy: +3, education: +5, trust: -2 }, r: 1 }
    ]},
    { t: "election year noise", body: "The campaign commences: billboards multiply, ambulances become campaign props, and your best reform bill sponsors discover they always supported you, retroactively, loudly.", opts: [
      { l: "Push reforms with data, ignore the circus.", h: "you will be unpopular by March", d: { integrity: +4, trust: +2, economy: +1 }, r: 1 },
      { l: "Trade two reforms for one bruising vote.", h: "the arithmetic of honesty", d: { economy: +5, integrity: -3 }, r: 1 },
      { l: "Free bus + healthcare vouchers for benches.", h: "short boom, slow hangover", d: { health: +4, economy: -4, trust: +5 }, r: 0 }
    ]},
    { t: "the graveyard of proposals", body: "Your draft law has died in committee for the sixth time. Its co-authors defend it in pressers and quietly dodge every hearing. Somewhere it grows a fertilizer smile.", opts: [
      { l: "Rebuild coalition; accept two loaves, half fish.", h: "compromise is not a diet", d: { economy: +4, integrity: -2, education: +2 }, r: 1 },
      { l: "Go public: explain it in barangay-level Filipino.", h: "sky formation of mime and mirror", d: { integrity: +3, trust: +8, economy: -2 }, r: 1 },
      { l: "Recycle it as an executive order tonight.", h: "legal? debatable. effective? temporarily", d: { education: +4, integrity: -5 }, r: 2 }
    ]},
    { t: "the onion incident", body: "Onions cost more than chicken for the third week. Import cartel or an actual harvest gap is unclear; either way, national cuisine is in cardio therapy and jokes are expensive.", opts: [
      { l: "Break the import monopoly on spices.", h: "someone with many warehouses objects", d: { health: +3, economy: +2, integrity: +5 }, r: 2 },
      { l: "Direct-from-farm market buses in cities.", h: "logical and photo-friendly", d: { economy: +3, health: +2, trust: +3 }, r: 0 },
      { l: "Tell everyone garlic is the new onion.", h: "war is not the answer; garlic is", d: { trust: -4, economy: +1 }, r: 1 }
    ]},
    { t: "edsa: the sequel series", body: "EDSA traffic remains UNESCO-worthy and air quality could season adobo. Buses race; the city plans; the planning meets the buses.", opts: [
      { l: "Dedicated busway + BRT honestly monitored.", h: "spends the pain now not in ten years", d: { economy: +5, health: +4, trust: +2 }, r: 2 },
      { l: "Odd-even scheme + congestion pricing trial.", h: "motorcycle owners remembered your surname", d: { health: +5, economy: -2, trust: -3 }, r: 1 },
      { l: "Widen everything; roads to places already gentrified.", h: "more asphalt, same math, different vibe", d: { economy: +3, health: -4 }, r: 0 }
    ]},
    { t: "the data leak", body: "A national database of juan and juana is on sale online: births, addresses, preferences. The agency retweeted its own data privacy webinar last week, which is the funniest tragedy this quarter.", opts: [
      { l: "Breach cleanup + sack the vendor contract chain.", h: "public audits feel personal today", d: { integrity: +7, trust: +2, economy: -2 }, r: 2 },
      { l: "Compensation + free credit monitoring for 3M.", h: "expensive dignity; real one", d: { health: +2, trust: +5, economy: -4 }, r: 1 },
      { l: "Statement of concern for the file.", h: "the file gets company", d: { integrity: -4, trust: -5 }, r: 2 }
    ]},
    { t: "the nurse diaspora", body: "Nurse exodus: the airport is informal nursing university orientation with roundtrip tickets. Then the airport queue thanks each nurse by nickname, then books the same flight themselves.", opts: [
      { l: "Bond-free scholarships via remote top-up pay.", h: "you buy 8 years, not careers", d: { education: +6, health: +4, economy: +1 }, r: 1 },
      { l: "Recognize their licenses abroad quietly, train double.", h: "immensely respectful math", d: { education: +4, health: +2, economy: +3 }, r: 0 },
      { l: "Restrict departures for national service.", h: "freedom files formal complaint", d: { health: +3, trust: -8 }, r: 2 }
    ]},
    { t: "the scam hub round-up", body: "POGO-adjacent operations reincarnating as online casinos and romance call centers got discovered in three subdivisions. One landlord was your actual high school classmate; nostalgia gets expensive.", opts: [
      { l: "Shut them all; repurpose the buildings.", h: "turn call centers into classrooms", d: { integrity: +8, education: +3, economy: -4 }, r: 2 },
      { l: "License and tax the clean ones; raid the rest.", h: "moral kazoo music with receipts", d: { economy: +3, integrity: +3, trust: -1 }, r: 1 },
      { l: "Let local LGUs negotiate; you stay for optics.", h: "plausible deniability is not a plan", d: { integrity: -6, trust: -3 }, r: 1 }
    ]}
  ];

  var AUDITS = [
    { t: "audit of record: term one", body: "Four years compiled into one slide and one silence during the presentation part." },
    { t: "audit of record: term two", body: "Mid-run check. The presser asks about the integrity gauge; you picture the gauge. The gauge stares back." },
    { t: "audit of record: term three", body: "The system either collapsed or quietly mitigated. Files pretend things are fine, which is how files sleep." },
    { t: "audit of record: final term", body: "Final years. History is filling in your grade in pencil, checking twice, and reaching for a red pen." }
  ];

  var PUSHBACKS = [
    { t: "the system bites", body: "Anonymous Well-Placed Sources say your reform is a secret coup by reformists. Three committees demand you attend hearings about attending other hearings.", d: { integrity: -3, trust: -2 } },
    { t: "the budget leak", body: "The budget for your program arrived minus the budget for the programme. An invoice says consulting was done by a company founded on Tuesday the same year Wednesday.", d: { integrity: -4, economy: -2 } },
    { t: "assorted sabotage", body: "Printers only print your memoirs. Finance staff take untracked holidays. Your lunch orders contain suspicious amounts of mayo. Nothing provable; everything coordinated.", d: { integrity: -1, trust: -3 } },
    { t: "the redecorating", body: "The audit findings were filed, then the archive room flooded 'for reasons'. The building has no mice, only strategic cats.", d: { integrity: -5, trust: -1 } }
  ];

  var ENDINGS = [
    { when: function (s, avg) { return avg >= 66 && s.integrity >= 66 && s.trust >= 60; }, title: "the long reform worked", body: "Not a meme, not a miracle: sixteen years of receipts. Institutions still standing, kids reading above stairs, an actual honest budget. Historians will call it boring on purpose, which is the highest possible compliment." },
    { when: function (s, avg) { return avg >= 55 && s.integrity >= 50; }, title: "rusty, but it runs", body: "The machine leaks oil and works. No parade, no statue, but hospitals count real patients and audits occur on schedule. You pass the fields where your projects stand and whisper: not perfect, but honest." },
    { when: function (s, avg) { return avg >= 55; }, title: "growth papered the rot", body: "GDP charts glow forever while the integrity sheet mildews in a drawer somewhere. The economy hums; the leaks hum in harmony. You are wealthy enough, for now, in a house sharks respect but cannot eat." },
    { when: function (s, avg) { return s.integrity <= 30 && avg >= 50; }, title: "the leak never closed", body: "You maximized everything except the one metric ruled everything. Your signature graces posters while someone else's signature graces your accounts. Somewhere, your own ghost joins the payroll and signs politely." },
    { when: function (s, avg) { return avg < 40; }, title: "status quo: undefeated", body: "It did not feel like losing; it felt like surviving Tuesdays. But the averages know: the system absorbed you. The desk stays. The chair still holds your shape. Someone remarkable is reading your files tonight, thinking of continuing." }
  ];

  function mount(host, isDead) {
    host.innerHTML =
      '<div class="rp-wrap" data-rp-root>' +
        '<div class="rp-top">' +
          '<span class="gm-tag" data-rp-year>year 0 / ' + YEARS + '</span>' +
          '<button class="gm-btn" data-rp="restart">restart</button>' +
        '</div>' +
        '<div class="rp-bars" data-rp-bars></div>' +
        '<div class="gm-panel rp-card" data-rp-card></div>' +
        '<div class="rp-log gm-panel" data-rp-log style="display:none"></div>' +
        '<p class="rp-note">you are one filipino with a plan. the country is 115 million people. no real officials are named; the villain is the pattern. endings depend on what you protected and when you looked away.</p>' +
      '</div>';

    var root = host.querySelector("[data-rp-root]");
    var yearEl = root.querySelector("[data-rp-year]");
    var barsEl = root.querySelector("[data-rp-bars]");
    var cardEl = root.querySelector("[data-rp-card]");
    var logEl = root.querySelector("[data-rp-log]");
    var analysis = {};

    analysis.s = null; analysis.year = 0; analysis.deck = []; analysis.log = []; analysis.endFlag = false;

    function clamp(v) { return Math.max(0, Math.min(100, v)); }
    function start() {
      analysis.s = Object.assign({}, START);
      analysis.year = 0; analysis.deck = shuffle(EVENTS.slice()); analysis.log = []; analysis.endFlag = false;
      logEl.style.display = "none"; logEl.innerHTML = "";
      renderBars();
      card({ t: "welcome to the planning desk", body: "You are one Filipino with a plan: fight the rot without letting the patient die on the table. Sixteen years, five gauges, one desk. Choose well, and choose who benefits.", opts: [
        { l: "Begin. Ordinary timetable.", h: "the termites are already on the clock", d: { integrity: +2 }, r: 0 }
      ]});
    }
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function avg() {
      var sum = 0; STATS.forEach(function (k) { sum += analysis.s[k]; });
      return sum / STATS.length;
    }
    function barColor(k, v) { return (k === "integrity" ? (v >= 60 ? "up" : v >= 35 ? "mid" : "down") : (v >= 60 ? "up" : v >= 40 ? "mid" : "down")); }
    function renderBars() {
      barsEl.innerHTML = STATS.map(function (k) {
        var v = Math.round(analysis.s[k]), cls = barColor(k, v);
        return '<div class="rp-bar ' + cls + '"><div class="rp-bar-l"><span>' + LABELS[k] + '</span><span>' + v + '</span></div>' +
          '<div class="rp-bar-b"><div class="rp-bar-f" style="width:' + v + '%"></div></div></div>';
      }).join("");
    }
    function recap(add) {
      analysis.log.unshift(add); analysis.log = analysis.log.slice(0, 6);
      logEl.style.display = "block";
      logEl.innerHTML = '<div class="mini-heading" style="margin:0 0 6px">the setup so far</div><ul style="margin:0;padding-left:16px">' +
        analysis.log.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>";
    }
    function card(ev) {
      yearEl.textContent = "year " + analysis.year + " / " + YEARS;
      renderBars();
      var opts = ev.opts.map(function (o, i) {
        return '<button class="gm-btn rp-opt" data-opt="' + i + '"><b>' + o.l + '</b><span>' + o.h + '</span></button>';
      }).join("");
      cardEl.style.display = "block";
      cardEl.innerHTML = '<h4 class="pixel">' + ev.t + '</h4><p>' + ev.body + '</p><div class="rp-opts">' + opts + '</div>';
      cardEl.querySelectorAll("[data-opt]").forEach(function (btn) {
        btn.addEventListener("click", function () { choose(ev, ev.opts[+btn.getAttribute("data-opt")]); });
      });
    }
    function choose(ev, o) {
      window.KipSound.click();
      var pushRisk = Math.random() < [0, 0.14, 0.30][o.r];
      apply(o.d, undefined);
      var audit = analysis.year % 4 === 0 && analysis.year > 0;
      recap("y" + analysis.year + " - " + ev.t + ": " + o.l.toLowerCase());
      if (pushRisk) {
        window.KipSound.shock();
        analysis.pending = PUSHBACKS[Math.floor(Math.random() * PUSHBACKS.length)];
        recap("the system pushed back");
      }
      next(audit);
    }
    function apply(d, noCommit) {
      STATS.forEach(function (k) { if (d[k]) analysis.s[k] = clamp(analysis.s[k] + d[k]); });
      renderBars();
    }
    function next(audited) {
      analysis.year++;
      if (analysis.year >= YEARS) { ending(); return; }
      if (audited && !analysis.pending) {
        card({ t: AUDITS[Math.floor(analysis.year / 4) - 1].t, body: AUDITS[Math.floor(analysis.year / 4) - 1].body, opts: [
          { l: "Continue the plan.", h: "with your eyes open and your hands counted", d: {}, r: 0 }
        ]});
        return;
      }
      if (analysis.pending) {
        var pb = analysis.pending; analysis.pending = null;
        apply(pb.d);
        recap(pb.t.toLowerCase());
        card({ t: pb.t, body: pb.body, opts: [
          { l: "Hold the line and publish everything.", h: "transparency is an eyes donation", d: { integrity: +2 }, r: 0 },
          { l: "Rest the machinery; keep head down one year.", h: "the system loves tedium", d: { economy: +1 }, r: 0 }
        ]});
        return;
      }
      card(deckShift());
    }
    function deckShift() {
      if (!analysis.deck.length) analysis.deck = shuffle(EVENTS.slice());
      return analysis.deck.pop();
    }
    function ending() {
      analysis.endFlag = true;
      var s = analysis.s, av = avg();
      var end = ENDINGS.find(function (e) { return e.when(s, av); }) || ENDINGS[ENDINGS.length - 1];
      cardEl.innerHTML =
        '<div class="rp-end">' +
          '<h3 class="pixel">' + end.title + '</h3>' +
          '<div class="gm-panel"><p>' + end.body + '</p>' +
          '<p style="margin:6px 0 0"><b>final gauges:</b> ' + STATS.map(function (k) { return LABELS[k].split(" (")[0] + " " + Math.round(s[k]); }).join(" / ") +
          ' (avg ' + Math.round(av) + ')</p></div>' +
          '<button class="gm-btn" data-rp="re-end" style="margin-top:10px">run it again - fix one thing</button>' +
          '<p class="rp-note">inspired by governance-hackathon sleep learning. endings reward early honesty; the system rewards delay; you get one shot per run.</p>' +
        '</div>';
      cardEl.style.display = "block";
      window.KipSound.open();
      yearEl.textContent = "year " + YEARS + " / " + YEARS;
      cardEl.querySelector("[data-rp=re-end]").addEventListener("click", function () { start(); });
    }

    root.querySelector('[data-rp="restart"]').addEventListener("click", function () { window.KipSound.click(); start(); });
    start();
    return { destroy: function () {} };
  }

  window.KipGames.modules.republika = { mount: mount, destroy: function () {} };
})();
