'use client';

import { useActionState } from 'react';
import { BadgeEuro, PackageCheck, RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { money } from '@/lib/format';
import { IDLE, type FormState } from '@/lib/form';
import {
  ALLOWED_TRANSITIONS,
  API_STATUS_LABELS,
  type AdminOrder,
  type Carrier,
} from '@/lib/data/orders';
import { changeStatus, markPaid, refund, ship } from './actions';

type Bound = (previous: FormState, data: FormData) => Promise<FormState>;

/**
 * Traitement d'une commande.
 *
 * Quatre gestes, quatre cartes, et **seulement celles qui ont un sens à cet
 * instant** : proposer « Encaisser » sur une commande déjà payée ou
 * « Expédier » sur une commande annulée oblige à lire pour comprendre qu'il
 * n'y a rien à faire. L'écran d'une commande close ne montre donc aucune
 * carte.
 *
 * Chaque formulaire a son propre état : un remboursement refusé ne doit pas
 * effacer le numéro de suivi saisi juste au-dessus.
 */
export function OrderActions({ order, carriers }: { order: AdminOrder; carriers: Carrier[] }) {
  const transitions = ALLOWED_TRANSITIONS[order.apiStatus] ?? [];
  const refundableCents = order.paidCents - order.refundedCents;

  const payable =
    order.apiStatus !== 'CANCELLED' &&
    (order.paymentStatus === 'UNPAID' ||
      order.paymentStatus === 'AUTHORIZED' ||
      order.paymentStatus === 'PARTIALLY_PAID');

  const shippable =
    order.apiStatus !== 'CANCELLED' &&
    order.lines.some((line) => line.quantity - line.fulfilledQuantity > 0);

  if (!payable && transitions.length === 0 && refundableCents <= 0 && !shippable) {
    return null;
  }

  return (
    <div className="space-y-6">
      {payable ? (
        <MarkPaidCard
          action={markPaid.bind(null, order.id, order.number)}
          totalCents={order.totalCents}
          paidCents={order.paidCents}
          currency={order.currencyCode}
        />
      ) : null}

      {shippable ? (
        <ShipCard action={ship.bind(null, order.id, order.number)} order={order} carriers={carriers} />
      ) : null}

      {transitions.length > 0 ? (
        <StatusCard
          action={changeStatus.bind(null, order.id, order.number, order.apiStatus)}
          current={order.apiStatus}
          transitions={transitions}
        />
      ) : null}

      {refundableCents > 0 ? (
        <RefundCard
          action={refund.bind(null, order.id, order.number, refundableCents)}
          refundableCents={refundableCents}
          currency={order.currencyCode}
        />
      ) : null}
    </div>
  );
}

function MarkPaidCard({
  action,
  totalCents,
  paidCents,
  currency,
}: {
  action: Bound;
  totalCents: number;
  paidCents: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Encaissement"
        description={
          paidCents > 0
            ? `${money(paidCents, currency)} déjà encaissés sur ${money(totalCents, currency)}. Marquer la commande comme payée solde le reste.`
            : 'Aucun prestataire de paiement n’est branché : le virement ou le règlement à la livraison se constate à la main, ici.'
        }
      />
      <form action={formAction} className="space-y-3 p-5 pt-0">
        <FormNotice state={state} />
        <SubmitButton variant="primary">
          <BadgeEuro aria-hidden className="size-4" />
          Marquer comme payée
        </SubmitButton>
      </form>
    </Card>
  );
}

function StatusCard({
  action,
  current,
  transitions,
}: {
  action: Bound;
  current: keyof typeof API_STATUS_LABELS;
  transitions: Array<keyof typeof API_STATUS_LABELS>;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="État de la commande"
        description={`Actuellement « ${API_STATUS_LABELS[current]} ». Une commande n’avance que dans un sens : il n’y a pas de retour en arrière.`}
      />
      <form action={formAction} className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
        <Field label="Nouvel état" required error={state.errors?.status}>
          {(props) => (
            <select {...props} name="status" defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              {transitions.map((status) => (
                <option key={status} value={status}>
                  {API_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Motif" hint="Consigné au journal, visible en cas de litige">
          {(props) => <input {...props} name="reason" placeholder="Rupture de stock fournisseur" />}
        </Field>

        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>

        <div className="flex justify-end sm:col-span-2">
          <SubmitButton>Changer l’état</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function RefundCard({
  action,
  refundableCents,
  currency,
}: {
  action: Bound;
  refundableCents: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Remboursement"
        description={`${money(refundableCents, currency)} encore remboursables. Le remboursement est enregistré dans la commande ; le virement, lui, reste à faire depuis votre banque.`}
      />
      <form action={formAction} className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
        <Field label="Montant" required error={state.errors?.amount}>
          {(props) => (
            <div className="relative">
              <input
                {...props}
                name="amount"
                type="number"
                step="0.01"
                min="0"
                max={(refundableCents / 100).toFixed(2)}
                inputMode="decimal"
                placeholder={(refundableCents / 100).toFixed(2)}
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

        <Field label="Motif" hint="Consigné au journal, visible en cas de litige">
          {(props) => <input {...props} name="reason" placeholder="Article retourné, non conforme" />}
        </Field>

        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>

        <div className="flex justify-end sm:col-span-2">
          <SubmitButton variant="danger">
            <RotateCcw aria-hidden className="size-4" />
            Rembourser
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function ShipCard({
  action,
  order,
  carriers,
}: {
  action: Bound;
  order: AdminOrder;
  carriers: Carrier[];
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const remaining = order.lines
    .map((line) => ({ line, left: line.quantity - line.fulfilledQuantity }))
    .filter((entry) => entry.left > 0);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Expédition"
        description="Une commande peut partir en plusieurs colis : laissez à zéro ce qui ne part pas maintenant."
      />
      <form action={formAction} className="space-y-5 p-5 pt-0">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Transporteur">
            {(props) => (
              <select {...props} name="carrierId" defaultValue="">
                <option value="">Non précisé</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Numéro de suivi" hint="Envoyé au client avec l’avis d’expédition">
            {(props) => (
              <input
                {...props}
                name="trackingNumber"
                autoComplete="off"
                className={`${props.className} font-mono`}
              />
            )}
          </Field>
        </div>

        <fieldset className="min-w-0">
          <legend className="text-sm font-medium text-ink-800">Quantités expédiées</legend>
          {state.errors?.items ? (
            <p className="mt-1 text-xs font-medium text-danger">{state.errors.items}</p>
          ) : null}

          <ul className="mt-2 divide-y divide-ink-100 rounded-control ring-1 ring-ink-200 ring-inset">
            {remaining.map(({ line, left }, index) => (
              <li key={line.id} className="flex items-center gap-3 p-3">
                <input type="hidden" name="itemId" value={line.id} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-900">{line.label}</p>
                  <p className="font-mono text-xs text-ink-500" translate="no">
                    {line.sku} · reste {left}
                  </p>
                </div>

                <label htmlFor={`qte-${line.id}`} className="sr-only">
                  Quantité expédiée pour {line.label}
                </label>
                <input
                  id={`qte-${line.id}`}
                  name="quantity"
                  type="number"
                  /* Pas de `step="1"` : l'alimentaire se vend au poids et une
                     ligne peut porter 0,75 kg. */
                  step="0.001"
                  min="0"
                  max={left}
                  inputMode="decimal"
                  defaultValue={left}
                  aria-invalid={state.errors?.[`quantity-${index}`] ? true : undefined}
                  className="h-9 w-24 rounded-control bg-surface px-2.5 text-right font-mono text-sm text-ink-900 ring-1 ring-ink-200 ring-inset"
                />
              </li>
            ))}
          </ul>
        </fieldset>

        <FormNotice state={state} />

        <div className="flex justify-end">
          <SubmitButton variant="primary">
            <PackageCheck aria-hidden className="size-4" />
            Enregistrer l’expédition
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
