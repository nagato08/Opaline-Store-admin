'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, textareaClass } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';
import { PUBLISH_STATUSES, type PageRow, type PublishStatus } from '@/lib/data/content';

type Action = (previous: FormState, data: FormData) => Promise<FormState>;

/** États proposés. `SCHEDULED` en est absent : rien ne collecte encore de date
 *  de publication, et un « Programmé » sans échéance ne se déclenche jamais. */
const OFFERED: PublishStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/**
 * Formulaire d'une page éditoriale, partagé création et modification.
 *
 * Le corps est du texte brut, pas un éditeur riche : la boutique ne rend que
 * deux formes de blocs — paragraphe et titre. Offrir gras, listes et tableaux
 * produirait du contenu qui ne s'afficherait nulle part.
 */
export function PageForm({
  action,
  page,
  submitLabel,
}: {
  action: Action;
  page?: PageRow;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const creating = page === undefined;

  return (
    <Card className="min-w-0">
      <CardHeader
        title={creating ? 'Nouvelle page' : 'Modifier la page'}
        description={
          creating
            ? 'Les pages fixes de la boutique : mentions légales, conditions de vente, livraison, retours.'
            : undefined
        }
      />

      <form action={formAction} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
        <Field
          label="Code"
          required
          hint={creating ? 'Cité en dur par la boutique : à ne plus changer ensuite' : 'Ne le changez pas si la boutique y renvoie déjà'}
          error={state.errors?.code}
        >
          {(props) => (
            <input
              {...props}
              name="code"
              defaultValue={page?.code ?? ''}
              placeholder="mentions-legales"
              autoComplete="off"
              className={`${props.className} font-mono`}
            />
          )}
        </Field>

        <Field label="État" required error={state.errors?.status}>
          {(props) => (
            <select {...props} name="status" defaultValue={page?.status ?? 'DRAFT'}>
              {OFFERED.map((status) => (
                <option key={status} value={status}>
                  {PUBLISH_STATUSES[status].label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field label="Titre" required error={state.errors?.title}>
            {(props) => (
              <input
                {...props}
                name="title"
                defaultValue={page?.title ?? ''}
                placeholder="Conditions générales de vente"
              />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Identifiant d’URL"
            hint="Laisser vide pour le déduire du titre"
            error={state.errors?.slug}
          >
            {(props) => (
              <input
                {...props}
                name="slug"
                defaultValue={page?.slug ?? ''}
                placeholder="conditions-generales-de-vente"
                autoComplete="off"
                className={`${props.className} font-mono`}
              />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Résumé" hint="Une phrase, affichée dans les listes et les partages">
            {(props) => (
              <input {...props} name="excerpt" defaultValue={page?.excerpt ?? ''} />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Contenu"
            required
            hint="Une ligne vide sépare deux paragraphes. Une ligne commençant par ## devient un titre."
            error={state.errors?.body}
          >
            {(props) => (
              <textarea
                {...props}
                name="body"
                defaultValue={page?.body ?? ''}
                rows={14}
                className={`${textareaClass} font-mono text-[13px]`}
              />
            )}
          </Field>
        </div>

        <div className="border-t border-ink-200/70 pt-5 sm:col-span-2">
          <h3 className="text-base font-semibold text-ink-900">Référencement</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            Ce qui s’affiche dans les résultats de recherche. Laissés vides, le titre et le résumé
            font l’affaire.
          </p>
        </div>

        <Field label="Titre pour les moteurs" hint="70 caractères au maximum">
          {(props) => <input {...props} name="seoTitle" defaultValue={page?.seoTitle ?? ''} />}
        </Field>

        <Field
          label="Description pour les moteurs"
          hint="160 caractères au maximum"
          error={state.errors?.seoDescription}
        >
          {(props) => (
            <input {...props} name="seoDescription" defaultValue={page?.seoDescription ?? ''} />
          )}
        </Field>

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
