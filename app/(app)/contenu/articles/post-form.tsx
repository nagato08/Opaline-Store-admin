'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, textareaClass } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE, type FormState } from '@/lib/form';
import { PUBLISH_STATUSES, type PostRow, type PublishStatus } from '@/lib/data/content';

type Action = (previous: FormState, data: FormData) => Promise<FormState>;

const OFFERED: PublishStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/**
 * Formulaire d'un article de blog, partagé création et modification.
 *
 * Même parti pris que pour les pages : le corps est du texte brut converti en
 * blocs `text` et `heading`, les deux seules formes que la boutique affiche.
 */
export function PostForm({
  action,
  post,
  submitLabel,
}: {
  action: Action;
  post?: PostRow;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const creating = post === undefined;

  return (
    <Card className="min-w-0">
      <CardHeader
        title={creating ? 'Nouvel article' : 'Modifier l’article'}
        description={
          creating
            ? 'Le blog de la boutique. Passer un article « En ligne » le publie immédiatement.'
            : undefined
        }
      />

      <form action={formAction} className="grid gap-5 p-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Field label="Titre" required error={state.errors?.title}>
            {(props) => (
              <input
                {...props}
                name="title"
                defaultValue={post?.title ?? ''}
                placeholder="Bien choisir son canapé"
              />
            )}
          </Field>
        </div>

        <Field label="État" required error={state.errors?.status}>
          {(props) => (
            <select {...props} name="status" defaultValue={post?.status ?? 'DRAFT'}>
              {OFFERED.map((status) => (
                <option key={status} value={status}>
                  {PUBLISH_STATUSES[status].label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Auteur" hint="Affiché sous le titre de l’article">
          {(props) => (
            <input {...props} name="authorName" defaultValue={post?.authorName ?? ''} />
          )}
        </Field>

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
                defaultValue={post?.slug ?? ''}
                autoComplete="off"
                className={`${props.className} font-mono`}
              />
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Chapô" hint="Deux phrases, affichées dans la liste du blog et les partages">
            {(props) => <input {...props} name="excerpt" defaultValue={post?.excerpt ?? ''} />}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Étiquettes" hint="Séparées par des virgules">
            {(props) => (
              <input
                {...props}
                name="tags"
                defaultValue={post?.tags.join(', ') ?? ''}
                placeholder="mobilier, conseils"
              />
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
                defaultValue={post?.body ?? ''}
                rows={14}
                className={`${textareaClass} font-mono text-[13px]`}
              />
            )}
          </Field>
        </div>

        <div className="border-t border-ink-200/70 pt-5 sm:col-span-2">
          <h3 className="text-base font-semibold text-ink-900">Référencement</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            Ce qui s’affiche dans les résultats de recherche. Laissés vides, le titre et le chapô
            font l’affaire.
          </p>
        </div>

        <Field label="Titre pour les moteurs" hint="70 caractères au maximum">
          {(props) => <input {...props} name="seoTitle" defaultValue={post?.seoTitle ?? ''} />}
        </Field>

        <Field
          label="Description pour les moteurs"
          hint="160 caractères au maximum"
          error={state.errors?.seoDescription}
        >
          {(props) => (
            <input {...props} name="seoDescription" defaultValue={post?.seoDescription ?? ''} />
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
