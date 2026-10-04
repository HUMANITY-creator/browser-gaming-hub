"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const W = 900;
const H = 520;
const LOOP = 3.6;
const SPEED = 190;
type Point = { x: number; y: number };
type Echo = { trail: Point[]; born: number; color: string };

const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v));

function dist(a:Point,b:Point){ return Math.hypot(a.x-b.x,a.y-b.y); }

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const game = useRef({
    running:false, won:false, t:0, player:{x:130,y:260},
    start:{x:130,y:260}, goal:{x:770,y:260}, shard:{x:450,y:120,got:false},
    keys:new Set<string>(), recording:[] as Point[], echoes:[] as Echo[],
    lastX:130,lastY:260, pulse:0, score:0, best:0
  });
  const [running,setRunning]=useState(false);
  const [won,setWon]=useState(false);
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(0);
  const [echoCount,setEchoCount]=useState(0);

  useEffect(()=>{ const b=Number(localStorage.getItem("afterimage-best")||0); setBest(b); game.current.best=b; },[]);

  const reset=useCallback(()=>{
    const s=game.current;
    s.running=true; s.won=false; s.t=0; s.player={x:130,y:260}; s.start={x:130,y:260};
    s.recording=[]; s.echoes=[]; s.pulse=0; s.score=0; s.shard={x:450,y:120,got:false};
    setRunning(true); setWon(false); setScore(0); setEchoCount(0);
  },[]);

  const end=useCallback((success:boolean)=>{
    const s=game.current; s.running=false; s.won=success;
    if(success){
      const final=Math.max(1,Math.floor(1000-s.t*70+s.echoes.length*85));
      s.score=final; setScore(final);
      const next=Math.max(s.best,final); s.best=next; setBest(next);
      localStorage.setItem("afterimage-best",String(next));
    }
    setRunning(false); setWon(success);
  },[]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    const resize=()=>{const d=Math.min(devicePixelRatio||1,2); c.width=W*d;c.height=H*d;c.style.aspectRatio=W+"/"+H;ctx.setTransform(d,0,0,d,0,0)};
    resize(); addEventListener("resize",resize);
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase(); if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"," "].includes(k))e.preventDefault(); game.current.keys.add(k); if(k===" "&&!game.current.running)reset()};
    const up=(e:KeyboardEvent)=>game.current.keys.delete(e.key.toLowerCase());
    addEventListener("keydown",down);addEventListener("keyup",up);
    let last=performance.now();

    const frame=(now:number)=>{
      const dt=Math.min(.035,(now-last)/1000);last=now;const s=game.current;
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createRadialGradient(450,250,30,450,250,620);bg.addColorStop(0,"#172033");bg.addColorStop(1,"#060912");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

      ctx.strokeStyle="rgba(160,180,220,.055)";ctx.lineWidth=1;
      for(let x=20;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=20;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}

      if(s.running){
        s.t+=dt;
        const k=s.keys; let dx=0,dy=0;
        if(k.has("arrowleft")||k.has("a"))dx--; if(k.has("arrowright")||k.has("d"))dx++;
        if(k.has("arrowup")||k.has("w"))dy--; if(k.has("arrowdown")||k.has("s"))dy++;
        const len=Math.hypot(dx,dy)||1; s.player.x=clamp(s.player.x+dx/len*SPEED*dt,32,W-32);s.player.y=clamp(s.player.y+dy/len*SPEED*dt,32,H-32);
        s.recording.push({x:s.player.x,y:s.player.y});
        if(s.t>=LOOP){
          const trail=s.recording.slice(); if(trail.length>2)s.echoes.push({trail,born:s.t,color:["#8b5cf6","#22d3ee","#f472b6","#a3e635"][s.echoes.length%4]});
          s.recording=[];s.t=0; s.player={x:s.start.x,y:s.start.y}; setEchoCount(s.echoes.length);
        }
        s.pulse+=dt;
        if(!s.shard.got && dist(s.player,s.shard)<22)s.shard.got=true;
        if(s.shard.got && dist(s.player,s.goal)<30)end(true);
        for(const e of s.echoes){
          const idx=Math.min(e.trail.length-1,Math.floor(s.t/LOOP*e.trail.length));
          const p=e.trail[idx];
          if(dist(s.player,p)<24)end(false);
        }
      }

      // exit ring
      ctx.save();ctx.translate(s.goal.x,s.goal.y);ctx.rotate(s.pulse*.7);
      ctx.strokeStyle=s.shard.got?"#a3e635":"rgba(255,255,255,.25)";ctx.lineWidth=3;ctx.shadowBlur=24;ctx.shadowColor=s.shard.got?"#a3e635":"transparent";
      ctx.beginPath();ctx.arc(0,0,24+Math.sin(s.pulse*4)*3,0,Math.PI*2);ctx.stroke();ctx.rotate(-s.pulse*1.4);ctx.strokeStyle="rgba(255,255,255,.18)";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.stroke();ctx.restore();

      // memory shard
      if(!s.shard.got){ctx.save();ctx.translate(s.shard.x,s.shard.y);ctx.rotate(s.pulse*1.5);ctx.fillStyle="#a3e635";ctx.shadowBlur=28;ctx.shadowColor="#a3e635";ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(12,0);ctx.lineTo(0,15);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.restore()}

      // echoes
      for(const e of s.echoes){
        const idx=Math.min(e.trail.length-1,Math.floor(s.t/LOOP*e.trail.length));const p=e.trail[idx]; if(!p)continue;
        ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=e.color;ctx.shadowBlur=20;ctx.shadowColor=e.color;ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.15;ctx.beginPath();ctx.arc(p.x,p.y,26,0,Math.PI*2);ctx.fill();ctx.restore();
      }

      // player
      ctx.save();ctx.fillStyle="#fff";ctx.shadowBlur=26;ctx.shadowColor="#fff";ctx.beginPath();ctx.arc(s.player.x,s.player.y,8,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.25)";ctx.beginPath();ctx.arc(s.player.x,s.player.y,16+Math.sin(s.pulse*5)*2,0,Math.PI*2);ctx.stroke();ctx.restore();

      ctx.fillStyle="rgba(255,255,255,.8)";ctx.font="700 13px system-ui";ctx.fillText("LOOP "+(LOOP-s.t).toFixed(1),20,28);ctx.fillStyle="rgba(255,255,255,.42)";ctx.font="500 12px system-ui";ctx.fillText("YOUR PAST IS ALIVE",20,48);
      ctx.textAlign="right";ctx.fillText("ECHOES  "+s.echoes.length,W-20,28);ctx.textAlign="left";

      if(!s.running){
        ctx.fillStyle="rgba(2,5,12,.76)";ctx.fillRect(0,0,W,H);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 42px system-ui";
        ctx.fillText(won?"THE LOOP ACCEPTED YOU":"AFTERIMAGE",W/2,H/2-20);ctx.font="500 16px system-ui";ctx.fillStyle="rgba(255,255,255,.65)";
        ctx.fillText(won?"You solved a room with your own past selves.":"Move for 3.6 seconds. Then your path comes back.",W/2,H/2+18);ctx.fillText("WASD / ARROWS  •  SPACE TO BEGIN",W/2,H/2+48);ctx.textAlign="left";
      }
      raf.current=requestAnimationFrame(frame);
    };
    raf.current=requestAnimationFrame(frame);
    return()=>{removeEventListener("resize",resize);removeEventListener("keydown",down);removeEventListener("keyup",up);if(raf.current)cancelAnimationFrame(raf.current)};
  },[end,reset,won]);

  return <main className="world">
    <header className="mast">
      <div className="title"><span className="sigil">◌</span><div><b>AFTERIMAGE</b><small>an experiment in playing with your own past</small></div></div>
      <div className="best">BEST <strong>{best||"—"}</strong></div>
    </header>

    <section className="intro">
      <div>
        <span className="kicker">A DIFFERENT KIND OF GAME</span>
        <h1>You don't fight the past.<br/><em>You choreograph it.</em></h1>
        <p>Every 3.6 seconds, your last movement becomes a living Echo. Your future is now a room full of everything you just did.</p>
        <div className="buttons"><button className="play" onClick={reset}>{running?"RESET THE ROOM":won?"PLAY AGAIN":"ENTER THE ROOM"} <span>↗</span></button><span className="hint">WASD / ARROWS · SPACE</span></div>
      </div>
      <div className="rules">
        <div><span>01</span><b>MOVE</b><p>Collect the green memory.</p></div>
        <div><span>02</span><b>LOOP</b><p>Your path becomes an Echo.</p></div>
        <div><span>03</span><b>COOPERATE</b><p>Use your past selves to reach the ring.</p></div>
      </div>
    </section>

    <section className="stage">
      <div className="stagebar"><span>ROOM 01 / RECURSION</span><span>{echoCount} ECHO{echoCount===1?"":"ES"}</span></div>
      <div className="canvas-frame"><canvas ref={canvasRef} width={W} height={H}/></div>
    </section>

    <footer><span>Nothing is random after you move.</span><span>Every mistake becomes part of the level.</span><span>Built as an original browser experiment.</span></footer>
  </main>;
}
