import { daysFromNow } from './random';
import type { BadgeTone } from '@/components/ui/badge';

/**
 * État d'une promotion ou d'une campagne.
 *
 * Il se **déduit** des dates plutôt que d'être stocké : un état écrit en base
 * se désynchronise dès qu'une date passe sans que personne ne repasse dessus,
 * et on se retrouve avec des promotions « actives » expirées depuis un mois.
 */
export type ScheduleState = 'scheduled' | 'running' | 'ended';

export const SCHEDULE_STATES: Record<
  ScheduleState,
  { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }
> = {
  running: { label: 'En cours', tone: 'success', slug: 'en-cours' },
  scheduled: { label: 'Programmée', tone: 'info', slug: 'programmee' },
  ended: { label: 'Terminée', tone: 'neutral', slug: 'terminee' },
};

export function toScheduleState(value: string | string[] | undefined): ScheduleState | undefined {
  if (typeof value !== 'string') return undefined;

  return (Object.keys(SCHEDULE_STATES) as ScheduleState[]).find(
    (key) => SCHEDULE_STATES[key].slug === value,
  );
}

export function scheduleState(startsAt: string, endsAt: string, now: Date): ScheduleState {
  if (Date.parse(startsAt) > now.getTime()) return 'scheduled';
  return Date.parse(endsAt) < now.getTime() ? 'ended' : 'running';
}

/* ------------------------------------------------------------------------- */

export type DemoPromotion = {
  name: string;
  /** Un code se saisit au panier ; une remise automatique s'applique seule. */
  kind: 'code' | 'automatic';
  code?: string;
  /** Libellé de la valeur : le moteur de règles accepte trop de formes pour un nombre. */
  value: string;
  scope: string;
  uses: number;
  maxUses?: number;
  startsAt: string;
  endsAt: string;
};

export function promotions(now: Date): DemoPromotion[] {
  return [
    { name: 'Rentrée mobilier', kind: 'automatic', value: '−15 % sur la catégorie', scope: 'Mobilier', uses: 187, startsAt: daysFromNow(now, -12), endsAt: daysFromNow(now, 6) },
    { name: 'Bienvenue', kind: 'code', code: 'BIENVENUE10', value: '−10 % première commande', scope: 'Tout le catalogue', uses: 342, maxUses: 1000, startsAt: daysFromNow(now, -180), endsAt: daysFromNow(now, 185) },
    { name: 'Livraison offerte dès 80 €', kind: 'automatic', value: 'Frais de port offerts', scope: 'France métropolitaine', uses: 908, startsAt: daysFromNow(now, -95), endsAt: daysFromNow(now, 270) },
    { name: 'Déstockage lampes', kind: 'code', code: 'LUMIERE25', value: '−25 %', scope: 'Lampe Arc', uses: 64, maxUses: 100, startsAt: daysFromNow(now, -5), endsAt: daysFromNow(now, 2) },
    { name: 'Épicerie −5 €', kind: 'code', code: 'EPICERIE5', value: '−5 € dès 40 €', scope: 'Alimentaire', uses: 0, maxUses: 500, startsAt: daysFromNow(now, 4), endsAt: daysFromNow(now, 34) },
    { name: 'Black Friday', kind: 'automatic', value: '−30 % sur une sélection', scope: 'Sélection de 42 produits', uses: 0, startsAt: daysFromNow(now, 104), endsAt: daysFromNow(now, 108) },
    { name: 'Soldes d’hiver', kind: 'automatic', value: 'Remise dégressive', scope: 'Tout le catalogue', uses: 1264, startsAt: daysFromNow(now, -212), endsAt: daysFromNow(now, -184) },
    { name: 'Parrainage', kind: 'code', code: 'AMI20', value: '−20 € parrain et filleul', scope: 'Tout le catalogue', uses: 76, maxUses: 200, startsAt: daysFromNow(now, -60), endsAt: daysFromNow(now, 30) },
  ];
}

/* ------------------------------------------------------------------------- */

export type DemoCampaign = {
  name: string;
  placement: string;
  /**
   * Le serveur décide *si* la campagne est éligible, le navigateur décide
   * *quand* l'afficher. Ce champ décrit la seconde moitié.
   */
  trigger: string;
  targeting: string;
  impressions: number;
  clicks: number;
  startsAt: string;
  endsAt: string;
};

export function campaigns(now: Date): DemoCampaign[] {
  return [
    { name: 'Bandeau rentrée mobilier', placement: 'Bandeau haut', trigger: 'Immédiat', targeting: 'Tous les visiteurs', impressions: 24380, clicks: 1218, startsAt: daysFromNow(now, -12), endsAt: daysFromNow(now, 6) },
    { name: 'Fenêtre première visite', placement: 'Fenêtre modale', trigger: 'Après 12 s', targeting: 'Visiteurs sans compte', impressions: 9640, clicks: 772, startsAt: daysFromNow(now, -40), endsAt: daysFromNow(now, 20) },
    { name: 'Rappel panier abandonné', placement: 'Fenêtre modale', trigger: 'Intention de sortie', targeting: 'Panier non vide', impressions: 3120, clicks: 468, startsAt: daysFromNow(now, -25), endsAt: daysFromNow(now, 35) },
    { name: 'Chaîne du froid — Québec', placement: 'Bandeau bas', trigger: 'Après 40 % de défilement', targeting: 'Canada, catégorie Alimentaire', impressions: 1870, clicks: 93, startsAt: daysFromNow(now, -8), endsAt: daysFromNow(now, 14) },
    { name: 'Annonce Black Friday', placement: 'Bandeau haut', trigger: 'Immédiat', targeting: 'Tous les visiteurs', impressions: 0, clicks: 0, startsAt: daysFromNow(now, 100), endsAt: daysFromNow(now, 108) },
    { name: 'Soldes d’hiver', placement: 'Bandeau haut', trigger: 'Immédiat', targeting: 'France', impressions: 68420, clicks: 4105, startsAt: daysFromNow(now, -212), endsAt: daysFromNow(now, -184) },
  ];
}
