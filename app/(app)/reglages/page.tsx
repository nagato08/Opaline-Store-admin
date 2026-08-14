import { PageHeader } from '@/components/layout/page-header';
import { Badge, Dot } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StoreSettingsForm } from './store-settings-form';

export const metadata = { title: 'Réglages — Comptoir' };

/**
 * Ligne de réglage.
 *
 * Une liste de définitions et non un tableau : ce sont des paires
 * intitulé/valeur, pas des enregistrements comparables ligne à ligne.
 */
function Setting({
  label,
  value,
  note,
  badge,
}: {
  label: string;
  value: string;
  note?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 py-4">
      <dt className="min-w-0 basis-64 text-sm font-medium text-ink-900">
        {label}
        {note ? <p className="mt-0.5 text-xs font-normal text-ink-500">{note}</p> : null}
      </dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
        {badge}
        <span>{value}</span>
      </dd>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader title={title} description={description} />
      <dl className="divide-y divide-ink-200/70">{children}</dl>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    /* L'en-tête reste sur la largeur commune à toutes les pages : sa trame
       s'étend d'un bord à l'autre, et le titre tombe au même endroit d'un
       écran au suivant. Seule la colonne de réglages est resserrée — une
       liste de paires intitulé/valeur devient illisible à pleine largeur. */
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Réglages"
        description="La configuration de la boutique. Comptoir est le nom du logiciel ; l’enseigne, elle, est un réglage — elle n’est écrite en dur nulle part."
      />

      <div className="max-w-4xl space-y-6">
        <StoreSettingsForm />

        <Section
          title="Pays et taxes"
          description="Le régime d’affichage dépend du pays de livraison, jamais d’un réglage global"
        >
          <Setting
            label="France"
            value="Affichage TTC · TVA 20 %, 5,5 % sur l’alimentaire"
            badge={<Badge tone="success"><Dot />Ouvert</Badge>}
          />
          <Setting
            label="Canada"
            value="Affichage hors taxe · TPS/TVQ ajoutées à la caisse"
            badge={<Badge tone="success"><Dot />Ouvert</Badge>}
            note="Un même produit ne s’affiche donc pas au même prix des deux côtés"
          />
          <Setting
            label="Éco-participation"
            value="Appliquée au mobilier et à l’électronique"
            note="Obligation légale française ; elle s’affiche à part du prix"
          />
        </Section>

        <Section
          title="Livraison"
          description="Le filtrage se fait d’abord sur les contraintes physiques, ensuite sur le tarif"
        >
          <Setting label="Point relais" value="4,90 € · 3 à 5 jours" />
          <Setting label="Domicile 48 h" value="7,90 € · France métropolitaine" />
          <Setting label="Transporteur Québec" value="14,50 CAD · Canada" />
          <Setting
            label="Chaîne du froid"
            value="12,90 € · Alimentaire frais"
            note="Seuls les modes compatibles sont proposés pour un panier réfrigéré"
          />
          <Setting
            label="Hors gabarit"
            value="Sur rendez-vous · Mobilier volumineux"
            note="Un canapé ne passe par aucun autre mode"
          />
        </Section>

        <Section
          title="Paiement"
          description="Un port et ses adaptateurs : changer de prestataire ne touche qu’une classe"
        >
          <Setting
            label="Virement bancaire"
            value="Actif"
            badge={<Badge tone="success"><Dot />En service</Badge>}
          />
          <Setting
            label="Paiement à la livraison"
            value="Actif · France uniquement"
            badge={<Badge tone="success"><Dot />En service</Badge>}
          />
          <Setting
            label="Stripe"
            value="Non branché"
            badge={<Badge tone="neutral"><Dot />Inactif</Badge>}
            note="En attente de la création de la société du client"
          />
        </Section>

        <Section
          title="Courriels et fichiers"
          description="Prestataires externes, chacun derrière son adaptateur"
        >
          <Setting
            label="Envoi des courriels"
            value="Resend · domaine tadjo.dev vérifié"
            badge={<Badge tone="success"><Dot />Vérifié</Badge>}
          />
          <Setting
            label="Stockage des images"
            value="Cloudinary"
            badge={<Badge tone="success"><Dot />Actif</Badge>}
            note="Repli sur le disque local en développement"
          />
        </Section>
      </div>
    </div>
  );
}
