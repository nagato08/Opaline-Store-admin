import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { FormState } from '@/lib/form';

const styles = {
  invalid: { icon: AlertTriangle, className: 'bg-danger-soft text-danger ring-danger/20' },
  unavailable: { icon: Info, className: 'bg-info-soft text-info ring-info/20' },
  saved: { icon: CheckCircle2, className: 'bg-success-soft text-success ring-success/20' },
} as const;

/**
 * Retour d'un formulaire.
 *
 * `role="status"` et `aria-live="polite"` : le message apparaît après la
 * soumission, donc hors du flux de lecture, et sans région vivante un
 * utilisateur de lecteur d'écran ne saurait jamais que quelque chose s'est
 * passé — il resterait sur le bouton à attendre.
 *
 * Poli et non « assertif » : l'annonce attend la fin de la phrase en cours
 * plutôt que de couper la parole.
 */
export function FormNotice({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null;

  const { icon: Icon, className } = styles[state.status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-card px-4 py-3 text-sm ring-1 ring-inset ${className}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{state.message}</p>
    </div>
  );
}
