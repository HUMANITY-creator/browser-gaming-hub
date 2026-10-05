"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { x: number; y: number };
type Actor = { id: string; x: number; y: number; scale: number; delay: number };

const buildings = [
  { id: "b1", x: 5, y: 40, w: 13, h: 46, depth: 2 },
  { id: "b2", x: 18, y: 31, w: 10, h: 55, depth: 1 },
  { id: "b3", x: 30, y: 23, w: 13, h: 63, depth: 3 },
  { id: "b4", x: 46, y: 17, w: 9, h: 69, depth: 2 },
  { id: "b5", x: 58, y: 28, w: 12, h: 58, depth: 4 },
  { id: "b6", x: 72, y: 19, w: 10, h: 67, depth: 1 },
  { id: "b7", x: 84, y: 37, w: 12, h: 49, depth: 3 },
];

const traffic: Actor[] = [
  { id: "c1", x: 32, y: 74, scale: 0.8, delay: -2 },
  { id: "c2", x: 59, y: 78, scale: 0.62, delay: -8 },
  { id: "c3", x: 72, y: 71, scale: 0.48, delay: -5 },
  { id: "c4", x: 43, y: 82, scale: 0.52, delay: -12 },
];

const pedestrians: Actor[] = [
  { id: "p1", x: 31, y: 66, scale: 0.9, delay: -2 },
  { id: "p2", x: 56, y: 68, scale: 0.8, delay: -4 },
  { id: "p3", x: 69, y: 64, scale: 0.68, delay: -6 },
  { id: "p4", x: 84, y: 70, scale: 0.7, delay: -1 },
  { id: "p5", x: 24, y: 60, scale: 0.58, delay: -5 },
];

export default function Home() {
  const [cash, setCash] = useState(2450);
  const [xp, setXp] = useState(120);
  const [level, setLevel] = useState(1);
  const [wanted, setWanted] = useState(0);
  const [mission, setMission] = useState("Reach the Riverside drop");
  const [phoneOpen, setPhoneOpen] = useState(true);
  const [inCar, setInCar] = useState(false);
  const [camera, setCamera] = useState<Point>({ x: 50, y: 50 });
  const [toast, setToast] = useState("CITYLINE ONLINE");
  const [time, setTime] = useState("7:42 PM");

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e", "f", "m"].includes(key)) return;
      event.preventDefault();

      if (key === "m") {
        setPhoneOpen((value) => !value);
        return;
      }

      if (key === "e") {
        setCash((value) => value + 250);
        setXp((value) => value + 30);
        setMission("Drive to the Harbor contact");
        setToast("Mission complete • +$250");
        return;
      }

      if (key === "f") {
        setInCar((value) => !value);
        setToast(inCar ? "On foot" : "Vehicle entered");
        return;
      }

      const speed = inCar ? 3.2 : 2.1;
      setCamera((prev) => ({
        x: Math.max(12, Math.min(88, prev.x + (key === "a" || key === "arrowleft" ? -speed : key === "d" || key === "arrowright" ? speed : 0))),
        y: Math.max(28, Math.min(72, prev.y + (key === "w" || key === "arrowup" ? -speed : key === "s" || key === "arrowdown" ? speed : 0))),
      }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inCar]);

  const sceneStyle = useMemo(
    () => ({ transform: "translate3d(" + (50 - camera.x) * 0.5 + "%, " + (50 - camera.y) * 0.28 + "%, 0)" }),
    [camera]
  );

  const giveReward = (amount: number, nextMission: string) => {
    setCash((value) => value + amount);
    setXp((value) => {
      const next = value + Math.floor(amount / 7);
      if (next >= 1000) {
        setLevel((current) => current + 1);
        return next - 1000;
      }
      return next;
    });
    setMission(nextMission);
    setToast("+$" + amount + " • " + nextMission);
  };

  return (
    <main className="game-shell">
      <section className="game-world">
        <div className="sky" />
        <div className="sun" />
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />

        <div className="scene" style={sceneStyle}>
          <div className="distant-hills"><span /><span /><span /></div>

          <div className="city-backdrop">
            {buildings.map((building) => (
              <div key={building.id} className={"building building-" + building.depth} style={{ left: building.x + "%", top: building.y + "%", width: building.w + "%", height: building.h + "%" }}>
                <span className="building-cap" />
                <span className="building-glass" />
                <span className="building-sign">CITYLINE</span>
              </div>
            ))}
          </div>

          <div className="street-system">
            <div className="boulevard" />
            <div className="cross-road cross-road-left" />
            <div className="cross-road cross-road-right" />
            <div className="lane-mark lane-a" />
            <div className="lane-mark lane-b" />
            <div className="crosswalk crosswalk-a" />
            <div className="crosswalk crosswalk-b" />
          </div>

          <div className="props">
            <div className="billboard billboard-a"><b>BETTER</b><span>TOMORROW</span></div>
            <div className="billboard billboard-b"><b>RIVERSIDE</b><span>LIVE HERE</span></div>
            <div className="gas-station"><span>24</span><b>FUEL</b></div>
            <div className="lamp lamp-a" />
            <div className="lamp lamp-b" />
          </div>

          <div className="palm palm-a"><i /><b /><span /></div>
          <div className="palm palm-b"><i /><b /><span /></div>

          <div className="traffic">
            {traffic.map((car) => (
              <div key={car.id} className="npc-car" style={{ left: car.x + "%", top: car.y + "%", "--car-scale": car.scale, "--car-delay": car.delay + "s" } as React.CSSProperties}>
                <span className="car-roof" /><span className="car-window" />
                <i className="car-wheel left" /><i className="car-wheel right" />
                <b className="headlight left" /><b className="headlight right" />
              </div>
            ))}
          </div>

          <div className="pedestrians">
            {pedestrians.map((ped) => (
              <div key={ped.id} className="npc-person" style={{ left: ped.x + "%", top: ped.y + "%", "--ped-scale": ped.scale, "--ped-delay": ped.delay + "s" } as React.CSSProperties}>
                <span className="npc-head" /><span className="npc-torso" />
                <i className="npc-leg left" /><i className="npc-leg right" />
              </div>
            ))}
          </div>
        </div>

        <div className="player-stage">
          <div className="player-shadow" />
          <div className={"player " + (inCar ? "driving" : "walking")}>
            <span className="player-head" /><span className="player-hair" /><span className="player-hoodie" /><span className="player-backpack" />
            <i className="player-arm left" /><i className="player-arm right" /><i className="player-leg left" /><i className="player-leg right" />
          </div>
          {inCar && <div className="player-car"><span /><i /><b /></div>}
          <div className="player-name">{inCar ? "YOU • DRIVING" : "YOU"}</div>
        </div>

        <div className="hud hud-logo"><div className="logo">CITYLINE</div><div className="tagline">LIVE. WORK. BUILD.</div></div>

        <div className="hud hud-right">
          <div className="money">◉ ${cash.toLocaleString()}</div>
          <div className="hud-level"><b>LEVEL {level}</b><span><i style={{ width: xp / 10 + "%" }} /></span><small>{xp}/1,000</small></div>
          <div className="wanted">WANTED <strong>{"★".repeat(wanted)}</strong><span>{"★".repeat(5 - wanted)}</span></div>
        </div>

        <aside className="mission">
          <div className="mission-title">CURRENT MISSION</div>
          <strong>◆ FIRST STEPS</strong>
          <p>{mission}</p>
          <small>GO TO THE MARKER</small>
        </aside>

        <div className="hud hud-left-bottom">
          <div className="minimap">
            <div className="map-grid" />
            <span className="map-road mr-1" /><span className="map-road mr-2" /><span className="map-road mr-3" />
            <b className="map-arrow">▲</b><i className="map-point map-point-a">◆</i><i className="map-point map-point-b">●</i>
          </div>
          <div className="location-label"><b>⌖ Downtown</b><span>Riverside • 0.6 mi</span></div>
        </div>

        <div className="controls"><span><b>W A S D</b> move</span><span><b>E</b> mission</span><span><b>F</b> vehicle</span><span><b>M</b> phone</span></div>

        <div className={"phone " + (phoneOpen ? "open" : "closed")}>
          <div className="phone-notch" /><div className="phone-top"><span>{time}</span><b>5G</b></div><h3>Messages</h3>
          {[["J", "Jay", "You free later?"], ["M", "Mom", "Dinner at 7. Lmk."], ["J", "Job Center", "New opportunity available!"]].map(([initial, from, text]) => (
            <button key={from} className="phone-message" onClick={() => setToast(from + ": " + text)}><b>{initial}</b><span><strong>{from}</strong>{text}</span></button>
          ))}
          <div className="phone-apps"><button onClick={() => setToast("Messages")}>✉</button><button onClick={() => setToast("Contacts")}>●</button><button onClick={() => setToast("Map")}>⌖</button><button onClick={() => setPhoneOpen(false)}>⚙</button></div>
        </div>

        {!phoneOpen && <button className="phone-open" onClick={() => setPhoneOpen(true)}>📱</button>}

        <button className="mission-button mission-one" onClick={() => giveReward(300, "Drive to Harbor Avenue")}><span>◆</span> JOB CENTER</button>
        <button className="mission-button mission-two" onClick={() => giveReward(450, "Tune the car at Riverside Garage")}><span>◆</span> GARAGE</button>

        <div className={"toast " + (toast ? "show" : "")}>{toast}</div>
      </section>
    </main>
  );
}
