import { money, number, share } from '@/lib/format';
import type { TopProduct } from '@/lib/demo';

/**
 * Meilleures ventes.
 *
 * Une magnitude d'une seule mesure : les barres portent donc **une seule
 * teinte**. Une couleur par ligne ferait croire à cinq catégories alors qu'il
 * n'y a qu'un classement.
 *
 * La barre est un `<table>` et non un graphique : la valeur chiffrée reste
 * lisible ligne à ligne, ce qui est la seule chose qu'on vient vraiment
 * chercher ici. La barre n'ajoute que le rapport de force entre les lignes.
 */
export function TopProducts({
  products,
  totalCents,
}: {
  products: TopProduct[];
  /** Chiffre d'affaires de la période entière — la part se calcule dessus, et
   *  non sur la somme des cinq lignes, qui donnerait toujours 100 %. */
  totalCents: number;
}) {
  const leader = Math.max(...products.map((product) => product.revenueCents));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-140 text-sm">
        <caption className="sr-only">
          Cinq produits les plus vendus sur la période, du plus fort chiffre d’affaires au
          plus faible
        </caption>
        <thead>
          <tr className="border-b border-ink-200/70 text-left">
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Produit
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium text-ink-500">
              Vendu
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-ink-500">
              Part du chiffre d’affaires
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium text-ink-500">
              Chiffre d’affaires
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200/70">
          {products.map((product) => (
            <tr key={product.sku} className="transition-colors duration-150 hover:bg-ink-50">
              <td className="px-5 py-3.5">
                <span className="block font-medium text-ink-900">{product.name}</span>
                <span className="mt-0.5 block font-mono text-xs text-ink-500" translate="no">
                  {product.sku}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-ink-600">
                <span data-numeric>{number(product.quantity)}</span>{' '}
                <span className="text-ink-500">{product.unit}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-2.5">
                  {/* Le fond de piste va jusqu'au leader, pas jusqu'au total :
                      on compare les produits entre eux, pas au catalogue. */}
                  <span aria-hidden className="h-1.5 w-full max-w-32 min-w-16 rounded-full bg-ink-100">
                    <span
                      className="block h-full rounded-full bg-cobalt-500"
                      style={{ width: `${(product.revenueCents / leader) * 100}%` }}
                    />
                  </span>
                  <span data-numeric className="w-9 shrink-0 text-right text-xs text-ink-500">
                    {share(product.revenueCents / totalCents)}
                  </span>
                </span>
              </td>
              <td className="px-5 py-3.5 text-right font-mono font-medium whitespace-nowrap text-ink-900">
                {money(product.revenueCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
