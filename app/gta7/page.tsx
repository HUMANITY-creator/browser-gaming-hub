'use client';

import { useEffect, useMemo, useRef, useState } from "react";

const W = 3000, H = 2000;
const clamp = (n:number,a:number,b:number) => Math.max(a, Math.min(b,n));
const d = (a:{x:number,y:number}, b:{x:number,y:number}) => Math.hypot(a.x-b.x,a.y-b.y);

export default function ExtraCity() {
  const [p,setP] = useState({x:1500,y:1050});
  const [cars,setCars] = useState(() => Array.from({length:14},(_,i)=>({
    id:i,x:300+((i*431)%2400),y:260+((i*277)%1450),
    color:["#e85d5d","#4d8df7","#e8c34d","#63c58a","#a77bf3"][i%5]
  })));
  const [wanted,setWanted] = useState(0);
  const [cash,setCash] = useState(1250);
  const [mission,setMission] = useState<"idle"|"active"|"done">("idle");
  const [car,setCar] = useState<number|null>(null);
  const keys = useRef(new Set<string>());
  const target = useMemo(()=>({x:2350,y:620}),[]);
  const msg = mission==="idle" ? "Press M to start NIGHT RUN." : mission==="active" ? "Reach the yellow target." : "MISSION COMPLETE. Explore EXTRA CITY.";

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(); keys.current.add(k);
      if(["w","a","s","d","e","m","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) e.preventDefault();
      if(k==="m" && mission==="idle") setMission("active");
      if(k==="e"){
        if(car!==null){ setCar(null); return; }
        setCars(cs=>{
          let best=-1, bd=95;
          cs.forEach(c=>{const z=d(p,c); if(z<bd){bd=z;best=c.id;}});
          if(best>=0){setCar(best);setWanted(w=>Math.max(1,w));}
          return cs;
        });
      }
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
    addEventListener("keydown",down); addEventListener("keyup",up);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up)};
  },[car,mission,p]);

  useEffect(()=>{
    let raf=0,last=performance.now();
    const loop=(now:number)=>{
      const dt=Math.min(.035,(now-last)/1000); last=now;
      const k=keys.current; let x=0,y=0;
      if(k.has("w")||k.has("arrowup"))y--; if(k.has("s")||k.has("arrowdown"))y++;
      if(k.has("a")||k.has("arrowleft"))x--; if(k.has("d")||k.has("arrowright"))x++;
      const len=Math.hypot(x,y)||1, speed=car===null?250:540;
      setP(old=>{
        const n={x:clamp(old.x+x/len*speed*dt,60,W-60),y:clamp(old.y+y/len*speed*dt,60,H-60)};
        if(mission==="active" && d(n,target)<120){setMission("done");setCash(v=>v+1500);setWanted(0)}
        return n;
      });
      setCars(cs=>cs.map(c=>c.id===car?{...c,x:p.x,y:p.y}:({...c,x:c.x+Math.sin(now/900+c.id)*dt*15})));
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop); return()=>cancelAnimationFrame(raf);
  },[car,mission,target,p.x,p.y]);

  useEffect(()=>{
    if(!wanted)return;
    const t=setInterval(()=>setWanted(w=>Math.random()<.18?Math.max(0,w-1):w),5000);
    return()=>clearInterval(t);
  },[wanted]);

  const camX=clamp(p.x-650,0,W-1300), camY=clamp(p.y-360,0,H-720);
  const roads=[
    {x:0,y:820,w:W,h:170},{x:1180,y:0,w:170,h:H},
    {x:2160,y:0,w:155,h:H},{x:0,y:1450,w:W,h:130}
  ];
  const buildings=Array.from({length:28},(_,i)=>({x:80+((i*313)%2800),y:70+((i*401)%1800),w:120+(i%3)*45,h:85+(i%2)*35}));

  return <main style={{height:"100vh",background:"#080b0e",color:"#f4f7f9",fontFamily:"Arial,sans-serif",overflow:"hidden"}}>
    <header style={{height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:"#090d10",borderBottom:"1px solid #29343b",position:"relative",zIndex:20}}>
      <div><div style={{fontWeight:900,letterSpacing:3,fontSize:22}}>EXTRA CITY</div><div style={{fontSize:10,color:"#84919a",letterSpacing:2}}>OPEN-WORLD PROTOTYPE • BUILD 01</div></div>
      <div style={{display:"flex",gap:18,fontWeight:800}}><span style={{color:"#72e3a0"}}>{"$"+cash.toLocaleString()}</span><span style={{color:wanted?"#ff5a5a":"#7d8991",letterSpacing:3}}>{wanted?"★".repeat(wanted):"—"}</span></div>
    </header>
    <section style={{position:"relative",height:"calc(100vh - 64px)",overflow:"hidden",background:"#2f4935"}}>
      <div style={{position:"absolute",left:-camX,top:-camY,width:W,height:H,background:"#304b36"}}>
        {roads.map((r,i)=><div key={i} style={{position:"absolute",left:r.x,top:r.y,width:r.w,height:r.h,background:"#252b2f",boxShadow:"inset 0 0 0 2px #3c454a"}}/>)}
        {buildings.map((b,i)=><div key={i} style={{position:"absolute",left:b.x,top:b.y,width:b.w,height:b.h,background:i%4===0?"#685149":"#58625b",border:"2px solid #303a35",borderRadius:4}}>
          <div style={{padding:8,fontSize:9,fontWeight:900,color:"#c7ceca"}}>{["MOTEL","AUTO","MARKET","WAREHOUSE"][i%4]}</div>
        </div>)}
        {cars.map(c=><div key={c.id} style={{position:"absolute",left:c.x-25,top:c.y-12,width:50,height:24,borderRadius:7,background:c.color,border:c.id===car?"3px solid white":"2px solid #14191c",zIndex:6,boxShadow:"0 4px 10px #0006"}}>
          <div style={{position:"absolute",left:10,top:4,width:26,height:15,background:"#20282c",borderRadius:3}}/>
        </div>)}
        {mission==="active"&&<div style={{position:"absolute",left:target.x-48,top:target.y-48,width:96,height:96,border:"3px solid #ffd84d",borderRadius:"50%",boxShadow:"0 0 35px #ffd84d55",zIndex:4}}/>}
        <div style={{position:"absolute",left:p.x-12,top:p.y-16,width:24,height:32,borderRadius:8,background:car!==null?"#f1f1f1":"#46b6ff",border:"3px solid #101417",boxShadow:"0 0 18px #46b6ff66",zIndex:10}}/>
      </div>

      <aside style={{position:"absolute",left:18,top:18,width:280,padding:18,background:"#090d10dd",border:"1px solid #344149",borderRadius:12,backdropFilter:"blur(10px)"}}>
        <div style={{fontWeight:900,fontSize:17}}>NIGHT RUN</div>
        <div style={{marginTop:8,color:"#a5afb5",fontSize:13,lineHeight:1.5}}>{msg}</div>
        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #293239",color:"#7f8b93",fontSize:11,lineHeight:1.8}}>WASD / ARROWS — MOVE<br/>E — ENTER / EXIT CAR<br/>M — START MISSION</div>
      </aside>

      <div style={{position:"absolute",right:18,bottom:18,width:190,height:120,background:"#090d10dd",border:"1px solid #344149",borderRadius:10,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:8,background:"#304b36"}}>
          <div style={{position:"absolute",left:"39%",top:0,width:"6%",height:"100%",background:"#252b2f"}}/>
          <div style={{position:"absolute",left:0,top:"41%",width:"100%",height:"9%",background:"#252b2f"}}/>
          <div style={{position:"absolute",left:(p.x/W*100)+"%",top:(p.y/H*100)+"%",width:7,height:7,background:"#46b6ff",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
          {mission==="active"&&<div style={{position:"absolute",left:(target.x/W*100)+"%",top:(target.y/H*100)+"%",width:7,height:7,background:"#ffd84d",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>}
        </div>
        <div style={{position:"absolute",left:10,bottom:7,fontSize:9,color:"#8d9aa4",letterSpacing:1}}>CITY MAP</div>
      </div>

      <div style={{position:"absolute",left:"50%",bottom:20,transform:"translateX(-50%)",padding:"10px 16px",background:"#090d10ee",border:"1px solid #344149",borderRadius:999,fontSize:12,color:"#d9e0e4"}}>{msg}</div>
    </section>
  </main>;
}
