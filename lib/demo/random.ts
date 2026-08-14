export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

/** Les `count` derniers jours, du plus ancien à celui de `from` inclus. */
export function lastDays(count: number, from: Date): Date[] {
  return Array.from(
    { length: count },
    (_, index) => new Date(from.getTime() - (count - 1 - index) * DAY_MS),
  );
}

/**
 * Générateur pseudo-aléatoire à graine (congruence linéaire).
 *
 * `Math.random` donnerait une courbe différente à chaque rechargement, ce qui
 * ferait passer une maquette pour un flux temps réel — et rendrait impossible
 * de comparer deux captures d'écran.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Date passée, exprimée en heures depuis maintenant. */
export function hoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * HOUR_MS).toISOString();
}

/** Date à venir, exprimée en jours depuis maintenant. Négatif pour le passé. */
export function daysFromNow(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}
