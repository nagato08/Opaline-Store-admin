/**
 * Génération de CSV pour les exports du back-office.
 *
 * Trois choix qui n'en sont pas vraiment, parce que le fichier sera ouvert
 * dans un tableur français :
 *
 * - **Séparateur point-virgule.** Un Excel configuré en français lit la
 *   virgule comme séparateur décimal ; avec des virgules en séparateur de
 *   colonnes, tout le fichier atterrit dans la colonne A.
 * - **Nomenclature UTF-8 en tête.** Sans elle, Excel devine un encodage
 *   régional et « châtaignier » devient « chÃ¢taignier ».
 * - **Fins de ligne CRLF.** C'est ce que demande la RFC 4180, et les vieux
 *   tableurs Windows ne lisent pas les autres.
 */
const SEPARATOR = ';';
const BOM = '﻿';

function escape(value: string | number): string {
  const text = String(value);

  // Guillemets, séparateur et sauts de ligne obligent à entourer le champ,
  // et à doubler les guillemets internes.
  return /["\n\r;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Montant en centimes rendu tel qu'un tableur français le comprend. */
export function csvMoney(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Quantité décimale, même règle que les montants. */
export function csvNumber(value: number): string {
  return String(value).replace('.', ',');
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return (
    BOM +
    [headers, ...rows].map((row) => row.map(escape).join(SEPARATOR)).join('\r\n') +
    '\r\n'
  );
}

/**
 * Réponse de téléchargement.
 *
 * `Content-Disposition: attachment` déclenche l'enregistrement plutôt que
 * l'affichage du CSV dans l'onglet, et `no-store` évite qu'un export daté ne
 * soit resservi depuis le cache le lendemain.
 */
export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/** Nom de fichier daté : deux exports du même jeu ne s'écrasent pas au téléchargement. */
export function stamped(prefix: string, now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
