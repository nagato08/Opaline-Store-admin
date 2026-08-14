import Link from 'next/link';
import { Download, Package, PackageSearch } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { SearchField } from '@/components/ui/search-field';
import { Cell, NumCell, Row, Table } from '@/components/ui/table';
import { money, number } from '@/lib/format';
import { PRODUCT_STATUSES, products, toProductStatus } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Produits — Comptoir' };

export default async function ProductsPage({ searchParams }: PageProps<'/produits'>) {
  const params = await searchParams;
  const status = toProductStatus(params.etat);
  const query = typeof params.q === 'string' ? params.q.trim() : '';

  const all = products();
  const filtered = all
    .filter((product) => (status ? product.status === status : true))
    .filter((product) =>
      query
        ? `${product.name} ${product.sku} ${product.category}`
            .toLocaleLowerCase('fr')
            .includes(query.toLocaleLowerCase('fr'))
        : true,
    );

  /* Le filtre courant part avec l'export, sous sa forme validée : la valeur
     brute de l'URL exporterait tout en prétendant filtrer. */
  const exportParams = new URLSearchParams();
  if (status) exportParams.set('etat', PRODUCT_STATUSES[status].slug);
  if (query) exportParams.set('q', query);
  const exportQuery = exportParams.size > 0 ? `?${exportParams}` : '';

  const tabs = [
    { label: 'Tous', count: all.length },
    ...(Object.keys(PRODUCT_STATUSES) as Array<keyof typeof PRODUCT_STATUSES>).map((key) => ({
      value: PRODUCT_STATUSES[key].slug,
      label: PRODUCT_STATUSES[key].label,
      count: all.filter((product) => product.status === key).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Produits"
        count={`${number(filtered.length)} affichés`}
        description="Le catalogue et ses variantes. Les prix sont hors éco-participation, qui reste affichée à part comme la loi l’impose sur le mobilier et l’électronique."
        action={
          <>
            <LinkButton href={`/api/export/produits${exportQuery}`} size="sm">
              <Download aria-hidden className="size-4" />
              Exporter
            </LinkButton>
            <LinkButton href="/produits/nouveau" variant="primary" size="sm" className="whitespace-nowrap">
              Nouveau produit
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={tabs}
          current={status && PRODUCT_STATUSES[status].slug}
          param="etat"
          basePath="/produits"
        />
        <SearchField
          action="/produits"
          defaultValue={query}
          label="Rechercher un produit par nom, référence ou catégorie"
          placeholder="Nom, SKU, catégorie…"
        />
      </div>

      <Card className="min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Aucun produit ne correspond"
            description="Rien ne répond à ce filtre. Élargissez la recherche ou repartez du catalogue complet."
            action={<LinkButton href="/produits">Voir tout le catalogue</LinkButton>}
          />
        ) : (
          <Table
            caption="Produits du catalogue, avec leur prix, leur stock et leur état de publication"
            minWidth="min-w-220"
            columns={[
              { label: 'Produit' },
              { label: 'Catégorie' },
              { label: 'État' },
              { label: 'Variantes', align: 'right' },
              { label: 'Stock', align: 'right' },
              { label: 'Éco-part.', align: 'right' },
              { label: 'Prix', align: 'right' },
            ]}
          >
            {filtered.map((product) => (
              <Row key={product.sku}>
                <Cell>
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      // Cohérent avec le reste du back-office, qui n'utilise
                      // `next/image` nulle part : une vignette de 40 px n'a
                      // rien à gagner à l'optimisation, et le domaine change
                      // encore (Unsplash de démonstration, Cloudinary ensuite).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="size-10 shrink-0 rounded-control object-cover ring-1 ring-ink-200 ring-inset"
                      />
                    ) : (
                      // Un carré neutre plutôt qu'un vide : sans lui, la colonne
                      // photo saute d'une ligne à l'autre et casse l'alignement.
                      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-ink-100 ring-1 ring-ink-200 ring-inset">
                        <Package aria-hidden className="size-4 text-ink-400" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/produits/${product.sku}`}
                        className="font-medium text-ink-900 hover:text-cobalt-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                      <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                        {product.sku}
                      </span>
                    </div>
                  </div>
                </Cell>
                <Cell className="whitespace-nowrap text-ink-600">{product.category}</Cell>
                <Cell>
                  <Badge tone={PRODUCT_STATUSES[product.status].tone}>
                    <Dot />
                    {PRODUCT_STATUSES[product.status].label}
                  </Badge>
                </Cell>
                <Cell align="right">
                  <span data-numeric className="font-mono text-ink-600">
                    {number(product.variants)}
                  </span>
                </Cell>
                <Cell align="right">
                  {/* La rupture n'est une alerte que si le produit est en vente.
                      Sur un brouillon ou un archivé, un stock à zéro est normal
                      et le signaler en rouge crée une fausse urgence. */}
                  {product.onHand === 0 && product.status === 'published' ? (
                    <Badge tone="danger">
                      <Dot />
                      Rupture
                    </Badge>
                  ) : product.onHand === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span className="whitespace-nowrap">
                      <span data-numeric className="font-mono text-ink-900">
                        {number(product.onHand)}
                      </span>{' '}
                      <span className="text-ink-500">{product.unit}</span>
                    </span>
                  )}
                </Cell>
                <Cell align="right">
                  {/* Un tiret plutôt qu'un zéro : l'alimentaire n'est pas soumis
                      à l'éco-participation, ce n'est pas un montant nul. */}
                  {product.ecoTaxCents === 0 ? (
                    <span className="text-ink-300">—</span>
                  ) : (
                    <span data-numeric className="font-mono text-ink-600">
                      {money(product.ecoTaxCents)}
                    </span>
                  )}
                </Cell>
                <NumCell>{money(product.priceCents)}</NumCell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
