import { airport, createGameState, formatTime, move, nearVehicle, toggleVehicle, advanceTime } from './game.js';
import { respondToMessage } from './social.js';
import { CITY_POPULATION, getVisibleCitizens } from './crowd.js';
import './style.css';

const canvas = document.querySelector('#game'); const ctx = canvas.getContext('2d');
const state = createGameState(); const keys = new Set();
const ui = { prompt: document.querySelector('#prompt'), mode: document.querySelector('#mode'), location: document.querySelector('#location'), title: document.querySelector('#missionTitle'), text: document.querySelector('#missionText'), clock: document.querySelector('#clock'), relationship: document.querySelector('#relationship'), reply: document.querySelector('#reply'), voiceButton: document.querySelector('#voiceButton'), voiceStatus: document.querySelector('#voiceStatus') };
addEventListener('keydown', e => { if (['w','a','s','d','e'].includes(e.key.toLowerCase())) e.preventDefault(); keys.add(e.key.toLowerCase()); if (e.key.toLowerCase() === 'e') toggleVehicle(state); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
function say(reply) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
}
function updateConversation(message) {
  const reply = respondToMessage(state.social, message);
  ui.reply.textContent = reply;
  ui.relationship.textContent = `${state.social.contact.relationship.toUpperCase()} · TRUST ${state.social.contact.trust}`;
  say(reply);
}
if (Recognition) {
  state.social.voice.supported = true;
  recognition = new Recognition(); recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-US';
  recognition.onresult = event => { const phrase = event.results[event.results.length - 1][0].transcript; state.social.voice.transcript = phrase; updateConversation(phrase); };
  recognition.onend = () => { if (state.social.voice.listening) recognition.start(); };
  recognition.onerror = () => { state.social.voice.listening = false; ui.voiceButton.textContent = 'Enable hands-free voice'; ui.voiceStatus.textContent = 'Microphone unavailable. You can keep playing without voice.'; };
} else { ui.voiceButton.disabled = true; ui.voiceButton.textContent = 'Voice not supported'; ui.voiceStatus.textContent = 'This browser does not provide built-in speech recognition.'; }
ui.voiceButton.addEventListener('click', () => {
  if (!recognition) return;
  state.social.voice.listening = !state.social.voice.listening;
  if (state.social.voice.listening) { recognition.start(); ui.voiceButton.textContent = 'Turn voice off'; ui.voiceStatus.textContent = 'Listening hands-free. Say hello, ask about dinner, or suggest a date.'; }
  else { recognition.stop(); ui.voiceButton.textContent = 'Enable hands-free voice'; ui.voiceStatus.textContent = 'Voice is off.'; }
});

function rect(x,y,w,h,color) { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); }
function text(t,x,y,size=14,color='#fff',align='left') { ctx.font=`700 ${size}px system-ui`; ctx.fillStyle=color; ctx.textAlign=align; ctx.fillText(t,x,y); }
function drawMap() {
  rect(0,0,960,540,'#153d51');
  // ocean and coastline
  rect(0,0,178,540,'#0e6675'); ctx.fillStyle='#218393'; for(let y=18;y<540;y+=31) for(let x=12;x<165;x+=47) ctx.fillRect(x+(y%2)*8,y,22,2);
  rect(178,0,782,540,'#d8c78e');
  // city blocks and roads
  rect(190,255,770,82,'#3b4651'); rect(418,0,88,540,'#3b4651'); rect(650,0,66,540,'#3b4651');
  [[210,30,182,180],[525,22,105,196],[730,260,195,230],[208,355,184,140],[525,355,103,135]].forEach(b=>{rect(...b,'#c99d72');ctx.strokeStyle='#f0d8a3';ctx.lineWidth=3;ctx.strokeRect(...b)});
  // piers
  rect(150,105,80,21,'#805b3e');rect(150,189,110,20,'#805b3e');rect(150,420,70,20,'#805b3e');
  // airport
  rect(airport.x,airport.y,airport.width,airport.height,'#495b61'); rect(airport.x+15,airport.y+32,airport.width-30,34,'#718189'); rect(airport.x+15,airport.y+91,airport.width-30,31,'#718189');
  ctx.strokeStyle='#e5d68d';ctx.lineWidth=3;ctx.setLineDash([14,8]);ctx.beginPath();ctx.moveTo(airport.x+20,airport.y+49);ctx.lineTo(airport.x+166,airport.y+49);ctx.stroke();ctx.setLineDash([]);
  text('MISTRAL AIRPORT',airport.x+airport.width/2,airport.y+18,12,'#f8efc7','center'); text('✈',airport.x+airport.width/2,airport.y+112,25,'#f8efc7','center');
  text('NORTH QUAY',288,242,12,'#eff0db','center');text('SOLAR DISTRICT',575,242,12,'#eff0db','center');
  getVisibleCitizens(state.sim.minutes).forEach(citizen => {
    ctx.beginPath(); ctx.arc(citizen.x, citizen.y, 4, 0, Math.PI * 2); ctx.fillStyle = citizen.color; ctx.fill();
  });
}
function draw() {
  drawMap();
  const v=state.vehicle; ctx.save();ctx.translate(v.x,v.y); rect(-24,-13,48,26,'#ffd45a');rect(-15,-10,24,11,'#274d5b');rect(-20,12,10,5,'#202b35');rect(10,12,10,5,'#202b35');ctx.restore();
  if (!v.occupied) {ctx.beginPath();ctx.arc(state.player.x,state.player.y,10,0,Math.PI*2);ctx.fillStyle='#ff7e54';ctx.fill();ctx.fillStyle='#142d3a';ctx.fillRect(state.player.x-7,state.player.y+8,14,12)}
  // practical driving dashboard
  ctx.fillStyle='rgba(8,25,31,.9)';ctx.fillRect(686,412,258,107);ctx.strokeStyle='#557176';ctx.strokeRect(686,412,258,107);
  text('SUNBEAM • DAILY LOG',700,433,11,'#a9c7bf'); text(`BATTERY  ${state.vehicle.fuel.toFixed(0)}%`,700,457,14,state.vehicle.fuel < 15 ? '#ff8c64' : '#ffdf72');
  text(`ODO  ${state.vehicle.odometer.toFixed(1)} km`,700,480,13,'#eaf3e5'); text(`RIDERS  ${state.sim.passengers}   CASH  $${state.sim.cash.toFixed(2)}`,700,503,12,'#eaf3e5');
  text(`${CITY_POPULATION.toLocaleString()} CITY RESIDENTS · 48 NEARBY`,700,396,10,'#a9c7bf');
  if (state.mission.completed) {ctx.fillStyle='rgba(13,32,40,.82)';ctx.fillRect(250,203,460,108); text('AIRPORT TRANSFER COMPLETE',480,246,22,'#ffdf72','center');text('Passengers disembarked. $18.00 added to today’s ledger.',480,276,14,'#e6f2e9','center');}
  const loc = v.x > 720 && v.y < 235 ? 'AIRPORT' : v.x < 240 ? 'HARBOUR' : 'CITY GRID'; ui.location.textContent=loc;ui.mode.textContent=v.occupied?'DRIVING':'ON FOOT';
  const show=!v.occupied && nearVehicle(state); ui.prompt.hidden=!show;ui.prompt.textContent='Press E to start the Sunbeam shuttle';
  ui.text.textContent=state.sim.message;
}
function tick(){let dx=0,dy=0;if(keys.has('w'))dy--;if(keys.has('s'))dy++;if(keys.has('a'))dx--;if(keys.has('d'))dx++;if(dx||dy)move(state,dx,dy);draw();requestAnimationFrame(tick)}
setInterval(()=>{advanceTime(state, 1);ui.clock.textContent=formatTime(state.sim.minutes)},1000); ui.clock.textContent=formatTime(state.sim.minutes); tick();
