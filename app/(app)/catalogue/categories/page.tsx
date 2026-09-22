import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderTree } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, EmptyState } from '@/components/ui/card';
import { Cell, Row, Table } from '@/components/ui/table';
import { number } from '@/lib/format';
import { listCategories } from '@/lib/data/catalog';
import { getSession } from '@/lib/current-session';
import { CategoryForm } from './category-form';
import { createCategory } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Catégories — Comptoir' };

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const categories = await listCategories(session);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Catégories"
        count={`${number(categories.length)} en tout`}
        description="Les rayons de la boutique. Un produit appartient à au moins une catégorie — c’est elle qui le place dans la navigation et dans les filtres de recherche."
      />

      <Card className="mb-6 min-w-0">
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="Aucune catégorie"
            description="Le catalogue est vide parce qu’il n’a pas encore de rayon. Créez-en un ci-dessous : la création d’un produit le réclame."
          />
        ) : (
          <Table
            caption="Catégories du catalogue, leur rang dans la hiérarchie et le nombre de produits qu’elles portent"
            minWidth="min-w-160"
            columns={[
              { label: 'Catégorie' },
              { label: 'Identifiant d’URL' },
              { label: 'Produits', align: 'right' },
              { label: 'Menu' },
              { label: 'État' },
            ]}
          >
            {categories.map((category) => (
              <Row key={category.id}>
                <Cell>
                  {/* L'indentation porte la hiérarchie. Le padding vient d'un
                      style en ligne et non d'une classe : la profondeur est une
                      donnée, et Tailwind ne génère pas de classe calculée. */}
                  <span
                    className="flex min-w-0 items-center"
                    style={{ paddingLeft: `${category.depth * 20}px` }}
                  >
                    {category.depth > 0 ? (
                      <span aria-hidden className="mr-2 text-ink-300">
                        └
                      </span>
                    ) : null}
                    <Link
                      href={`/catalogue/categories/${category.id}`}
                      className="truncate font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                    >
                      {category.name}
                    </Link>
                  </span>
                  {category.parentName ? (
                    <span className="sr-only">dans {category.parentName}</span>
                  ) : null}
                </Cell>
                <Cell className="font-mono text-xs text-ink-500">{category.slug || '—'}</Cell>
                <Cell align="right">
                  {/* Zéro produit n'est pas une anomalie sur une catégorie qu'on
                      vient de créer : un tiret plutôt qu'un chiffre évite de
                      suggérer un problème. */}
                  {category.productCount === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span data-numeric className="font-mono text-ink-600">
                      {number(category.productCount)}
                    </span>
                  )}
                </Cell>
                <Cell>
                  {category.showInMenu ? (
                    <Badge tone="info">Affichée</Badge>
                  ) : (
                    <span className="text-ink-400">Masquée</span>
                  )}
                </Cell>
                <Cell>
                  <Badge tone={category.isActive ? 'success' : 'neutral'}>
                    <Dot />
                    {category.isActive ? 'En ligne' : 'Hors ligne'}
                  </Badge>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>

      <CategoryForm action={createCategory} parents={categories} submitLabel="Créer la catégorie" />
    </div>
  );
}
