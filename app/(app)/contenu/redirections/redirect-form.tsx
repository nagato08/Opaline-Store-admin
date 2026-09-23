'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { createRedirect } from './actions';

/**
 * Création d'une redirection.
 *
 * Le choix 301 / 302 n'est pas cosmétique : le premier dit aux moteurs que
 * l'ancienne adresse est morte et leur fait transférer son référencement, le
 * second annonce un détour temporaire et ne transfère rien. Poser un 302 sur
 * un déplacement définitif perd le référencement accumulé.
 */
export function RedirectForm() {
  const [state, formAction] = useActionState(createRedirect, IDLE);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Nouvelle redirection"
        description="À poser dès qu’une adresse change : sans elle, les liens déjà partagés et les résultats de recherche tombent sur une page introuvable."
      />

      <form action={formAction} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
        <Field label="Ancienne adresse" required error={state.errors?.fromPath}>
          {(props) => (
            <input
              {...props}
              name="fromPath"
              placeholder="/rayons/canapes"
              autoComplete="off"
              className={`${props.className} font-mono`}
            />
          )}
        </Field>

        <Field label="Nouvelle adresse" required error={state.errors?.toPath}>
          {(props) => (
            <input
              {...props}
              name="toPath"
              placeholder="/rayons/mobilier"
              autoComplete="off"
              className={`${props.className} font-mono`}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Type"
            required
            hint="Définitif transfère le référencement de l’ancienne adresse, temporaire ne transfère rien."
            error={state.errors?.statusCode}
          >
            {(props) => (
              <select {...props} name="statusCode" defaultValue="301">
                <option value="301">Définitif (301)</option>
                <option value="302">Temporaire (302)</option>
              </select>
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>

        <div className="flex justify-end sm:col-span-2">
          <SubmitButton variant="primary">Créer la redirection</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
