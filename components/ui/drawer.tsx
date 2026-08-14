'use client';

import { useEffect, useRef } from 'react';

/**
 * Panneau modal latéral.
 *
 * Bâti sur l'élément `<dialog>` natif ouvert par `showModal()`, et non sur un
 * `<div>` en position fixe. Le navigateur fournit alors quatre comportements
 * qu'une réimplémentation manuelle rate presque toujours :
 *
 * - le focus reste **piégé** dans le panneau, sans compter les éléments
 *   focalisables à la main ;
 * - `Échap` ferme ;
 * - l'arrière-plan devient inerte, donc invisible aux lecteurs d'écran et
 *   inatteignable à la tabulation ;
 * - le focus revient sur le bouton d'ouverture à la fermeture.
 *
 * Reste à notre charge le blocage du défilement : un `<dialog>` est dans la
 * couche supérieure, mais la page continue de défiler sous lui.
 */
export function Drawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Nom du panneau pour les lecteurs d'écran ; il n'a pas de titre visible. */
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // `showModal` lève si le dialogue est déjà ouvert : d'où le garde-fou.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      /* `close` couvre aussi bien Échap que `dialog.close()` : l'état React
         suit la fermeture par quelque chemin qu'elle arrive. */
      onClose={onClose}
      /* Un clic sur le fond a pour cible le `<dialog>` lui-même, jamais son
         contenu : la comparaison suffit à distinguer les deux. */
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-transparent p-0 backdrop:bg-ink-900/50"
    >
      <div className="animate-in h-full overscroll-contain">{children}</div>
    </dialog>
  );
}
