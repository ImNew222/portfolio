# KipOS 95 - Mike Alinghawa's Portfolio

A Windows-95-style desktop OS portfolio, except the wallpaper is pastel and the mascot is Kip (a small blue fellow who is weak on grass but strong in water).

Live (Vercel): https://kipos95.vercel.app
Live (GitHub Pages mirror): https://imnew222.github.io/portfolio/
Repo: https://github.com/ImNew222/portfolio

## The idea

Most portfolios are a page you scroll. This one is a computer you use. Six desktop icons open draggable windows (about me.txt, projects.exe, arcade.exe, player-two.exe, terminal.exe, contact.exe), a taskbar keeps track of what is open, and a start menu exists mostly because it felt illegal not to include one.

## Features

- In-page draggable windows with focus stacking, taskbar chips and a start menu
- Light mode (light pink + sky blue) and dark mode (soft plum), persisted and toggleable from the taskbar
- Wind-chime sound effects synthesized live with the Web Audio API - open/close arpeggios, click ticks, no audio files
- Lo-fi background music: a four-bar chime loop at 72 bpm with triangle pads and vinyl crackle, also synthesized, toggleable
- A working terminal.exe with real commands: help, whoami, story, projects, games, hack4gov, cheatengine, mudkip, yui, contact, theme, clear (and sudo, which answers exactly like you expect)
- A games folder on the desktop: four playable minigames, no libraries, no build step
- Typed easter eggs (the terminal hints that two are hidden; one of them makes it rain)
- You can drag the icons' windows around, ESC closes the top window, and everything runs on plain HTML/CSS/JS - zero frameworks, zero build step

## Sections (as windows)

- **about me.txt** - the story: pisonet kid at age 5, Cheat Engine at the family budget's expense, Python in 2018, the GAS detour, now a 4th-year IT student at Cebu Eastern College
- **projects.exe** - Nexora (offline-first gamified LMS, live), UniversityFinds (Laravel + Mapbox), The Waking Nightmare V2 (24-hour Unity horror, playable), PropConnect, and FindMoSer (the ESP32 capstone, honestly labeled in progress)
- **arcade.exe** - current Godot experiments (TungSahurZone: town zone, cozy interior, subway boss with Health/Insanity bars) and the competitions timeline
- **games folder** - playable stuff: chess.exe (handsome Stockfish WASM engine vendored into apps/chess/, GPLv3, difficulty levels, tap-to-move works on phones), tetris.exe (7-bag, ghost pieces, saved high score), flappy.exe (kip vs pipes, saved best), and republika.exe - a hand-written Philippine governance simulation where you play one Filipino with a plan: 16 years, 5 gauges (integrity, economy, education, health, trust), a system that pushes back when you poke the rot, and multiple endings. No real officials are named.
- **player-two.exe** - the anime shelf: Violet Evergarden ep 10 (the letter one) and K-On!
- **terminal.exe** - see commands above
- **contact.exe** - email and GitHub links

## What is honest here

Everything in the projects window is real work with real links. FindMoSer is marked in progress because it is. The vibe-coding admission ("I read code slowly, and tools like AI helpers let me keep pace") is on purpose. No achievements were invented; all of them (Hack4Gov Top 9, Sinulog PropTech Top 12, UPCSG game jam, AWS builder group) happened.

## AI tools note

Built with AI assistance (opencode) for scaffolding, CSS tuning and copy drafting, per class guide disclosure. All content, stories, project facts and design direction are the author's own; screenshots are from real running projects.

## Run it

Any static server works:

```
python3 -m http.server 8127
```

Then open http://localhost:8127. Chrome unblocks the Web Audio clocks after the first click anywhere.

## Credits

- Kip mascot: original SVG, inspired by a certain water-type starter (noncommercial tribute, slightly redesigned)
- Fonts: VT323 / Space Grotesk via Google Fonts (system fallbacks if offline)
- Reference inspiration: sharyap.com for the in-page-window desktop metaphor (the implementation here is entirely different code and design)
