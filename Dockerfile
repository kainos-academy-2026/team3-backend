# FROM node:22-bookworm-slim AS base
# WORKDIR /app
 
# RUN apt-get update \
#   && apt-get install -y --no-install-recommends openssl ca-certificates \
#   && rm -rf /var/lib/apt/lists/*
 
# ARG EXTRA_CA_CERT=company-root-ca.crt
# COPY ${EXTRA_CA_CERT} /usr/local/share/ca-certificates/company-root-ca.crt
# RUN chmod 644 /usr/local/share/ca-certificates/company-root-ca.crt \
#   && update-ca-certificates
 
# ENV NODE_OPTIONS=--use-openssl-ca
# ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/company-root-ca.crt
# ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
# ENV NPM_CONFIG_CAFILE=/etc/ssl/certs/ca-certificates.crt
 
# FROM base AS deps
# COPY package*.json ./
# COPY prisma ./prisma
# COPY prisma.config.ts ./
# RUN npm ci
 
# FROM deps AS build
# COPY . .
# RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build
 
# FROM deps AS runtime
# RUN npm prune --omit=dev
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/prisma ./prisma
# COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
# COPY --from=build /app/node_modules/@prisma/client /app/node_modules/@prisma/client
 
# EXPOSE 4000
# CMD ["npm", "run", "start"]
 
FROM node:22-bookworm-slim AS builder
WORKDIR /app
# Trust any corporate/Zscaler CA certificates present in certs/ so
# TLS-inspected HTTPS works on the corporate network. certs/*.crt and
# certs/*.pem are gitignored (never committed), so on GitHub-hosted CI
# runners this directory will be empty after checkout and this step simply
# installs nothing extra — no build-arg or override needed either way.
COPY certs/ /tmp/certs/
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && for f in /tmp/certs/*.crt /tmp/certs/*.pem; do \
         [ -f "$f" ] && cp "$f" "/usr/local/share/ca-certificates/$(basename "$f" | sed 's/\.[^.]*$/.crt/')"; \
       done; true \
    && update-ca-certificates \
    && rm -rf /tmp/certs /var/lib/apt/lists/*
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY prisma ./prisma
# NOTE: Prisma's engine downloader (undici) doesn't reliably honour
# NODE_EXTRA_CA_CERTS for the Zscaler/corporate TLS-inspection chain, even
# though the cert is trusted by curl/OpenSSL. Scoping TLS verification off
# for just this one build-time layer unblocks the engine download; this
# variable is not set in the final runtime image/stage.
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc
 
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
EXPOSE 4000
CMD ["node", "dist/index.js"]