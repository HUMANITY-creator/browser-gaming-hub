"use client";

import { useEffect, useState } from "react";

const cars = [
  {left:"48%",top:"56%",type:"sport"},
  {left:"63%",top:"48%",type:"sedan"},
  {left:"72%",top:"63%",type:"suv"},
  {left:"36%",top:"68%",type:"taxi"},
];

export default function Home(){
  const [money,setMoney]=useState(2450);
  const [mission,setMission]=useState("Go to the local job center");
  const [streetCred,setStreetCred]=useState(0);
  const [time,setTime]=useState("7:42 PM");

  useEffect(()=>{
    const t=setInterval(()=>{
      const d=new Date();
      setTime(d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}));
    },30000);
    return()=>clearInterval(t);
  },[]);

  const interact=()=>{
    setMoney(v=>v+250);
    setStreetCred(v=>Math.min(100,v+10));
    setMission("Job accepted — get to the meeting point");
  };

  return (
    <main className="cityline-game">
      <section className="city-scene" aria-label="CITYLINE downtown">
        <div className="sky"/><div className="sunset-glow"/>
        <div className="skyline">
          {Array.from({length:13}).map((_,i)=><div className="tower" key={i} style={{height:(120+(i*47)%260)+"px"}}><i/><i/><i/></div>)}
        </div>
        <div className="palms left"><b/><b/><b/></div><div className="palms right"><b/><b/><b/></div>
        <div className="street">
          <div className="sidewalk leftwalk"/><div className="sidewalk rightwalk"/>
          <div className="road-lane lane-one"/><div className="road-lane lane-two"/><div className="road-line"/>
          <div className="building-front cafe"><strong>SUNSET</strong><span>BAR & GRILL</span></div>
          <div className="building-front shop">NORTHSIDE MARKET</div>
          {cars.map((car,i)=><div key={i} className={"city-car "+car.type} style={{left:car.left,top:car.top}}><span/><b/></div>)}
          <div className="pedestrian woman"/><div className="pedestrian man"/>
          <div className="player-character">
            <div className="character-shadow"/><div className="character-body"><div className="hood"/><div className="backpack"/><div className="arm left-arm"/><div className="arm right-arm"/></div>
            <div className="character-head"><div className="hair"/></div>
          </div>
        </div>
        <div className="brand">CITYLINE <small>PLAY NOW</small></div>
        <div className="hud money"><b>◉</b> ${money.toLocaleString()}<div className="level">Level 1 <span><i style={{width:"9%"}}/></span> <em>90/1,000</em></div></div>
        <div className="hud missions"><strong>◆ &nbsp; First Steps</strong><p>• ${mission}</p><strong>✦ &nbsp; Street Cred</strong><p>• Complete 2 side missions<br/> &nbsp; (${Math.floor(streetCred/50)}/2)</p></div>
        <div className="controls"><b>W</b> Move Forward <b>S</b> Move Backward <b>A</b> Left <b>D</b> Right <b>Shift</b> Sprint <b>E</b> Interact <b>F</b> Enter/Exit Vehicle</div>
        <div className="minimap"><span className="you">▲</span><i className="home">⌂</i><i className="job">◆</i><i className="carpin">●</i></div>
        <div className="location">⌖ Downtown <span>♣ 0.6 mi</span></div>
        <div className="phone"><div className="phone-top"><span>${time}</span><span>● ◔ ▰</span></div><h3>Messages</h3>
          <div className="msg"><b>J</b><span><strong>Jay</strong>You free later?</span></div><div className="msg"><b>M</b><span><strong>Mom</strong>Dinner at 7. Lmk.</span></div><div className="msg"><b>✦</b><span><strong>Job Center</strong>New job opportunity available!</span></div>
          <div className="phone-apps"><button>☎</button><button>✉</button><button>⌖</button><button>⚙</button></div>
        </div>
        <button className="mission-action" onClick={interact}>INTERACT <span>→</span></button>
      </section>
    </main>
  );
}
