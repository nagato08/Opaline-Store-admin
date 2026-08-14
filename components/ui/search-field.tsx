import { Search } from 'lucide-react';

/**
 * Recherche d'une liste.
 *
 * Un vrai formulaire en `GET` plutôt qu'un champ piloté par JavaScript : la
 * recherche atterrit dans l'URL, elle survit à un rechargement, et elle
 * fonctionne encore si le script n'a pas fini de charger. Sur une liste de
 * plusieurs centaines de lignes, filtrer à chaque frappe déclencherait de
 * toute façon une requête par caractère.
 */
export function SearchField({
  action,
  placeholder,
  label,
  defaultValue,
}: {
  action: string;
  placeholder: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <form action={action} role="search" className="relative w-full sm:w-72">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-9 w-full rounded-control bg-surface pr-3 pl-9 text-sm ring-1 ring-ink-200 ring-inset transition-colors duration-150 placeholder:text-ink-400 hover:ring-ink-300"
      />
    </form>
  );
}
