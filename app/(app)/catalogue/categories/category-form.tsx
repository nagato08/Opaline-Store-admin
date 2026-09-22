'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Checkbox, Field } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';
import type { CategoryRow } from '@/lib/data/catalog';

type Action = (previous: FormState, data: FormData) => Promise<FormState>;

/**
 * Formulaire d'une catégorie, partagé par la création et la modification.
 *
 * Les deux écrans collectent exactement les mêmes champs : les séparer en deux
 * composants aurait garanti qu'ils divergent à la première retouche.
 *
 * `useFieldValues` n'est pas utilisé ici. Ce crochet existe pour restituer une
 * saisie après un refus, or ce formulaire est court et l'écran de création
 * reste sur place après un succès : remonter les champs à chaque fin d'action
 * effacerait ce que l'utilisateur vient d'enchaîner. Les champs restent donc
 * non contrôlés, et la seule remise à zéro est celle du navigateur.
 */
export function CategoryForm({
  action,
  parents,
  category,
  submitLabel,
}: {
  action: Action;
  /** Catégories pouvant servir de parent — la catégorie modifiée en est exclue. */
  parents: CategoryRow[];
  category?: CategoryRow;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const creating = category === undefined;

  return (
    <Card className="min-w-0">
      <CardHeader
        title={creating ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
        description={
          creating
            ? 'Un produit ne peut pas exister sans catégorie : commencez par les rayons de la boutique, les sous-rayons viennent ensuite.'
            : undefined
        }
      />

      <form action={formAction} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Field label="Nom" required error={state.errors?.name}>
            {(props) => (
              <input
                {...props}
                name="name"
                defaultValue={category?.name ?? ''}
                placeholder="Mobilier de jardin"
                autoComplete="off"
              />
            )}
          </Field>
        </div>

        <Field
          label="Identifiant d’URL"
          hint="Laisser vide pour le déduire du nom"
          error={state.errors?.slug}
        >
          {(props) => (
            <input
              {...props}
              name="slug"
              defaultValue={category?.slug ?? ''}
              placeholder="mobilier-de-jardin"
              autoComplete="off"
              className={`${props.className} font-mono`}
            />
          )}
        </Field>

        <Field label="Rayon parent" hint="Vide = rayon de premier niveau">
          {(props) => (
            <select {...props} name="parentId" defaultValue={category?.parentId ?? ''}>
              <option value="">Aucun</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {/* L'indentation rend la hiérarchie lisible dans une liste
                      déroulante, qui ne sait pas afficher d'arbre. */}
                  {' '.repeat(parent.depth * 2)}
                  {parent.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Position"
          hint="Ordre d’affichage, le plus petit d’abord"
          error={state.errors?.position}
        >
          {(props) => (
            <input
              {...props}
              name="position"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={category?.position ?? ''}
              placeholder="0"
            />
          )}
        </Field>

        <div className="space-y-3 sm:col-span-2">
          <Checkbox
            name="isActive"
            label="Visible dans la boutique"
            hint="Décochée, la catégorie et ses produits disparaissent du site sans être supprimés."
            defaultChecked={category?.isActive ?? true}
          />
          <Checkbox
            name="showInMenu"
            label="Afficher dans le menu de navigation"
            hint="Réservez-le aux rayons principaux : un menu à trente entrées ne se lit plus."
            defaultChecked={category?.showInMenu ?? creating}
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
