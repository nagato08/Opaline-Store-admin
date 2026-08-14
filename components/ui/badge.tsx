import { cn } from '@/lib/cn';

/**
 * Pastille de statut.
 *
 * Chaque statut porte une couleur **et** un libellé explicite : la couleur
 * seule exclurait les daltoniens, et un back-office se lit vite — le mot doit
 * suffire même en noir et blanc.
 */
const tones = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  brand: 'bg-cobalt-50 text-cobalt-700 ring-cobalt-200',
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Point coloré précédant un libellé de statut, purement décoratif. */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-1.5 rounded-full bg-current', className)}
    />
  );
}
