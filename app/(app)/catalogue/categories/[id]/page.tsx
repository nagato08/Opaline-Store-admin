import { notFound, redirect } from 'next/navigation';
import { DetailHeader } from '@/components/layout/detail-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { number } from '@/lib/format';
import { getCategory, listCategories } from '@/lib/data/catalog';
import { getSession } from '@/lib/current-session';
import { CategoryForm } from '../category-form';
import { deleteCategory, updateCategory } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Catégorie — Comptoir' };

export default async function CategoryPage({ params }: PageProps<'/catalogue/categories/[id]'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { id } = await params;
  const [category, all] = await Promise.all([getCategory(session, id), listCategories(session)]);
  if (!category) notFound();

  /* Une catégorie ne peut être ni son propre parent, ni le parent de son
     ancêtre : la boucle rendrait l'arbre infini et la navigation de la
     boutique ne terminerait jamais. On écarte donc la catégorie elle-même et
     toute sa descendance. */
  const descendants = new Set<string>([category.id]);
  for (const row of all) {
    if (row.parentId && descendants.has(row.parentId)) descendants.add(row.id);
  }
  const parents = all.filter((row) => !descendants.has(row.id));

  const blocked = category.productCount > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <DetailHeader
        backHref="/catalogue/categories"
        backLabel="Catégories"
        title={category.name}
        subtitle={
          category.parentName
            ? `Sous-rayon de ${category.parentName}`
            : 'Rayon de premier niveau'
        }
        badge={
          category.productCount > 0 ? (
            <Badge tone="neutral">{number(category.productCount)} produits</Badge>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <CategoryForm
          action={updateCategory.bind(null, category.id)}
          parents={parents}
          category={category}
          submitLabel="Enregistrer"
        />

        <Card className="min-w-0">
          <CardHeader
            title="Supprimer"
            description={
              blocked
                ? 'Des produits sont rattachés à cette catégorie. Déplacez-les avant de pouvoir la supprimer — l’API refusera l’opération tant qu’ils y sont.'
                : 'La suppression est définitive. Pour retirer la catégorie de la boutique sans la perdre, décochez « Visible dans la boutique » ci-dessus.'
            }
          />
          <div className="p-5 pt-0">
            <DeleteButton
              action={deleteCategory.bind(null, category.id)}
              label="Supprimer la catégorie"
              confirmation={`Supprimer « ${category.name} » définitivement ?`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
