import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Boxes, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardHeader, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { ExpiringLots } from '@/components/dashboard/expiring-lots';
import { number } from '@/lib/format';
import { STOCK_LEVELS, expiringLots, listStockLines, toStockLevel } from '@/lib/data/stock';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Stock — Comptoir' };

const LEVELS = STOCK_LEVELS;

export default async function StockPage({ searchParams }: PageProps<'/stock'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const params = await searchParams;
  const level = toStockLevel(params.niveau);

  const now = new Date();
  const [all, lots] = await Promise.all([listStockLines(session, {}), expiringLots(session, 7)]);

  const filtered = level ? all.filter((line) => line.level === level) : all;

  const tabs = [
    { label: 'Tout', count: all.length },
    ...(['out', 'low', 'ok'] as const).map((key) => ({
      value: LEVELS[key].slug,
      label: LEVELS[key].label,
      count: all.filter((line) => line.level === key).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Stock"
        count={`${number(filtered.length)} références`}
        description="Le disponible est la quantité physique moins ce que les commandes payées ont déjà immobilisé. C’est lui qui décide d’une rupture, jamais la quantité en rayon."
        action={
          <>
            <LinkButton href="/api/export/stock" size="sm">
              <Download aria-hidden className="size-4" />
              Exporter
            </LinkButton>
            <LinkButton href="/stock/ajuster" variant="primary" size="sm" className="whitespace-nowrap">
              Ajuster le stock
            </LinkButton>
          </>
        }
      />

      <div className="mb-4">
        <FilterTabs
          tabs={tabs}
          current={level && LEVELS[level].slug}
          param="niveau"
          basePath="/stock"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Aucune référence à ce niveau"
            description="C’est une bonne nouvelle : rien n’est dans cet état pour le moment."
            action={<LinkButton href="/stock">Voir tout le stock</LinkButton>}
          />
        ) : (
          <Table
            caption="Références en stock, avec quantité physique, quantité réservée et disponible"
            minWidth="min-w-220"
            columns={[
              { label: 'Référence' },
              { label: 'Niveau' },
              { label: 'Lots ouverts', align: 'right' },
              { label: 'Physique', align: 'right' },
              { label: 'Réservé', align: 'right' },
              { label: 'Seuil', align: 'right' },
              { label: 'Disponible', align: 'right' },
            ]}
          >
            {filtered.map((line) => (
              <Row key={line.sku}>
                <Cell>
                  <Link
                    href={`/produits/${line.sku}`}
                    className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {line.product}
                  </Link>
                  <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                    {line.sku}
                  </span>
                </Cell>
                <Cell>
                  <Badge tone={LEVELS[line.level].tone}>
                    <Dot />
                    {LEVELS[line.level].label}
                  </Badge>
                </Cell>
                <Cell align="right">
                  {/* Un tiret et non zéro : le mobilier n'a pas de lots, il
                      n'en a pas « zéro ». */}
                  {line.openLots === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span data-numeric className="font-mono text-ink-600">
                      {number(line.openLots)}
                    </span>
                  )}
                </Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-600">
                    {number(line.onHand)}
                  </span>
                </Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-600">
                    {number(line.reserved)}
                  </span>
                </Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-400">
                    {number(line.threshold)}
                  </span>
                </Cell>
                <NumCell>
                  {number(line.available)}{' '}
                  <span className="font-sans text-xs font-normal text-ink-500">{line.unit}</span>
                </NumCell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6 min-w-0">
        <CardHeader
          title="Lots à surveiller"
          description="Dates limites dans les 7 jours, sortie en FEFO — le lot qui périme le premier part le premier"
        />
        <ExpiringLots lots={lots} now={now} />
      </Card>
    </div>
  );
}
