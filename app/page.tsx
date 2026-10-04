"use client";

import { useEffect, useRef, useState } from "react";

const W=1100,H=680;
type Car={x:number;y:number;a:number;speed:number;color:string;player?:boolean};
type Mission={x:number;y:number;title:string;reward:number;done:boolean};
type Player={x:number;y:number;money:number;health:number;wanted:number;inCar:boolean};

export default function Home(){
  const ref=useRef<HTMLCanvasElement>(null);
  const [money,setMoney]=useState(250);
  const [wanted,setWanted]=useState(0);
  const [mission,setMission]=useState("Find the blue marker");
  const [running,setRunning]=useState(false);

  useEffect(()=>{
    const c=ref.current;if(!c)return; const ctx=c.getContext("2d");if(!ctx)return;
    const keys=new Set<string>();
    const p:Player={x:500,y:330,money:250,health:100,wanted:0,inCar:false};
    const cars:Car[]=[
      {x:430,y:260,a:0,speed:0,color:"#e85d5d"},
      {x:650,y:420,a:Math.PI/2,speed:0,color:"#42a5f5"},
      {x:300,y:520,a:0,speed:0,color:"#f2c94c"},
      {x:760,y:220,a:Math.PI/2,speed:0,color:"#b86cff"},
      {x:510,y:330,a:0,speed:0,color:"#ffffff",player:true}
    ];
    const missions:Mission[]=[
      {x:180,y:145,title:"Meet the contact",reward:300,done:false},
      {x:850,y:155,title:"Deliver the package",reward:500,done:false},
      {x:900,y:535,title:"Street race",reward:750,done:false}
    ];
    let active=0,last=performance.now(),raf=0,cam={x:0,y:0},flash=0;

    const down=(e:KeyboardEvent)=>{keys.add(e.key.toLowerCase());if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault()};
    const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
    addEventListener("keydown",down);addEventListener("keyup",up);

    const road=(x:number,y:number,w:number,h:number)=>{
      ctx.fillStyle="#222733";ctx.fillRect(x,y,w,h);
      ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=2;
      if(w>h){for(let xx=x+20;xx<x+w;xx+=42){ctx.setLineDash([18,16]);ctx.beginPath();ctx.moveTo(xx,y+h/2);ctx.lineTo(xx+18,y+h/2);ctx.stroke()}ctx.setLineDash([])}
      else{for(let yy=y+20;yy<y+h;yy+=42){ctx.setLineDash([18,16]);ctx.beginPath();ctx.moveTo(x+w/2,yy);ctx.lineTo(x+w/2,yy+18);ctx.stroke()}ctx.setLineDash([])}
    };

    const frame=(now:number)=>{
      const dt=Math.min(.033,(now-last)/1000);last=now;
      if(running){
        const dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
        const dy=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
        if(p.inCar){
          const car=cars.find(x=>x.player)!;
          if(dx||dy){car.a=Math.atan2(dy,dx);car.speed=Math.min(280,car.speed+420*dt)}
          else car.speed*=.91;
          car.x+=Math.cos(car.a)*car.speed*dt;car.y+=Math.sin(car.a)*car.speed*dt;
          p.x=car.x;p.y=car.y;
          if(keys.has("e")){p.inCar=false;car.speed=0;p.x+=30;p.y+=20}
        }else{
          const len=Math.hypot(dx,dy)||1;p.x+=dx/len*170*dt;p.y+=dy/len*170*dt;
          if(keys.has("e")){
            const car=cars.find(x=>!x.player&&Math.hypot(x.x-p.x,x.y-p.y)<42);
            if(car){car.player=true;p.inCar=true;cars.forEach(x=>{if(x!==car)x.player=false})}
          }
        }
        p.x=Math.max(45,Math.min(1955,p.x));p.y=Math.max(45,Math.min(1355,p.y));
        const m=missions[active];
        if(!m.done&&Math.hypot(p.x-m.x,p.y-m.y)<55){
          m.done=true;p.money+=m.reward;active=Math.min(missions.length-1,active+1);flash=1;
          setMoney(p.money);setMission(active===missions.length-1&&missions[active].done?"City free-roam":missions[active].title);
        }
        if(p.wanted>0)p.wanted=Math.max(0,p.wanted-dt*.035);
        setWanted(Math.round(p.wanted));
      }

      cam.x=Math.max(0,Math.min(2000-W,p.x-W/2));cam.y=Math.max(0,Math.min(1400-H,p.y-H/2));
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#10151a";ctx.fillRect(0,0,W,H);
      ctx.save();ctx.translate(-cam.x,-cam.y);

      for(let x=0;x<2000;x+=120)for(let y=0;y<1400;y+=120){
        ctx.fillStyle=((x+y)/120)%2?"#171d20":"#1a2023";ctx.fillRect(x+6,y+6,108,108);
      }
      road(0,90,2000,105);road(0,620,2000,105);road(300,0,105,1400);road(980,0,105,1400);road(1640,0,105,1400);
      ctx.fillStyle="#24302a";ctx.fillRect(1130,180,400,300);
      ctx.fillStyle="#1d2930";ctx.fillRect(80,820,650,360);

      ctx.fillStyle="#d4b37a";ctx.font="800 20px system-ui";
      ctx.fillText("NORTHSIDE",120,70);ctx.fillText("DOWNTOWN",1130,145);ctx.fillText("RIVERSIDE",90,800);
      ctx.fillStyle="#55616a";ctx.font="700 11px system-ui";ctx.fillText("FREE CITY — ORIGINAL BROWSER WORLD",120,90);

      missions.forEach((m,i)=>{
        if(m.done)return;
        ctx.beginPath();ctx.arc(m.x,m.y,20+Math.sin(now/180)*4,0,Math.PI*2);
        ctx.fillStyle=i===active?"#65e6ff":"rgba(101,230,255,.18)";ctx.fill();
        ctx.strokeStyle="#65e6ff";ctx.lineWidth=3;ctx.stroke();
        ctx.fillStyle="#fff";ctx.font="700 12px system-ui";ctx.fillText(m.title,m.x-45,m.y-32);
      });

      cars.forEach(car=>{
        ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.a);
        ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(-24,9,48,9);
        ctx.fillStyle=car.color;ctx.fillRect(-24,-13,48,26);
        ctx.fillStyle="#111820";ctx.fillRect(-10,-10,20,20);
        ctx.fillStyle="#dbe8ef";ctx.fillRect(10,-10,9,20);
        ctx.restore();
      });

      if(!p.inCar){
        ctx.fillStyle="#c88a68";ctx.beginPath();ctx.arc(p.x,p.y-18,8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#17151a";ctx.beginPath();ctx.arc(p.x,p.y-21,9,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#3f4650";ctx.fillRect(p.x-9,p.y-10,18,18);ctx.strokeStyle="#c88a68";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x-8,p.y-5);ctx.lineTo(p.x-15,p.y+8);ctx.moveTo(p.x+8,p.y-5);ctx.lineTo(p.x+15,p.y+8);ctx.stroke();ctx.fillStyle="#20242b";ctx.fillRect(p.x-8,p.y+8,6,16);ctx.fillRect(p.x+2,p.y+8,6,16);
      }

      if(flash>0){flash-=dt;ctx.fillStyle="rgba(101,230,255,.08)";ctx.fillRect(0,0,2000,1400)}
      ctx.restore();

      ctx.fillStyle="rgba(5,8,12,.88)";ctx.fillRect(18,18,350,92);
      ctx.fillStyle="#fff";ctx.font="900 18px system-ui";ctx.fillText("CITYLINE",35,47);
      ctx.fillStyle="#8f9aa5";ctx.font="600 11px system-ui";ctx.fillText("OPEN-WORLD BROWSER GAME",35,67);
      ctx.fillStyle="#65e6ff";ctx.font="800 14px system-ui";ctx.fillText("$ "+p.money.toLocaleString(),35,91);
      ctx.fillStyle="#ff5364";ctx.fillText("WANTED  "+"★".repeat(Math.round(p.wanted)),145,91);
      ctx.fillStyle="#fff";ctx.font="700 12px system-ui";ctx.fillText("MISSION  "+(missions[active]?.title||"Free roam"),500,42);
      ctx.fillStyle="#8f9aa5";ctx.font="500 11px system-ui";ctx.fillText("WASD / ARROWS move or drive   •   E enter/exit",500,62);

      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);removeEventListener("keydown",down);removeEventListener("keyup",up)};
  },[running]);

  return <main className="city">
    <header className="top"><div><strong>CITYLINE</strong><span>FREE OPEN WORLD</span></div><div className="pitch">A browser city built for everyone.</div></header>
    <section className="hero">
      <div><small>THE CITY IS YOURS</small><h1>A BIG CITY.<br/><i>A FREE WORLD.</i></h1>
      <p>Explore an original open-world city right in your browser. Walk, drive, discover missions, earn cash and build your story.</p>
      <button onClick={()=>setRunning(true)}>{running?"GAME RUNNING":"ENTER CITY"} <b>→</b></button></div>
      <div className="promise"><b>NOT GTA.</b><p>We aren't copying another game's characters, map, story or assets. We're building our own world around the things that make open-world games exciting.</p></div>
    </section>
    <section className="game"><canvas ref={ref} width={W} height={H}/></section>
    <footer><span>WASD / ARROWS — MOVE & DRIVE</span><span>E — ENTER / EXIT VEHICLE</span><span>BUILT FOR THE BROWSER</span></footer>
  </main>;
}
