'use client';

import { useActionState, useMemo } from 'react';
import { DetailHeader } from '@/components/layout/detail-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, textareaClass, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { number } from '@/lib/format';
import { IDLE } from '@/lib/form';
import { createOrder } from './actions';

const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'CA', label: 'Canada' },
];

export function OrderForm({
  customers,
  products,
}: {
  customers: Array<{ name: string; email: string }>;
  products: Array<{ sku: string; label: string; available: number; unit: string }>;
}) {
  const [state, action] = useActionState(createOrder, IDLE);
  const { field, formKey } = useFieldValues({ quantity: '1', countryCode: 'FR' }, state);

  // Stable tant que le formulaire n'a pas été remonté (nouvel envoi après
  // succès) : un double-clic sur « Créer » rejoue la même clé et ne crée pas
  // deux commandes, l'API rejouant la première réponse. `formKey` sert de
  // déclencheur volontaire, pas d'une valeur lue dans le calcul.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [formKey]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader backHref="/commandes" backLabel="Commandes" title="Nouvelle commande" />

      <form key={formKey} action={action} className="space-y-6" noValidate>
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

        <Card className="min-w-0">
          <CardHeader
            title="Client"
            description="Une vente prise par téléphone ou au comptoir suit ensuite le même circuit qu'une commande en ligne : prix figé, stock réservé, numéro de commande définitif."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
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

            <Field label="Prénom" required error={state.errors?.firstName}>
              {(props) => <input {...props} {...field('firstName')} />}
            </Field>
            <Field label="Nom" required error={state.errors?.lastName}>
              {(props) => <input {...props} {...field('lastName')} />}
            </Field>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Adresse de livraison"
            description="Elle fixe le régime de taxe — TTC en France, hors taxe au Canada — et le mode de livraison, choisi automatiquement parmi ceux éligibles."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Adresse" required error={state.errors?.line1}>
                {(props) => <input {...props} {...field('line1')} placeholder="14 rue des Petites-Écuries" />}
              </Field>
            </div>
            <Field label="Code postal" required error={state.errors?.postalCode}>
              {(props) => <input {...props} {...field('postalCode')} inputMode="numeric" />}
            </Field>
            <Field label="Ville" required error={state.errors?.city}>
              {(props) => <input {...props} {...field('city')} />}
            </Field>
            <Field label="Pays" required error={state.errors?.countryCode}>
              {(props) => (
                <select {...props} {...field('countryCode')}>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title="Article"
            description="Une ligne pour commencer ; les suivantes s’ajoutent depuis la fiche une fois la commande créée."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Référence" required error={state.errors?.sku}>
              {(props) => (
                <select {...props} {...field('sku')}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {products.map((product) => (
                    <option key={product.sku} value={product.sku} disabled={product.available <= 0}>
                      {product.label}
                      {product.available <= 0
                        ? ' — rupture'
                        : ` — ${number(product.available)} ${product.unit} disponibles`}
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
              <Field label="Note" hint="Facultatif — visible sur la fiche commande, pas sur la facture">
                {(props) => <textarea {...props} {...field('customerNote')} rows={3} className={textareaClass} />}
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
