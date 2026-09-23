'use client';

import { useActionState, useState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { ImagePicker, type PickedImage } from '@/components/ui/image-picker';
import { StoredImages } from '@/components/ui/stored-images';
import { SubmitButton } from '@/components/ui/submit-button';
import { PRODUCT_STATUSES, type ProductDetail, type ProductImage } from '@/lib/data/products';
import { IDLE } from '@/lib/form';
import { updateProduct } from './actions';

export function EditForm({ product }: { product: ProductDetail }) {
  const [state, action] = useActionState(updateProduct, IDLE);
  const { field, formKey } = useFieldValues(
    {
      name: product.name,
      status: product.status,
      price: (product.priceCents / 100).toFixed(2),
      ecoTax: product.ecoTaxCents > 0 ? (product.ecoTaxCents / 100).toFixed(2) : '',
    },
    state,
  );
  /* Deux listes distinctes, et non une seule : les photos déjà enregistrées
     n'ont pas de fichier à envoyer, seulement un identifiant à conserver. Les
     mélanger obligerait à porter un `File` fictif pour les unes ou un
     identifiant vide pour les autres. */
  const [kept, setKept] = useState<ProductImage[]>(product.images);
  const [added, setAdded] = useState<PickedImage[]>([]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader
        backHref={`/produits/${encodeURIComponent(product.sku)}`}
        backLabel={product.name}
        title="Modifier le produit"
        subtitle={
          <span className="font-mono" translate="no">
            {product.sku}
          </span>
        }
      />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="variantId" value={product.defaultVariantId ?? ''} />
        <input type="hidden" name="slug" value={product.slug} />
        <input type="hidden" name="sku" value={product.sku} />
        <Card className="min-w-0">
          <CardHeader description="La référence (SKU) ne se modifie pas ici : elle est citée dans les commandes déjà passées, la changer casserait leur historique." title="Identification" />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="space-y-4 sm:col-span-2">
              <StoredImages name="keptMediaIds" images={kept} onChange={setKept} />

              <ImagePicker
                label={kept.length > 0 ? 'Ajouter des photos' : 'Photos'}
                name="images"
                error={state.errors?.images}
                hint="Les nouvelles photos s’ajoutent à la suite des précédentes."
                images={added}
                onChange={setAdded}
              />
            </div>

            <div className="sm:col-span-2">
              <Field label="Nom du produit" required error={state.errors?.name}>
                {(props) => (
                  <input {...props} {...field('name')} />
                )}
              </Field>
            </div>

            <Field label="État" required error={state.errors?.status}>
              {(props) => (
                <select {...props} {...field('status')}>
                  {(Object.keys(PRODUCT_STATUSES) as Array<keyof typeof PRODUCT_STATUSES>).map((key) => (
                    <option key={key} value={key}>
                      {PRODUCT_STATUSES[key].label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Prix"
            description="Modifier le prix n’altère jamais une commande passée : elle a figé le sien à l’achat."
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
                    className={`${props.className} pr-8`}
                  />
                  <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400">€</span>
                </div>
              )}
            </Field>

            <Field label="Éco-participation" error={state.errors?.ecoTax}>
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    {...field('ecoTax')}
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    className={`${props.className} pr-8`}
                  />
                  <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-400">€</span>
                </div>
              )}
            </Field>
          </div>
        </Card>

        <FormNotice state={state} />

        <div className="flex justify-end gap-2">
          <SubmitButton variant="primary">Enregistrer</SubmitButton>
        </div>
      </form>
    </div>
  );
}
