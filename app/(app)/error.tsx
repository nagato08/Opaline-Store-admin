'use client';

import { useEffect } from 'react';
import { ServerCrash } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';

/**
 * Limite d'erreur commune à toutes les sections.
 *
 * Elle est posée sur le groupe et non sur chaque page : une page ajoutée plus
 * tard hérite de la protection sans qu'on y pense, alors qu'une limite par
 * route se serait oubliée. Le tableau de bord garde la sienne, plus précise,
 * qui prend le pas sur celle-ci pour son propre segment.
 *
 * Seul le contenu est remplacé : le rail et la barre supérieure restent en
 * place, donc l'utilisateur peut partir ailleurs sans recharger.
 *
 * Le message ne montre ni la pile ni le texte technique — il n'apprendrait
 * rien à un commerçant et exposerait la structure du serveur. L'empreinte,
 * elle, est affichée : c'est ce qui permet de retrouver la trace côté API.
 */
export default function SectionError({
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
          title="Cette section n’a pas pu être chargée"
          description="La requête a échoué avant d’aboutir. Les autres sections restent accessibles depuis le menu."
          action={
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={retry}>
                  Réessayer
                </Button>
                <LinkButton href="/tableau-de-bord">Tableau de bord</LinkButton>
              </div>
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
