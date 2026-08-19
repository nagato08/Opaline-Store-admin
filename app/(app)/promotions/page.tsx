import { redirect } from 'next/navigation';
import { TicketPercent } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { dateRange, number, share } from '@/lib/format';
import { listPromotions } from '@/lib/data/promotions';
import { SCHEDULE_STATES, toScheduleState } from '@/lib/data/schedule';
import { getSession } from '@/lib/current-session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Promotions — Comptoir' };

export default async function PromotionsPage({ searchParams }: PageProps<'/promotions'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const params = await searchParams;
  const state = toScheduleState(params.etat);

  const now = new Date();
  const all = await listPromotions(session);
  const filtered = state ? all.filter((promotion) => promotion.state === state) : all;

  const tabs = [
    { label: 'Toutes', count: all.length },
    ...(['running', 'scheduled', 'ended'] as const).map((key) => ({
      value: SCHEDULE_STATES[key].slug,
      label: SCHEDULE_STATES[key].label,
      count: all.filter((promotion) => promotion.state === key).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Promotions"
        count={`${number(filtered.length)} affichées`}
        description="Une remise réduit la base taxable : elle s’applique avant la taxe, jamais après. L’état se déduit des dates, il n’est pas saisi à la main."
        action={
          <LinkButton href="/promotions/nouvelle" variant="primary" size="sm" className="whitespace-nowrap">
            Nouvelle promotion
          </LinkButton>
        }
      />

      <div className="mb-4">
        <FilterTabs
          tabs={tabs}
          current={state && SCHEDULE_STATES[state].slug}
          param="etat"
          basePath="/promotions"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title="Aucune promotion dans cet état"
            description="Rien n’est programmé ni en cours ici pour le moment."
            action={<LinkButton href="/promotions">Voir toutes les promotions</LinkButton>}
          />
        ) : (
          <Table
            caption="Promotions et codes de réduction, avec leur période et leur consommation"
            minWidth="min-w-220"
            columns={[
              { label: 'Promotion' },
              { label: 'Déclenchement' },
              { label: 'Remise' },
              { label: 'Portée' },
              { label: 'État' },
              { label: 'Période' },
              { label: 'Utilisations', align: 'right' },
            ]}
          >
            {filtered.map((promotion) => (
              <Row key={promotion.id}>
                <Cell>
                  <span className="block font-medium text-ink-900">{promotion.name}</span>
                  {!promotion.isAutomatic ? (
                    <span
                      className="mt-0.5 block font-mono text-xs text-cobalt-600"
                      translate="no"
                    >
                      {promotion.code}
                    </span>
                  ) : null}
                </Cell>
                <Cell className="whitespace-nowrap text-ink-600">
                  {promotion.isAutomatic ? 'Automatique' : 'Code au panier'}
                </Cell>
                <Cell className="text-ink-800">{promotion.value}</Cell>
                <Cell className="text-ink-600">{promotion.scope}</Cell>
                <Cell>
                  <Badge tone={SCHEDULE_STATES[promotion.state].tone}>
                    <Dot />
                    {SCHEDULE_STATES[promotion.state].label}
                  </Badge>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-500">
                  <span data-numeric>
                    {promotion.startsAt && promotion.endsAt
                      ? dateRange(promotion.startsAt, promotion.endsAt, now)
                      : 'Sans limite'}
                  </span>
                </Cell>
                <NumCell>
                  {number(promotion.uses)}
                  {/* Le plafond est la seule information qui dit si une
                      promotion est sur le point de s'épuiser. */}
                  {promotion.maxUses ? (
                    <span className="font-sans text-xs font-normal text-ink-400">
                      {' '}
                      / {number(promotion.maxUses)} · {share(promotion.uses / promotion.maxUses)}
                    </span>
                  ) : null}
                </NumCell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
