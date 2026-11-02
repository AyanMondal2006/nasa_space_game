/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures deterministic simulation runs given the same seed.
 */
export class SeededRandom {
  constructor(seed = 123456789) {
    this.seed = typeof seed === 'number' ? seed : SeededRandom.hashString(String(seed));
    this.initialSeed = this.seed;
  }

  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 123456789;
  }

  reset() {
    this.seed = this.initialSeed;
  }

  // Returns pseudo-random float between 0 (inclusive) and 1 (exclusive)
  next() {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns float between min (inclusive) and max (exclusive)
  range(min, max) {
    return min + (max - min) * this.next();
  }

  // Returns random integer between min and max (inclusive)
  intRange(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  // Returns true with given probability [0, 1]
  chance(probability) {
    return this.next() < probability;
  }

  // Selects random element from array
  choice(array) {
    if (!array || array.length === 0) return null;
    return array[this.intRange(0, array.length - 1)];
  }
}
