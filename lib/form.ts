/**
 * Contrat commun aux formulaires du back-office.
 *
 * L'état renvoyé par une action serveur porte trois cas et pas un de plus :
 *
 * - `invalid` — la saisie est refusée, les erreurs sont rattachées champ par
 *   champ ;
 * - `unavailable` — la saisie est valide mais l'écriture n'a pas d'endroit où
 *   aller, faute d'API branchée ;
 * - `saved` — écrit.
 *
 * Le cas `unavailable` existe pour une raison précise : un bouton qui ne fait
 * rien et n'explique rien est pire qu'un bouton absent. Tant que l'API n'est
 * pas branchée, le formulaire valide vraiment, garde la saisie, et dit ce qui
 * manque. Le jour où elle répond, seule la dernière ligne de chaque action
 * change.
 */
export type FormState = {
  status: 'idle' | 'invalid' | 'unavailable' | 'saved';
  message?: string;
  /** Erreurs par nom de champ, tel qu'il figure dans le `name` de l'input. */
  errors?: Record<string, string>;
  /** Saisie renvoyée telle quelle : un formulaire refusé ne se revide jamais. */
  values?: Record<string, string>;
};

export const IDLE: FormState = { status: 'idle' };

/** Récupère les valeurs saisies pour les réafficher après un refus. */
export function readValues(data: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of data.entries()) {
    if (typeof value === 'string') values[key] = value;
  }

  return values;
}

export function required(data: FormData, field: string): string {
  return (data.get(field) as string | null)?.trim() ?? '';
}

/**
 * Conversion d'un montant saisi en centimes entiers.
 *
 * `Math.round` et non une troncature : `19.99 * 100` vaut `1998.9999…` en
 * flottant, et tronquer produirait 19,98 €. C'est le seul endroit de
 * l'application où un montant existe sous forme décimale.
 */
export function toCents(input: string): number | null {
  const normalised = input.replace(',', '.').trim();
  if (normalised === '') return null;

  const value = Number(normalised);
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * 100);
}

/** Quantité décimale — l'alimentaire se vend au poids. */
export function toQuantity(input: string): number | null {
  const value = Number(input.replace(',', '.').trim());
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Quantité signée — un ajustement de stock peut retirer autant qu'ajouter. */
export function toSignedQuantity(input: string): number | null {
  const value = Number(input.replace(',', '.').trim());
  return Number.isFinite(value) && value !== 0 ? value : null;
}

/**
 * Message unique du cas « pas d'API ».
 *
 * Centralisé pour qu'il soit identique partout : six formulations différentes
 * du même blocage donnent l'impression de six pannes distinctes.
 */
export function unavailable(subject: string): FormState {
  return {
    status: 'unavailable',
    message: `Saisie valide. ${subject} sera enregistré dès que l’API sera branchée sur ce back-office — aucune donnée n’a été perdue, le formulaire garde ce que vous venez d’écrire.`,
  };
}
