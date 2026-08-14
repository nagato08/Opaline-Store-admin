/**
 * Données de démonstration du back-office.
 *
 * C'est le **seul** endroit de l'application qui invente des chiffres. Les
 * composants ne reçoivent que des props : le jour où l'API répond, il n'y a
 * que ce dossier à remplacer.
 *
 * Correspondances prévues :
 *
 * | Fonction                        | Route                                    | État    |
 * |---------------------------------|------------------------------------------|---------|
 * | `revenueSeries`, `topProducts`  | `GET /admin/dashboard`                   | à créer |
 * | `ordersByStatus`                | `GET /admin/dashboard`                   | à créer |
 * | `orders`, `latestOrders`        | `GET /admin/orders`                      | existe  |
 * | `products`                      | `GET /admin/catalog/products`            | existe  |
 * | `stockLines`                    | `GET /admin/inventory`                   | à créer |
 * | `expiringLots`                  | `GET /admin/inventory/expiring?days=7`   | existe  |
 * | `customers`                     | `GET /admin/customers`                   | à créer |
 * | `promotions`                    | `GET /admin/promotions`                  | existe  |
 * | `campaigns`                     | `GET /admin/campaigns`                   | existe  |
 *
 * Tout ce qui porte une date prend l'instant courant en argument : une liste
 * figée sur un jour passé se remarque immédiatement et discrédite l'écran.
 * Les montants sont des **centimes entiers**, comme ceux de l'API.
 */

export * from './periods';
export * from './orders';
export * from './catalog';
export * from './customers';
export * from './marketing';
export * from './stats';
export * from './notifications';
