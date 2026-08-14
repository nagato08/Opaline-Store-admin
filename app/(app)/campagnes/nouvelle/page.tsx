'use client';

import { useActionState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { createCampaign } from './actions';

const PLACEMENTS = ['Bandeau haut', 'Bandeau bas', 'Fenêtre modale'];
const TRIGGERS = ['Immédiat', 'Après un délai', 'Après un pourcentage de défilement', 'Intention de sortie'];

export default function NewCampaignPage() {
  const [state, action] = useActionState(createCampaign, IDLE);
  const { field, formKey } = useFieldValues({}, state);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/campagnes" backLabel="Campagnes" title="Nouvelle campagne" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <Card className="min-w-0">
          <CardHeader
            title="Diffusion"
            description="Le serveur décide si la campagne est éligible ; ce formulaire décrit seulement où et quand elle peut apparaître."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom de la campagne" required error={state.errors?.name}>
                {(props) => (
                  <input {...props} {...field('name')} placeholder="Bandeau rentrée mobilier" />
                )}
              </Field>
            </div>

            <Field label="Emplacement" required error={state.errors?.placement}>
              {(props) => (
                <select {...props} {...field('placement')}>
                  <option value="" disabled>Choisir…</option>
                  {PLACEMENTS.map((placement) => (
                    <option key={placement} value={placement}>{placement}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Déclenchement" required error={state.errors?.trigger}>
              {(props) => (
                <select {...props} {...field('trigger')}>
                  <option value="" disabled>Choisir…</option>
                  {TRIGGERS.map((trigger) => (
                    <option key={trigger} value={trigger}>{trigger}</option>
                  ))}
                </select>
              )}
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Audience"
                required
                hint="Ex. « Canada, catégorie Alimentaire » ou « Visiteurs sans compte »"
                error={state.errors?.targeting}
              >
                {(props) => (
                  <input {...props} {...field('targeting')} placeholder="Tous les visiteurs" />
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
          <SubmitButton variant="primary">Créer la campagne</SubmitButton>
        </div>
      </form>
    </div>
  );
}
