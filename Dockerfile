# Image de production du back-office.
#
# Trois étapes, sortie Next.js « standalone » : l'image finale ne contient
# que server.js et les node_modules réellement traversés au runtime, pas le
# dépôt entier ni les dépendances de développement.

FROM node:22-alpine AS deps

WORKDIR /app

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 300000

COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `NEXT_PUBLIC_*` est figé dans le bundle au moment du build, pas lu au
# démarrage : changer l'URL de l'API impose de reconstruire l'image.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# `127.0.0.1` et non `localhost` : busybox (Alpine) résout `localhost` en
# `::1` en premier, or le serveur n'écoute qu'en IPv4 — la sonde échouerait
# en permanence sur un conteneur pourtant sain.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
