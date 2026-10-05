"use client";

import { useEffect, useMemo, useState } from "react";

const CITY_BG="https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=2400&q=92";

type Zone={id:string;label:string;x:number;y:number;reward:number};
const zones:Zone[]=[
  {id:"job",label:"JOB CENTER",x:57,y:43,reward:300},
  {id:"garage",label:"GARAGE",x:36,y:63,reward:450},
  {id:"club",label:"SUNSET",x:73,y:55,reward:550},
];

export default function Home(){
  const [cash,setCash]=useState(2450);
  const [level,setLevel]=useState(1);
  const [xp,setXp]=useState(90);
  const [wanted,setWanted]=useState(0);
  const [mission,setMission]=useState("Go to the local job center");
  const [messages,setMessages]=useState(["Jay — You free later?","Mom — Dinner at 7. Lmk.","Job Center — New opportunity available!"]);
  const [phoneOpen,setPhoneOpen]=useState(true);
  const [inCar,setInCar]=useState(false);
  const [position,setPosition]=useState({x:50,y:58});
  const [toast,setToast]=useState("Welcome to CITYLINE");
  const [time]=useState("7:42 PM");

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase();
      if(!["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e","f","m"].includes(k)) return;
      e.preventDefault();
      const step=1.8;
      setPosition(prev=>({
        x:Math.max(28,Math.min(72,prev.x+(k==="a"||k==="arrowleft"?-step:k==="d"||k==="arrowright"?step:0))),
        y:Math.max(30,Math.min(78,prev.y+(k==="w"||k==="arrowup"?-step:k==="s"||k==="arrowdown"?step:0)))
      }));
      if(k==="e") interact();
      if(k==="f") toggleVehicle();
      if(k==="m") setPhoneOpen(v=>!v);
    };
    addEventListener("keydown",onKey);
    return()=>removeEventListener("keydown",onKey);
  },[inCar]);

  const backgroundPosition=useMemo(()=>`${position.x}% ${position.y}%`,[position]);

  function gain(reward:number,text:string){
    setCash(v=>v+reward);
    setXp(v=>{
      const next=v+Math.round(reward/8);
      if(next>=1000){setLevel(l=>l+1);return next-1000;}
      return next;
    });
    setToast(text);
  }

  function interact(){
    gain(250,"Mission updated • +$250");
    setMission("Deliver the package to Riverside");
    setMessages(m=>["Job Center — Route updated.",...m].slice(0,3));
  }

  function toggleVehicle(){
    setInCar(v=>!v);
    setToast(!inCar?"Vehicle entered • F to exit":"Vehicle exited");
  }

  function hitZone(zone:Zone){
    gain(zone.reward,`${zone.label} complete • +$${zone.reward}`);
    setMission(zone.id==="job"?"Deliver the package to Riverside":zone.id==="garage"?"Tune your ride":"Meet the contact");
    if(zone.id==="club")setWanted(v=>Math.min(5,v+1));
  }

  return (
    <main className="game-shell">
      <section className="world" style={{backgroundImage:`url(${CITY_BG})`,backgroundPosition}}>

        <div className="scene-actors" aria-hidden="true">
          <div className="traffic-car traffic-car-a"><span/><i/><b/></div>
          <div className="traffic-car traffic-car-b"><span/><i/><b/></div>
          <div className="traffic-car traffic-car-c"><span/><i/><b/></div>
          <div className="traffic-ped traffic-ped-a"><span/><i/><b/><em/></div>
          <div className="traffic-ped traffic-ped-b"><span/><i/><b/><em/></div>
          <div className="traffic-ped traffic-ped-c"><span/><i/><b/><em/></div>
        </div>
        <div className="cinematic"/>
        <div className="grain"/>

        <header className="topbar">
          <div className="logo">CITYLINE<small>FREE OPEN WORLD</small></div>
          <button className="top-action" onClick={interact} aria-label="Interact">INTERACT <span>→</span></button>
          <div className="wallet">
            <div className="cash-line"><span>◉</span> ${cash.toLocaleString()}</div>
            <div className="level-row"><b>LEVEL {level}</b><i><em style={{width:`${xp/10}%`}}/></i><small>{xp}/1,000</small></div>
            <div className="wanted">WANTED {"★".repeat(wanted)}<span>{"★".repeat(5-wanted)}</span></div>
          </div>
        </header>

        <aside className="mission-card">
          <strong>◆ FIRST STEPS</strong>
          <p>{mission}</p>
          <strong>✦ STREET CRED</strong>
          <p>Complete 2 side missions<br/>({Math.min(2,Math.floor(xp/250))}/2)</p>
        </aside>

        <div className="world-copy">
          <span>DOWNTOWN / 7:42 PM</span>
          <h1>A city that feels lived in.</h1>
          <p>Explore, drive, take jobs, build cash, and make your own route through an original browser city.</p>
        </div>

        {zones.map(zone=>(
          <button
            key={zone.id}
            className="zone"
            style={{left:`${zone.x}%`,top:`${zone.y}%`}}
            onClick={()=>hitZone(zone)}
          >
            <span className="zone-dot"/><b>{zone.label}</b>
          </button>
        ))}

        <div className={`player-tag ${inCar?"car":"walk"}`} style={{left:`${position.x}%`,top:`${position.y}%`}}>
          <div className="player-avatar">
            <span className="player-head"/>
            <span className="player-neck"/>
            <span className="player-body"/>
            <span className="player-arm player-arm-left"/>
            <span className="player-arm player-arm-right"/>
            <span className="player-leg player-leg-left"/>
            <span className="player-leg player-leg-right"/>
          </div>
          <b>{inCar?"YOU — DRIVING":"YOU"}</b>
        </div>

        <div className="minimap">
          <div className="map-roads r1"/><div className="map-roads r2"/><div className="map-roads r3"/>
          <span className="map-you" style={{left:`${position.x}%`,top:`${position.y}%`}}>▲</span>
          <i className="map-home">⌂</i><i className="map-job">◆</i><i className="map-car">●</i>
        </div>

        <div className="controls">
          <span><b>W A S D</b> move</span>
          <span><b>E</b> interact</span>
          <span><b>F</b> enter / exit vehicle</span>
          <span><b>M</b> phone</span>
        </div>

        <div className="location"><b>⌖ Downtown</b><span>0.6 mi</span></div>

        <div className={`phone ${phoneOpen?"open":"closed"}`}>
          <div className="phone-head"><span>{time}</span><button onClick={()=>setPhoneOpen(false)}>—</button></div>
          <h3>Messages</h3>
          {messages.map((m,i)=>{const [from,...rest]=m.split(" — ");return <button key={i} className="message" onClick={()=>setToast(m)}><b>{from.slice(0,1)}</b><span><strong>{from}</strong>{rest.join(" — ")}</span></button>})}
          <div className="phone-apps">
            <button onClick={()=>setToast("Phone")}>☎</button>
            <button onClick={()=>setToast("Messages")}>✉</button>
            <button onClick={()=>setToast("Map")}>⌖</button>
            <button onClick={()=>setPhoneOpen(false)}>⚙</button>
          </div>
        </div>

        {!phoneOpen && <button className="phone-launch" onClick={()=>setPhoneOpen(true)}>📱</button>}
        <div className="play-hint"><b>PLAYABLE</b><span>Click the city, then use W A S D. E = interact · F = vehicle · M = phone</span></div>\n        <div className="toast">{toast}</div>
      </section>
    </main>
  );
}
