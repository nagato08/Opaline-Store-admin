/**
 * Formatage localisé. Les montants arrivent du backend en centimes entiers :
 * la division n'a lieu qu'ici, au moment de l'affichage.
 */

export function money(cents: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function number(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function percent(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value);
}

/**
 * Taux de taxe.
 *
 * Sans décompte fixe de décimales, contrairement à `share` : la TVA
 * française est ronde (20 %, 5,5 %), mais le cumul TPS + TVQ canadien vaut
 * 14,975 %. Arrondir à deux décimales afficherait 14,98 % — un taux qui
 * n'existe dans aucun texte légal.
 */
export function taxRate(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

/**
 * Part d'un total. Contrairement à `percent`, jamais de signe : une
 * répartition n'a pas de sens de variation.
 */
export function share(value: number, fractionDigits = 0, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Échéance exprimée en jours pleins — « demain », « dans 3 jours ».
 *
 * La comparaison porte sur les dates civiles et non sur l'écart en
 * millisecondes : un lot qui périme ce soir à 23 h périme « aujourd'hui », pas
 * « dans 0 jour ».
 */
export function untilDay(value: string | Date, now = new Date(), locale = 'fr-FR'): string {
  const midnight = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((midnight(new Date(value)) - midnight(now)) / 86_400_000);

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
}

/** Date civile seule — sur une échéance, l'heure n'apporte rien. */
export function dayMonth(value: string | Date, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(value));
}

/**
 * Intervalle de dates.
 *
 * L'année n'apparaît que lorsqu'elle sort de l'année courante. Sans cette
 * règle, une promotion courant du 14 février au 14 février de l'année suivante
 * s'affiche « 14 févr. → 14 févr. » et passe pour une période vide.
 */
export function dateRange(start: string | Date, end: string | Date, now: Date, locale = 'fr-FR'): string {
  const withYear = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const label = (value: string | Date) => {
    const date = new Date(value);
    return date.getFullYear() === now.getFullYear() ? dayMonth(date, locale) : withYear.format(date);
  };

  return `${label(start)} → ${label(end)}`;
}

/** Date courte pour les tableaux, où la place est comptée. */
export function shortDate(value: string | Date, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
