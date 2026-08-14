'use client';

import { useActionState, useState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, textareaClass, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { ImagePicker, type PickedImage } from '@/components/ui/image-picker';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { createProduct } from './actions';

const CATEGORIES = ['Mobilier', 'Électronique', 'Alimentaire'];

export default function NewProductPage() {
  const [state, action] = useActionState(createProduct, IDLE);
  const { field, formKey } = useFieldValues({}, state);
  // Hors du formulaire remonté par `formKey` : les images choisies doivent
  // survivre à un refus de validation, comme le reste de la saisie.
  const [images, setImages] = useState<PickedImage[]>([]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/produits" backLabel="Produits" title="Nouveau produit" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <Card className="min-w-0">
          <CardHeader title="Identification" />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <ImagePicker
              label="Photos"
              hint="La première devient la couverture — c'est elle qui illustre le catalogue et la recherche."
              images={images}
              onChange={setImages}
            />

            <div className="sm:col-span-2">
              <Field label="Nom du produit" required error={state.errors?.name}>
                {(props) => (
                  <input {...props} {...field('name')} placeholder="Canapé Oslo" />
                )}
              </Field>
            </div>

            <Field
              label="Référence (SKU)"
              required
              hint="Majuscules, chiffres et tirets uniquement"
              error={state.errors?.sku}
            >
              {(props) => (
                <input
                  {...props}
                  {...field('sku')}
                  placeholder="MOB-OSL-3P-GRI"
                  className={`${props.className} font-mono uppercase`}
                />
              )}
            </Field>

            <Field label="Catégorie" required error={state.errors?.category}>
              {(props) => (
                <select {...props} {...field('category')}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <div className="sm:col-span-2">
              <Field label="Description">
                {(props) => (
                  <textarea {...props} {...field('description')} rows={4} className={textareaClass} />
                )}
              </Field>
            </div>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Prix"
            description="Hors éco-participation, qui reste affichée à part comme la loi l’impose sur le mobilier et l’électronique."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Prix de base" required error={state.errors?.price}>
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    {...field('price')}
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={`${props.className} pr-8`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400"
                  >
                    €
                  </span>
                </div>
              )}
            </Field>

            <Field
              label="Éco-participation"
              hint="Laisser vide si le produit n’y est pas soumis"
              error={state.errors?.ecoTax}
            >
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    {...field('ecoTax')}
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={`${props.className} pr-8`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400"
                  >
                    €
                  </span>
                </div>
              )}
            </Field>
          </div>
        </Card>

        <FormNotice state={state} />

        <div className="flex justify-end gap-2">
          <SubmitButton variant="primary">Créer le produit</SubmitButton>
        </div>
      </form>
    </div>
  );
}
