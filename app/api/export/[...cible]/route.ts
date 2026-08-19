import { csvMoney, csvNumber, csvResponse, stamped, toCsv } from '@/lib/csv';
import { getSession } from '@/lib/current-session';
import { ORDER_STATUSES, getOrderDetail, listOrders, listOrdersByLot, toStatusKey } from '@/lib/data/orders';
import { PRODUCT_STATUSES, listProducts, toProductStatus } from '@/lib/data/products';
import { getCustomer, listCustomers } from '@/lib/data/customers';
import { listStockLines, lotByNumber } from '@/lib/data/stock';

/**
 * Exports CSV du back-office.
 *
 * Une seule route attrape-tout plutôt qu'un fichier par jeu de données : la
 * mise en forme du CSV, l'en-tête de téléchargement et la nomenclature UTF-8
 * sont identiques partout, et les dupliquer six fois garantissait qu'une
 * copie finisse par diverger.
 *
 * Les exports de liste **respectent les filtres de l'écran**. Un bouton
 * « Exporter » qui renvoie toujours le catalogue entier alors qu'on regarde
 * les ruptures oblige à refaire le tri dans le tableur, donc à ne plus s'en
 * servir.
 *
 * L'export « clients » en masse se limite aux champs de la liste (nom,
 * courriel, activité) : l'adresse et les consentements exigeraient un aller-
 * retour par client, coûteux sur plusieurs milliers de lignes. L'export
 * « client » individuel — la portabilité RGPD — reste complet : une seule
 * personne, un seul aller-retour.
 */
export async function GET(request: Request, context: RouteContext<'/api/export/[...cible]'>) {
  const session = await getSession();
  // `redirect()` de next/navigation ne fonctionne que dans le rendu de page :
  // un handler de route doit renvoyer lui-même une réponse de redirection.
  if (!session) return Response.redirect(new URL('/connexion', request.url));

  const { cible } = await context.params;
  const url = new URL(request.url);
  const now = new Date();
  const [jeu, reference] = cible.map((segment) => decodeURIComponent(segment));

  switch (jeu) {
    case 'commandes': {
      const status = toStatusKey(url.searchParams.get('statut') ?? undefined);
      const query = url.searchParams.get('q') ?? undefined;

      const { orders } = await listOrders(session, { status, search: query });

      const rows = orders.map((order) => [
        order.number,
        order.placedAt,
        order.customer,
        order.email,
        order.currencyCode,
        ORDER_STATUSES[order.status].label,
        order.paymentLabel,
        order.shippingLabel,
        order.itemCount,
        csvMoney(order.subtotalCents),
        csvMoney(order.discountCents),
        csvMoney(order.taxCents),
        csvMoney(order.ecoTaxCents),
        csvMoney(order.shippingCents),
        csvMoney(order.totalCents),
        order.pricesIncludeTax ? 'TTC' : 'HT',
      ]);

      return csvResponse(
        stamped('commandes', now),
        toCsv(
          ['Numéro', 'Date', 'Client', 'Courriel', 'Devise', 'Statut', 'Paiement', 'Livraison', 'Lignes', 'Sous-total', 'Remises', 'Taxe', 'Éco-participation', 'Livraison (montant)', 'Total', 'Régime'],
          rows,
        ),
      );
    }

    case 'produits': {
      const status = toProductStatus(url.searchParams.get('etat') ?? undefined);
      const query = url.searchParams.get('q') ?? undefined;

      const { products } = await listProducts(session, { status, search: query });

      const rows = products.map((product) => [
        product.sku,
        product.name,
        product.category,
        PRODUCT_STATUSES[product.status].label,
        csvMoney(product.priceCents),
        csvMoney(product.ecoTaxCents),
        product.variantCount,
        csvNumber(product.onHand),
        product.unit,
      ]);

      return csvResponse(
        stamped('produits', now),
        toCsv(
          ['SKU', 'Nom', 'Catégorie', 'État', 'Prix', 'Éco-participation', 'Déclinaisons', 'En stock', 'Unité'],
          rows,
        ),
      );
    }

    case 'clients': {
      const { customers } = await listCustomers(session, {});

      const rows = customers.map((customer) => [
        customer.name,
        customer.email,
        customer.kind === 'account' ? 'Avec compte' : 'Sans compte',
        customer.orderCount,
        csvMoney(customer.spentCents),
        customer.lastOrderAt ?? '',
      ]);

      return csvResponse(
        stamped('clients', now),
        toCsv(['Nom', 'Courriel', 'Type', 'Commandes', 'Total dépensé', 'Dernière commande'], rows),
      );
    }

    case 'stock': {
      const rows = (await listStockLines(session, {})).map((line) => [
        line.sku,
        line.product,
        line.locationName,
        csvNumber(line.onHand),
        csvNumber(line.reserved),
        csvNumber(line.available),
        csvNumber(line.threshold),
        line.unit,
        line.openLots,
        { out: 'Rupture', low: 'Sous le seuil', ok: 'Suffisant' }[line.level],
      ]);

      return csvResponse(
        stamped('stock', now),
        toCsv(
          ['SKU', 'Produit', 'Entrepôt', 'Physique', 'Réservé', 'Disponible', 'Seuil', 'Unité', 'Lots ouverts', 'Niveau'],
          rows,
        ),
      );
    }

    case 'commande': {
      const detail = reference ? await getOrderDetail(session, reference) : null;
      if (!detail) return new Response('Commande introuvable', { status: 404 });

      const rows = detail.order.lines.map((line) => [
        detail.order.number,
        line.sku,
        line.label,
        csvNumber(line.quantity),
        csvMoney(line.unitPriceCents),
        csvMoney(line.discountCents),
        csvMoney(line.ecoTaxCents),
        csvMoney(line.totalCents),
        line.lotNumbers?.join(' ') ?? '',
      ]);

      return csvResponse(
        `commande-${detail.order.number}.csv`,
        toCsv(
          ['Commande', 'SKU', 'Article', 'Quantité', 'Prix unitaire', 'Remise', 'Éco-participation', 'Total ligne', 'Lots'],
          rows,
        ),
      );
    }

    case 'client': {
      /* Export des données d'une personne : c'est l'article 20 du RGPD, la
         portabilité. Le fichier doit donc contenir ce qui la concerne, pas un
         résumé commercial. */
      const customer = reference ? await getCustomer(session, reference) : null;
      if (!customer) return new Response('Client introuvable', { status: 404 });

      const rows: Array<Array<string | number>> = [
        ['Identité', 'Nom', customer.name],
        ['Identité', 'Courriel', customer.email],
        ['Identité', 'Type de compte', customer.kind === 'account' ? 'Avec compte' : 'Sans compte'],
        ...(customer.address
          ? [
              ['Adresse', 'Rue', customer.address.line1],
              ['Adresse', 'Code postal', customer.address.postalCode],
              ['Adresse', 'Ville', customer.address.city],
              ['Adresse', 'Pays', customer.address.countryCode],
            ]
          : []),
        ['Consentement', 'Lettre d’information', customer.consents.newsletter ? 'accordé' : 'refusé'],
        ['Consentement', 'Cookies marketing', customer.consents.marketingCookies ? 'accordé' : 'refusé'],
        ['Fidélité', 'Points accumulés', customer.loyaltyPoints],
        ...customer.orders.map((order) => [
          'Commande',
          order.number,
          `${order.placedAt} — ${ORDER_STATUSES[order.status].label} — ${csvMoney(order.totalCents)}`,
        ]),
      ];

      return csvResponse(
        `donnees-${customer.email.replace(/[^a-z0-9]+/gi, '-')}.csv`,
        toCsv(['Rubrique', 'Champ', 'Valeur'], rows),
      );
    }

    case 'lot': {
      const lot = reference ? await lotByNumber(session, reference) : null;
      if (!lot) return new Response('Lot introuvable', { status: 404 });

      /* Liste de rappel : les destinataires du lot, et rien d'autre. C'est le
         fichier qu'on ouvre le jour où un produit doit être retiré. */
      const affected = await listOrdersByLot(session, lot.lotNumber);

      const rows = affected.map((order) => [
        lot.lotNumber,
        lot.product,
        order.number,
        order.placedAt,
        order.customer,
        order.email,
        ORDER_STATUSES[order.status].label,
      ]);

      return csvResponse(
        `rappel-lot-${lot.lotNumber}.csv`,
        toCsv(['Lot', 'Produit', 'Commande', 'Date', 'Client', 'Courriel', 'Statut'], rows),
      );
    }

    default:
      return new Response('Jeu de données inconnu', { status: 404 });
  }
}
