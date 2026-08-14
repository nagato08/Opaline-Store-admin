'use client';

import { useActionState } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { createOrder } from './actions';

const SHIPPING_MODES = [
  'Point relais',
  'Domicile 48 h',
  'Transporteur Québec',
  'Chaîne du froid',
  'Hors gabarit sur rendez-vous',
];

export function OrderForm({
  customers,
  products,
}: {
  customers: Array<{ name: string; email: string }>;
  products: Array<{ name: string; sku: string }>;
}) {
  const [state, action] = useActionState(createOrder, IDLE);
  const { field, formKey } = useFieldValues({ quantity: '1' }, state);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/commandes" backLabel="Commandes" title="Nouvelle commande" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <Card className="min-w-0">
          <CardHeader
            title="Client"
            description="Une vente prise par téléphone ou au comptoir suit ensuite le même circuit qu'une commande en ligne."
          />
          <div className="p-5">
            <Field
              label="Courriel du client"
              required
              hint="Un client existant est reconnu automatiquement ; sinon la commande est passée comme invité."
              error={state.errors?.email}
            >
              {(props) => (
                <>
                  <input
                    {...props}
                    {...field('email')}
                    type="email"
                    list="clients-connus"
                    placeholder="camille.berger@example.fr"
                  />
                  <datalist id="clients-connus">
                    {customers.map((customer) => (
                      <option key={customer.email} value={customer.email}>
                        {customer.name}
                      </option>
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Article" description="Une ligne pour commencer ; les suivantes s’ajoutent depuis la fiche une fois la commande créée." />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Produit" required error={state.errors?.sku}>
              {(props) => (
                <select {...props} {...field('sku')}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {products.map((product) => (
                    <option key={product.sku} value={product.sku}>
                      {product.name} — {product.sku}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Quantité" required error={state.errors?.quantity}>
              {(props) => (
                <input
                  {...props}
                  {...field('quantity')}
                  type="number"
                  step="0.001"
                  min="0"
                  inputMode="decimal"
                />
              )}
            </Field>

            <div className="sm:col-span-2">
              <Field label="Mode de livraison" required error={state.errors?.shipping}>
                {(props) => (
                  <select {...props} {...field('shipping')}>
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {SHIPPING_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </div>
        </Card>

        <FormNotice state={state} />

        <div className="flex justify-end gap-2">
          <SubmitButton variant="primary">Créer la commande</SubmitButton>
        </div>
      </form>
    </div>
  );
}
