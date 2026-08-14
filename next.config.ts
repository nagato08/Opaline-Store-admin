import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sortie autonome : l'image Docker ne copie que server.js et les
  // node_modules réellement utilisés, pas tout le dépôt.
  output: 'standalone',
};

export default nextConfig;
