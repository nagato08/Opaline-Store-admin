import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Card } from '@/components/ui/card';
import { SESSION_COOKIE, openSession } from '@/lib/session';
import { LoginForm } from './login-form';

export const metadata = { title: 'Connexion — Comptoir' };

export default async function LoginPage({ searchParams }: PageProps<'/connexion'>) {
  const store = await cookies();

  // Déjà connecté : inutile de redemander: on renvoie au back-office.
  if (await openSession(store.get(SESSION_COOKIE)?.value)) {
    redirect('/tableau-de-bord');
  }

  const params = await searchParams;
  const suite = typeof params.suite === 'string' ? params.suite : '';

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-control bg-cobalt-500 font-display text-lg font-bold text-white"
          >
            C
          </span>
          <span>
            <span className="block font-display text-lg font-bold text-ink-900">Comptoir</span>
            <span className="block text-xs text-ink-500">Back-office</span>
          </span>
        </div>

        <Card className="mt-6 p-6">
          <h1 className="text-xl font-semibold text-ink-900">Connexion</h1>
          <p className="mt-1.5 text-sm text-ink-600">
            Réservé au personnel de la boutique.
          </p>

          <LoginForm suite={suite} />
        </Card>

        <p className="mt-5 text-center text-xs text-ink-500">
          Mot de passe oublié : la réinitialisation se demande depuis la boutique, avec la même
          adresse.
        </p>
      </div>
    </main>
  );
}
