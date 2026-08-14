'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Bouton.
 *
 * Une seule action principale par écran : la variante `primary` est donc
 * volontairement la seule à porter la couleur de marque pleine.
 * Le bouton reste **actif** pendant une requête et affiche un indicateur —
 * le désactiver empêche l'utilisateur de comprendre qu'il s'est passé
 * quelque chose, et fait perdre le focus clavier.
 */
const variants = {
  primary: 'bg-cobalt-500 text-white hover:bg-cobalt-600 active:bg-cobalt-700',
  secondary:
    'bg-surface text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
} as const;

const sizes = {
  // 44 px de haut : seuil de confort tactile, respecté même sur desktop pour
  // rester utilisable sur une tablette en réserve.
  md: 'h-11 px-4 text-sm gap-2',
  sm: 'h-9 px-3 text-sm gap-1.5',
  icon: 'size-9 justify-center',
} as const;

const base = [
  'inline-flex items-center rounded-control font-medium',
  // `manipulation` supprime le délai de 300 ms au tap sur mobile.
  'touch-manipulation transition-colors duration-150',
  'disabled:pointer-events-none disabled:opacity-50',
];

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
});

/**
 * Lien portant l'allure d'un bouton.
 *
 * Une destination reste un `<a>` : le clic milieu, le « ouvrir dans un nouvel
 * onglet » et le survol qui montre l'adresse en dépendent. Un `<button>` qui
 * navigue casse les trois.
 */
export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(base, 'justify-center', variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}
