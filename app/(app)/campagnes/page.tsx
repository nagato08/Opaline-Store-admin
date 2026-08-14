import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { dateRange, number, share } from '@/lib/format';
import { SCHEDULE_STATES, campaigns, scheduleState, toScheduleState } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Campagnes — Comptoir' };

export default async function CampaignsPage({ searchParams }: PageProps<'/campagnes'>) {
  const params = await searchParams;
  const state = toScheduleState(params.etat);

  const now = new Date();
  const all = campaigns(now);
  const filtered = state
    ? all.filter((campaign) => scheduleState(campaign.startsAt, campaign.endsAt, now) === state)
    : all;

  const tabs = [
    { label: 'Toutes', count: all.length },
    ...(['running', 'scheduled', 'ended'] as const).map((key) => ({
      value: SCHEDULE_STATES[key].slug,
      label: SCHEDULE_STATES[key].label,
      count: all.filter((campaign) => scheduleState(campaign.startsAt, campaign.endsAt, now) === key)
        .length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Campagnes"
        count={`${number(filtered.length)} affichées`}
        description="Le serveur décide si une campagne est éligible — planning, ciblage, plafond par visiteur. Le navigateur décide seulement quand l’afficher."
        action={
          <LinkButton href="/campagnes/nouvelle" variant="primary" size="sm" className="whitespace-nowrap">
            Nouvelle campagne
          </LinkButton>
        }
      />

      <div className="mb-4">
        <FilterTabs
          tabs={tabs}
          current={state && SCHEDULE_STATES[state].slug}
          param="etat"
          basePath="/campagnes"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne dans cet état"
            description="Rien n’est diffusé ni programmé ici pour le moment."
            action={<LinkButton href="/campagnes">Voir toutes les campagnes</LinkButton>}
          />
        ) : (
          /* Le ciblage passe sous le nom de la campagne : à huit colonnes, les
             noms se cassaient en trois lignes et le tableau glissait en
             permanence. Emplacement et déclenchement se lisent ensemble — ils
             décrivent le même geste, où et quand. */
          <Table
            caption="Campagnes d’affichage, avec leur emplacement, leur déclenchement et leur audience"
            minWidth="min-w-200"
            columns={[
              { label: 'Campagne' },
              { label: 'Affichage' },
              { label: 'État' },
              { label: 'Période' },
              { label: 'Affichages', align: 'right' },
              { label: 'Clics', align: 'right' },
            ]}
          >
            {filtered.map((campaign) => {
              const state = scheduleState(campaign.startsAt, campaign.endsAt, now);

              return (
                <Row key={campaign.name}>
                  <Cell>
                    <span className="block font-medium whitespace-nowrap text-ink-900">
                      {campaign.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">{campaign.targeting}</span>
                  </Cell>
                  <Cell>
                    <span className="block whitespace-nowrap text-ink-700">
                      {campaign.placement}
                    </span>
                    <span className="mt-0.5 block text-xs whitespace-nowrap text-ink-500">
                      {campaign.trigger}
                    </span>
                  </Cell>
                  <Cell>
                    <Badge tone={SCHEDULE_STATES[state].tone}>
                      <Dot />
                      {SCHEDULE_STATES[state].label}
                    </Badge>
                  </Cell>
                  <Cell className="whitespace-nowrap text-ink-500">
                    <span data-numeric>
                      {dateRange(campaign.startsAt, campaign.endsAt, now)}
                    </span>
                  </Cell>
                  <Cell align="right">
                    <span data-numeric className="font-mono text-ink-600">
                      {number(campaign.impressions)}
                    </span>
                  </Cell>
                  <NumCell>
                    {number(campaign.clicks)}
                    {/* Un nombre de clics ne dit rien sans son taux : mille clics
                        sur cent mille affichages, c'est un échec. */}
                    {campaign.impressions > 0 ? (
                      <span className="font-sans text-xs font-normal text-ink-400">
                        {' '}
                        · {share(campaign.clicks / campaign.impressions, 1)}
                      </span>
                    ) : null}
                  </NumCell>
                </Row>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
