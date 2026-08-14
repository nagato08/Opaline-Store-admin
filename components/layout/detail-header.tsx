import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/**
 * En-tête d'une fiche.
 *
 * Le retour est un vrai lien vers la liste d'origine, pas un `history.back()` :
 * une fiche s'atteint aussi par une recherche, un signet ou un lien collé dans
 * un message, et le bouton « précédent » du navigateur renverrait alors
 * ailleurs — ou nulle part.
 *
 * Le titre est en chasse fixe quand c'est une référence — numéro de commande,
 * SKU, numéro de lot : ce sont des chaînes qu'on compare caractère à
 * caractère, et la chasse proportionnelle rend `0`, `O` et `8` ambigus.
 */
export function DetailHeader({
  backHref,
  backLabel,
  title,
  mono = false,
  subtitle,
  badge,
  action,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  mono?: boolean;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="bg-grid -mx-4 mb-6 px-4 pb-6 lg:-mx-8 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-ink-600 transition-colors duration-150 hover:text-ink-900"
      >
        <ChevronLeft aria-hidden className="size-4" />
        {backLabel}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={
                mono
                  ? 'font-mono text-xl font-semibold text-ink-900 sm:text-2xl'
                  : 'text-2xl font-semibold text-ink-900 sm:text-3xl'
              }
              translate={mono ? 'no' : undefined}
              data-numeric={mono ? '' : undefined}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle ? <div className="mt-1.5 text-sm text-ink-600">{subtitle}</div> : null}
        </div>

        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
