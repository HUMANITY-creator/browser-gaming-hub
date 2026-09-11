const FIRST_NAMES = ['Amara', 'Beau', 'Cleo', 'Dax', 'Emi', 'Farah', 'Gio', 'Hana', 'Ivo', 'June'];
const ACTIVITIES = ['heading to work', 'walking a dog', 'getting breakfast', 'waiting for a ferry', 'taking a break'];

// The city has one million stable resident IDs. Rendering is virtualized: only
// people in the current screen cells are materialized, not a million objects.
export const CITY_POPULATION = 1_000_000;

function hash(value) {
  let result = value >>> 0;
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  return (result ^ (result >>> 16)) >>> 0;
}

export function getVisibleCitizens(minutes, limit = 48) {
  return Array.from({ length: limit }, (_, index) => {
    const id = (hash(index * 7919) % CITY_POPULATION) + 1;
    const shift = Math.floor(minutes / 10);
    return {
      id,
      name: FIRST_NAMES[id % FIRST_NAMES.length],
      activity: ACTIVITIES[(id + shift) % ACTIVITIES.length],
      x: 205 + ((hash(id + shift) % 700)),
      y: 25 + ((hash(id * 3 + shift) % 475)),
      color: ['#e66c5f', '#775ec9', '#53a6a3', '#dfa64a'][id % 4],
    };
  });
}
