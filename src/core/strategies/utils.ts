/** Returns a random integer in the inclusive range [min, max]. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Greatest common divisor (Euclidean algorithm, iterative). */
export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}

/** Least common multiple. */
export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}
