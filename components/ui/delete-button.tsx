'use client';

import { useActionState, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';

/**
 * Suppression en deux temps.
 *
 * Le premier clic ne supprime pas : il remplace le bouton par une demande de
 * confirmation explicite. C'est préféré à `window.confirm` pour deux raisons —
 * le message natif ne peut pas nommer précisément ce qui va disparaître, et il
 * est bloquant, donc invisible aux lecteurs d'écran qui l'annoncent hors
 * contexte.
 *
 * `aria-live="polite"` sur la zone de confirmation : sans lui, le changement
 * d'état du bouton ne serait pas annoncé et un utilisateur non voyant
 * croirait son clic perdu.
 */
export function DeleteButton({
  action,
  label,
  confirmation,
}: {
  action: (previous: FormState, data: FormData) => Promise<FormState>;
  /** Libellé du bouton au repos, par exemple « Supprimer la catégorie ». */
  label: string;
  /** Ce qui disparaît, formulé pour être relu avant de cliquer. */
  confirmation: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <div className="space-y-3">
        <FormNotice state={state} />
        <Button type="button" variant="ghost" onClick={() => setAsking(true)}>
          <Trash2 aria-hidden className="size-4" />
          {label}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormNotice state={state} />
      <div aria-live="polite" className="rounded-card bg-danger-soft p-4 ring-1 ring-danger/20">
        <p className="text-sm text-danger">{confirmation}</p>
        <form action={formAction} className="mt-3 flex flex-wrap gap-2">
          <SubmitButton variant="danger" size="sm">
            Oui, supprimer
          </SubmitButton>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAsking(false)}>
            Annuler
          </Button>
        </form>
      </div>
    </div>
  );
}
