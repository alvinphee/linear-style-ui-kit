// A seeded random number generator (mulberry32): the same seed gives the same
// numbers on every load, so made-up sample data reads the same for everyone.
// Returns a function that works like Math.random (0 up to, not including, 1).
export function seededRandom(seed: number) {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
