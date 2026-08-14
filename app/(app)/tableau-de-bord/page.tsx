import Link from 'next/link';
import { AlertTriangle, ArrowRight, PackageX, Truck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { StatusBreakdown } from '@/components/dashboard/status-breakdown';
import { ExpiringLots } from '@/components/dashboard/expiring-lots';
import { PeriodPicker } from '@/components/dashboard/period-picker';
import { money, number, share, shortDate } from '@/lib/format';
import {
  ORDER_STATUSES,
  PERIODS,
  conversionSeries,
  expiringLots,
  latestOrders,
  ordersByStatus,
  outOfStock,
  revenueSeries,
  toPeriodKey,
  topProducts,
} from '@/lib/demo';

/**
 * La page est datée : la laisser préparer à la compilation la figerait au jour
 * du déploiement. Le rendu par requête sera de toute façon nécessaire une fois
 * les vrais chiffres branchés.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: PageProps<'/tableau-de-bord'>) {
  const periodKey = toPeriodKey((await searchParams).periode);
  const period = PERIODS[periodKey];
  const now = new Date();

  const revenue = revenueSeries(now, period.days, period.bucketDays);
  const orders = latestOrders(now);
  const statuses = ordersByStatus();
  const products = topProducts(period.days);
  const lots = expiringLots(now);
  const ruptures = outOfStock();

  const caCents = revenue.reduce((sum, point) => sum + point.caCents, 0);
  const orderCount = revenue.reduce((sum, point) => sum + point.commandes, 0);
  const toPrepare = statuses.find((slice) => slice.key === 'to-prepare')?.count ?? 0;
  const sinceYesterday = orders.filter(
    (order) => now.getTime() - Date.parse(order.placedAt) < 86_400_000,
  ).length;

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  // « Bonne nuit » se dit en partant : à une heure du matin, quelqu'un qui
  // ouvre son back-office commence sa session, il ne la termine pas.
  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir';

  /* Ce qui bloque aujourd'hui, déduit des mêmes données que le reste de la
     page : deux compteurs qui se contredisent sur un même écran suffisent à
     faire douter de l'outil entier. */
  const alerts = [
    {
      icon: PackageX,
      tone: 'danger' as const,
      title: `${number(ruptures.length)} produits en rupture`,
      detail: ruptures.map((item) => `${item.product} (${item.variant})`).join(', '),
      href: '/stock',
    },
    {
      icon: AlertTriangle,
      tone: 'warning' as const,
      title: `${number(lots.length)} lots périment sous 7 jours`,
      detail: lots
        .slice(0, 2)
        .map((lot) => lot.product)
        .join(', '),
      href: '#lots-a-surveiller',
    },
    {
      icon: Truck,
      tone: 'info' as const,
      title: `${number(toPrepare)} commandes à préparer`,
      detail: 'Dont 1 en livraison sur rendez-vous',
      href: '/commandes?statut=a-preparer',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* En-tête sur trame : une texture discrète qui distingue la zone de
          titre du contenu, sans ajouter de bloc ni de bordure. */}
      <header className="bg-grid -mx-4 mb-8 px-4 pb-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink-500 first-letter:uppercase">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900 sm:text-3xl">
              {greeting} Jérémie
            </h1>
            {/* Deux faits, deux périmètres : les commandes reçues depuis hier
                et la file d'attente de préparation, qui contient aussi des
                commandes plus anciennes. Les enchaîner par « dont » laisserait
                croire à une inclusion, et les chiffres sembleraient faux. */}
            <p className="mt-1.5 text-sm text-ink-600">
              {number(sinceYesterday)} commandes reçues depuis hier.{' '}
              {number(toPrepare)} attendent une préparation.
            </p>
          </div>

          {/* `flex-wrap` : sous 400 px, le sélecteur et l'action principale ne
              tiennent pas côte à côte. Ils passent l'un sous l'autre plutôt que
              de laisser leurs libellés se casser en deux lignes. */}
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker current={periodKey} basePath="/tableau-de-bord" />
            <LinkButton href="/commandes/nouvelle" variant="primary" size="sm" className="whitespace-nowrap">
              Nouvelle commande
            </LinkButton>
          </div>
        </div>
      </header>

      <section aria-labelledby="indicateurs">
        <h2 id="indicateurs" className="sr-only">
          Indicateurs de la période
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

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Chiffre d’affaires"
            description={`${period.label}, ${period.grain}, toutes devises converties en euros`}
            action={
              <Badge tone="brand">
                <Dot />
                En direct
              </Badge>
            }
          />
          <RevenueChart data={revenue} />
        </Card>

        <Card>
          <CardHeader title="À traiter" description="Ce qui bloque aujourd’hui" />
          <ul className="divide-y divide-ink-200/70">
            {alerts.map((alert) => (
              <li key={alert.title}>
                <Link
                  href={alert.href}
                  className="flex items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-ink-50"
                >
                  <span
                    aria-hidden
                    className={
                      alert.tone === 'danger'
                        ? 'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger'
                        : alert.tone === 'warning'
                          ? 'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-warning-soft text-warning'
                          : 'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-info-soft text-info'
                    }
                  >
                    <alert.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">
                      {alert.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-500">
                      {alert.detail}
                    </span>
                  </span>
                  <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* `min-w-0` sur les cartes : un enfant de grille garde par défaut la
          largeur minimale de son contenu. Sans lui, le tableau large à
          l'intérieur pousse la carte au-delà du viewport au lieu de défiler
          dans son propre cadre, et c'est la page entière qui glisse. */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Meilleures ventes"
            description={`${period.label}, par chiffre d’affaires`}
            action={
              <Link
                href="/produits"
                className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-cobalt-600 transition-colors duration-150 hover:bg-cobalt-50"
              >
                Le catalogue
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            }
          />
          <TopProducts products={products} totalCents={caCents} />
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Carnet de commandes" description="Où en sont les commandes" />
          <StatusBreakdown slices={statuses} />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Dernières commandes"
          action={
            <Link
              href="/commandes"
              className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-cobalt-600 transition-colors duration-150 hover:bg-cobalt-50"
            >
              Tout voir
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          }
        />

        {/* Défilement horizontal contenu : sur mobile, un tableau large doit
            glisser dans son cadre plutôt que déborder de la page. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <caption className="sr-only">
              Cinq dernières commandes, de la plus récente à la plus ancienne
            </caption>
            <thead>
              <tr className="border-b border-ink-200/70 text-left">
                <th scope="col" className="px-5 py-3 font-medium text-ink-500">
                  Numéro
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-ink-500">
                  Client
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-ink-500">
                  Statut
                </th>
                <th scope="col" className="px-5 py-3 font-medium text-ink-500">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium text-ink-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {orders.map((order) => (
                <tr key={order.number} className="transition-colors duration-150 hover:bg-ink-50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/commandes/${order.number}`}
                      className="font-mono text-[13px] font-medium text-cobalt-600 hover:underline"
                      translate="no"
                    >
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-800">{order.customer}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={ORDER_STATUSES[order.status].tone}>
                      <Dot />
                      {ORDER_STATUSES[order.status].label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-ink-500">
                    {shortDate(order.placedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-medium text-ink-900">
                    {money(order.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cible de l'alerte « lots périment sous 7 jours » : le détail vit sur la
          même page que le signalement, pas deux clics plus loin. */}
      <Card className="mt-6 scroll-mt-20" id="lots-a-surveiller">
        <CardHeader
          title="Lots à surveiller"
          description="Dates limites dans les 7 jours, sortie en FEFO"
          action={
            <Link
              href="/stock"
              className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-cobalt-600 transition-colors duration-150 hover:bg-cobalt-50"
            >
              Le stock
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          }
        />
        <ExpiringLots lots={lots} now={now} />
      </Card>
    </div>
  );
}
