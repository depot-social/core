FROM node:22-bookworm-slim

ARG LOCAL_UID=1000
ARG LOCAL_GID=1000

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@11.20.0 \
    && groupmod -o -g "$LOCAL_GID" node \
    && usermod -o -u "$LOCAL_UID" -g "$LOCAL_GID" node

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
ENV pnpm_config_store_dir=/pnpm/store

# Create volume mount points as the development user, including nested workspaces.
RUN mkdir -p /pnpm/store /workspace/node_modules /workspace/packages/nuxt/.nuxt \
    && for package in nuxt shared strapi \
        strapi/src/plugins/availabilities \
        strapi/src/plugins/conversations \
        strapi/src/plugins/emails \
        strapi/src/plugins/prices \
        strapi/src/plugins/rental-agreement \
        strapi/src/plugins/search; do \
        mkdir -p "/workspace/packages/$package/node_modules"; \
    done \
    && chown -R node:node /workspace /pnpm /home/node

COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh

USER node
WORKDIR /workspace
ENTRYPOINT ["entrypoint.sh"]
CMD ["pnpm", "dev"]
