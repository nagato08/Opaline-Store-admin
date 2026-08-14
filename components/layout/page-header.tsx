/**
 * En-tête de page.
 *
 * Reprend la trame du tableau de bord pour que toutes les sections se
 * reconnaissent au premier coup d'œil : titre, une phrase qui dit ce qu'on
 * regarde, et les actions de la page alignées à droite.
 *
 * Le décompte est en chasse fixe et vit à côté du titre plutôt que dans la
 * phrase : c'est le chiffre qu'on vient vérifier en arrivant.
 */
export function PageHeader({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description: string;
  count?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="bg-grid -mx-4 mb-6 px-4 pb-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
            {count ? (
              <span
                data-numeric
                className="rounded-full bg-ink-100 px-2.5 py-1 font-mono text-xs font-medium text-ink-600"
              >
                {count}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-600">{description}</p>
        </div>

        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
