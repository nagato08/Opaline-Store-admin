'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { saveStoreSettings } from './actions';

/**
 * Seule section réellement éditable de la page : l'enseigne est un réglage
 * (`store.name`), le reste — régimes de taxe, transporteurs, prestataires —
 * est un fait d'infrastructure affiché en lecture seule plus bas.
 */
export function StoreSettingsForm() {
  const [state, action] = useActionState(saveStoreSettings, IDLE);
  const { field, formKey } = useFieldValues(
    {
      storeName: 'La Maison Comptoir',
      contactEmail: 'contact@example.fr',
      currency: 'EUR',
      locale: 'fr',
    },
    state,
  );

  return (
    <Card className="min-w-0">
      <CardHeader title="Boutique" description="Ce qui identifie l’enseigne auprès des visiteurs" />

      <form key={formKey} action={action} noValidate>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Nom de l’enseigne" required error={state.errors?.storeName}>
            {(props) => (
              <input {...props} {...field('storeName')} />
            )}
          </Field>

          <Field label="Adresse de contact" required error={state.errors?.contactEmail}>
            {(props) => (
              <input {...props} {...field('contactEmail')} type="email" />
            )}
          </Field>

          <Field label="Devise de référence" hint="Les montants sont stockés en centimes entiers">
            {(props) => (
              <select {...props} {...field('currency')}>
                <option value="EUR">Euro (EUR)</option>
                <option value="CAD">Dollar canadien (CAD)</option>
              </select>
            )}
          </Field>

          <Field label="Langue de l’interface">
            {(props) => (
              <select {...props} {...field('locale')}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            )}
          </Field>
        </div>

        <div className="border-t border-ink-200/70 px-5 py-4">
          <FormNotice state={state} />
          <div className="mt-3 flex justify-end">
            <SubmitButton variant="primary" size="sm">
              Enregistrer
            </SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}
