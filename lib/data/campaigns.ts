import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

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
