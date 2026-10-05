'use client';

import { useEffect, useMemo, useRef, useState } from "react";

const W = 3000, H = 2000;
const clamp = (n:number,a:number,b:number) => Math.max(a, Math.min(b,n));
const d = (a:{x:number,y:number}, b:{x:number,y:number}) => Math.hypot(a.x-b.x,a.y-b.y);

type Car = {id:number,x:number,y:number,angle:number,color:string,speed:number};
type Ped = {id:number,x:number,y:number,tx:number,ty:number,state:"walk"|"panic"};
type Cop = {id:number,x:number,y:number,angle:number};

export default function ExtraCity() {
  const [p,setP] = useState({x:1500,y:1050});
  const [cars,setCars] = useState<Car[]>(() => Array.from({length:18},(_,i)=>({
    id:i,x:300+((i*431)%2400),y:260+((i*277)%1450),angle:i%2?0:Math.PI/2,
    color:["#e85d5d","#4d8df7","#e8c34d","#63c58a","#a77bf3","#f28b5b"][i%6],speed:45+(i%4)*18
  })));
  const [peds,setPeds] = useState<Ped[]>(() => Array.from({length:24},(_,i)=>({
    id:i,x:180+((i*173)%2640),y:180+((i*317)%1640),
    tx:180+(((i*173)+500)%2640),ty:180+(((i*317)+700)%1640),state:"walk"
  })));
  const [wanted,setWanted] = useState(0);
  const [cash,setCash] = useState(1250);
  const [mission,setMission] = useState<"idle"|"active"|"done">("idle");
  const [car,setCar] = useState<number|null>(null);
  const [police,setPolice] = useState<Cop[]>([]);
  const [time,setTime] = useState(21.5);
  const [weather,setWeather] = useState<"clear"|"rain">("clear");
  const keys = useRef(new Set<string>());
  const target = useMemo(()=>({x:2350,y:620}),[]);
  const msg = mission==="idle" ? "Press M to start NIGHT RUN." : mission==="active" ? "Reach the yellow target. Lose the cops if they spot you." : "MISSION COMPLETE. Explore EXTRA CITY.";

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(); keys.current.add(k);
      if(["w","a","s","d","e","m","r","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) e.preventDefault();
      if(k==="m" && mission==="idle") { setMission("active"); setWanted(1); }
      if(k==="r") setWeather(w=>w==="clear"?"rain":"clear");
      if(k==="e"){
        if(car!==null){ setCar(null); return; }
        setCars(cs=>{
          let best=-1,bd=90;
          cs.forEach(c=>{const z=d(p,c);if(z<bd){bd=z;best=c.id;}});
          if(best>=0){setCar(best);setWanted(w=>Math.min(5,Math.max(1,w+1)));}
          return cs;
        });
      }
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
    addEventListener("keydown",down); addEventListener("keyup",up);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up)};
  },[car,mission,p]);

  useEffect(()=>{
    let raf=0,last=performance.now(),accel=0,angle=0;
    const loop=(now:number)=>{
      const dt=Math.min(.035,(now-last)/1000); last=now;
      const k=keys.current;
      const up=k.has("w")||k.has("arrowup"), down=k.has("s")||k.has("arrowdown");
      const left=k.has("a")||k.has("arrowleft"), right=k.has("d")||k.has("arrowright");

      if(car!==null){
        accel += (up?520:0) - (down?700:0) - accel*1.8;
        accel=clamp(accel,-220,520);
        if(left) angle-=dt*(1.5+Math.abs(accel)/300);
        if(right) angle+=dt*(1.5+Math.abs(accel)/300);
        setP(old=>({
          x:clamp(old.x+Math.cos(angle)*accel*dt,70,W-70),
          y:clamp(old.y+Math.sin(angle)*accel*dt,70,H-70)
        }));
        setCars(cs=>cs.map(c=>c.id===car?{...c,x:p.x,y:p.y,angle,speed:Math.abs(accel)}:c));
      } else {
        const vx=(right?1:0)-(left?1:0), vy=(down?1:0)-(up?1:0), len=Math.hypot(vx,vy)||1;
        setP(old=>({x:clamp(old.x+vx/len*250*dt,60,W-60),y:clamp(old.y+vy/len*250*dt,60,H-60)}));
      }

      setCars(cs=>cs.map(c=>c.id===car?c:{
        ...c,
        x:clamp(c.x+Math.cos(c.angle)*c.speed*dt,60,W-60),
        y:clamp(c.y+Math.sin(c.angle)*c.speed*dt,60,H-60)
      }));

      setPeds(ps=>ps.map(n=>{
        const panic=d(n,p)<170 || (wanted>0 && d(n,p)<250);
        const tx=panic?n.x+(n.x-p.x)*2:n.tx, ty=panic?n.y+(n.y-p.y)*2:n.ty;
        const dx=tx-n.x,dy=ty-n.y,len=Math.hypot(dx,dy)||1;
        let nx=n.x+dx/len*(panic?125:42)*dt, ny=n.y+dy/len*(panic?125:42)*dt;
        if(!panic && d({x:nx,y:ny},{x:n.tx,y:n.ty})<30){n.tx=180+((n.id*571+now/20)%2640);n.ty=180+((n.id*283+now/30)%1640);}
        return {...n,x:clamp(nx,80,W-80),y:clamp(ny,80,H-80),state:panic?"panic":"walk"};
      }));

      if(wanted>0){
        setPolice(ps=>{
          const count=wanted>=4?4:wanted>=2?2:1;
          const next=Array.from({length:count},(_,i)=>ps[i]||{id:i,x:p.x+420+i*90,y:p.y-320-i*70,angle:0});
          return next.map(q=>{
            const dx=p.x-q.x,dy=p.y-q.y,len=Math.hypot(dx,dy)||1;
            return {...q,x:q.x+dx/len*(135+wanted*22)*dt,y:q.y+dy/len*(135+wanted*22)*dt,angle:Math.atan2(dy,dx)};
          });
        });
      } else setPolice([]);

      setTime(t=>(t+dt*0.35)%24);
      if(mission==="active" && d(p,target)<115){setMission("done");setCash(v=>v+1500);setWanted(0);}
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop); return()=>cancelAnimationFrame(raf);
  },[car,mission,target,p,wanted]);

  useEffect(()=>{
    if(!wanted)return;
    const t=setInterval(()=>setWanted(w=>Math.random()<0.22?Math.max(0,w-1):w),4500);
    return()=>clearInterval(t);
  },[wanted]);

  const camX=clamp(p.x-650,0,W-1300), camY=clamp(p.y-360,0,H-720);
  const night=time>=19||time<6;
  const roads=[
    {x:0,y:820,w:W,h:170},{x:1180,y:0,w:170,h:H},
    {x:2160,y:0,w:155,h:H},{x:0,y:1450,w:W,h:130}
  ];
  const buildings=Array.from({length:34},(_,i)=>({x:80+((i*313)%2800),y:70+((i*401)%1800),w:120+(i%3)*45,h:85+(i%2)*35}));

  return <main style={{height:"100vh",background:"#080b0e",color:"#f4f7f9",fontFamily:"Arial,sans-serif",overflow:"hidden"}}>
    <header style={{height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:"#090d10",borderBottom:"1px solid #29343b",position:"relative",zIndex:20}}>
      <div><div style={{fontWeight:900,letterSpacing:3,fontSize:22}}>EXTRA CITY</div><div style={{fontSize:10,color:"#84919a",letterSpacing:2}}>OPEN-WORLD PROTOTYPE • BUILD 02</div></div>
      <div style={{display:"flex",gap:18,fontWeight:800}}><span style={{color:"#72e3a0"}}>{"$"+cash.toLocaleString()}</span><span style={{color:wanted?"#ff5a5a":"#7d8991",letterSpacing:3}}>{wanted?"★".repeat(wanted):"—"}</span><span style={{color:"#9aa7ae"}}>{weather==="rain"?"RAIN":"CLEAR"}</span></div>
    </header>
    <section style={{position:"relative",height:"calc(100vh - 64px)",overflow:"hidden",background:night?"#18261d":"#426342"}}>
      <div style={{position:"absolute",left:-camX,top:-camY,width:W,height:H,background:night?"#1d3425":"#426342",transition:"background .5s"}}>
        {roads.map((r,i)=><div key={i} style={{position:"absolute",left:r.x,top:r.y,width:r.w,height:r.h,background:night?"#20272b":"#2d3336",boxShadow:"inset 0 0 0 2px #4b5459"}}/>)}
        {buildings.map((b,i)=><div key={i} style={{position:"absolute",left:b.x,top:b.y,width:b.w,height:b.h,background:i%4===0?"#685149":"#58625b",border:"2px solid #303a35",borderRadius:4,boxShadow:night?"0 0 18px #f4c95d22":"none"}}>
          <div style={{padding:8,fontSize:9,fontWeight:900,color:"#c7ceca"}}>{["MOTEL","AUTO","MARKET","WAREHOUSE"][i%4]}</div>
        </div>)}
        {peds.map(n=><div key={"ped"+n.id} style={{position:"absolute",left:n.x-6,top:n.y-9,width:12,height:18,borderRadius:5,background:n.state==="panic"?"#ffbd55":"#d4d8dc",border:"2px solid #20262a",zIndex:5}}/>)}
        {police.map(q=><div key={"police"+q.id} style={{position:"absolute",left:q.x-29,top:q.y-14,width:58,height:28,borderRadius:6,background:"#f2f2f2",border:"2px solid #15191c",transform:"rotate("+q.angle+"rad)",zIndex:8}}><div style={{height:8,background:"#2563eb"}}/><div style={{position:"absolute",right:0,top:0,width:29,height:8,background:"#ef4444"}}/><div style={{position:"absolute",left:8,top:13,width:42,height:6,background:"#20262a",borderRadius:2}}/></div>)}
        {cars.map(c=><div key={c.id} style={{position:"absolute",left:c.x-25,top:c.y-12,width:50,height:24,borderRadius:7,background:c.color,border:c.id===car?"3px solid white":"2px solid #14191c",transform:"rotate("+c.angle+"rad)",zIndex:6,boxShadow:"0 4px 10px #0006"}}><div style={{position:"absolute",left:10,top:4,width:26,height:15,background:"#20282c",borderRadius:3}}/></div>)}
        {mission==="active"&&<div style={{position:"absolute",left:target.x-48,top:target.y-48,width:96,height:96,border:"3px solid #ffd84d",borderRadius:"50%",boxShadow:"0 0 35px #ffd84d55",zIndex:4}}/>}
        <div style={{position:"absolute",left:p.x-12,top:p.y-16,width:24,height:32,borderRadius:8,background:car!==null?"#f1f1f1":"#46b6ff",border:"3px solid #101417",boxShadow:"0 0 18px #46b6ff66",zIndex:10}}/>
        {weather==="rain"&&<div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(105deg,transparent 0,transparent 14px,#9ed8ff33 15px,#9ed8ff33 16px)",opacity:.75}}/>}
      </div>

      <aside style={{position:"absolute",left:18,top:18,width:300,padding:18,background:"#090d10dd",border:"1px solid #344149",borderRadius:12,backdropFilter:"blur(10px)"}}>
        <div style={{fontWeight:900,fontSize:17}}>NIGHT RUN</div>
        <div style={{marginTop:8,color:"#a5afb5",fontSize:13,lineHeight:1.5}}>{msg}</div>
        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #293239",color:"#7f8b93",fontSize:11,lineHeight:1.8}}>WASD / ARROWS — MOVE<br/>E — ENTER / EXIT CAR<br/>M — START MISSION<br/>R — TOGGLE RAIN</div>
      </aside>

      <div style={{position:"absolute",right:18,top:18,padding:"10px 13px",background:"#090d10dd",border:"1px solid #344149",borderRadius:10,fontSize:11,color:"#b8c1c6"}}>
        {night?"NIGHT":"DAY"} • {weather.toUpperCase()} • {Math.floor(time).toString().padStart(2,"0")}:{Math.floor((time%1)*60).toString().padStart(2,"0")}
      </div>

      <div style={{position:"absolute",right:18,bottom:18,width:190,height:120,background:"#090d10dd",border:"1px solid #344149",borderRadius:10,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:8,background:night?"#1d3425":"#426342"}}>
          <div style={{position:"absolute",left:"39%",top:0,width:"6%",height:"100%",background:"#252b2f"}}/>
          <div style={{position:"absolute",left:0,top:"41%",width:"100%",height:"9%",background:"#252b2f"}}/>
          <div style={{position:"absolute",left:(p.x/W*100)+"%",top:(p.y/H*100)+"%",width:7,height:7,background:"#46b6ff",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
          {police.map(q=><div key={q.id} style={{position:"absolute",left:(q.x/W*100)+"%",top:(q.y/H*100)+"%",width:5,height:5,background:"#ff4d4d",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>)}
          {mission==="active"&&<div style={{position:"absolute",left:(target.x/W*100)+"%",top:(target.y/H*100)+"%",width:7,height:7,background:"#ffd84d",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>}
        </div>
        <div style={{position:"absolute",left:10,bottom:7,fontSize:9,color:"#8d9aa4",letterSpacing:1}}>CITY MAP</div>
      </div>
      <div style={{position:"absolute",left:"50%",bottom:20,transform:"translateX(-50%)",padding:"10px 16px",background:"#090d10ee",border:"1px solid #344149",borderRadius:999,fontSize:12,color:"#d9e0e4"}}>{msg}</div>
    </section>
  </main>;
}
