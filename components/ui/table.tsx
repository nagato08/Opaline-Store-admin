import { cn } from '@/lib/cn';

export type Column = {
  label: string;
  align?: 'right';
  /** En-tête nécessaire au lecteur d'écran mais superflu à l'œil (actions). */
  hidden?: boolean;
};

/**
 * Coquille de tableau.
 *
 * Elle porte les trois choses qu'on oublie une fois sur deux et qu'il faut
 * pourtant partout : le `overflow-x-auto` qui fait glisser un tableau large
 * dans son cadre au lieu de pousser la page, la légende lue par les lecteurs
 * d'écran, et le `scope="col"` qui rattache chaque cellule à sa colonne.
 *
 * `minWidth` est explicite : au-dessous de cette largeur le tableau défile.
 */
export function Table({
  caption,
  columns,
  minWidth = 'min-w-160',
  children,
}: {
  caption: string;
  columns: Column[];
  minWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', minWidth)}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink-200/70 text-left">
            {columns.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={cn(
                  'px-5 py-3 font-medium text-ink-500',
                  column.align === 'right' && 'text-right',
                )}
              >
                <span className={column.hidden ? 'sr-only' : undefined}>{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200/70">{children}</tbody>
      </table>
    </div>
  );
}

/** Ligne de tableau cliquable au survol, comme partout ailleurs. */
export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors duration-150 hover:bg-ink-50">{children}</tr>;
}

export function Cell({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: 'right';
  className?: string;
}) {
  return (
    <td className={cn('px-5 py-3.5', align === 'right' && 'text-right', className)}>{children}</td>
  );
}

/** Valeur chiffrée : chasse fixe et alignement à droite, jamais autrement. */
export function NumCell({ children }: { children: React.ReactNode }) {
  return (
    <td data-numeric className="px-5 py-3.5 text-right font-mono font-medium whitespace-nowrap text-ink-900">
      {children}
    </td>
  );
}
