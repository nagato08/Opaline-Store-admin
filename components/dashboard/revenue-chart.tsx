'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money } from '@/lib/format';
import { chartColors, chartNeutrals } from '@/lib/palette';

export type RevenuePoint = { date: string; caCents: number; commandes: number };

/**
 * Chiffre d'affaires sur la période.
 *
 * Une aire plutôt que des barres : la question posée ici est « comment ça
 * évolue », pas « combien tel jour ». Les valeurs exactes restent accessibles
 * au survol et dans le tableau situé plus bas, qui sert d'équivalent
 * accessible au graphique.
 */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    /* `min-w-0` + `overflow-hidden` : sans eux, le conteneur de Recharts
       conserve une largeur mesurée trop grande et le graphique déborde de sa
       carte sur petit écran, ce qui provoque un défilement horizontal de la
       page entière. */
    <div className="h-72 w-full min-w-0 overflow-hidden px-2 pt-5 pb-2">
      <ResponsiveContainer
        width="100%"
        height="100%"
        /* `initialDimension` vaut `{-1, -1}` par défaut, et Recharts ne dessine
           rien tant qu'il n'a pas mesuré son conteneur : la carte reste vide
           jusqu'à ce que le `ResizeObserver` se déclenche. C'est invisible sur
           une machine rapide, mais le graphique manque à l'impression, dans une
           capture automatisée, et sur un poste chargé. Une dimension de départ
           plausible fait tracer la courbe dès la première image ; la mesure
           réelle la corrige juste après, et `overflow-hidden` sur le parent
           absorbe l'écart sans jamais faire déborder la page. */
        initialDimension={{ width: 640, height: 260 }}
      >
        {/* Marge droite : le dernier libellé d'axe est centré sur le dernier
            point, donc il déborde de la moitié de sa largeur. Sans cette marge
            il est rogné par le bord de la carte sur petit écran. */}
        <AreaChart data={data} margin={{ top: 4, right: 28, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors[1]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartColors[1]} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grille horizontale seule et très claire : elle aide à lire les
              niveaux sans concurrencer la courbe. */}
          <CartesianGrid vertical={false} stroke={chartNeutrals.grid} strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartNeutrals.axis }}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fontSize: 12, fill: chartNeutrals.axis }}
            tickFormatter={(value: number) => `${Math.round(value / 100000)} k€`}
          />

          <Tooltip
            cursor={{ stroke: chartNeutrals.cursor, strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${chartNeutrals.border}`,
              boxShadow: 'var(--shadow-pop)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) =>
              name === 'caCents'
                ? [money(Number(value)), 'Chiffre d’affaires']
                : [String(value), 'Commandes']
            }
          />

          <Area
            type="monotone"
            dataKey="caCents"
            stroke={chartColors[1]}
            strokeWidth={2}
            fill="url(#ca)"
            /* Pas d'animation d'entrée : sur un outil de pilotage, un
               graphique doit être lisible dès la première image. Recharts
               anime le tracé via `strokeDasharray`, ce qui laisse la courbe
               invisible tant que l'animation n'a pas démarré — y compris à
               l'impression et dans un rendu hors navigateur. */
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
