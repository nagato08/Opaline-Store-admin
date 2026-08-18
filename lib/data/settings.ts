import { apiFetch } from '@/lib/api';
import type { SessionData } from '@/lib/session';

/**
 * Réglages d'enseigne, branchés sur `GET/PATCH /admin/settings`.
 *
 * Seules deux clés sont éditables depuis cet écran (`store.name`,
 * `store.email`) : le reste de la page — régimes de taxe, transporteurs,
 * prestataires — est un fait d'infrastructure affiché en lecture seule, pas
 * un réglage.
 */

export type StoreSettings = { name: string; contactEmail: string };

type ApiSetting = { key: string; value: unknown };

export async function getStoreSettings(session: SessionData): Promise<StoreSettings> {
  const rows = await apiFetch<ApiSetting[]>(session, '/admin/settings?group=general');
  const find = (key: string) => rows.find((row) => row.key === key)?.value;
  const name = find('store.name');
  const email = find('store.email');

  return {
    name: typeof name === 'string' ? name : 'Ma Boutique',
    contactEmail: typeof email === 'string' ? email : '',
  };
}

export async function setStoreSetting(
  session: SessionData,
  key: 'store.name' | 'store.email',
  value: string,
): Promise<void> {
  await apiFetch(session, `/admin/settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
}
