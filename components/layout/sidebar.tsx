'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Navigation principale.
 *
 * Groupée par métier — ce qu'on fait tous les jours en haut, la configuration
 * tout en bas. L'ordre suit la journée type d'un commerçant : il regarde ses
 * commandes avant de retoucher son catalogue.
 */
const groups = [
  {
    label: 'Pilotage',
    items: [
      { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/commandes', label: 'Commandes', icon: ShoppingBag, badge: 3 },
      { href: '/clients', label: 'Clients', icon: Users },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/produits', label: 'Produits', icon: Package },
      { href: '/stock', label: 'Stock', icon: Boxes },
      { href: '/promotions', label: 'Promotions', icon: Tag },
    ],
  },
  {
    label: 'Boutique',
    items: [
      { href: '/campagnes', label: 'Campagnes', icon: Megaphone },
      { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="flex h-full flex-col bg-rail text-ink-300">
      <div className="flex h-16 items-center gap-2.5 px-5">
        {/* Marque : le carré cobalt est le seul aplat de couleur du rail, donc
            le point de repère immédiat. */}
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-lg bg-cobalt-500 font-display text-sm font-bold text-white"
        >
          C
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight text-white">
          Comptoir
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mt-5 first:mt-1">
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      // `aria-current` porte l'information d'état pour les
                      // lecteurs d'écran : la couleur ne suffit pas.
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-10 items-center gap-3 rounded-control px-3',
                        'text-sm transition-colors duration-150',
                        active
                          ? 'bg-white/10 font-medium text-white'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {/* Repère vertical sur l'élément actif : lisible sans
                          dépendre de la couleur de fond. */}
                      <span
                        aria-hidden
                        className={cn(
                          'absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cobalt-400',
                          active ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <item.icon aria-hidden className="size-[18px] shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {'badge' in item && item.badge ? (
                        <span
                          className="rounded-full bg-cobalt-500 px-1.5 py-0.5 font-mono text-[11px] leading-none font-medium text-white"
                          aria-label={`${item.badge} à traiter`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Réglages et aide séparés du reste : ce sont des destinations rares,
          et les mêler au flux quotidien encombre la lecture. */}
      <div className="border-t border-white/10 px-3 py-3">
        <ul className="space-y-0.5">
          {[
            { href: '/reglages', label: 'Réglages', icon: Settings },
            { href: '/aide', label: 'Aide', icon: LifeBuoy },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="flex h-10 items-center gap-3 rounded-control px-3 text-sm text-ink-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
              >
                <item.icon aria-hidden className="size-[18px]" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
