import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { percent } from '@/lib/format';
import { chartColors } from '@/lib/palette';

/**
 * Carte d'indicateur.
 *
 * Le chiffre est le sujet : il occupe la plus grande taille de la page, en
 * chasse fixe pour rester aligné d'une carte à l'autre. La variation porte une
 * flèche en plus de la couleur — un daltonien doit pouvoir lire la tendance.
 *
 * Le filet coloré en tête sert de code d'appartenance entre la carte et sa
 * série dans les graphiques plus bas.
 */
export function StatCard({
  label,
  value,
  delta,
  hint,
  accent = 'chart-1',
  spark,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  accent?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';
  spark?: number[];
}) {
  const positive = (delta ?? 0) >= 0;

  return (
    <article className="relative overflow-hidden rounded-card bg-surface p-5 ring-1 ring-ink-200/70 shadow-card">
      <span
        aria-hidden
        className={cn('absolute inset-x-0 top-0 h-[3px]', {
          'bg-chart-1': accent === 'chart-1',
          'bg-chart-2': accent === 'chart-2',
          'bg-chart-3': accent === 'chart-3',
          'bg-chart-4': accent === 'chart-4',
        })}
      />

      <p className="text-sm font-medium text-ink-500">{label}</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p data-numeric className="font-mono text-[28px] leading-none font-semibold text-ink-900">
          {value}
        </p>
        {spark ? <Sparkline points={spark} accent={accent} /> : null}
      </div>

      {delta !== undefined ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              positive ? 'text-success' : 'text-danger',
            )}
          >
            {positive ? (
              <ArrowUpRight aria-hidden className="size-4" />
            ) : (
              <ArrowDownRight aria-hidden className="size-4" />
            )}
            {percent(delta)}
          </span>
          {hint ? <span className="text-ink-500">{hint}</span> : null}
        </p>
      ) : null}
    </article>
  );
}

/** Au-delà, la courbe ne tient plus dans 72 px sans devenir du bruit. */
const MAX_SPARK_POINTS = 16;

/**
 * Réduit une série en moyennant des paquets de taille égale.
 *
 * Sous-échantillonner en prenant un point sur n ferait disparaître les pics au
 * hasard ; la moyenne conserve le niveau de chaque tranche.
 */
function condense(points: number[], limit: number): number[] {
  if (points.length <= limit) return points;

  const size = Math.ceil(points.length / limit);

  return Array.from({ length: Math.ceil(points.length / size) }, (_, index) => {
    const bucket = points.slice(index * size, (index + 1) * size);
    return bucket.reduce((sum, value) => sum + value, 0) / bucket.length;
  });
}

/**
 * Courbe miniature. Purement indicative : elle donne la forme de la tendance,
 * jamais les valeurs — celles-ci sont dans le graphique détaillé.
 */
function Sparkline({
  points: raw,
  accent,
}: {
  points: number[];
  accent: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';
}) {
  const points = condense(raw, MAX_SPARK_POINTS);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 72;
      const y = 28 - ((point - min) / span) * 24;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 72 30"
      className="h-8 w-[72px] shrink-0"
      aria-hidden
      style={{ transformBox: 'fill-box' }}
    >
      <path
        d={path}
        fill="none"
        stroke={chartColors[Number(accent.slice(-1)) as 1 | 2 | 3 | 4]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
