export const WORLD = { width: 960, height: 540 };
export const airport = { x: 736, y: 70, width: 186, height: 150 };
export const shuttleStart = { x: 282, y: 355 };
import { createSocialState } from './social.js';

export function createGameState() {
  return {
    player: { x: 150, y: 394, speed: 2.7 },
    vehicle: { x: shuttleStart.x, y: shuttleStart.y, occupied: false, fuel: 78, odometer: 1248.6 },
    mission: { id: 'airportTransfer', destination: 'Mistral Airport', completed: false },
    sim: { minutes: 390, cash: 42.5, passengers: 0, fareCollected: false, tripStarted: false, message: 'Start your 06:30 airport transfer.' },
    social: createSocialState(),
  };
}

export function nearVehicle(state) {
  return Math.hypot(state.player.x - state.vehicle.x, state.player.y - state.vehicle.y) < 42;
}

export function toggleVehicle(state) {
  if (state.vehicle.occupied) {
    state.vehicle.occupied = false;
    state.player.x = state.vehicle.x - 28;
    state.player.y = state.vehicle.y + 22;
    state.sim.message = 'Shuttle parked. Walk to enter again.';
    return true;
  }
  if (nearVehicle(state)) {
    state.vehicle.occupied = true;
    state.sim.tripStarted = true;
    if (!state.mission.completed) {
      state.sim.passengers = 2;
      state.sim.message = 'Two passengers boarded. Drive safely to Mistral Airport.';
    } else {
      state.sim.message = 'Shift complete. The Sunbeam is ready for the next route.';
    }
    return true;
  }
  return false;
}

export function move(state, dx, dy) {
  const actor = state.vehicle.occupied ? state.vehicle : state.player;
  const factor = state.vehicle.occupied ? 1.65 : 1;
  if (state.vehicle.occupied && state.vehicle.fuel <= 0) {
    state.sim.message = 'Battery reserve empty. The shuttle cannot move.';
    return;
  }
  const oldX = actor.x;
  const oldY = actor.y;
  actor.x = Math.max(18, Math.min(WORLD.width - 18, actor.x + dx * state.player.speed * factor));
  actor.y = Math.max(18, Math.min(WORLD.height - 18, actor.y + dy * state.player.speed * factor));
  const distance = Math.hypot(actor.x - oldX, actor.y - oldY);
  if (state.vehicle.occupied && distance) {
    state.vehicle.fuel = Math.max(0, state.vehicle.fuel - distance * 0.012);
    state.vehicle.odometer += distance * 0.018;
  }
  if (state.vehicle.occupied) { state.player.x = actor.x; state.player.y = actor.y; }
  checkMission(state);
}

export function advanceTime(state, minutes = 1) {
  state.sim.minutes = (state.sim.minutes + minutes) % 1440;
  return state.sim.minutes;
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  return `${hours}:${Math.floor(minutes % 60).toString().padStart(2, '0')}`;
}

export function checkMission(state) {
  const v = state.vehicle;
  const arrived = v.occupied && v.x >= airport.x && v.x <= airport.x + airport.width && v.y >= airport.y && v.y <= airport.y + airport.height;
  if (arrived && !state.mission.completed) {
    state.mission.completed = true;
    state.sim.cash += 18;
    state.sim.fareCollected = true;
    state.sim.passengers = 0;
    state.sim.message = 'Airport transfer complete. $18.00 fare settled.';
  }
  return state.mission.completed;
}
