'use client';

import { useActionState } from 'react';
import { Check, ShieldCheck, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { textareaClass } from '@/components/ui/field';
import { shortDate } from '@/lib/format';
import { IDLE, type FormState } from '@/lib/form';
import { REVIEW_STATUSES, type ReviewRow } from '@/lib/data/engagement';

/**
 * Un avis et sa décision.
 *
 * Les deux boutons sont côte à côte et portent chacun leur libellé : un menu
 * déroulant « statut » obligerait à deux gestes là où la décision est binaire.
 * Le refus est en `danger` — publier par erreur se corrige, mais un avis
 * refusé disparaît de la boutique sans que le client en soit averti.
 */
export function ReviewCard({
  review,
  action,
}: {
  review: ReviewRow;
  action: (previous: FormState, data: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <article className="border-b border-ink-200/70 p-5 last:border-b-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} />
            <Badge tone={REVIEW_STATUSES[review.status].tone}>
              {REVIEW_STATUSES[review.status].label}
            </Badge>
            {review.isVerifiedPurchase ? (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <ShieldCheck aria-hidden className="size-3.5" />
                Achat vérifié
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            {review.author} · {review.productName} · {shortDate(review.createdAt)}
          </p>
        </div>
      </header>

      {review.title ? (
        <h3 className="mt-3 text-base font-semibold text-ink-900">{review.title}</h3>
      ) : null}
      {review.body ? (
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-700">
          {review.body}
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-ink-400">Une note sans commentaire.</p>
      )}

      {review.reply ? (
        <div className="mt-3 rounded-control bg-ink-50 p-3">
          <p className="text-xs font-medium text-ink-500">Votre réponse</p>
          <p className="mt-1 text-sm whitespace-pre-line text-ink-700">{review.reply}</p>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-3">
        <label htmlFor={`reponse-${review.id}`} className="block text-sm font-medium text-ink-800">
          Réponse publique
        </label>
        <textarea
          id={`reponse-${review.id}`}
          name="reply"
          rows={2}
          defaultValue={review.reply}
          placeholder="Merci pour votre retour — nous avons transmis au fabricant."
          className={textareaClass}
        />

        <FormNotice state={state} />

        <div className="flex flex-wrap gap-2">
          <SubmitButton name="status" value="APPROVED" variant="primary" size="sm">
            <Check aria-hidden className="size-4" />
            Publier
          </SubmitButton>
          <SubmitButton name="status" value="REJECTED" variant="danger" size="sm">
            <X aria-hidden className="size-4" />
            Refuser
          </SubmitButton>
        </div>
      </form>
    </article>
  );
}

/**
 * La note en étoiles est **doublée d'un texte** lu par les lecteurs d'écran :
 * cinq pictogrammes identiques ne disent rien sans lui.
 */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="sr-only">{rating} sur 5</span>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden
          className={
            value <= rating ? 'size-4 fill-warning text-warning' : 'size-4 text-ink-300'
          }
        />
      ))}
    </span>
  );
}
