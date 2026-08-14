import { FileQuestion } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/card';

/**
 * Page introuvable, à l'intérieur du back-office.
 *
 * Elle garde le rail et la barre : une commande supprimée ou un lien périmé
 * doit laisser l'utilisateur là où il travaillait, pas le renvoyer sur un
 * écran nu qui ressemble à une panne du site.
 */
export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl pt-10">
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Cette page n’existe pas"
          description="La référence demandée est introuvable. Elle a peut-être été supprimée, ou l’adresse comporte une erreur de saisie."
          action={<LinkButton href="/tableau-de-bord">Retour au tableau de bord</LinkButton>}
        />
      </Card>
    </div>
  );
}
