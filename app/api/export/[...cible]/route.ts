import { csvMoney, csvNumber, csvResponse, stamped, toCsv } from '@/lib/csv';
import {
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  customerByEmail,
  customers,
  lotByNumber,
  orderByNumber,
  orderTotals,
  orders,
  ordersOf,
  products,
  stockLevel,
  stockLines,
} from '@/lib/demo';

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
 */
export async function GET(request: Request, context: RouteContext<'/api/export/[...cible]'>) {
  const { cible } = await context.params;
  const url = new URL(request.url);
  const now = new Date();
  const [jeu, reference] = cible.map((segment) => decodeURIComponent(segment));

  switch (jeu) {
    case 'commandes': {
      const status = url.searchParams.get('statut');
      const query = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase('fr');
      const key = (Object.keys(ORDER_STATUSES) as Array<keyof typeof ORDER_STATUSES>).find(
        (candidate) => ORDER_STATUSES[candidate].slug === status,
      );

      const rows = orders(now)
        .filter((order) => (key ? order.status === key : true))
        .filter((order) =>
          query
            ? `${order.number} ${order.customer} ${order.email}`
                .toLocaleLowerCase('fr')
                .includes(query)
            : true,
        )
        .map((order) => {
          const totals = orderTotals(order);

          return [
            order.number,
            order.placedAt,
            order.customer,
            order.email,
            order.country,
            ORDER_STATUSES[order.status].label,
            order.payment,
            order.shipping,
            order.lines.length,
            csvMoney(totals.subtotalCents),
            csvMoney(totals.discountCents),
            csvMoney(totals.taxableCents),
            csvMoney(totals.taxCents),
            csvMoney(totals.shippingCents),
            csvMoney(totals.totalCents),
            /* Le régime d'affichage voyage avec la ligne : sans lui, un total
               canadien hors taxe s'additionne à un total français TTC dans le
               tableur, et la somme ne veut rien dire. */
            order.country === 'FR' ? 'TTC' : 'HT',
          ];
        });

      return csvResponse(
        stamped('commandes', now),
        toCsv(
          ['Numéro', 'Date', 'Client', 'Courriel', 'Pays', 'Statut', 'Paiement', 'Livraison', 'Lignes', 'Sous-total', 'Remises', 'Base taxable', 'Taxe', 'Livraison (montant)', 'Total', 'Régime'],
          rows,
        ),
      );
    }

    case 'produits': {
      const state = url.searchParams.get('etat');
      const query = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase('fr');
      const key = (Object.keys(PRODUCT_STATUSES) as Array<keyof typeof PRODUCT_STATUSES>).find(
        (candidate) => PRODUCT_STATUSES[candidate].slug === state,
      );

      const rows = products()
        .filter((product) => (key ? product.status === key : true))
        .filter((product) =>
          query
            ? `${product.name} ${product.sku} ${product.category}`
                .toLocaleLowerCase('fr')
                .includes(query)
            : true,
        )
        .map((product) => [
          product.sku,
          product.name,
          product.category,
          PRODUCT_STATUSES[product.status].label,
          csvMoney(product.priceCents),
          csvMoney(product.ecoTaxCents),
          product.variants,
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
      const rows = customers().map((customer) => [
        customer.name,
        customer.email,
        customer.country,
        customer.kind === 'account' ? 'Avec compte' : 'Sans compte',
        customer.orders,
        csvMoney(customer.spentCents),
        customer.address.line1,
        customer.address.postalCode,
        customer.address.city,
        customer.consents.newsletter ? 'oui' : 'non',
        customer.consents.profiling ? 'oui' : 'non',
        customer.loyaltyPoints,
      ]);

      return csvResponse(
        stamped('clients', now),
        toCsv(
          ['Nom', 'Courriel', 'Pays', 'Type', 'Commandes', 'Total dépensé', 'Adresse', 'Code postal', 'Ville', 'Lettre d’information', 'Personnalisation', 'Points'],
          rows,
        ),
      );
    }

    case 'stock': {
      const rows = stockLines().map((line) => [
        line.sku,
        line.product,
        line.variant,
        line.category,
        csvNumber(line.onHand),
        csvNumber(line.reserved),
        csvNumber(line.onHand - line.reserved),
        csvNumber(line.threshold),
        line.unit,
        line.lots,
        { out: 'Rupture', low: 'Sous le seuil', ok: 'Suffisant' }[stockLevel(line)],
      ]);

      return csvResponse(
        stamped('stock', now),
        toCsv(
          ['SKU', 'Produit', 'Déclinaison', 'Catégorie', 'Physique', 'Réservé', 'Disponible', 'Seuil', 'Unité', 'Lots ouverts', 'Niveau'],
          rows,
        ),
      );
    }

    case 'commande': {
      const order = reference ? orderByNumber(reference, now) : undefined;
      if (!order) return new Response('Commande introuvable', { status: 404 });

      const rows = order.lines.map((line) => [
        order.number,
        line.sku,
        line.label,
        csvNumber(line.quantity),
        line.unit,
        csvMoney(line.unitPriceCents),
        csvNumber(line.taxRate),
        csvMoney(line.discountCents),
        csvMoney(Math.round(line.ecoTaxCents * line.quantity)),
        csvMoney(Math.round(line.unitPriceCents * line.quantity) - line.discountCents),
        line.lotNumbers?.join(' ') ?? '',
      ]);

      return csvResponse(
        `commande-${order.number}.csv`,
        toCsv(
          ['Commande', 'SKU', 'Article', 'Quantité', 'Unité', 'Prix unitaire', 'Taux de taxe', 'Remise', 'Éco-participation', 'Total ligne', 'Lots'],
          rows,
        ),
      );
    }

    case 'client': {
      /* Export des données d'une personne : c'est l'article 20 du RGPD, la
         portabilité. Le fichier doit donc contenir ce qui la concerne, pas un
         résumé commercial. */
      const customer = reference ? customerByEmail(reference) : undefined;
      if (!customer) return new Response('Client introuvable', { status: 404 });

      const history = ordersOf(customer.email, now);

      const rows: Array<Array<string | number>> = [
        ['Identité', 'Nom', customer.name],
        ['Identité', 'Courriel', customer.email],
        ['Identité', 'Type de compte', customer.kind === 'account' ? 'Avec compte' : 'Sans compte'],
        ['Adresse', 'Rue', customer.address.line1],
        ['Adresse', 'Code postal', customer.address.postalCode],
        ['Adresse', 'Ville', customer.address.city],
        ['Adresse', 'Pays', customer.address.country],
        ['Consentement', 'Lettre d’information', customer.consents.newsletter ? 'accordé' : 'refusé'],
        ['Consentement', 'Personnalisation des offres', customer.consents.profiling ? 'accordé' : 'refusé'],
        ['Fidélité', 'Points accumulés', customer.loyaltyPoints],
        ...history.map((order) => [
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
      const lot = reference ? lotByNumber(reference, now) : undefined;
      if (!lot) return new Response('Lot introuvable', { status: 404 });

      /* Liste de rappel : les destinataires du lot, et rien d'autre. C'est le
         fichier qu'on ouvre le jour où un produit doit être retiré. */
      const rows = orders(now)
        .filter((order) => order.lines.some((line) => line.lotNumbers?.includes(lot.lotNumber)))
        .map((order) => [
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
