'use client';

import { useActionState } from 'react';
import { Check, PackageCheck, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, textareaClass } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';
import type { ReturnRow } from '@/lib/data/engagement';

type Bound = (previous: FormState, data: FormData) => Promise<FormState>;

/**
 * Traitement d'une demande de retour.
 *
 * Deux étapes qui ne se confondent pas : on décide d'abord si l'on accepte,
 * puis — le colis revenu — on constate son état et on rembourse. Les afficher
 * ensemble laisserait croire qu'accepter rembourse, alors que rien ne part
 * tant que la marchandise n'est pas là.
 */
export function ReturnActions({
  request,
  decide,
  receive,
}: {
  request: ReturnRow;
  decide: Bound;
  receive: Bound;
}) {
  const pending = request.status === 'REQUESTED';
  const awaited = request.status === 'APPROVED' || request.status === 'IN_TRANSIT';

  if (!pending && !awaited) return null;

  return pending ? (
    <DecisionCard action={decide} />
  ) : (
    <ReceiveCard action={receive} request={request} />
  );
}

function DecisionCard({ action }: { action: Bound }) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Décision"
        description="Accepter n’engage aucun remboursement : le client reçoit l’autorisation de renvoyer, et tout se joue à la réception du colis."
      />

      <form action={formAction} className="space-y-4 p-5 pt-0">
        <div>
          <label htmlFor="commentaire-decision" className="block text-sm font-medium text-ink-800">
            Message au client
          </label>
          <p className="mt-0.5 mb-1.5 text-xs text-ink-500">
            Sur un refus, c’est la seule explication qu’il recevra.
          </p>
          <textarea
            id="commentaire-decision"
            name="adminComment"
            rows={3}
            placeholder="Retour accepté, une étiquette prépayée vous a été envoyée."
            className={textareaClass}
          />
        </div>

        <FormNotice state={state} />

        {/* La valeur part avec le bouton cliqué : un seul formulaire, une
            seule saisie, deux issues. */}
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="decision" value="approve" variant="primary">
            <Check aria-hidden className="size-4" />
            Accepter le retour
          </SubmitButton>
          <SubmitButton name="decision" value="reject" variant="danger">
            <X aria-hidden className="size-4" />
            Refuser
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function ReceiveCard({ action, request }: { action: Bound; request: ReturnRow }) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Réception du colis"
        description="C’est ici que l’argent part. Vérifiez l’état des articles avant de valider : la remise en stock les remet en vente immédiatement."
      />

      <form action={formAction} className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Checkbox
            name="restock"
            label="Remettre les articles en vente"
            hint="À décocher si la marchandise revient abîmée, ouverte, ou périmée."
            defaultChecked
          />
        </div>

        <Field
          label="Montant remboursé"
          hint="Vide = la valeur des articles retournés"
          error={state.errors?.refundAmount}
        >
          {(props) => (
            <div className="relative">
              <input
                {...props}
                name="refundAmount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                className={`${props.className} pr-8`}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400"
              >
                €
              </span>
            </div>
          )}
        </Field>

        <Field label="Commentaire interne" hint={`${request.itemCount} ligne${request.itemCount > 1 ? 's' : ''} attendue${request.itemCount > 1 ? 's' : ''}`}>
          {(props) => <input {...props} name="adminComment" />}
        </Field>

        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>

        <div className="flex justify-end sm:col-span-2">
          <SubmitButton variant="primary">
            <PackageCheck aria-hidden className="size-4" />
            Constater la réception et rembourser
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
