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
export function StoreSettingsForm({ storeName, contactEmail }: { storeName: string; contactEmail: string }) {
  const [state, action] = useActionState(saveStoreSettings, IDLE);
  const { field, formKey } = useFieldValues({ storeName, contactEmail }, state);

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
