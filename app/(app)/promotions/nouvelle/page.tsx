'use client';

import { useActionState, useState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/cn';
import { IDLE } from '@/lib/form';
import { createPromotion } from './actions';

export default function NewPromotionPage() {
  const [state, action] = useActionState(createPromotion, IDLE);
  const [kind, setKind] = useState('automatic');
  const [discountKind, setDiscountKind] = useState('percentage');
  const { field, formKey } = useFieldValues({}, state);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/promotions" backLabel="Promotions" title="Nouvelle promotion" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <Card className="min-w-0">
          <CardHeader
            title="Remise"
            description="La remise s’applique avant la taxe : elle réduit la base taxable, jamais l’inverse. Elle porte sur le panier entier — un ciblage par catégorie n’est pas encore disponible depuis cet écran."
          />
          <div className="space-y-5 p-5">
            <Field label="Nom de la promotion" required error={state.errors?.name}>
              {(props) => (
                <input {...props} {...field('name')} placeholder="Rentrée mobilier" />
              )}
            </Field>

            <fieldset>
              <legend className="text-sm font-medium text-ink-800">Déclenchement</legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {[
                  { value: 'automatic', label: 'Automatique', hint: 'S’applique seule, sans saisie du client' },
                  { value: 'code', label: 'Par code', hint: 'Le client le saisit au panier' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-control p-3 text-sm ring-1 ring-inset transition-colors duration-150',
                      kind === option.value
                        ? 'bg-cobalt-50 ring-cobalt-300'
                        : 'ring-ink-200 hover:bg-ink-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={option.value}
                      checked={kind === option.value}
                      onChange={() => setKind(option.value)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium text-ink-900">{option.label}</span>
                      <span className="block text-xs text-ink-500">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {state.errors?.kind ? (
                <p className="mt-1.5 text-xs font-medium text-danger">{state.errors.kind}</p>
              ) : null}
            </fieldset>

            {kind === 'code' ? (
              <Field
                label="Code promotionnel"
                required
                hint="Majuscules et chiffres uniquement"
                error={state.errors?.code}
              >
                {(props) => (
                  <input
                    {...props}
                    {...field('code')}
                    placeholder="BIENVENUE10"
                    className={`${props.className} font-mono uppercase`}
                  />
                )}
              </Field>
            ) : null}

            <fieldset>
              <legend className="text-sm font-medium text-ink-800">Type de remise</legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                {[
                  { value: 'percentage', label: 'Pourcentage' },
                  { value: 'fixed', label: 'Montant fixe' },
                  { value: 'shipping', label: 'Livraison offerte' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-control p-3 text-sm ring-1 ring-inset transition-colors duration-150',
                      discountKind === option.value
                        ? 'bg-cobalt-50 ring-cobalt-300'
                        : 'ring-ink-200 hover:bg-ink-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="discountKind"
                      value={option.value}
                      checked={discountKind === option.value}
                      onChange={() => setDiscountKind(option.value)}
                    />
                    <span className="font-medium text-ink-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {discountKind !== 'shipping' ? (
              <Field
                label={discountKind === 'percentage' ? 'Pourcentage de remise' : 'Montant de la remise'}
                required
                hint={discountKind === 'percentage' ? 'Entre 1 et 100' : 'En euros'}
                error={state.errors?.value}
              >
                {(props) => (
                  <div className="relative">
                    <input
                      {...props}
                      {...field('value')}
                      type="number"
                      step={discountKind === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={discountKind === 'percentage' ? '100' : undefined}
                      inputMode="decimal"
                      className={`${props.className} pr-8`}
                    />
                    <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400">
                      {discountKind === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                )}
              </Field>
            ) : null}
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Période" />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Début" required error={state.errors?.startsAt}>
              {(props) => <input {...props} {...field('startsAt')} type="date" />}
            </Field>
            <Field label="Fin" required error={state.errors?.endsAt}>
              {(props) => <input {...props} {...field('endsAt')} type="date" />}
            </Field>
          </div>
        </Card>

        <FormNotice state={state} />

        <div className="flex justify-end gap-2">
          <SubmitButton variant="primary">Créer la promotion</SubmitButton>
        </div>
      </form>
    </div>
  );
}
