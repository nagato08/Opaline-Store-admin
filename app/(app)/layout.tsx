import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { notifications } from '@/lib/demo/notifications';

/**
 * Le compte connecté viendra de la session. Il est isolé ici plutôt que semé
 * dans la barre : le jour où l'API répond, il n'y a qu'une ligne à remplacer.
 */
const account = {
  name: 'Jérémie T.',
  initials: 'JT',
  role: 'Administrateur',
  email: 'admin@example.com',
};

export default function AppLayout({ children }: LayoutProps<'/'>) {
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
