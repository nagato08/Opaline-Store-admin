import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sortie autonome : l'image Docker ne copie que server.js et les
  // node_modules réellement utilisés, pas tout le dépôt.
  output: 'standalone',

  experimental: {
    serverActions: {
      // Les photos de produit transitent par une action serveur, et la limite
      // par défaut est de 1 Mo : une seule photo d'appareil la dépasse. L'API
      // accepte 15 Mo par fichier ; 20 Mo laissent la place à une galerie de
      // plusieurs images plus les quelques kilo-octets que le multipart ajoute
      // en frontières et en-têtes de parties.
      //
      // La route reste derrière l'authentification du back-office : ce plafond
      // n'ouvre rien au public.
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
