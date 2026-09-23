'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Déclenche l'impression du navigateur.
 *
 * Le raccourci clavier existe déjà ; ce bouton est là pour qui ne le connaît
 * pas, ce qui est le cas de la plupart des gens qui préparent des commandes.
 */
export function PrintButton() {
  return (
    <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden className="size-4" />
      Imprimer
    </Button>
  );
}
