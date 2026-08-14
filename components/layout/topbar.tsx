'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, LifeBuoy, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { Badge, Dot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Popover } from '@/components/ui/popover';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/cn';
import type { Notification } from '@/lib/demo/notifications';

/**
 * Barre supérieure.
 *
 * Elle ne contient que trois choses : l'accès à la navigation en petit écran,
 * la recherche globale, et le compte. Tout le reste appartient aux pages —
 * une barre qui accumule des actions devient un dépotoir en trois mois.
 *
 * Les notifications arrivent en props depuis le serveur : elles se déduisent
 * de l'état du stock et des commandes, et ce calcul n'a rien à faire dans le
 * bundle du navigateur.
 */
export function Topbar({
  notifications,
  account,
}: {
  notifications: Notification[];
  account: { name: string; initials: string; role: string; email: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const unread = notifications.filter((item) => !item.read).length;

  // Raccourci clavier : sur un outil utilisé toute la journée, atteindre la
  // recherche sans quitter le clavier fait gagner un temps réel.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-canvas/85 px-4 backdrop-blur-md lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Ouvrir la navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden className="size-5" />
        </Button>

        {/* Un vrai formulaire en `GET` : la recherche atterrit dans l'URL, donc
            elle survit au rechargement et se partage. */}
        <form action="/recherche" role="search" className="relative max-w-md flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
          />
          <input
            ref={searchRef}
            type="search"
            name="q"
            // Le libellé visible manquerait de place ici ; il est donc porté
            // par `aria-label`, jamais par le seul placeholder.
            aria-label="Rechercher une commande, un produit ou un client"
            placeholder="Rechercher une commande, un produit…"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              'h-10 w-full rounded-control bg-surface pr-16 pl-9 text-sm',
              'ring-1 ring-ink-200 ring-inset placeholder:text-ink-400',
              'transition-colors duration-150 hover:ring-ink-300',
            )}
          />
          <kbd
            aria-hidden
            className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-500 sm:block"
          >
            ⌘K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <Popover
            label="Notifications"
            trigger={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                aria-label={
                  unread > 0
                    ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}`
                    : 'Notifications, aucune non lue'
                }
              >
                <span className="relative">
                  <Bell aria-hidden className="size-5" />
                  {unread > 0 ? (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger ring-2 ring-canvas"
                    />
                  ) : null}
                </span>
              </Button>
            )}
          >
            {(close) => (
              <>
                <header className="flex items-center justify-between gap-3 border-b border-ink-200/70 px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink-900">À traiter</h2>
                  <span className="font-mono text-xs text-ink-500" data-numeric>
                    {unread} non lue{unread > 1 ? 's' : ''}
                  </span>
                </header>

                <ul className="max-h-96 divide-y divide-ink-200/70 overflow-y-auto overscroll-contain">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="block px-4 py-3 transition-colors duration-150 hover:bg-ink-50"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-sm font-medium text-ink-900">{item.title}</span>
                          {item.read ? null : (
                            <Badge tone={item.tone} className="mt-0.5 shrink-0">
                              <Dot />
                              Nouveau
                            </Badge>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-500">
                          {item.detail}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-ink-200/70 px-4 py-2.5">
                  <Link
                    href="/tableau-de-bord"
                    onClick={close}
                    className="text-sm font-medium text-cobalt-600 hover:underline"
                  >
                    Voir le tableau de bord
                  </Link>
                </footer>
              </>
            )}
          </Popover>

          <Popover
            label={`Compte de ${account.name}`}
            className="w-64"
            trigger={(props) => (
              <button
                {...props}
                type="button"
                className="flex items-center gap-2.5 rounded-control py-1 pr-2 pl-1 transition-colors duration-150 hover:bg-ink-100"
              >
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-cobalt-100 font-medium text-cobalt-700"
                >
                  {account.initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm leading-tight font-medium text-ink-900">
                    {account.name}
                  </span>
                  <span className="block text-xs leading-tight text-ink-500">{account.role}</span>
                </span>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="border-b border-ink-200/70 px-4 py-3">
                  <p className="text-sm font-medium text-ink-900">{account.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{account.email}</p>
                </div>

                <ul className="py-1.5">
                  {[
                    { href: '/reglages', label: 'Réglages de la boutique', icon: Settings },
                    { href: '/aide', label: 'Aide', icon: LifeBuoy },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 transition-colors duration-150 hover:bg-ink-50 hover:text-ink-900"
                      >
                        <item.icon aria-hidden className="size-4 text-ink-400" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* La déconnexion est une écriture : elle passe par un
                    formulaire en `POST`, pas par un lien. Un `<a href>` de
                    déconnexion se déclenche au préchargement du navigateur. */}
                <form action="/deconnexion" method="post" className="border-t border-ink-200/70 p-1.5">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-sm text-danger transition-colors duration-150 hover:bg-danger-soft"
                  >
                    <LogOut aria-hidden className="size-4" />
                    Se déconnecter
                  </button>
                </form>
              </>
            )}
          </Popover>
        </div>
      </header>

      {/* Navigation en tiroir sous 1024 px. */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} label="Navigation principale">
        <div className="relative h-full">
          <Sidebar onNavigate={() => setMenuOpen(false)} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fermer la navigation"
            className="absolute top-4 right-3 text-ink-300 hover:bg-white/10 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            <X aria-hidden className="size-5" />
          </Button>
        </div>
      </Drawer>
    </>
  );
}
