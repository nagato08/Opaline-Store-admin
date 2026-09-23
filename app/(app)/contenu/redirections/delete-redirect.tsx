'use client';

import { useActionState } from 'react';
import { X } from 'lucide-react';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { deleteRedirect } from './actions';

/**
 * Suppression en ligne, sans confirmation.
 *
 * Contrairement à une page ou une catégorie, une redirection se recrée en dix
 * secondes et ne détruit rien : demander confirmation à chaque ligne coûterait
 * plus que l'erreur qu'on éviterait.
 */
export function DeleteRedirect({ id, fromPath }: { id: string; fromPath: string }) {
  const [, formAction] = useActionState(deleteRedirect.bind(null, id), IDLE);

  return (
    <form action={formAction}>
      <SubmitButton variant="ghost" size="icon" aria-label={`Supprimer la redirection depuis ${fromPath}`}>
        <X aria-hidden className="size-4" />
      </SubmitButton>
    </form>
  );
}
