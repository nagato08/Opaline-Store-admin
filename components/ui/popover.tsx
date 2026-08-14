'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Panneau ancré à son déclencheur.
 *
 * Volontairement **non modal**, contrairement au `Drawer` : un menu de compte
 * ou une liste de notifications n'interrompt pas la tâche en cours, et le
 * rendre modal obligerait à le fermer avant de pouvoir relire l'écran.
 *
 * Ce qui reste donc à notre charge, et qu'un panneau bricolé oublie :
 *
 * - `Échap` ferme **et rend le focus au déclencheur**, sinon la tabulation
 *   repart du début du document ;
 * - un clic ou un focus hors du panneau ferme, y compris au clavier ;
 * - le déclencheur annonce l'état par `aria-expanded`, faute de quoi un
 *   lecteur d'écran ne sait pas qu'un panneau vient de s'ouvrir.
 *
 * L'ancrage se fait par positionnement absolu dans un conteneur `relative`
 * plutôt que par l'API `popover` native : celle-ci place l'élément dans la
 * couche supérieure, où il faudrait l'ancrage CSS que Firefox et Safari ne
 * savent pas encore appliquer.
 */
export function Popover({
  label,
  trigger,
  children,
  className,
}: {
  /** Nom du panneau pour les lecteurs d'écran. */
  label: string;
  /** Rendu du déclencheur ; il reçoit les attributs à poser sur le bouton. */
  trigger: (props: {
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-haspopup': 'dialog';
    onClick: () => void;
  }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function close(restoreFocus: boolean) {
      setOpen(false);
      if (restoreFocus) {
        rootRef.current?.querySelector<HTMLElement>('button')?.focus();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    }

    /* `pointerdown` et non `click` : un clic sur un autre bouton doit fermer
       le panneau *avant* que ce bouton n'agisse, sinon l'action se joue sous
       un panneau encore ouvert. */
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    }

    /* La sortie au clavier compte autant que la sortie à la souris : sans
       cette écoute, tabuler hors du panneau le laisse ouvert derrière soi. */
    function onFocusIn(event: FocusEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  // Le focus entre dans le panneau à l'ouverture, sur son premier élément
  // actionnable : sans cela, l'utilisateur clavier ouvre un panneau qu'il ne
  // peut atteindre qu'en retraversant tout le reste de la barre.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button, input')?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        'aria-expanded': open,
        'aria-controls': id,
        'aria-haspopup': 'dialog',
        onClick: () => setOpen((value) => !value),
      })}

      {open ? (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            'animate-in absolute top-[calc(100%+0.5rem)] right-0 z-50 w-80 max-w-[calc(100vw-2rem)]',
            'rounded-card bg-surface shadow-pop ring-1 ring-ink-200/70',
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}
