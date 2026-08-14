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
  const { field, formKey } = useFieldValues({}, state);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/promotions" backLabel="Promotions" title="Nouvelle promotion" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <Card className="min-w-0">
          <CardHeader
            title="Remise"
            description="La remise s’applique avant la taxe : elle réduit la base taxable, jamais l’inverse."
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

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Valeur de la remise"
                required
                hint="Ex. « −15 % » ou « −5 € dès 40 € »"
                error={state.errors?.value}
              >
                {(props) => (
                  <input {...props} {...field('value')} placeholder="−15 %" />
                )}
              </Field>

              <Field
                label="Portée"
                required
                hint="Ex. « Mobilier » ou « Tout le catalogue »"
                error={state.errors?.scope}
              >
                {(props) => (
                  <input {...props} {...field('scope')} placeholder="Tout le catalogue" />
                )}
              </Field>
            </div>
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
