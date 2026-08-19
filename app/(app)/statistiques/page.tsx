import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { PeriodPicker } from '@/components/dashboard/period-picker';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { SplitBars } from '@/components/dashboard/split-bars';
import { money, number } from '@/lib/format';
import { PERIODS, getBreakdowns, getOverview, toPeriodKey } from '@/lib/data/dashboard';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Statistiques — Comptoir' };

const COUNTRY_NAMES: Record<string, string> = { FR: 'France', CA: 'Canada' };

export default async function StatsPage({ searchParams }: PageProps<'/statistiques'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const periodKey = toPeriodKey((await searchParams).periode);
  const period = PERIODS[periodKey];

  const [overview, breakdowns] = await Promise.all([
    getOverview(session, period.days),
    getBreakdowns(session, period.days),
  ]);

  const revenue = overview.series;
  const caCents = overview.primaryRegime?.totalCents ?? 0;
  const primaryCurrency = overview.primaryRegime?.currencyCode ?? 'EUR';
  const orderCount = overview.revenue.orderCount;
  const averageCents = overview.primaryRegime?.orderCount
    ? Math.round(overview.primaryRegime.totalCents / overview.primaryRegime.orderCount)
    : 0;

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
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={`Chiffre d’affaires (${primaryCurrency})`}
            value={money(caCents, primaryCurrency)}
            delta={overview.revenue.revenueChange ?? undefined}
            hint={period.compare}
            accent="chart-1"
            spark={revenue.map((point) => point.caCents)}
          />
          <StatCard
            label="Commandes"
            value={number(orderCount)}
            delta={overview.revenue.orderChange ?? undefined}
            hint={period.compare}
            accent="chart-2"
            spark={revenue.map((point) => point.commandes)}
          />
          <StatCard
            label="Panier moyen"
            value={money(averageCents, primaryCurrency)}
            hint={period.compare}
            accent="chart-4"
            spark={revenue.map((point) => (point.commandes ? Math.round(point.caCents / point.commandes / 100) : 0))}
          />
        </div>
        {overview.otherRegimes.length > 0 ? (
          <p className="mt-3 text-xs text-ink-500">
            Autres régimes non additionnés :{' '}
            {overview.otherRegimes
              .map((regime) => `${money(regime.totalCents, regime.currencyCode)} (${regime.regime}, ${regime.currencyCode})`)
              .join(', ')}
          </p>
        ) : null}
      </section>

      <Card className="mt-6 min-w-0">
        <CardHeader
          title="Chiffre d’affaires"
          description={`${period.label}, jour par jour, en ${primaryCurrency}`}
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
          <CardHeader title="Par catégorie" description={`Chiffre d’affaires en ${primaryCurrency}`} />
          {breakdowns.byCategory.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-500">Aucune vente sur la période.</p>
          ) : (
            <SplitBars
              kind="money"
              rows={breakdowns.byCategory.map((row) => ({ label: row.name, value: row.totalCents }))}
            />
          )}
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Par pays" description="Chaque devise reste à part, jamais sommée" />
          {breakdowns.byCountry.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-500">Aucune vente sur la période.</p>
          ) : (
            <ul className="space-y-3 px-5 py-5">
              {breakdowns.byCountry.map((row) => (
                <li key={`${row.countryCode}-${row.currencyCode}`} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink-900">
                    {COUNTRY_NAMES[row.countryCode] ?? row.countryCode}
                  </span>
                  <span className="text-right">
                    <span data-numeric className="font-mono font-medium text-ink-900">
                      {money(row.totalCents, row.currencyCode)}
                    </span>
                    <span className="ml-2 text-xs text-ink-500">
                      {number(row.orderCount)} {row.orderCount > 1 ? 'commandes' : 'commande'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0 lg:col-span-2 xl:col-span-1">
          <CardHeader title="Par transporteur" description="Expéditions déjà créées, pas les commandes en attente" />
          {breakdowns.byCarrier.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-500">Aucune expédition sur la période.</p>
          ) : (
            <SplitBars
              kind="count"
              rows={breakdowns.byCarrier.map((row) => ({ label: row.name, value: row.orderCount }))}
            />
          )}
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
            { label: 'Jour' },
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
                  {point.commandes ? money(Math.round(point.caCents / point.commandes), primaryCurrency) : '—'}
                </span>
              </Cell>
              <NumCell>{money(point.caCents, primaryCurrency)}</NumCell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  );
}
