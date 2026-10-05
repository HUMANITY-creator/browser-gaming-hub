"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Stats = { cash: number; xp: number; level: number; wanted: number; mission: string; phoneOpen: boolean; inCar: boolean; toast: string; time: string };

function makeWindowTexture(dark = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = dark ? "#111920" : "#26313b";
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 250; y += 22) {
    for (let x = 8; x < 124; x += 18) {
      const lit = (x * 7 + y * 13) % 5 !== 0;
      ctx.fillStyle = lit ? (dark ? "#6d7f86" : "#9bb3c1") : "#202b33";
      ctx.globalAlpha = lit ? 0.78 : 0.34;
      ctx.fillRect(x, y, 10, 13);
    }
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function addBuilding(scene: THREE.Scene, x: number, z: number, w: number, d: number, h: number, index: number) {
  const colors = ["#8c99a3", "#4a5964", "#6b4b43", "#344e5c", "#707b82", "#2f3c45"];
  const tex = makeWindowTexture(index % 2 === 0);
  const mat = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.78, metalness: 0.12, map: tex });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.22, d * 1.04), new THREE.MeshStandardMaterial({ color: "#222b33", roughness: 0.88 }));
  roof.position.set(x, h + 0.11, z);
  roof.castShadow = true;
  scene.add(roof);
}

function makeCar(color: string, scale = 1) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5 * scale, 0.65 * scale, 4.5 * scale), new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.32 }));
  body.position.y = 0.62 * scale;
  body.castShadow = true;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85 * scale, 0.7 * scale, 2.1 * scale), new THREE.MeshStandardMaterial({ color: "#1b252d", roughness: 0.18, metalness: 0.18, transparent: true, opacity: 0.92 }));
  cabin.position.set(0, 1.03 * scale, -0.15 * scale);
  cabin.castShadow = true;
  group.add(cabin);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#0b0e11", roughness: 0.92 });
  [-1, 1].forEach((sx) => [-1.45, 1.45].forEach((sz) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43 * scale, 0.43 * scale, 0.28 * scale, 14), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(sx * 1.1 * scale, 0.38 * scale, sz * scale);
    wheel.castShadow = true;
    group.add(wheel);
  }));
  const lightMat = new THREE.MeshStandardMaterial({ color: "#fff2cf", emissive: "#d9a95c", emissiveIntensity: 1.8 });
  [-0.78, 0.78].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.16 * scale, 0.12 * scale), lightMat);
    lamp.position.set(x * scale, 0.77 * scale, -2.27 * scale);
    group.add(lamp);
  });
  return group;
}

function makePerson(tone: string, shirt: string) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.62 });
  const clothing = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.86 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 14), skin);
  head.position.y = 1.58;
  group.add(head);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.65, 5, 10), clothing);
  torso.position.y = 0.99;
  torso.scale.set(0.8, 1.08, 0.55);
  torso.castShadow = true;
  group.add(torso);
  [-0.18, 0.18].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), clothing);
    leg.position.set(x, 0.43, 0);
    group.add(leg);
  });
  return group;
}

export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ cash: 2450, xp: 140, level: 1, wanted: 0, mission: "Reach the Riverside drop", phoneOpen: true, inCar: false, toast: "CITYLINE ONLINE", time: "7:42 PM" });

  const statsRef = useRef<Stats>(stats);
  const keys = useRef<Record<string, boolean>>({});
  const playerRef = useRef<THREE.Group | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const missionRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mount.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#071018");
    scene.fog = new THREE.FogExp2("#0d1822", 0.0065);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5.5, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.current.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight("#dbeaff", "#18232b", 2.2);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#ffd2a1", 3.5);
    sun.position.set(-80, 130, 65);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ color: "#1a252c", roughness: 0.96 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({ color: "#1a1f23", roughness: 0.9 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#555e64", roughness: 0.88 });
    const lineMat = new THREE.MeshStandardMaterial({ color: "#d6b74f", emissive: "#614e18", emissiveIntensity: 0.32 });
    const roadCoords = [-90, -45, 0, 45, 90];
    roadCoords.forEach((x) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 420), roadMat);
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      scene.add(road);
      const sidewalk1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 420), sidewalkMat);
      sidewalk1.position.set(x - 10.7, 0.06, 0);
      scene.add(sidewalk1);
      const sidewalk2 = sidewalk1.clone();
      sidewalk2.position.x = x + 10.7;
      scene.add(sidewalk2);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 420), lineMat);
      stripe.position.set(x, 0.08, 0);
      scene.add(stripe);
    });
    roadCoords.forEach((z) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(420, 0.08, 18), roadMat);
      road.position.set(0, 0.02, z);
      road.receiveShadow = true;
      scene.add(road);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(420, 0.09, 0.18), lineMat);
      stripe.position.set(0, 0.08, z);
      scene.add(stripe);
    });

    let bIndex = 0;
    for (let gx = -4; gx <= 4; gx++) {
      for (let gz = -4; gz <= 4; gz++) {
        if (gx === 0 || gz === 0) continue;
        const x = gx * 45 + 18 * Math.sin(gz * 1.7 + gx);
        const z = gz * 45 + 15 * Math.cos(gx * 1.2 - gz);
        const w = 21 + (Math.abs(gx * 7 + gz * 11) % 8);
        const d = 21 + (Math.abs(gx * 11 + gz * 5) % 9);
        const h = 16 + (Math.abs(gx * 13 + gz * 17) % 62);
        addBuilding(scene, x, z, w, d, h, bIndex++);
      }
    }

    for (let i = 0; i < 24; i++) {
      const z = -126 + i * 11;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.5, 8), new THREE.MeshStandardMaterial({ color: "#1c2227", roughness: 0.8 }));
      pole.position.set(10.1, 1.75, z);
      scene.add(pole);
      const lamp = new THREE.PointLight("#ffd78c", 3.2, 13);
      lamp.position.set(10.1, 3.35, z);
      scene.add(lamp);
    }

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(11, 17, 95, 24), new THREE.MeshStandardMaterial({ color: "#40586b", roughness: 0.35, metalness: 0.28, map: makeWindowTexture(false) }));
    tower.position.set(6, 47.5, -132);
    tower.castShadow = true;
    scene.add(tower);
    const towerTop = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 16, 20), new THREE.MeshStandardMaterial({ color: "#6e8797", roughness: 0.25, metalness: 0.4 }));
    towerTop.position.set(6, 103, -132);
    scene.add(towerTop);

    const player = new THREE.Group();
    const playerBody = makePerson("#a96f55", "#171d25");
    player.add(playerBody);
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.95, 0.28), new THREE.MeshStandardMaterial({ color: "#10151b", roughness: 0.95 }));
    backpack.position.set(0, 1.05, 0.27);
    player.add(backpack);
    player.position.set(0, 0, 18);
    player.rotation.y = Math.PI;
    scene.add(player);
    playerRef.current = player;

    const playerCar = makeCar("#31475b", 1.08);
    playerCar.position.set(0, 0, 12);
    playerCar.rotation.y = Math.PI;
    scene.add(playerCar);
    carRef.current = playerCar;
    playerCar.visible = false;

    traffic.forEach((_, i) => {
      const colors = ["#b83b34", "#2e5d84", "#d0a441", "#444b53", "#e2e4e4", "#18202b"];
      const car = makeCar(colors[i % colors.length], 0.72 + (i % 3) * 0.08);
      const lane = i % 2 === 0 ? -45 : 45;
      car.position.set(lane, 0, -130 + i * 54);
      car.userData.speed = 7 + i * 1.3;
      car.userData.axis = i % 2;
      car.userData.direction = i % 3 === 0 ? -1 : 1;
      car.userData.traffic = true;
      scene.add(car);
    });

    for (let i = 0; i < 34; i++) {
      const tones = ["#855743", "#9a684f", "#b77c5e", "#6b4636", "#bf886b"];
      const shirts = ["#252e38", "#445766", "#7b3432", "#d18b31", "#1d3140", "#53664c"];
      const ped = makePerson(tones[i % tones.length], shirts[i % shirts.length]);
      const side = i % 2 === 0 ? -1 : 1;
      ped.position.set(side * (9.2 + (i % 3) * 1.2), 0, -150 + i * 9.2);
      ped.scale.setScalar(0.92 + (i % 4) * 0.06);
      ped.userData.walkSpeed = 0.6 + (i % 5) * 0.12;
      ped.userData.baseX = ped.position.x;
      ped.userData.walkPhase = i * 0.9;
      scene.add(ped);
    }

    const mission = new THREE.Group();
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 9, 12), new THREE.MeshBasicMaterial({ color: "#ffd64e", transparent: true, opacity: 0.42 }));
    beacon.position.y = 4.5;
    mission.add(beacon);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 12, 48), new THREE.MeshStandardMaterial({ color: "#ffd64e", emissive: "#c18a18", emissiveIntensity: 2.2, roughness: 0.28 }));
    ring.rotation.x = Math.PI / 2;
    mission.add(ring);
    mission.position.set(44, 0, -44);
    scene.add(mission);
    missionRef.current = mission;

    const wantedLight = new THREE.PointLight("#ff2e45", 0, 12);
    wantedLight.position.set(-3, 3, 0);
    player.add(wantedLight);

    const state = { yaw: Math.PI, speed: 0, velocity: new THREE.Vector3() };
    const clock = new THREE.Clock();
    let raf = 0;

    const keydown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      const k = e.key.toLowerCase();
      if (["w","a","s","d","e","f","m","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) e.preventDefault();
      if (k === "m") setStats((s) => ({ ...s, phoneOpen: !s.phoneOpen }));
      if (k === "f") {
        setStats((s) => ({ ...s, inCar: !s.inCar, toast: s.inCar ? "Back on foot" : "Vehicle entered" }));
      }
      if (k === "e") {
        const p = playerRef.current;
        const m = missionRef.current;
        if (!p || !m) return;
        const d = p.position.distanceTo(m.position);
        if (d < 10) {
          setStats((s) => ({ ...s, cash: s.cash + 350, xp: Math.min(999, s.xp + 48), mission: "Meet the Harbor contact", toast: "MISSION COMPLETE • +$350" }));
          m.position.set(-90, 0, 45);
        } else {
          setStats((s) => ({ ...s, toast: "Get closer to the yellow marker" }));
        }
      }
    };
    const keyup = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resize);

    const loop = () => {
      const dt = Math.min(clock.getDelta(), 0.033);
      const p = playerRef.current!;
      const c = carRef.current!;
      const inCar = statsRef.current.inCar;
      const controlled = inCar ? c : p;
      const turn = (keys.current.a || keys.current.arrowleft ? 1 : 0) + (keys.current.d || keys.current.arrowright ? -1 : 0);
      const move = (keys.current.w || keys.current.arrowup ? 1 : 0) + (keys.current.s || keys.current.arrowdown ? -1 : 0);
      state.yaw += turn * dt * (inCar ? 1.8 : 2.7);
      controlled.rotation.y = state.yaw;
      const dir = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
      const speed = inCar ? 18 : 6.5;
      const target = move * speed;
      state.speed += (target - state.speed) * Math.min(1, dt * 7);
      controlled.position.addScaledVector(dir, state.speed * dt);
      controlled.position.x = THREE.MathUtils.clamp(controlled.position.x, -150, 150);
      controlled.position.z = THREE.MathUtils.clamp(controlled.position.z, -150, 150);
      if (inCar) p.position.copy(c.position);
      p.visible = !inCar;
      c.visible = inCar;

      scene.traverse((obj) => {
        const user = obj.userData as any;
        if (user.traffic) {
          const car = obj as THREE.Group;
          const d = user.speed * dt * user.direction;
          if (user.axis === 0) car.position.z += d; else car.position.x += d;
          if (Math.abs(car.position.z) > 210) car.position.z = -Math.sign(car.position.z) * 210;
          if (Math.abs(car.position.x) > 210) car.position.x = -Math.sign(car.position.x) * 210;
        }
        if (user.walkSpeed) {
          const ped = obj as THREE.Group;
          ped.position.z += user.walkSpeed * dt;
          ped.position.x = user.baseX + Math.sin(clock.elapsedTime * 1.3 + user.walkPhase) * 1.8;
          if (ped.position.z > 205) ped.position.z = -190;
        }
      });

      if (missionRef.current) {
        missionRef.current.rotation.y += dt * 0.9;
        missionRef.current.children[1].position.y = 0.12 + Math.sin(clock.elapsedTime * 2.2) * 0.18;
      }

      const camOffset = new THREE.Vector3(-Math.sin(state.yaw) * 9.5, 5.3, -Math.cos(state.yaw) * 9.5);
      const camTarget = controlled.position.clone().add(new THREE.Vector3(0, 1.7, 0));
      const desired = camTarget.clone().add(camOffset);
      camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
      camera.lookAt(camTarget);

      wantedLight.intensity = statsRef.current.wanted > 0 ? 4.2 : 0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const timeId = window.setInterval(() => setStats((s) => ({ ...s, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) })), 30000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timeId);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (mount.current && renderer.domElement.parentNode === mount.current) mount.current.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose()); else material?.dispose();
      });
    };
  }, []);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    const t = window.setTimeout(() => setStats((s) => ({ ...s, toast: "" })), 2500);
    return () => window.clearTimeout(t);
  }, [stats.toast]);

  return (
    <main className="game-shell">
      <div ref={mount} className="webgl" />
      <div className="vignette" />
      <header className="hud-logo"><div className="logo">CITYLINE</div><span>LIVE. WORK. BUILD.</span></header>
      <section className="hud-top-right">
        <div className="money">◉ ${stats.cash.toLocaleString()}</div>
        <div className="level"><b>LEVEL {stats.level}</b><i><em style={{ width: stats.xp / 10 + "%" }} /></i><small>{stats.xp}/1,000</small></div>
        <div className="wanted">WANTED <strong>{"★".repeat(stats.wanted)}</strong><span>{"★".repeat(5 - stats.wanted)}</span></div>
      </section>
      <aside className="mission-card"><b>CURRENT MISSION</b><h3>◆ FIRST STEPS</h3><p>{stats.mission}</p><small>FOLLOW THE YELLOW MARKER</small></aside>
      <div className="location">⌖ Downtown <span>Riverside • 0.6 mi</span></div>
      <div className="minimap"><div className="map-streets" /><div className="map-dot" /><div className="map-marker">◆</div></div>
      <div className="controls"><span><b>WASD</b> move</span><span><b>E</b> mission</span><span><b>F</b> vehicle</span><span><b>M</b> phone</span></div>
      {stats.phoneOpen && <aside className="phone"><div className="phone-notch" /><div className="phone-time">{stats.time}<span>5G</span></div><h2>Messages</h2><button onClick={() => setStats((s) => ({ ...s, toast: "Jay: You free later?" }))}><b>J</b><span><strong>Jay</strong>You free later?</span></button><button onClick={() => setStats((s) => ({ ...s, toast: "Mom: Dinner at 7. Lmk." }))}><b>M</b><span><strong>Mom</strong>Dinner at 7. Lmk.</span></button><button onClick={() => setStats((s) => ({ ...s, toast: "Job Center: New opportunity available!" }))}><b>J</b><span><strong>Job Center</strong>New opportunity available!</span></button><footer><button onClick={() => setStats((s) => ({ ...s, toast: "Phone" }))}>☎</button><button onClick={() => setStats((s) => ({ ...s, toast: "Map" }))}>⌖</button><button onClick={() => setStats((s) => ({ ...s, phoneOpen: false }))}>—</button></footer></aside>}
      {!stats.phoneOpen && <button className="phone-launch" onClick={() => setStats((s) => ({ ...s, phoneOpen: true }))}>📱</button>}
      <div className="player-label">{stats.inCar ? "YOU • DRIVING" : "YOU"}</div>
      <div className={"toast " + (stats.toast ? "show" : "")}>{stats.toast}</div>
    </main>
  );
}
