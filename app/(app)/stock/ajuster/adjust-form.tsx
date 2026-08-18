'use client';

import { useActionState, useMemo, useState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, textareaClass, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { number } from '@/lib/format';
import { IDLE } from '@/lib/form';
import { adjustStock } from './actions';
import type { Location, StockLine, StockMovementType } from '@/lib/data/stock';

const REASONS: Array<{ label: string; type: StockMovementType }> = [
  { label: 'Inventaire physique', type: 'ADJUSTMENT' },
  { label: 'Casse ou produit périmé', type: 'LOSS' },
  { label: 'Retour non conforme', type: 'RETURN' },
  { label: 'Correction d’erreur de saisie', type: 'ADJUSTMENT' },
];

function lineKey(line: Pick<StockLine, 'variantId' | 'locationId'>): string {
  return `${line.variantId}::${line.locationId}`;
}

export function AdjustForm({ lines, locations }: { lines: StockLine[]; locations: Location[] }) {
  const [state, action] = useActionState(adjustStock, IDLE);
  const [key, setKey] = useState('');
  const { field, formKey } = useFieldValues({}, state);
  const current = useMemo(() => lines.find((line) => lineKey(line) === key), [lines, key]);
  const multiLocation = locations.length > 1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <DetailHeader backHref="/stock" backLabel="Stock" title="Ajuster le stock" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <input type="hidden" name="variantId" value={current?.variantId ?? ''} />
        <input type="hidden" name="locationId" value={current?.locationId ?? ''} />

        <Card className="min-w-0">
          <CardHeader
            title="Référence"
            description="Le disponible se recalcule après l’ajustement ; les réservations en cours ne sont pas touchées."
          />
          <div className="space-y-5 p-5">
            <Field label="Référence" required error={state.errors?.sku}>
              {(props) => (
                <select
                  {...props}
                  name="line"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {lines.map((line) => (
                    <option key={lineKey(line)} value={lineKey(line)}>
                      {line.product} ({line.sku})
                      {multiLocation ? ` — ${line.locationName}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {current ? (
              <p className="rounded-control bg-ink-50 px-3 py-2.5 text-sm text-ink-600">
                Quantité physique actuelle :{' '}
                <span data-numeric className="font-mono font-medium text-ink-900">
                  {number(current.onHand)} {current.unit}
                </span>
                {current.reserved > 0 ? (
                  <>
                    {' '}
                    · dont{' '}
                    <span data-numeric className="font-mono">
                      {number(current.reserved)} {current.unit}
                    </span>{' '}
                    déjà réservés
                  </>
                ) : null}
              </p>
            ) : null}

            <Field
              label="Quantité à ajouter ou retirer"
              required
              hint={current ? `En ${current.unit} — signée : négative pour une sortie` : 'Signée : négative pour une sortie'}
              error={state.errors?.quantity}
            >
              {(props) => (
                <input
                  {...props}
                  {...field('quantity')}
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                />
              )}
            </Field>

            <Field label="Motif" required error={state.errors?.reason}>
              {(props) => (
                <select {...props} {...field('reason')}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {REASONS.map((reason) => (
                    <option key={reason.label} value={reason.label}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Note" hint="Facultatif — détail utile pour retrouver le contexte plus tard">
              {(props) => (
                <textarea {...props} {...field('note')} rows={3} className={textareaClass} />
              )}
            </Field>
          </div>
        </Card>

        <FormNotice state={state} />

        <div className="flex justify-end gap-2">
          <SubmitButton variant="primary">Enregistrer l’ajustement</SubmitButton>
        </div>
      </form>
    </div>
  );
}
