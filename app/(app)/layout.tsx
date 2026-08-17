import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { notifications } from '@/lib/demo/notifications';
import { SESSION_COOKIE, type SessionUser, openSession } from '@/lib/session';

/** Libellés des rôles, tels qu'on les nomme dans la boutique. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Gérant',
  FULFILLMENT: 'Préparation',
  SUPPORT: 'Support',
};

function toAccount(user: SessionUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return {
    name,
    // Initiales tirées du nom affiché : un compte sans prénom ni nom retombe
    // sur son adresse, et la première lettre reste lisible.
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
    role: ROLE_LABELS[user.role] ?? user.role,
    email: user.email,
  };
}

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const store = await cookies();
  const session = await openSession(store.get(SESSION_COOKIE)?.value);

  // Le middleware a déjà redirigé, mais le rendu ne doit pas en dépendre :
  // une route qui échapperait au `matcher` afficherait sinon la coquille du
  // back-office à un visiteur sans session.
  if (!session) redirect('/connexion');

  const account = toAccount(session.user);

  return (
    <div className="flex min-h-dvh">
      {/* Lien d'évitement.
          Le rail porte dix liens, répétés à l'identique sur chaque page : sans
          ce raccourci, atteindre le contenu au clavier coûte une dizaine de
          tabulations à *chaque* navigation. Invisible tant qu'il n'a pas le
          focus, il est le premier élément atteint par la touche Tab. */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-control focus:bg-cobalt-500 focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Aller au contenu
      </a>

      {/* Rail fixe à partir de 1024 px : sur un écran large, une navigation
          latérale permanente évite un aller-retour à chaque changement de
          section. En dessous, elle passe en tiroir. */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar notifications={notifications(new Date())} account={account} />
        {/* `tabIndex={-1}` : sans lui, le saut d'ancre déplace le défilement
            mais pas le focus, et la tabulation suivante repart de la barre. */}
        <main id="contenu" tabIndex={-1} className="flex-1 px-4 pt-6 pb-16 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
