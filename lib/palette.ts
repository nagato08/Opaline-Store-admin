/**
 * Couleurs des séries de graphiques, en valeurs littérales.
 *
 * Recharts pose ses couleurs en **attributs de présentation SVG**
 * (`stroke="…"`), et `var(--…)` n'y est pas résolu par le navigateur : la
 * courbe est bien tracée dans le DOM, mais invisible. Ces constantes doublent
 * donc volontairement les jetons `--color-chart-*` de `globals.css`, dont
 * elles doivent rester le miroir exact.
 */
export const chartColors = {
  1: '#2b4eff',
  2: '#00b3a4',
  3: '#f2695f',
  4: '#f2b134',
  5: '#7b5cff',
} as const;

/** Neutres utilisés par les axes et la grille des graphiques. */
export const chartNeutrals = {
  grid: '#e0e0da',
  axis: '#74746b',
  cursor: '#c5c5bc',
  border: '#e0e0da',
} as const;
