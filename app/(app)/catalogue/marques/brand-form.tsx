'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Checkbox, Field } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';
import type { BrandRow } from '@/lib/data/catalog';

type Action = (previous: FormState, data: FormData) => Promise<FormState>;

/**
 * Formulaire d'une marque, partagé par la création et la modification.
 *
 * Le nom de la marque n'est **pas** traduit, contrairement à celui d'une
 * catégorie : « Bosch » s'écrit pareil dans les deux langues. C'est l'API qui
 * pose cette distinction — elle expose un champ `name` direct sur la marque,
 * là où la catégorie passe par une table de traductions.
 */
export function BrandForm({
  action,
  brand,
  submitLabel,
}: {
  action: Action;
  brand?: BrandRow;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const creating = brand === undefined;

  return (
    <Card className="min-w-0">
      <CardHeader
        title={creating ? 'Nouvelle marque' : 'Modifier la marque'}
        description={
          creating
            ? 'Facultatif sur un produit, mais c’est ce qui alimente le filtre « marque » de la recherche.'
            : undefined
        }
      />

      <form action={formAction} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
        <Field label="Nom" required error={state.errors?.name}>
          {(props) => (
            <input
              {...props}
              name="name"
              defaultValue={brand?.name ?? ''}
              placeholder="Bosch"
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="Identifiant d’URL"
          hint="Laisser vide pour le déduire du nom"
          error={state.errors?.slug}
        >
          {(props) => (
            <input
              {...props}
              name="slug"
              defaultValue={brand?.slug ?? ''}
              placeholder="bosch"
              autoComplete="off"
              className={`${props.className} font-mono`}
            />
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Site du fabricant"
            hint="Adresse complète, en commençant par https://"
            error={state.errors?.website}
          >
            {(props) => (
              <input
                {...props}
                name="website"
                type="url"
                defaultValue={brand?.website ?? ''}
                placeholder="https://www.bosch.fr"
                autoComplete="off"
              />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Checkbox
            name="isActive"
            label="Marque active"
            hint="Décochée, elle disparaît des filtres de la boutique sans toucher aux produits qui la portent."
            defaultChecked={brand?.isActive ?? true}
          />
        </div>

        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>

        <div className="flex justify-end sm:col-span-2">
          <SubmitButton variant="primary">{submitLabel}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
