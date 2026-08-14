import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { PeriodPicker } from '@/components/dashboard/period-picker';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { SplitBars } from '@/components/dashboard/split-bars';
import { money, number, share } from '@/lib/format';
import {
  PERIODS,
  conversionSeries,
  revenueByCategory,
  revenueByCountry,
  revenueSeries,
  shippingSplit,
  toPeriodKey,
} from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Statistiques — Comptoir' };

export default async function StatsPage({ searchParams }: PageProps<'/statistiques'>) {
  const periodKey = toPeriodKey((await searchParams).periode);
  const period = PERIODS[periodKey];
  const now = new Date();

  const revenue = revenueSeries(now, period.days, period.bucketDays);
  const caCents = revenue.reduce((sum, point) => sum + point.caCents, 0);
  const orderCount = revenue.reduce((sum, point) => sum + point.commandes, 0);

  const byCategory = revenueByCategory(caCents);
  const byCountry = revenueByCountry(caCents);
  const byShipping = shippingSplit(orderCount);

  /* Le meilleur et le pire jour de la période : c'est la première question
     qu'on se pose devant une courbe, autant y répondre sans avoir à survoler. */
  const best = revenue.reduce((top, point) => (point.caCents > top.caCents ? point : top));
  const worst = revenue.reduce((low, point) => (point.caCents < low.caCents ? point : low));

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Statistiques"
        description="La structure des ventes, pas leur détail. Les montants canadiens sont hors taxe : ils ne s’additionnent aux montants français que si l’on sait ce qu’on additionne."
        action={<PeriodPicker current={periodKey} basePath="/statistiques" />}
      />

      <section aria-labelledby="synthese">
        <h2 id="synthese" className="sr-only">
          Synthèse de la période
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Chiffre d’affaires"
            value={money(caCents)}
            delta={period.deltas.ca}
            hint={period.compare}
            accent="chart-1"
            spark={revenue.map((point) => point.caCents)}
          />
          <StatCard
            label="Commandes"
            value={number(orderCount)}
            delta={period.deltas.orders}
            hint={period.compare}
            accent="chart-2"
            spark={revenue.map((point) => point.commandes)}
          />
          <StatCard
            label="Panier moyen"
            value={money(Math.round(caCents / orderCount))}
            delta={period.deltas.basket}
            hint={period.compare}
            accent="chart-4"
            spark={revenue.map((point) => Math.round(point.caCents / point.commandes / 100))}
          />
          <StatCard
            label="Taux de conversion"
            value={share(period.conversion, 1)}
            delta={period.deltas.conversion}
            hint={period.compare}
            accent="chart-3"
            spark={conversionSeries(revenue.length, period.conversion)}
          />
        </div>
      </section>

      <Card className="mt-6 min-w-0">
        <CardHeader
          title="Chiffre d’affaires"
          description={`${period.label}, ${period.grain}`}
          action={
            <Badge tone="brand">
              <Dot />
              En direct
            </Badge>
          }
        />
        <RevenueChart data={revenue} />
      </Card>

      {/* `items-start` : sans lui, les trois cartes s'alignent sur la plus
          haute et celle qui n'a que deux lignes traîne un grand vide. */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader title="Par catégorie" description="Part du chiffre d’affaires" />
          <SplitBars
            kind="money"
            rows={byCategory.map((row) => ({
              label: row.label,
              value: row.valueCents,
              hint: row.hint,
            }))}
          />
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Par pays" description="Régime d’affichage compris" />
          <SplitBars
            kind="money"
            rows={byCountry.map((row) => ({
              label: row.label,
              value: row.valueCents,
              hint: row.hint,
            }))}
          />
        </Card>

        <Card className="min-w-0 lg:col-span-2 xl:col-span-1">
          <CardHeader title="Par mode de livraison" description="En nombre de commandes" />
          <SplitBars
            kind="count"
            rows={byShipping.map((row) => ({
              label: row.label,
              value: row.count,
              hint: row.hint,
            }))}
          />
        </Card>
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader
          title="Détail de la période"
          description="Le tableau équivalent au graphique — il reste lisible à l’impression et se copie dans un tableur"
        />
        <Table
          caption="Chiffre d’affaires et commandes, période par période"
          minWidth="min-w-140"
          columns={[
            { label: period.bucketDays === 1 ? 'Jour' : 'Semaine du' },
            { label: '' , hidden: true },
            { label: 'Commandes', align: 'right' },
            { label: 'Panier moyen', align: 'right' },
            { label: 'Chiffre d’affaires', align: 'right' },
          ]}
        >
          {revenue.map((point) => (
            <Row key={point.date}>
              <Cell className="whitespace-nowrap font-medium text-ink-900">{point.date}</Cell>
              <Cell>
                {point.date === best.date ? (
                  <Badge tone="success">Meilleur</Badge>
                ) : point.date === worst.date ? (
                  <Badge tone="neutral">Plus faible</Badge>
                ) : null}
              </Cell>
              <Cell align="right">
                <span data-numeric className="font-mono text-ink-600">
                  {number(point.commandes)}
                </span>
              </Cell>
              <Cell align="right">
                <span data-numeric className="font-mono text-ink-600">
                  {money(Math.round(point.caCents / point.commandes))}
                </span>
              </Cell>
              <NumCell>{money(point.caCents)}</NumCell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  );
}
