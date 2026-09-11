# Skyline Shuttle

An original browser-game vertical slice set in **Luma Bay**, a sunlit coastal city powered by public transit. You play **Rin Vale**, a new courier for the Mistral Coast Transit Authority. Your first run is to take the compact, solar-electric **Sunbeam shuttle** from North Quay to **Mistral Airport** for a time-sensitive terminal transfer.

This is intentionally an original setting and is not affiliated with, inspired by, or a recreation of any existing open-world game. The airport is a small travel hub in this first slice; arriving there completes the mission and establishes the route-travel premise for later destinations.

## Stack

- Vanilla JavaScript ES modules for gameplay logic
- HTML Canvas 2D for the original map, characters, vehicle, and UI rendering
- A zero-dependency Python static server for local development and a Node static-file build script
- Node's built-in test runner for gameplay-state tests

## Install and run

Requires Node.js 18+ for tests/build and Python 3 for the local server. No `npm install` is required.

```bash
npm run dev
```

Keep that terminal running, then open **http://localhost:5173/** in the *same computer/browser profile*. A connection-refused page means no development server is currently running on that computer or its terminal was closed. Use **WASD** to walk/drive, approach the yellow Sunbeam shuttle, press **E** to enter, and drive north-east into Mistral Airport.

## Easiest way to play: a shareable web link

This repository includes a GitHub Pages deployment workflow. After the repository is pushed to GitHub, open the repository’s **Actions** tab and wait for **Deploy game to GitHub Pages** to finish. Its deployment page shows the clickable live website link. You only need to do this once per update; anyone can then open that link in a browser—no terminal, Python, or localhost required.

If Pages has not been enabled for the repository yet, open **Settings → Pages** and choose **GitHub Actions** as the source. The link normally has the form `https://YOUR-GITHUB-NAME.github.io/YOUR-REPOSITORY-NAME/`.

## Commands

```bash
npm run dev       # local development server at http://localhost:5173/
npm run build     # copy a production build into dist/
npm run preview   # serve the production build at http://localhost:4173/
npm test          # gameplay state tests
```

## Asset and licensing record

All visible game assets are generated at runtime from original Canvas drawing code in `src/main.js`: geometric map tiles, airport runway, vehicle, player token, and interface. The project contains no downloaded images, audio, fonts, trademarks, or third-party game assets. These original placeholder assets and source code are licensed under the repository's default project terms; add an explicit license file before distribution if different terms are needed.

Audio is deliberately not yet implemented; no audio assets or audio licenses are required for this slice.

## Social and voice simulation

The slice includes original adult characters: Ari Sol is Rin's dating partner and Nia Vale is Rin's sister. Conversations are intentionally respectful and consent-aware: kind check-ins can build trust, invitations are answered with mutual-plan and comfort language, while abusive or sexual-image requests are declined and reduce trust. This is not a reproduction of characters, dialogue, or systems from any other game.

Select **Enable hands-free voice** to grant the browser microphone permission once; it keeps listening without a push-to-talk key until you turn it off. Recognized speech is processed in the browser by the platform speech-recognition feature, and Ari's short replies use the browser's built-in speech synthesis voice. No audio is recorded, uploaded, or sent to a third-party service by this project. Browser support varies; the game remains playable without voice.

## Living city crowd

Luma Bay models **1,000,000 stable resident IDs** using deterministic, procedural population generation. The Canvas materializes only the 48 citizens near the active map at a time, rather than allocating a million JavaScript objects; each visible resident has an ID, name, activity, position, and colour that can vary with the in-game clock. This is a performance-conscious crowd simulation foundation, not a claim that a million fully simulated people are rendered simultaneously.

## Vertical slice scope

- Walking around a compact harbour/city/airport map
- Entering and exiting one Sunbeam shuttle vehicle
- Simulated in-game clock, electric battery use, odometer, passenger count, and cash ledger
- Two airport passengers who board when the shuttle is started and disembark at the airport
- A mission state that completes on driving into the airport zone and settles an $18 fare
- Airport arrival / future destination-routing hook

The map, naming, characters, vehicle design, mission, and brand are original to this project.
