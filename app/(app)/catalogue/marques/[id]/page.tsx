import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { number } from '@/lib/format';
import { getBrand } from '@/lib/data/catalog';
import { getSession } from '@/lib/current-session';
import { BrandForm } from '../brand-form';
import { deleteBrand, updateBrand } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Marque — Comptoir' };

export default async function BrandPage({ params }: PageProps<'/catalogue/marques/[id]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { id } = await params;
  const brand = await getBrand(session, id);
  if (!brand) notFound();

  const blocked = brand.productCount > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader
        backHref="/catalogue/marques"
        backLabel="Marques"
        title={brand.name}
        badge={
          brand.productCount > 0 ? (
            <Badge tone="neutral">{number(brand.productCount)} produits</Badge>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <BrandForm action={updateBrand.bind(null, brand.id)} brand={brand} submitLabel="Enregistrer" />

        <Card className="min-w-0">
          <CardHeader
            title="Supprimer"
            description={
              blocked
                ? 'Des produits portent cette marque. Retirez-la de leurs fiches avant de pouvoir la supprimer.'
                : 'La suppression est définitive. Pour la retirer des filtres de la boutique sans la perdre, décochez « Marque active » ci-dessus.'
            }
          />
          <div className="p-5 pt-0">
            <DeleteButton
              action={deleteBrand.bind(null, brand.id)}
              label="Supprimer la marque"
              confirmation={`Supprimer « ${brand.name} » définitivement ?`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
