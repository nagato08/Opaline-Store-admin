import { daysFromNow } from './random';

export type Address = {
  line1: string;
  postalCode: string;
  city: string;
  country: 'France' | 'Canada';
};

export type DemoCustomer = {
  name: string;
  email: string;
  country: 'FR' | 'CA';
  /**
   * Une commande peut être passée sans compte. Distinguer les deux évite de
   * promettre un historique à quelqu'un qui n'en a pas, et de compter deux fois
   * une même personne qui a fini par créer un compte.
   */
  kind: 'account' | 'guest';
  orders: number;
  spentCents: number;
  /** Jours écoulés depuis la dernière commande. */
  lastOrderDaysAgo: number;
  address: Address;
  /**
   * Consentements RGPD. Ils se stockent horodatés et se retirent : afficher un
   * simple booléen empêcherait de prouver quand le client a accepté.
   */
  consents: { newsletter: boolean; profiling: boolean };
  /** Points de fidélité accumulés. Leur utilisation au paiement n'est pas branchée. */
  loyaltyPoints: number;
};

const CUSTOMERS: DemoCustomer[] = [
  { name: 'Camille Berger', email: 'camille.berger@example.fr', country: 'FR', kind: 'account', orders: 14, spentCents: 892400, lastOrderDaysAgo: 0, address: { line1: '14 rue des Petites-Écuries', postalCode: '75010', city: 'Paris', country: 'France' }, consents: { newsletter: true, profiling: false }, loyaltyPoints: 892 },
  { name: 'Sofia Marchand', email: 'sofia.marchand@example.fr', country: 'FR', kind: 'account', orders: 9, spentCents: 412300, lastOrderDaysAgo: 0, address: { line1: '8 quai de la Fosse', postalCode: '44000', city: 'Nantes', country: 'France' }, consents: { newsletter: true, profiling: true }, loyaltyPoints: 412 },
  { name: 'Mathieu Roy', email: 'mathieu.roy@example.ca', country: 'CA', kind: 'account', orders: 7, spentCents: 388900, lastOrderDaysAgo: 1, address: { line1: '2140 rue Sainte-Catherine O', postalCode: 'H3H 1M3', city: 'Montréal', country: 'Canada' }, consents: { newsletter: false, profiling: false }, loyaltyPoints: 389 },
  { name: 'Inès Fontaine', email: 'ines.fontaine@example.fr', country: 'FR', kind: 'account', orders: 11, spentCents: 276500, lastOrderDaysAgo: 1, address: { line1: '31 cours Gambetta', postalCode: '69003', city: 'Lyon', country: 'France' }, consents: { newsletter: true, profiling: false }, loyaltyPoints: 277 },
  { name: 'Clara Nguyen', email: 'clara.nguyen@example.fr', country: 'FR', kind: 'account', orders: 22, spentCents: 254800, lastOrderDaysAgo: 4, address: { line1: '5 rue du Taur', postalCode: '31000', city: 'Toulouse', country: 'France' }, consents: { newsletter: true, profiling: true }, loyaltyPoints: 255 },
  { name: 'Émile Gagnon', email: 'emile.gagnon@example.ca', country: 'CA', kind: 'account', orders: 5, spentCents: 198700, lastOrderDaysAgo: 4, address: { line1: '650 Grande Allée E', postalCode: 'G1R 2K4', city: 'Québec', country: 'Canada' }, consents: { newsletter: false, profiling: false }, loyaltyPoints: 199 },
  { name: 'Aïcha Benali', email: 'aicha.benali@example.fr', country: 'FR', kind: 'account', orders: 18, spentCents: 156300, lastOrderDaysAgo: 2, address: { line1: '22 rue Saint-Ferréol', postalCode: '13001', city: 'Marseille', country: 'France' }, consents: { newsletter: true, profiling: false }, loyaltyPoints: 156 },
  { name: 'Léa Tremblay', email: 'lea.tremblay@example.ca', country: 'CA', kind: 'account', orders: 3, spentCents: 98600, lastOrderDaysAgo: 2, address: { line1: '1010 boulevard Charest O', postalCode: 'G1N 2E1', city: 'Québec', country: 'Canada' }, consents: { newsletter: true, profiling: false }, loyaltyPoints: 99 },
  { name: 'Hugo Lambert', email: 'hugo.lambert@example.fr', country: 'FR', kind: 'guest', orders: 2, spentCents: 46700, lastOrderDaysAgo: 3, address: { line1: '3 place du Ralliement', postalCode: '49100', city: 'Angers', country: 'France' }, consents: { newsletter: false, profiling: false }, loyaltyPoints: 0 },
  { name: 'Nour Haddad', email: 'nour.haddad@example.fr', country: 'FR', kind: 'account', orders: 6, spentCents: 41200, lastOrderDaysAgo: 3, address: { line1: '17 rue de la Barre', postalCode: '59800', city: 'Lille', country: 'France' }, consents: { newsletter: true, profiling: false }, loyaltyPoints: 41 },
  { name: 'Yann Delcourt', email: 'yann.delcourt@example.fr', country: 'FR', kind: 'guest', orders: 1, spentCents: 7490, lastOrderDaysAgo: 0, address: { line1: '9 rue Sainte-Catherine', postalCode: '33000', city: 'Bordeaux', country: 'France' }, consents: { newsletter: false, profiling: false }, loyaltyPoints: 0 },
  { name: 'Paul Invité', email: 'paul.invite@example.fr', country: 'FR', kind: 'guest', orders: 1, spentCents: 1888, lastOrderDaysAgo: 0, address: { line1: '46 rue Nationale', postalCode: '37000', city: 'Tours', country: 'France' }, consents: { newsletter: false, profiling: false }, loyaltyPoints: 0 },
];

export function customers(): DemoCustomer[] {
  return CUSTOMERS;
}

/**
 * Un client par son courriel.
 *
 * Le courriel sert de clé d'URL parce qu'il identifie aussi bien un compte
 * qu'un acheteur invité, qui n'a pas d'identifiant de client.
 */
export function customerByEmail(email: string): DemoCustomer | undefined {
  return CUSTOMERS.find((customer) => customer.email === email);
}

/** Date de dernière commande, résolue au moment du rendu. */
export function lastOrderAt(customer: DemoCustomer, now: Date): string {
  return daysFromNow(now, -customer.lastOrderDaysAgo);
}
