'use client';

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Job = "delivery" | "escape" | "checkpoint";
type JobStage = "go" | "return";

const jobs:Record<Job,{name:string;reward:number;target:THREE.Vector3}> = {
  delivery:{name:"NIGHT DELIVERY",reward:1500,target:new THREE.Vector3(70,0,-90)},
  escape:{name:"CLEAN GETAWAY",reward:2800,target:new THREE.Vector3(-55,0,35)},
  checkpoint:{name:"CITY CHECKPOINT",reward:2200,target:new THREE.Vector3(95,0,65)}
};

function makeHuman(palette:number, panic=false){
  const g=new THREE.Group();
  const tones=["#8b5a3c","#b87550","#d39b73","#6c4735"];
  const shirts=["#285f9e","#9d3f42","#c18b2e","#3f875f","#744da1","#d06b3d"];
  const pants=["#1f2a36","#343434","#293c2d","#4b392b"];
  const skin=new THREE.MeshStandardMaterial({color:tones[palette%tones.length],roughness:.85});
  const shirt=new THREE.MeshStandardMaterial({color:panic?"#ff8a2a":shirts[palette%shirts.length],roughness:.8});
  const trouser=new THREE.MeshStandardMaterial({color:pants[palette%pants.length],roughness:.9});
  const hair=new THREE.MeshStandardMaterial({color:["#161616","#3b2417","#654126","#252525"][palette%4],roughness:1});
  const head=new THREE.Mesh(new THREE.SphereGeometry(.235,16,14),skin); head.position.y=1.55;
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.095,.11,.16,10),skin); neck.position.y=1.31;
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.242,16,10,0,Math.PI*2,0,Math.PI*.55),hair); hairCap.position.y=1.64;
  const eyeMat=new THREE.MeshStandardMaterial({color:"#101820",roughness:.4});
  const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),eyeMat); eyeL.position.set(-.09,1.57,-.215);
  const eyeR=eyeL.clone(); eyeR.position.x=.09;
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.255,.62,6,10),shirt); body.position.y=1.04;
  const lArm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.52,4,6),shirt); lArm.position.set(-.31,1.08,0); lArm.rotation.z=.08;
  const rArm=lArm.clone(); rArm.position.x=.31; rArm.rotation.z=-.08;
  const lLeg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.62,4,6),trouser); lLeg.position.set(-.13,.45,0);
  const rLeg=lLeg.clone(); rLeg.position.x=.13;
  const shoeMat=new THREE.MeshStandardMaterial({color:"#16181a",roughness:1});
  const lShoe=new THREE.Mesh(new THREE.BoxGeometry(.16,.09,.3),shoeMat); lShoe.position.set(-.13,.08,.06);
  const rShoe=lShoe.clone(); rShoe.position.x=.13;
  g.add(head,neck,hairCap,eyeL,eyeR,body,lArm,rArm,lLeg,rLeg,lShoe,rShoe);
  g.userData={lArm,rArm,lLeg,rLeg,walkPhase:palette*.7,baseY:0,head,hairCap,body};
  return g;
}

function makeCar(color:string, police=false){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.7,.48,3.5),new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.65}));
  body.position.y=.48; g.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.35,.52,1.7),new THREE.MeshStandardMaterial({color:"#182126",metalness:.1,roughness:.25,transparent:true,opacity:.9}));
  cabin.position.set(0,.82,-.05); g.add(cabin);
  const wheelMat=new THREE.MeshStandardMaterial({color:"#111315",roughness:1});
  for(const x of [-.82,.82]) for(const z of [-1.15,1.15]){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.18,12),wheelMat);
    w.rotation.z=Math.PI/2; w.position.set(x,.3,z); g.add(w);
  }
  if(police){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.72,.12,.2),new THREE.MeshStandardMaterial({color:"#eeeeee",emissive:"#222222"}));
    bar.position.y=1.14; g.add(bar);
    const red=new THREE.Mesh(new THREE.BoxGeometry(.34,.13,.22),new THREE.MeshStandardMaterial({color:"#e22",emissive:"#500"}));
    red.position.set(-.18,1.2,0); g.add(red);
    const blue=red.clone(); blue.material=new THREE.MeshStandardMaterial({color:"#26f",emissive:"#005"}); blue.position.x=.18; g.add(blue);
  }
  return g;
}

export default function ExtraCity(){
  const mount=useRef<HTMLDivElement>(null);
  const [cash,setCash]=useState(1250);
  const [wanted,setWanted]=useState(0);
  const [job,setJob]=useState<Job|null>(null);
  const [jobStage,setJobStage]=useState<JobStage>("go");
  const [message,setMessage]=useState("Welcome to EXTRA CITY.");
  const [district,setDistrict]=useState("DOWNTOWN");
  const [time,setTime]=useState(18.5);
  const [rain,setRain]=useState(false);
  const [inCar,setInCar]=useState(false);
  const inCarRef=useRef(false), jobRef=useRef<Job|null>(null), jobStageRef=useRef<JobStage>("go"), rainRef=useRef(false), wantedRef=useRef(0), districtRef=useRef("DOWNTOWN");
  useEffect(()=>{inCarRef.current=inCar;},[inCar]);
  useEffect(()=>{jobRef.current=job;},[job]);
  useEffect(()=>{jobStageRef.current=jobStage;},[jobStage]);
  useEffect(()=>{rainRef.current=rain;},[rain]);
  useEffect(()=>{wantedRef.current=wanted;},[wanted]);
  useEffect(()=>{districtRef.current=district;},[district]);

  useEffect(()=>{
    const root=mount.current;
    if(!root) return;

    const scene=new THREE.Scene();
    scene.background=new THREE.Color("#9eb9cc");
    scene.fog=new THREE.Fog("#9eb9cc",65,250);

    const camera=new THREE.PerspectiveCamera(62,root.clientWidth/root.clientHeight,.1,500);
    camera.position.set(0,6,9);

    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
    renderer.setSize(root.clientWidth,root.clientHeight);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    root.appendChild(renderer.domElement);

    const hemi=new THREE.HemisphereLight("#cde8ff","#27351f",1.8); scene.add(hemi);
    const sun=new THREE.DirectionalLight("#fff1d0",3.2); sun.position.set(60,100,30); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);

    const ground=new THREE.Mesh(new THREE.PlaneGeometry(620,440),new THREE.MeshStandardMaterial({color:"#30483a",roughness:1}));
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

    const roadMat=new THREE.MeshStandardMaterial({color:"#292d31",roughness:.95});
    const road1=new THREE.Mesh(new THREE.BoxGeometry(620,.08,30),roadMat); road1.position.y=.02; scene.add(road1);
    const roadNorth=new THREE.Mesh(new THREE.BoxGeometry(620,.08,22),roadMat); roadNorth.position.set(0,.025,-82); scene.add(roadNorth);
    const roadSouth=new THREE.Mesh(new THREE.BoxGeometry(620,.08,22),roadMat); roadSouth.position.set(0,.025,82); scene.add(roadSouth);
    const road2=new THREE.Mesh(new THREE.BoxGeometry(30,.08,440),roadMat); road2.position.y=.03; scene.add(road2);
    for(const x of [-150,-75,75,150]){
      const r=new THREE.Mesh(new THREE.BoxGeometry(18,.08,440),roadMat);
      r.position.set(x,.035,0); scene.add(r);
    }
    const road3=new THREE.Mesh(new THREE.BoxGeometry(420,.08,20),roadMat); road3.position.set(0,.04,-82); scene.add(road3);
    const laneMat=new THREE.MeshStandardMaterial({color:"#d7bd62",roughness:1});
    for(const z of [0,-82,82]) for(let x=-300;x<300;x+=12){const m=new THREE.Mesh(new THREE.BoxGeometry(6,.02,.12),laneMat);m.position.set(x,.09,z);scene.add(m);}
    for(const x of [-150,-75,0,75,150]) for(let z=-210;z<210;z+=12){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,6),laneMat);m.position.set(x,.09,z);scene.add(m);}

    const buildingMats=["#555b60","#66554c","#4d6259","#6a6460","#4c5663","#765a4c","#405a67"];
    for(let i=0;i<58;i++){
      const x=((i*37)%390)-195, z=((i*61)%285)-142;
      if(Math.abs(x)<22 || Math.abs(z)<17 || (Math.abs(z+82)<13)) continue;
      const h=4+(i%7)*1.5, w=5+(i%4)*1.8, dep=5+(i%3)*2;
      const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,dep),new THREE.MeshStandardMaterial({color:buildingMats[i%buildingMats.length],roughness:.9}));
      b.position.set(x,h/2,z); b.castShadow=true; b.receiveShadow=true; scene.add(b);
      if(i%4===0){
        const sign=new THREE.Mesh(new THREE.BoxGeometry(Math.min(w*.65,3),.45,.08),new THREE.MeshStandardMaterial({color:"#d7a93b",emissive:"#332000"}));
        sign.position.set(x,h*.65,z-dep/2-.05); scene.add(sign);
      }
    }

    const districtZones=[
      {name:"DOWNTOWN",x:0,z:-55,w:140,d:55},
      {name:"OLD MARKET",x:-115,z:65,w:90,d:90},
      {name:"INDUSTRIAL",x:115,z:70,w:90,d:85},
      {name:"SUNSET HEIGHTS",x:0,z:145,w:210,d:55}
    ];
    for(const [di,zone] of districtZones.entries()){
      for(let j=0;j<10;j++){
        const px=zone.x+(Math.random()-.5)*zone.w;
        const pz=zone.z+(Math.random()-.5)*zone.d;
        const tree=new THREE.Group();
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,1.5,7),new THREE.MeshStandardMaterial({color:"#5b3e29",roughness:1}));
        trunk.position.y=.75;
        const crown=new THREE.Mesh(new THREE.SphereGeometry(.75+(j%3)*.12,8,7),new THREE.MeshStandardMaterial({color:["#315d3a","#3f7047","#526d3e","#284f3a"][di],roughness:1}));
        crown.position.y=1.8; tree.add(trunk,crown); tree.position.set(px,0,pz); tree.castShadow=true; scene.add(tree);
      }
      for(let j=0;j<7;j++){
        const sx=zone.x-zone.w/2+j*(zone.w/6);
        const pole=new THREE.Group();
        const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,3.4,6),new THREE.MeshStandardMaterial({color:"#252b30",metalness:.6,roughness:.45}));
        const lamp=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshStandardMaterial({color:"#fff1b0",emissive:"#5a4518",emissiveIntensity:2}));
        stem.position.y=1.7; lamp.position.set(0,3.35,0); pole.add(stem,lamp); pole.position.set(sx,.05,zone.z-zone.d/2); scene.add(pole);
      }
    }
    const sidewalkMat=new THREE.MeshStandardMaterial({color:"#777b78",roughness:.95});
    for(const z of [-15,15,-93,-71,67,97]){const s=new THREE.Mesh(new THREE.BoxGeometry(620,.12,3.5),sidewalkMat);s.position.set(0,.08,z);scene.add(s);}
    for(const x of [-165,-135,-90,-60,-15,15,60,90,135,165]){const s=new THREE.Mesh(new THREE.BoxGeometry(3.5,.12,440),sidewalkMat);s.position.set(x,.08,0);scene.add(s);}
    const player=makeHuman(2); player.scale.setScalar(1.12); player.position.set(0,0,6); player.castShadow=true; scene.add(player);
    let playerCar:THREE.Group|null=null;
    const traffic:THREE.Group[]=[];
    const trafficSpeeds:number[]=[];
    const trafficColors=["#d44b4b","#3f78c9","#d5b23f","#4b9b6a","#8255a9","#d97745"];
    for(let i=0;i<18;i++){
      const c=makeCar(trafficColors[i%trafficColors.length]); c.position.set(((i*31)%360)-180,.05,((i%5)*75)-150);
      if(i%3===0)c.rotation.y=Math.PI/2;
      trafficSpeeds.push(5+(i%6)*1.7); c.castShadow=true; scene.add(c); traffic.push(c);
    }

    const people:THREE.Group[]=[];
    for(let i=0;i<46;i++){
      const h=makeHuman(i%12); h.position.set(((i*29)%370)-185,0,((i*53)%270)-135); h.scale.setScalar(.9+(i%4)*.04); h.castShadow=true; scene.add(h); people.push(h);
    }

    const cops:THREE.Group[]=[];
    const missionMarker=new THREE.Mesh(new THREE.TorusGeometry(2.1,.12,8,40),new THREE.MeshStandardMaterial({color:"#ffd84d",emissive:"#6b4e00"}));
    missionMarker.rotation.x=-Math.PI/2; missionMarker.position.y=.12; missionMarker.visible=false; scene.add(missionMarker);

    const keys=new Set<string>();
    const down=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(); keys.add(k);
      if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e","m","r"].includes(k)) e.preventDefault();
      if(k==="e"){
        setInCar(v=>{
          if(v){ if(playerCar){player.position.copy(playerCar.position);player.visible=true;scene.remove(playerCar);playerCar=null;} setMessage("On foot."); return false; }
          let nearest:THREE.Group|null=null,best=4;
          for(const c of traffic){const z=c.position.distanceTo(player.position);if(z<best){best=z;nearest=c;}}
          if(nearest){playerCar=nearest;player.visible=false;setWanted(v=>Math.min(5,Math.max(1,v+1)));setMessage("Vehicle acquired. Police are watching.");return true;}
          setMessage("Get closer to a car."); return false;
        });
      }
      if(k==="m" && !job){
        setJob("delivery");
        setJobStage("go");
        setMessage("JOB: NIGHT DELIVERY — reach the yellow marker.");
        missionMarker.visible=true; missionMarker.position.copy(jobs.delivery.target);
      }
      if(k==="r"){setRain(v=>{const next=!v;setMessage(next?"Rain started.":"Rain stopped.");return next;});}
    };
    const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown",down); window.addEventListener("keyup",up);

    let last=performance.now(),raf=0,elapsed=0;
    let carVelocity=0;
    const clock=new THREE.Clock();
    const animate=()=>{
      raf=requestAnimationFrame(animate);
      const dt=Math.min(clock.getDelta(),.035); elapsed+=dt;
      const driving=inCarRef.current;
      const currentJob=jobRef.current;
      const currentStage=jobStageRef.current;
      const raining=rainRef.current;
      const currentWanted=wantedRef.current;
      const upKey=keys.has("w")||keys.has("arrowup"), downKey=keys.has("s")||keys.has("arrowdown");
      const left=keys.has("a")||keys.has("arrowleft"), right=keys.has("d")||keys.has("arrowright");
      const active=driving&&playerCar?playerCar:player;
      if(driving && playerCar){
        playerCar.position.y=.05;
        const throttle=upKey?18:downKey?-11:0;
        carVelocity += throttle*dt;
        if(!upKey&&!downKey) carVelocity*=Math.pow(.18,dt);
        if(downKey && carVelocity>0) carVelocity*=Math.pow(.35,dt);
        carVelocity=THREE.MathUtils.clamp(carVelocity,-8,24);
        const steer=(left?1:0)-(right?1:0);
        const steerScale=THREE.MathUtils.clamp(Math.abs(carVelocity)/8,.18,1);
        playerCar.rotation.y += -steer*dt*(1.65*steerScale)*(carVelocity>=0?1:-1);
        const forward=new THREE.Vector3(0,0,-1).applyQuaternion(playerCar.quaternion);
        playerCar.position.addScaledVector(forward,carVelocity*dt);
      } else {
        carVelocity=0;
        const forward=new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);
        if(upKey) player.position.addScaledVector(forward,6.5*dt);
        if(downKey) player.position.addScaledVector(forward,-4*dt);
        if(left) player.rotation.y+=dt*2.6;
        if(right) player.rotation.y-=dt*2.6;
      }
      active.position.x=THREE.MathUtils.clamp(active.position.x,-198,198);
      active.position.z=THREE.MathUtils.clamp(active.position.z,-150,150);

      for(let i=0;i<traffic.length;i++){
        const c=traffic[i];
        if(Math.abs(c.rotation.y-Math.PI/2)<.1 || Math.abs(c.rotation.y+Math.PI/2)<.1){
          c.position.x += (i%2?1:-1)*trafficSpeeds[i]*dt;
          if(c.position.x>305)c.position.x=-305;
          if(c.position.x<-305)c.position.x=305;
        } else {
          c.position.z += (i%2?1:-1)*trafficSpeeds[i]*dt;
          if(c.position.z>215)c.position.z=-215;
          if(c.position.z<-215)c.position.z=215;
        }
      }
      for(const [i,h] of people.entries()){
        const dangerRadius=currentWanted>0?16:5;
        const phase=elapsed*4+(h.userData.walkPhase||0);
        const joints=h.userData;
        if(joints.lArm){
          joints.lArm.rotation.x=Math.sin(phase)*.28;
          joints.rArm.rotation.x=-Math.sin(phase)*.28;
          joints.lLeg.rotation.x=-Math.sin(phase)*.24;
          joints.rLeg.rotation.x=Math.sin(phase)*.24;
          const bob=Math.abs(Math.sin(phase))*0.025;
          h.position.y=bob;
          joints.head.rotation.y=Math.sin(phase*.5)*.05;
          joints.hairCap.rotation.y=Math.sin(phase*.5)*.05;
        }
        h.position.x += Math.sin(elapsed*.35+i)*.35*dt;
        h.position.z += Math.cos(elapsed*.3+i*.7)*.3*dt;
        h.rotation.y=Math.atan2(Math.cos(elapsed*.3+i*.7),Math.sin(elapsed*.35+i));
        if(currentWanted>0 && h.position.distanceTo(active.position)<dangerRadius){
          h.position.x += (h.position.x-active.position.x)*dt*2.4;
          h.position.z += (h.position.z-active.position.z)*dt*2.4;
        }
      }

      if(currentWanted>0){
        const needed=currentWanted>=4?4:currentWanted>=2?2:1;
        while(cops.length<needed){const c=makeCar("#f1f1f1",true);c.position.set(active.position.x+18+cops.length*8,.05,active.position.z+18);scene.add(c);cops.push(c);}
        while(cops.length>needed){const c=cops.pop();if(c)scene.remove(c);}
        for(const c of cops){
          const dx=active.position.x-c.position.x,dz=active.position.z-c.position.z;
          const len=Math.hypot(dx,dz)||1;
          const stopDistance=4.2;
          const chaseSpeed=7+currentWanted*1.8;
          if(len>stopDistance){
            const step=Math.min(chaseSpeed*dt,len-stopDistance);
            c.position.x+=(dx/len)*step;
            c.position.z+=(dz/len)*step;
          }
          c.rotation.y=Math.atan2(dx,dz);
          // Keep police vehicles from clipping into the player or each other.
          if(len<stopDistance){
            const push=(stopDistance-len)+.02;
            c.position.x-=(dx/len)*push;
            c.position.z-=(dz/len)*push;
          }
          for(const other of cops){
            if(other===c) continue;
            const ox=c.position.x-other.position.x,oz=c.position.z-other.position.z,od=Math.hypot(ox,oz);
            if(od>0 && od<3.6){
              const push=(3.6-od)*.35;
              c.position.x+=(ox/od)*push;
              c.position.z+=(oz/od)*push;
            }
          }
        }
      } else while(cops.length){const c=cops.pop();if(c)scene.remove(c);}

      const cameraDistance=driving?12.5:9.5;
      const cameraHeight=driving?5.8:5.2;
      const desired=new THREE.Vector3(active.position.x,active.position.y+cameraHeight,active.position.z+cameraDistance);
      camera.position.lerp(desired,1-Math.pow(.0001,dt));
      camera.lookAt(active.position.x,active.position.y+1.1,active.position.z-3);

      const gameHour=(18.5+elapsed*.22)%24;
      const px=active.position.x,pz=active.position.z;
      const nextDistrict=px>65?"INDUSTRIAL":px<-65?"OLD MARKET":pz>105?"SUNSET HEIGHTS":"DOWNTOWN";
      if(nextDistrict!==districtRef.current){districtRef.current=nextDistrict;setDistrict(nextDistrict);setMessage(nextDistrict+" district.");}
      const night=gameHour>=19||gameHour<6;
      const sky=night?"#08101a":"#9eb9cc";
      (scene.background as THREE.Color).lerp(new THREE.Color(sky),.025); scene.fog?.color.lerp(new THREE.Color(sky),.025);
      hemi.intensity=night?0.55:1.8; sun.intensity=night?.45:3.2;
      setTime(v=>(v+dt*.22)%24);

      if(raining){
        const rainCount=110;
        const group=scene.getObjectByName("rain") as THREE.Group|null;
        const rg=group||new THREE.Group();
        rg.name="rain";
        if(!group){for(let i=0;i<rainCount;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.015,.45,.015),new THREE.MeshBasicMaterial({color:"#9ed8ff"}));m.position.set((Math.random()-.5)*220,Math.random()*35+3,(Math.random()-.5)*170);rg.add(m);}scene.add(rg);}
        rg.children.forEach(m=>{m.position.y-=28*dt;if(m.position.y<1)m.position.y=35;});
      } else {const rg=scene.getObjectByName("rain");if(rg)scene.remove(rg);}

      if(currentJob){
        const target=currentStage==="return"?new THREE.Vector3(0,0,6):jobs[currentJob].target;
        missionMarker.visible=true;
        missionMarker.position.copy(target);
        missionMarker.position.y=.12;
        if(active.position.distanceTo(target)<3){
          if(currentJob==="checkpoint" && currentStage==="go"){
            setJobStage("return");
            setMessage("CHECKPOINT reached — return to the starting point.");
            setWanted(1);
          } else {
            setCash(v=>v+jobs[currentJob].reward);
            setMessage(currentJob==="delivery"?"NIGHT DELIVERY complete. +$1,500":currentJob==="escape"?"CLEAN GETAWAY complete. +$2,800":"CITY CHECKPOINT complete. +$2,200");
            setJob(null);
            setJobStage("go");
            missionMarker.visible=false;
            setWanted(0);
          }
        }
      }

      renderer.render(scene,camera);
    };
    animate();

    const resize=()=>{if(!root)return;camera.aspect=root.clientWidth/root.clientHeight;camera.updateProjectionMatrix();renderer.setSize(root.clientWidth,root.clientHeight);};
    window.addEventListener("resize",resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("resize",resize);renderer.dispose();root.removeChild(renderer.domElement);};
  },[]);

  return <main style={{height:"100vh",background:"#070b0f",color:"#fff",overflow:"hidden",fontFamily:"Arial,sans-serif"}}>
    <header style={{height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:"#080c10",borderBottom:"1px solid #27323a",position:"relative",zIndex:10}}>
      <div><div style={{fontSize:22,fontWeight:900,letterSpacing:4}}>EXTRA CITY</div><div style={{fontSize:10,color:"#87949c",letterSpacing:2}}>AAA-STYLE OPEN-WORLD VERTICAL SLICE • BUILD 11</div></div>
      <div style={{display:"flex",gap:22,fontWeight:800}}><span style={{color:"#6ee7a0"}}>{"$"+cash.toLocaleString()}</span><span style={{color:wanted?"#ff5555":"#7e8990"}}>{wanted?"★".repeat(wanted):"NO WANTED"}</span><span>{rain?"RAIN":"CLEAR"}</span></div>
    </header>
    <section style={{position:"relative",height:"calc(100vh - 64px)"}}>
      <div ref={mount} style={{position:"absolute",inset:0}}/>
      <aside style={{position:"absolute",left:18,top:18,width:310,padding:18,background:"#070b0edb",border:"1px solid #33414a",borderRadius:14,backdropFilter:"blur(12px)",zIndex:5}}>
        <div style={{fontSize:17,fontWeight:900}}>EXTRA CITY <span style={{fontSize:10,color:"#6ee7a0",letterSpacing:1}}>PLAYABLE DEMO</span></div>
        <div style={{marginTop:8,color:"#aeb8be",fontSize:13,lineHeight:1.5}}>{job?jobs[job].name+" — "+(jobStage==="return"?"return to the start.":"follow the yellow marker."):"Press M to start a job."}</div>
        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #29343b",color:"#8c99a1",fontSize:11,lineHeight:1.9}}>WASD / ARROWS — MOVE / DRIVE<br/>E — ENTER / EXIT CAR<br/>M — START JOB<br/>R — TOGGLE RAIN<br/>CAMERA — THIRD PERSON</div>
      </aside>
      <div style={{position:"absolute",right:18,top:18,padding:"10px 14px",background:"#070b0edb",border:"1px solid #33414a",borderRadius:10,fontSize:11,zIndex:5}}>{district} • {time>=19||time<6?"NIGHT":"DAY"} • {rain?"RAIN":"CLEAR"} • {Math.floor(time).toString().padStart(2,"0")}:{Math.floor((time%1)*60).toString().padStart(2,"0")}</div>
      <div style={{position:"absolute",left:18,bottom:18,padding:"10px 14px",background:"#070b0eee",border:"1px solid #33414a",borderRadius:10,fontSize:12,zIndex:5}}>{message}</div>
      <div style={{position:"absolute",right:18,bottom:18,padding:"10px 14px",background:"#070b0eee",border:"1px solid #33414a",borderRadius:10,color:"#aeb8be",fontSize:11,zIndex:5}}>DOWNTOWN • OLD MARKET • INDUSTRIAL • SUNSET HEIGHTS</div>
    </section>
  </main>;
}
