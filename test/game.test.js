import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTime, airport, checkMission, createGameState, formatTime, move, nearVehicle, toggleVehicle } from '../src/game.js';
import { createSocialState, respondToMessage } from '../src/social.js';
import { CITY_POPULATION, getVisibleCitizens } from '../src/crowd.js';

test('the player can enter and exit a nearby shuttle', () => {
  const state = createGameState();
  assert.equal(nearVehicle(state), false);
  state.player.x = state.vehicle.x; state.player.y = state.vehicle.y;
  assert.equal(toggleVehicle(state), true); assert.equal(state.vehicle.occupied, true);
  toggleVehicle(state); assert.equal(state.vehicle.occupied, false);
});
test('airport arrival only completes while driving', () => {
  const state = createGameState(); state.vehicle.x = airport.x + 20; state.vehicle.y = airport.y + 20;
  assert.equal(checkMission(state), false);
  state.vehicle.occupied = true; assert.equal(checkMission(state), true);
});
test('movement keeps the actor in the playable map', () => {
  const state = createGameState(); move(state, -1000, -1000);
  assert.equal(state.player.x, 18); assert.equal(state.player.y, 18);
});
test('a completed airport transfer settles the fare and clears passengers once', () => {
  const state = createGameState(); state.player.x = state.vehicle.x; state.player.y = state.vehicle.y; toggleVehicle(state);
  state.vehicle.x = airport.x + 20; state.vehicle.y = airport.y + 20;
  checkMission(state); checkMission(state);
  assert.equal(state.sim.cash, 60.5); assert.equal(state.sim.passengers, 0);
  toggleVehicle(state); toggleVehicle(state);
  assert.equal(state.sim.passengers, 0);
});
test('the simulator clock wraps after midnight', () => {
  const state = createGameState(); state.sim.minutes = 1439;
  assert.equal(advanceTime(state), 0); assert.equal(formatTime(state.sim.minutes), '00:00');
});
test('adult relationship responses reward kindness and enforce boundaries', () => {
  const social = createSocialState();
  assert.equal(social.contact.adult, true);
  const trust = social.contact.trust;
  assert.match(respondToMessage(social, 'Want to get coffee after work?'), /plan something|Get there safely|glad you checked in/);
  assert.equal(social.contact.trust, trust + 3);
  assert.match(respondToMessage(social, 'send a nude pic'), /not comfortable/);
  assert.equal(social.contact.trust, trust - 5);
});
test('an invitation receives a warm but consent-aware reply', () => {
  const social = createSocialState();
  assert.match(respondToMessage(social, 'Hi babe, come to my house'), /agree on a time.*comfortable/);
});
test('the crowd virtualizes a million residents into a bounded visible set', () => {
  const citizens = getVisibleCitizens(390);
  assert.equal(CITY_POPULATION, 1_000_000); assert.equal(citizens.length, 48);
  assert.ok(citizens.every(citizen => citizen.id > 0 && citizen.id <= CITY_POPULATION));
  assert.deepEqual(getVisibleCitizens(390), citizens);
});
