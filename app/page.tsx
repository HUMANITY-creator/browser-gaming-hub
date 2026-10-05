"use client";

import { useEffect, useRef, useState } from "react";

type Vec3 = { x: number; y: number; z: number };
type Vehicle = { p: Vec3; yaw: number; speed: number; color: [number, number, number] };
type Ped = { p: Vec3; phase: number; color: [number, number, number] };

const buildings: Array<{ x:number; z:number; w:number; d:number; h:number; color:[number,number,number] }> = [];
for (let gx = -6; gx <= 6; gx++) {
  for (let gz = -6; gz <= 6; gz++) {
    if (gx === 0 || gz === 0) continue;
    const x = gx * 24 + Math.sin(gz * 1.7 + gx) * 4;
    const z = gz * 24 + Math.cos(gx * 1.3 - gz) * 4;
    const h = 8 + ((Math.abs(gx * 17 + gz * 11) % 10) * 2.4);
    const w = 12 + (Math.abs(gx * 5 + gz * 7) % 7);
    const d = 12 + (Math.abs(gx * 9 + gz * 3) % 7);
    const palette: [number, number, number][] = [[.19,.24,.29],[.29,.34,.38],[.36,.25,.23],[.18,.30,.35],[.31,.31,.32],[.22,.27,.33]];
    buildings.push({ x, z, w, d, h, color: palette[Math.abs(gx * 3 + gz * 5) % palette.length] });
  }
}

const vehicles: Vehicle[] = [];
const colors: [number, number, number][] = [[.72,.13,.12],[.12,.31,.52],[.82,.55,.12],[.21,.24,.27],[.74,.75,.76],[.15,.18,.22]];
for (let i = 0; i < 24; i++) {
  const axis = i % 2;
  vehicles.push({
    p: axis === 0 ? { x: i % 3 === 0 ? 11 : -11, y: .45, z: -140 + i * 11.5 } : { x: -140 + i * 11.5, y: .45, z: i % 3 === 0 ? 11 : -11 },
    yaw: axis === 0 ? 0 : Math.PI / 2,
    speed: 5 + (i % 5) * .9,
    color: colors[i % colors.length]
  });
}

const peds: Ped[] = [];
const skin: [number, number, number][] = [[.48,.28,.20],[.62,.38,.27],[.72,.46,.34],[.36,.20,.15],[.66,.40,.31]];
const shirt: [number, number, number][] = [[.12,.15,.19],[.22,.28,.34],[.42,.18,.16],[.55,.36,.12],[.18,.29,.22]];
for (let i = 0; i < 34; i++) {
  peds.push({
    p: { x: i % 2 === 0 ? 8.5 : -8.5, y: 0, z: -150 + i * 8.9 },
    phase: i * .83,
    color: [...skin[i % skin.length]].map((v,j)=>v*.9 + shirt[i % shirt.length][j]*.12) as [number,number,number]
  });
}

const cubeVertices = new Float32Array([
  -0.5,-0.5,-0.5, 0,0,-1,  0.5,-0.5,-0.5, 0,0,-1,  0.5,0.5,-0.5, 0,0,-1,  -0.5,0.5,-0.5, 0,0,-1,
  -0.5,-0.5,0.5, 0,0,1,   0.5,-0.5,0.5, 0,0,1,   0.5,0.5,0.5, 0,0,1,   -0.5,0.5,0.5, 0,0,1,
  -0.5,-0.5,-0.5,-1,0,0, -0.5,0.5,-0.5,-1,0,0, -0.5,0.5,0.5,-1,0,0, -0.5,-0.5,0.5,-1,0,0,
   0.5,-0.5,-0.5,1,0,0,  0.5,0.5,-0.5,1,0,0,  0.5,0.5,0.5,1,0,0,   0.5,-0.5,0.5,1,0,0,
  -0.5,-0.5,-0.5,0,-1,0,  0.5,-0.5,-0.5,0,-1,0, 0.5,-0.5,0.5,0,-1,0, -0.5,-0.5,0.5,0,-1,0,
  -0.5,0.5,-0.5,0,1,0,   0.5,0.5,-0.5,0,1,0,  0.5,0.5,0.5,0,1,0,  -0.5,0.5,0.5,0,1,0
]);
const cubeIndices = new Uint16Array([
  0,1,2,0,2,3, 4,6,5,4,7,6, 8,9,10,8,10,11,
  12,14,13,12,15,14, 16,17,18,16,18,19, 20,22,21,20,23,22
]);

function mat4Perspective(out:Float32Array,fovy:number,aspect:number,near:number,far:number){
  const f=1/Math.tan(fovy/2), nf=1/(near-far);
  out[0]=f/aspect;out[1]=0;out[2]=0;out[3]=0;out[4]=0;out[5]=f;out[6]=0;out[7]=0;
  out[8]=0;out[9]=0;out[10]=(far+near)*nf;out[11]=-1;out[12]=0;out[13]=0;out[14]=2*far*near*nf;out[15]=0;
}
function mat4LookAt(out:Float32Array,eye:Vec3,center:Vec3,up:Vec3){
  let zx=eye.x-center.x,zy=eye.y-center.y,zz=eye.z-center.z;let l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
  let xx=up.y*zz-up.z*zy,xy=up.z*zx-up.x*zz,xz=up.x*zy-up.y*zx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  out[0]=xx;out[1]=yx;out[2]=zx;out[3]=0;out[4]=xy;out[5]=yy;out[6]=zy;out[7]=0;out[8]=xz;out[9]=yz;out[10]=zz;out[11]=0;
  out[12]=-(xx*eye.x+xy*eye.y+xz*eye.z);out[13]=-(yx*eye.x+yy*eye.y+yz*eye.z);out[14]=-(zx*eye.x+zy*eye.y+zz*eye.z);out[15]=1;
}
function mat4Mul(out:Float32Array,a:Float32Array,b:Float32Array){
  const t=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)t[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  out.set(t);
}
function mat4TRS(out:Float32Array,p:Vec3,s:Vec3,yaw=0){
  const c=Math.cos(yaw),sn=Math.sin(yaw);out[0]=c*s.x;out[1]=0;out[2]=-sn*s.x;out[3]=0;out[4]=0;out[5]=s.y;out[6]=0;out[7]=0;
  out[8]=sn*s.z;out[9]=0;out[10]=c*s.z;out[11]=0;out[12]=p.x;out[13]=p.y;out[14]=p.z;out[15]=1;
}

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [cash,setCash]=useState(2450);
  const [xp,setXp]=useState(160);
  const [level,setLevel]=useState(1);
  const [wanted]=useState(0);
  const [mission,setMission]=useState("Reach the Riverside drop");
  const [inCar,setInCar]=useState(false);
  const [phoneOpen,setPhoneOpen]=useState(true);
  const [toast,setToast]=useState("CITYLINE ONLINE");
  const [time,setTime]=useState("7:42 PM");
  const game=useRef({p:{x:0,y:0,z:18} as Vec3,yaw:Math.PI,keys:{} as Record<string,boolean>,inCar:false,mission:{x:44,z:-44}});

  useEffect(()=>{game.current.inCar=inCar},[inCar]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const gl=canvas.getContext("webgl2",{antialias:true})||canvas.getContext("webgl",{antialias:true});
    if(!gl){setToast("WebGL is not supported");return;}
    const vertexSrc="attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 w=uModel*vec4(aPos,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uMVP*vec4(aPos,1.0);}";
    const fragmentSrc="precision mediump float;uniform vec3 uColor;uniform vec3 uCamera;uniform vec3 uSun;varying vec3 vNormal;varying vec3 vWorld;void main(){vec3 n=normalize(vNormal);float l=.28+max(dot(n,normalize(uSun-vWorld)),0.0)*.72;float d=length(vWorld-uCamera);float fog=smoothstep(90.0,250.0,d);vec3 c=uColor*l;c=mix(c,vec3(.035,.07,.10),fog*.58);gl_FragColor=vec4(c,1.0);}";
    const compile=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"shader");return s;};
    const prog=gl.createProgram()!;gl.attachShader(prog,compile(gl.VERTEX_SHADER,vertexSrc));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fragmentSrc));gl.linkProgram(prog);gl.useProgram(prog);
    const vb=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,cubeVertices,gl.STATIC_DRAW);
    const ib=gl.createBuffer()!;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,cubeIndices,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(gl.getAttribLocation(prog,"aPos"));gl.vertexAttribPointer(gl.getAttribLocation(prog,"aPos"),3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(gl.getAttribLocation(prog,"aNormal"));gl.vertexAttribPointer(gl.getAttribLocation(prog,"aNormal"),3,gl.FLOAT,false,24,12);
    const uMVP=gl.getUniformLocation(prog,"uMVP")!,uModel=gl.getUniformLocation(prog,"uModel")!,uColor=gl.getUniformLocation(prog,"uColor")!,uCamera=gl.getUniformLocation(prog,"uCamera")!,uSun=gl.getUniformLocation(prog,"uSun")!;
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
    const proj=new Float32Array(16),view=new Float32Array(16),model=new Float32Array(16),mvp=new Float32Array(16);
    const draw=(p:Vec3,s:Vec3,color:[number,number,number],yaw=0)=>{mat4TRS(model,p,s,yaw);mat4Mul(mvp,view,model);mat4Mul(mvp,proj,mvp);gl.uniformMatrix4fv(uModel,false,model);gl.uniformMatrix4fv(uMVP,false,mvp);gl.uniform3f(uColor,color[0],color[1],color[2]);gl.drawElements(gl.TRIANGLES,cubeIndices.length,gl.UNSIGNED_SHORT,0);};
    let raf=0,last=performance.now();
    const resize=()=>{const d=Math.min(window.devicePixelRatio,2);canvas.width=Math.floor(innerWidth*d);canvas.height=Math.floor(innerHeight*d);gl.viewport(0,0,canvas.width,canvas.height);mat4Perspective(proj,Math.PI/3,canvas.width/canvas.height,.1,400);};
    resize();window.addEventListener("resize",resize);
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["w","a","s","d","e","f","m","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();game.current.keys[k]=true;
      if(k==="m")setPhoneOpen(v=>!v);
      if(k==="f"){setInCar(v=>!v);setToast(inCar?"On foot":"Vehicle entered");}
      if(k==="e"){const g=game.current;const d=Math.hypot(g.p.x-g.mission.x,g.p.z-g.mission.z);if(d<11){setCash(v=>v+350);setXp(v=>Math.min(999,v+60));setMission("Meet the Harbor contact");setToast("MISSION COMPLETE • +$350");g.mission={x:-90,z:45};}else setToast("Get closer to the yellow marker");}
    };
    const up=(e:KeyboardEvent)=>{game.current.keys[e.key.toLowerCase()]=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    const frame=(now:number)=>{const dt=Math.min(.032,(now-last)/1000);last=now;const g=game.current,k=g.keys;const turn=(k.a||k.arrowleft?1:0)+(k.d||k.arrowright?-1:0),fwd=(k.w||k.arrowup?1:0)+(k.s||k.arrowdown?-1:0);g.yaw+=turn*dt*(g.inCar?1.75:2.65);const sp=g.inCar?18:7,c=Math.cos(g.yaw),s=Math.sin(g.yaw);g.p.x+=-s*fwd*sp*dt;g.p.z+=c*fwd*sp*dt;g.p.x=Math.max(-150,Math.min(150,g.p.x));g.p.z=Math.max(-150,Math.min(150,g.p.z));
      gl.clearColor(.035,.075,.11,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const cam={x:g.p.x+Math.sin(g.yaw)*9,y:g.p.y+5.1,z:g.p.z+Math.cos(g.yaw)*9},target={x:g.p.x,y:1.25,z:g.p.z};mat4LookAt(view,cam,target,{x:0,y:1,z:0});gl.uniform3f(uCamera,cam.x,cam.y,cam.z);gl.uniform3f(uSun,-60,110,45);
      draw({x:0,y:-.12,z:0},{x:320,y:.2,z:320},[.08,.11,.13]);
      for(let x=-144;x<=144;x+=24)draw({x,y:.02,z:0},{x:17,y:.08,z:320},[.07,.075,.085]);
      for(let z=-144;z<=144;z+=24)draw({x:0,y:.02,z},{x:320,y:.08,z:17},[.07,.075,.085]);
      for(const b of buildings){draw({x:b.x,y:b.h/2,z:b.z},{x:b.w,y:b.h,z:b.d},b.color);draw({x:b.x,y:b.h+.07,z:b.z},{x:b.w*1.03,y:.14,z:b.d*1.03},[.12,.15,.18]);}
      for(const v of vehicles){if(Math.abs(v.p.z)>170)v.p.z=-Math.sign(v.p.z)*170;if(Math.abs(v.p.x)>170)v.p.x=-Math.sign(v.p.x)*170;if(Math.abs(v.yaw)<.5)v.p.z+=v.speed*dt;else v.p.x+=v.speed*dt;draw({x:v.p.x,y:v.p.y,z:v.p.z},{x:2.1,y:.62,z:4.1},v.color,v.yaw);draw({x:v.p.x,y:1.0,z:v.p.z},{x:1.6,y:.45,z:1.8},[.06,.09,.12],v.yaw);}
      for(const p of peds){p.p.z+=.65*dt;if(p.p.z>160)p.p.z=-160;p.p.x+=(Math.sin(now*.0013+p.phase)*.45-p.p.x+ (p.p.x>0?8.5:-8.5))*.16;draw({x:p.p.x,y:.65,z:p.p.z},{x:.45,y:1.3,z:.45},p.color);draw({x:p.p.x,y:1.55,z:p.p.z},{x:.4,y:.4,z:.4},[.44,.28,.20]);}
      if(g.inCar){draw({x:g.p.x,y:.55,z:g.p.z},{x:2.7,y:.72,z:4.6},[.12,.22,.30],g.yaw);draw({x:g.p.x,y:1.08,z:g.p.z},{x:1.9,y:.58,z:2.0},[.04,.07,.09],g.yaw);}else{draw({x:g.p.x,y:.78,z:g.p.z},{x:.9,y:1.55,z:.72},[.06,.08,.11],g.yaw);draw({x:g.p.x,y:1.75,z:g.p.z},{x:.54,y:.54,z:.54},[.58,.36,.25]);}
      const mx=g.mission.x,mz=g.mission.z,pulse=1+Math.sin(now*.004)*.12;draw({x:mx,y:2.7,z:mz},{x:.18,y:5.4,z:.18},[1,.78,.15]);draw({x:mx,y:.12,z:mz},{x:2.4*pulse,y:.08,z:2.4*pulse},[1,.72,.08]);
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);gl.deleteBuffer(vb);gl.deleteBuffer(ib);gl.deleteProgram(prog);};
  },[inCar]);

  useEffect(()=>{const id=setInterval(()=>setTime(new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})),30000);return()=>clearInterval(id);},[]);
  useEffect(()=>{const id=setTimeout(()=>setToast(""),2400);return()=>clearTimeout(id);},[toast]);

  return <main className="game-shell">
    <canvas ref={canvasRef} className="game-canvas"/>
    <div className="vignette"/>
    <div className="logo"><b>CITYLINE</b><span>LIVE. WORK. BUILD.</span></div>
    <div className="stats"><strong>◉ {"$"}{cash.toLocaleString()}</strong><div><b>LEVEL {level}</b><i><em style={{width:xp/10+"%"}}/></i><small>{xp}/1,000</small></div><label>WANTED <b>{"★".repeat(wanted)}</b><span>{"★".repeat(5-wanted)}</span></label></div>
    <aside className="mission"><small>CURRENT MISSION</small><h3>◆ FIRST STEPS</h3><p>{mission}</p><span>FOLLOW THE YELLOW MARKER</span></aside>
    <div className="location">⌖ Downtown <span>Riverside • 0.6 mi</span></div>
    <div className="minimap"><i/><b>◆</b><span>▲</span></div>
    <div className="controls"><span><b>W A S D</b> move</span><span><b>F</b> vehicle</span><span><b>E</b> mission</span><span><b>M</b> phone</span></div>
    {phoneOpen&&<aside className="phone"><i/><small>{time}<span>5G</span></small><h2>Messages</h2><button onClick={()=>setToast("Jay: You free later?")}><b>J</b><span><strong>Jay</strong>You free later?</span></button><button onClick={()=>setToast("Mom: Dinner at 7. Lmk.")}><b>M</b><span><strong>Mom</strong>Dinner at 7. Lmk.</span></button><button onClick={()=>setToast("Job Center: New opportunity available!") }><b>J</b><span><strong>Job Center</strong>New opportunity available!</span></button><footer><button onClick={()=>setToast("Map")}>⌖</button><button onClick={()=>setPhoneOpen(false)}>—</button></footer></aside>}
    {!phoneOpen&&<button className="phone-open" onClick={()=>setPhoneOpen(true)}>📱</button>}
    <div className={"player-label "+(inCar?"drive":"")}>{inCar?"YOU • DRIVING":"YOU"}</div>
    <div className={"toast "+(toast?"show":"")}>{toast}</div>
  </main>;
}
