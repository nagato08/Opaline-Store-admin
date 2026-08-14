'use client';

import { useEffect } from 'react';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';

/**
 * Limite d'erreur du tableau de bord.
 *
 * Elle ne remplace que ce segment : le rail et la barre supérieure restent en
 * place, donc l'utilisateur peut partir ailleurs sans recharger.
 *
 * Le message ne montre ni la pile ni le message technique — il n'apprendrait
 * rien à un commerçant et exposerait la structure du serveur. L'empreinte,
 * elle, est affichée : c'est ce qui permet de retrouver la trace côté API.
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // À rebrancher sur le collecteur d'erreurs le jour où il existe.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl pt-10">
      <Card>
        <EmptyState
          icon={ServerCrash}
          title="Les indicateurs n’ont pas pu être chargés"
          description="La connexion à l’API a échoué. Les commandes et le catalogue restent accessibles depuis le menu."
          action={
            <div className="flex flex-col items-center gap-3">
              <Button variant="primary" onClick={retry}>
                Réessayer
              </Button>
              {error.digest ? (
                <p className="font-mono text-xs text-ink-400" translate="no">
                  Référence {error.digest}
                </p>
              ) : null}
            </div>
          }
        />
      </Card>
    </div>
  );
}
