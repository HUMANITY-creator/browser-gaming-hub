"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "idle" | "playing" | "gameover";

const GAME_WIDTH = 760;
const GAME_HEIGHT = 420;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef({
    playerX: GAME_WIDTH / 2,
    score: 0,
    elapsed: 0,
    status: "idle" as GameStatus,
    obstacles: [] as Array<{ x: number; y: number; size: number; speed: number }>,
    lastSpawn: 0,
    keys: new Set<string>(),
  });

  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [aiReply, setAiReply] = useState("Ask me for a game tip, a new idea, or help designing your next feature.");
  const [aiBusy, setAiBusy] = useState(false);
  const [tab, setTab] = useState<"play" | "ai" | "leaderboard">("play");

  useEffect(() => {
    const stored = Number(window.localStorage.getItem("gameforge-best") || 0);
    setBest(stored);
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerX: GAME_WIDTH / 2,
      score: 0,
      elapsed: 0,
      status: "playing",
      obstacles: [],
      lastSpawn: 0,
      keys: new Set(),
    };
    setScore(0);
    setStatus("playing");
  }, []);

  const finishGame = useCallback(() => {
    const current = Math.floor(stateRef.current.score);
    stateRef.current.status = "gameover";
    setStatus("gameover");
    setScore(current);
    setBest((old) => {
      const next = Math.max(old, current);
      window.localStorage.setItem("gameforge-best", String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = GAME_WIDTH * dpr;
      canvas.height = GAME_HEIGHT * dpr;
      canvas.style.aspectRatio = `${GAME_WIDTH}/${GAME_HEIGHT}`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onKeyDown = (event: KeyboardEvent) => {
      stateRef.current.keys.add(event.key.toLowerCase());
      if (["arrowleft", "arrowright", "a", "d", " "].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
      if (event.key === " " && stateRef.current.status !== "playing") startGame();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      stateRef.current.keys.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let last = performance.now();

    const draw = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.04);
      last = time;
      const state = stateRef.current;

      context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const background = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      background.addColorStop(0, "#0b1020");
      background.addColorStop(1, "#111827");
      context.fillStyle = background;
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      context.strokeStyle = "rgba(255,255,255,.05)";
      context.lineWidth = 1;
      for (let x = 0; x <= GAME_WIDTH; x += 38) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, GAME_HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= GAME_HEIGHT; y += 38) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(GAME_WIDTH, y);
        context.stroke();
      }

      if (state.status === "playing") {
        state.elapsed += dt;
        state.score += dt * 10;

        const speed = 340 + state.elapsed * 8;
        if (state.keys.has("arrowleft") || state.keys.has("a")) state.playerX -= 330 * dt;
        if (state.keys.has("arrowright") || state.keys.has("d")) state.playerX += 330 * dt;
        state.playerX = clamp(state.playerX, 24, GAME_WIDTH - 24);

        state.lastSpawn += dt;
        const spawnEvery = Math.max(0.22, 0.78 - state.elapsed * 0.012);
        if (state.lastSpawn > spawnEvery) {
          state.lastSpawn = 0;
          const size = 18 + Math.random() * 20;
          state.obstacles.push({
            x: size + Math.random() * (GAME_WIDTH - size * 2),
            y: -size,
            size,
            speed: speed * (0.72 + Math.random() * 0.58),
          });
        }

        for (const obstacle of state.obstacles) {
          obstacle.y += obstacle.speed * dt;
        }

        state.obstacles = state.obstacles.filter((o) => o.y < GAME_HEIGHT + o.size);

        for (const obstacle of state.obstacles) {
          const hit =
            Math.abs(obstacle.x - state.playerX) < obstacle.size + 15 &&
            Math.abs(obstacle.y - (GAME_HEIGHT - 52)) < obstacle.size + 15;

          if (hit) {
            finishGame();
            break;
          }
        }

        setScore(Math.floor(state.score));
      }

      for (const obstacle of state.obstacles) {
        context.save();
        context.translate(obstacle.x, obstacle.y);
        context.rotate((obstacle.y / 40) % (Math.PI * 2));
        context.fillStyle = "#fb7185";
        context.shadowBlur = 22;
        context.shadowColor = "#fb7185";
        context.fillRect(-obstacle.size / 2, -obstacle.size / 2, obstacle.size, obstacle.size);
        context.restore();
      }

      const playerY = GAME_HEIGHT - 52;
      context.save();
      context.fillStyle = "#67e8f9";
      context.shadowBlur = 26;
      context.shadowColor = "#22d3ee";
      context.beginPath();
      context.roundRect(state.playerX - 16, playerY - 16, 32, 32, 8);
      context.fill();
      context.restore();

      context.fillStyle = "rgba(255,255,255,.75)";
      context.font = "600 16px system-ui";
      context.fillText(`SCORE ${Math.floor(state.score)}`, 20, 28);

      if (state.status !== "playing") {
        context.fillStyle = "rgba(3,7,18,.72)";
        context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.font = "800 34px system-ui";
        context.fillText(
          state.status === "gameover" ? "RUN OVER" : "NEON DODGE",
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 - 18
        );
        context.fillStyle = "rgba(255,255,255,.70)";
        context.font = "500 16px system-ui";
        context.fillText(
          state.status === "gameover" ? "Press SPACE or PLAY AGAIN" : "Dodge the falling blocks",
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 + 18
        );
        context.textAlign = "left";
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [finishGame, startGame]);

  const askAI = async (preset?: string) => {
    const text = (preset ?? prompt).trim();
    if (!text) return;
    setAiBusy(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await response.json()) as { answer?: string };
      setAiReply(data.answer || "No answer came back.");
    } catch {
      setAiReply("The AI panel couldn't reach the game server.");
    } finally {
      setAiBusy(false);
      setPrompt("");
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">G</div>
          <div>
            <strong>GameForge</strong>
            <span>AI Arcade</span>
          </div>
        </div>

        <nav className="nav">
          <button className={tab === "play" ? "nav-item active" : "nav-item"} onClick={() => setTab("play")}>
            <span>◈</span> Play
          </button>
          <button className={tab === "ai" ? "nav-item active" : "nav-item"} onClick={() => setTab("ai")}>
            <span>✦</span> AI Lab
          </button>
          <button className={tab === "leaderboard" ? "nav-item active" : "nav-item"} onClick={() => setTab("leaderboard")}>
            <span>♛</span> Leaderboard
          </button>
        </nav>

        <div className="side-card">
          <span className="eyebrow">CURRENT BUILD</span>
          <strong>v0.1 — playable</strong>
          <p>Browser-first. No download. Built with Next.js + Vercel.</p>
        </div>

        <div className="sidebar-footer">
          <span className="status-dot" /> Systems online
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR ARCADE</span>
            <h1>{tab === "play" ? "Pick a game." : tab === "ai" ? "Build with AI." : "Chase the high score."}</h1>
          </div>
          <div className="topbar-pill">
            <span className="status-dot" /> AI connected
          </div>
        </header>

        {tab === "play" && (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">FEATURED GAME</span>
                <h2>NEON DODGE</h2>
                <p>Stay alive. Read the pattern. Push your score.</p>
                <div className="hero-actions">
                  <button className="primary" onClick={startGame}>
                    {status === "playing" ? "Restart Run" : "Play Now"} <span>→</span>
                  </button>
                  <button className="ghost" onClick={() => setTab("ai")}>Ask AI Coach</button>
                </div>
              </div>
              <div className="hero-metric">
                <span>BEST</span>
                <strong>{best.toString().padStart(4, "0")}</strong>
              </div>
            </section>

            <section className="game-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">LIVE ARCADE</span>
                  <h3>Neon Dodge</h3>
                </div>
                <div className="control-hint">A / D or ← / → <span>•</span> Space to restart</div>
              </div>
              <div className="canvas-wrap">
                <canvas ref={canvasRef} className="game-canvas" width={GAME_WIDTH} height={GAME_HEIGHT} />
              </div>
            </section>

            <section className="games-grid">
              <article className="game-card featured-card">
                <div className="game-art neon">✦</div>
                <div className="card-copy">
                  <span className="tag">PLAYABLE</span>
                  <h4>Neon Dodge</h4>
                  <p>Arcade survival with escalating speed.</p>
                  <button className="mini-button" onClick={startGame}>Launch</button>
                </div>
              </article>
              <article className="game-card">
                <div className="game-art grid">▦</div>
                <div className="card-copy">
                  <span className="tag muted">NEXT BUILD</span>
                  <h4>Grid Blitz</h4>
                  <p>AI-generated rounds, coming next.</p>
                  <button className="mini-button disabled" disabled>Locked</button>
                </div>
              </article>
              <article className="game-card">
                <div className="game-art memory">◌</div>
                <div className="card-copy">
                  <span className="tag muted">NEXT BUILD</span>
                  <h4>Memory Rush</h4>
                  <p>Pattern memory with adaptive difficulty.</p>
                  <button className="mini-button disabled" disabled>Locked</button>
                </div>
              </article>
            </section>
          </>
        )}

        {tab === "ai" && (
          <section className="ai-layout">
            <div className="ai-card large">
              <div className="ai-orb">✦</div>
              <span className="eyebrow">GAMEFORGE AI</span>
              <h2>Your game copilot.</h2>
              <p>Ask for strategy, game ideas, UI concepts, or beginner-friendly coding help.</p>

              <div className="prompt-row">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") askAI();
                  }}
                  placeholder="e.g. Give me a new game idea..."
                />
                <button className="primary" onClick={() => askAI()} disabled={aiBusy}>
                  {aiBusy ? "Thinking..." : "Ask"} →
                </button>
              </div>

              <div className="quick-prompts">
                <button onClick={() => askAI("Give me a tip for Neon Dodge.")}>Get a game tip</button>
                <button onClick={() => askAI("Give me a simple browser game idea I could build.")}>Invent a game</button>
                <button onClick={() => askAI("How should I make the next GameForge UI feel more polished?")}>Improve the UI</button>
              </div>
            </div>

            <div className="ai-response">
              <span className="eyebrow">RESPONSE</span>
              <div className="response-avatar">G</div>
              <p>{aiReply}</p>
              <span className="response-note">AI responses are generated server-side.</span>
            </div>
          </section>
        )}

        {tab === "leaderboard" && (
          <section className="leaderboard-card">
            <div className="leaderboard-head">
              <div>
                <span className="eyebrow">LOCAL LEADERBOARD</span>
                <h2>Your runs</h2>
              </div>
              <span className="score-chip">BEST {best}</span>
            </div>

            <div className="leader-row top">
              <span>01</span><strong>YOU</strong><b>{best.toString().padStart(4, "0")}</b>
            </div>
            <div className="leader-row"><span>02</span><strong>AI_BETA</strong><b>0084</b></div>
            <div className="leader-row"><span>03</span><strong>PIXEL_RUNNER</strong><b>0071</b></div>
            <div className="leader-row"><span>04</span><strong>GRID_GHOST</strong><b>0066</b></div>

            <p className="leader-note">Your best score is saved in this browser. Online accounts can be added in the next build.</p>
          </section>
        )}
      </section>
    </main>
  );
}
