FROM node:18.17.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Needed for prisma installation
RUN apt-get update -y && apt-get install -y openssl bash

WORKDIR /app

FROM base AS build
COPY . /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Runs pnpm build:next and pnpm build:ws
RUN pnpm run build

FROM base AS runner

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DOCKER true

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/.next /app/.next
COPY --from=build /app/next.config.js /app/next.config.js
COPY --from=build /app/public /app/public
COPY --from=build /app/prisma /app/prisma
COPY docker-entrypoint.sh .
COPY .env.production .

# Execute script
RUN ["chmod", "+x", "./docker-entrypoint.sh"]
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 3000 3001

WORKDIR /app

CMD ["pnpm", "run", "start"]
