import type { BadgeTone } from '@/components/ui/badge';

/**
 * État d'une promotion ou d'une campagne, déduit des dates plutôt que stocké :
 * un état écrit en base se désynchronise dès qu'une date passe sans que
 * personne ne repasse dessus.
 */
export type ScheduleState = 'scheduled' | 'running' | 'ended';

export const SCHEDULE_STATES: Record<ScheduleState, { label: string; tone: Exclude<BadgeTone, 'brand'>; slug: string }> = {
  running: { label: 'En cours', tone: 'success', slug: 'en-cours' },
  scheduled: { label: 'Programmée', tone: 'info', slug: 'programmee' },
  ended: { label: 'Terminée', tone: 'neutral', slug: 'terminee' },
};

export function toScheduleState(value: string | string[] | undefined): ScheduleState | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.keys(SCHEDULE_STATES) as ScheduleState[]).find((key) => SCHEDULE_STATES[key].slug === value);
}

/** `startsAt`/`endsAt` nuls : une promotion sans date de fin ne se termine jamais. */
export function scheduleState(startsAt: string | null, endsAt: string | null, now: Date): ScheduleState {
  if (startsAt && Date.parse(startsAt) > now.getTime()) return 'scheduled';
  if (endsAt && Date.parse(endsAt) < now.getTime()) return 'ended';
  return 'running';
}
