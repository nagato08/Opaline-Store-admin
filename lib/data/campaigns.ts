import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';
import { scheduleState, type ScheduleState } from './schedule';

/**
 * Création de campagne d'affichage, branchée sur `POST /admin/content/campaigns`.
 *
 * Répartition héritée du moteur de campagnes : le serveur décide *si* la
 * campagne est éligible (audience), le navigateur décide *quand* l'afficher
 * dans la page (déclenchement). Les deux champs du formulaire correspondent
 * chacun à un vrai type de l'API — pas de ciblage libre inventé.
 */

export type Placement = 'Bandeau haut' | 'Bandeau bas' | 'Fenêtre modale';
export type Trigger = 'Immédiat' | 'Après un délai' | 'Après un pourcentage de défilement' | 'Intention de sortie';
export type Audience = 'Tous les visiteurs' | 'Nouveaux visiteurs' | 'Visiteurs de retour' | 'Clients connectés' | 'Visiteurs sans compte';

const PLACEMENT_TYPES: Record<Placement, string> = {
  'Bandeau haut': 'TOP_BAR',
  'Bandeau bas': 'BANNER',
  'Fenêtre modale': 'POPUP',
};

const TRIGGER_VALUES: Record<Trigger, string> = {
  'Immédiat': 'IMMEDIATE',
  'Après un délai': 'DELAY',
  'Après un pourcentage de défilement': 'SCROLL',
  'Intention de sortie': 'EXIT_INTENT',
};

const AUDIENCE_VALUES: Record<Audience, string> = {
  'Tous les visiteurs': 'ALL',
  'Nouveaux visiteurs': 'NEW_VISITOR',
  'Visiteurs de retour': 'RETURNING_VISITOR',
  'Clients connectés': 'CUSTOMER',
  'Visiteurs sans compte': 'GUEST',
};

export const PLACEMENTS = Object.keys(PLACEMENT_TYPES) as Placement[];
export const TRIGGERS = Object.keys(TRIGGER_VALUES) as Trigger[];
export const AUDIENCES = Object.keys(AUDIENCE_VALUES) as Audience[];

function reverse<K extends string, V extends string>(map: Record<K, V>): Record<string, K> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v as string, k])) as Record<string, K>;
}

const TYPE_PLACEMENTS = reverse(PLACEMENT_TYPES);
const TRIGGER_LABELS = reverse(TRIGGER_VALUES);
const AUDIENCE_LABELS = reverse(AUDIENCE_VALUES);

export async function createCampaign(
  session: SessionData,
  input: { name: string; placement: Placement; trigger: Trigger; audience: Audience; startsAt: string; endsAt: string },
): Promise<void> {
  const code =
    input.name
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replaceAll(/[^A-Z0-9]/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/^-|-$/g, '')
      .slice(0, 60) || 'CAMPAGNE';

  await apiFetch(session, '/admin/content/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      code,
      type: PLACEMENT_TYPES[input.placement],
      status: 'RUNNING',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      displayRules: { trigger: TRIGGER_VALUES[input.trigger] },
      targeting: { audience: AUDIENCE_VALUES[input.audience] },
      translations: [{ locale: 'FR', title: input.name }],
    }),
  });
}

type ApiCampaign = {
  id: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
  displayRules: { trigger?: string };
  targeting: { audience?: string };
  translations: { locale: string; title: string | null }[];
};

type ApiCampaignStats = { impressions: number; clicks: number };

export type Campaign = {
  id: string;
  name: string;
  placement: string;
  trigger: string;
  audience: string;
  impressions: number;
  clicks: number;
  startsAt: string | null;
  endsAt: string | null;
  state: ScheduleState;
};

function campaignName(translations: ApiCampaign['translations']): string {
  return translations.find((t) => t.locale === 'FR')?.title ?? translations[0]?.title ?? '—';
}

/**
 * Liste des campagnes, avec leurs statistiques sur 30 jours.
 *
 * La liste brute ne porte pas les compteurs d'affichage — ils vivent dans
 * `CampaignStat`, agrégés par `GET .../campaigns/:id/stats`. D'où un aller-
 * retour par campagne : acceptable pour le nombre de campagnes qu'une
 * boutique mono-enseigne fait tourner à la fois.
 */
export async function listCampaigns(session: SessionData): Promise<Campaign[]> {
  const now = new Date();
  const page = await apiFetch<{ items: ApiCampaign[] }>(session, '/admin/content/campaigns?perPage=100');

  const stats = await Promise.all(
    page.items.map((campaign) =>
      apiFetch<ApiCampaignStats>(session, `/admin/content/campaigns/${campaign.id}/stats?days=30`),
    ),
  );

  return page.items.map((campaign, index) => ({
    id: campaign.id,
    name: campaignName(campaign.translations),
    placement: TYPE_PLACEMENTS[campaign.type] ?? campaign.type,
    trigger: campaign.displayRules.trigger ? (TRIGGER_LABELS[campaign.displayRules.trigger] ?? campaign.displayRules.trigger) : '—',
    audience: campaign.targeting.audience ? (AUDIENCE_LABELS[campaign.targeting.audience] ?? campaign.targeting.audience) : 'Tous les visiteurs',
    impressions: stats[index].impressions,
    clicks: stats[index].clicks,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    state: scheduleState(campaign.startsAt, campaign.endsAt, now),
  }));
}
