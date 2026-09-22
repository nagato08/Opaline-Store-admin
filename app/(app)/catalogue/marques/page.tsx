import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Tags } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { Cell, Row, Table } from '@/components/ui/table';
import { number } from '@/lib/format';
import { listBrands } from '@/lib/data/catalog';
import { getSession } from '@/lib/current-session';
import { BrandForm } from './brand-form';
import { createBrand } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Marques — Comptoir' };

export default async function BrandsPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const brands = await listBrands(session);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Marques"
        count={`${number(brands.length)} en tout`}
        description="Les fabricants du catalogue. Contrairement à la catégorie, la marque est facultative sur un produit."
      />

      <Card className="mb-6 min-w-0">
        {brands.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Aucune marque"
            description="Rien à déclarer pour l’instant. Ajoutez-en une ci-dessous si vos produits en portent une — l’alimentaire en vrac, par exemple, n’en a pas besoin."
          />
        ) : (
          <Table
            caption="Marques du catalogue et nombre de produits rattachés à chacune"
            minWidth="min-w-160"
            columns={[
              { label: 'Marque' },
              { label: 'Identifiant d’URL' },
              { label: 'Site' },
              { label: 'Produits', align: 'right' },
              { label: 'État' },
            ]}
          >
            {brands.map((brand) => (
              <Row key={brand.id}>
                <Cell>
                  <Link
                    href={`/catalogue/marques/${brand.id}`}
                    className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                  >
                    {brand.name}
                  </Link>
                </Cell>
                <Cell className="font-mono text-xs text-ink-500">{brand.slug || '—'}</Cell>
                <Cell>
                  {brand.website ? (
                    // `rel="noreferrer"` en plus de `noopener` : le site d'un
                    // fabricant n'a pas à connaître l'URL du back-office.
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cobalt-600 hover:underline"
                    >
                      {brand.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </Cell>
                <Cell align="right">
                  {brand.productCount === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span data-numeric className="font-mono text-ink-600">
                      {number(brand.productCount)}
                    </span>
                  )}
                </Cell>
                <Cell>
                  <Badge tone={brand.isActive ? 'success' : 'neutral'}>
                    <Dot />
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <BrandForm action={createBrand} submitLabel="Créer la marque" />
    </div>
  );
}
