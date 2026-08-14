import { cn } from '@/lib/cn';

export function Card({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'section'>) {
  return (
    <section
      className={cn(
        'rounded-card bg-surface ring-1 ring-ink-200/70 shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-4 border-b border-ink-200/70 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/**
 * État vide.
 *
 * Un tableau vide sans explication laisse l'utilisateur croire à une panne :
 * on dit ce qui manque et on propose l'action qui remplit l'écran.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ink-100">
        <Icon aria-hidden className="size-5 text-ink-500" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
