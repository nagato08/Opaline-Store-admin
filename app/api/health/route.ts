/**
 * Sonde de santé du conteneur. Ne dépend d'aucun service externe : le
 * back-office reste 100 % données de démonstration pour l'instant, et une
 * sonde qui appellerait l'API la ferait échouer pour une raison qui n'est
 * pas la sienne.
 */
export function GET() {
  return Response.json({ status: 'ok' });
}
