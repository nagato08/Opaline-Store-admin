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
import type { StockLine } from '@/lib/demo';

const REASONS = ['Inventaire physique', 'Casse ou produit périmé', 'Retour non conforme', 'Correction d’erreur de saisie'];

export function AdjustForm({ lines }: { lines: StockLine[] }) {
  const [state, action] = useActionState(adjustStock, IDLE);
  const [sku, setSku] = useState('');
  const { field, formKey } = useFieldValues({}, state);
  const current = useMemo(() => lines.find((line) => line.sku === sku), [lines, sku]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <DetailHeader backHref="/stock" backLabel="Stock" title="Ajuster le stock" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
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
                  name="sku"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {lines.map((line) => (
                    <option key={line.sku} value={line.sku}>
                      {line.product} — {line.variant} ({line.sku})
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
              label="Nouvelle quantité physique"
              required
              hint={current ? `En ${current.unit}` : undefined}
              error={state.errors?.quantity}
            >
              {(props) => (
                <input
                  {...props}
                  {...field('quantity')}
                  type="number"
                  step="0.001"
                  min="0"
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
                    <option key={reason} value={reason}>
                      {reason}
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
