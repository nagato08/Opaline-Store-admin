'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

/**
 * Bouton de validation d'un formulaire.
 *
 * `useFormStatus` lit l'état du `<form>` parent : ce composant doit donc être
 * un enfant du formulaire, jamais le formulaire lui-même. Le bouton reste
 * **actif** pendant l'envoi et affiche un indicateur — le désactiver fait
 * perdre le focus clavier et laisse croire à un blocage, la même règle que
 * pour tout `Button`.
 */
export function SubmitButton({
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Button>, 'type' | 'loading'>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
