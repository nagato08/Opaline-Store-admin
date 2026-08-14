import { expiringLots, outOfStock } from './catalog';
import { orders } from './orders';
import type { BadgeTone } from '@/components/ui/badge';

export type Notification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: Exclude<BadgeTone, 'brand'>;
  /** Une notification lue reste affichée : elle documente ce qui vient de se passer. */
  read: boolean;
};

/**
 * Notifications du back-office.
 *
 * Elles ne sont pas saisies à la main : chacune se **déduit** de l'état réel
 * de la boutique — rupture, lot qui périme, commande en attente de
 * préparation. Une file de notifications alimentée séparément se désynchronise
 * du stock au premier écart, et on finit par ne plus la croire.
 *
 * L'ordre est celui de l'urgence commerciale, pas celui de l'horodatage : une
 * rupture sur un produit en ligne coûte une vente maintenant, un lot qui
 * périme dans six jours peut attendre demain.
 */
export function notifications(now: Date): Notification[] {
  const ruptures = outOfStock();
  const lots = expiringLots(now);
  const toPrepare = orders(now).filter((order) => order.status === 'to-prepare');
  const soon = lots.filter((lot) => Date.parse(lot.expiresAt) - now.getTime() < 3 * 86_400_000);

  const list: Notification[] = [];

  if (ruptures.length > 0) {
    list.push({
      id: 'ruptures',
      title: `${ruptures.length} produit${ruptures.length > 1 ? 's' : ''} en rupture`,
      detail: ruptures.map((rupture) => rupture.product).join(', '),
      href: '/stock?niveau=rupture',
      tone: 'danger',
      read: false,
    });
  }

  if (soon.length > 0) {
    list.push({
      id: 'peremption',
      title: `${soon.length} lot${soon.length > 1 ? 's' : ''} périme${soon.length > 1 ? 'nt' : ''} sous 3 jours`,
      detail: soon.map((lot) => lot.product).join(', '),
      href: '/stock',
      tone: 'warning',
      read: false,
    });
  }

  if (toPrepare.length > 0) {
    list.push({
      id: 'a-preparer',
      title: `${toPrepare.length} commande${toPrepare.length > 1 ? 's' : ''} à préparer`,
      detail: toPrepare.map((order) => order.number).join(', '),
      href: '/commandes?statut=a-preparer',
      tone: 'info',
      read: false,
    });
  }

  list.push({
    id: 'sauvegarde',
    title: 'Sauvegarde quotidienne effectuée',
    detail: 'Archive vérifiée après création, rétention 30 jours',
    href: '/reglages',
    tone: 'success',
    read: true,
  });

  return list;
}
