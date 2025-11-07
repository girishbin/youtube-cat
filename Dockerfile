# ---- Base Node ----
FROM node:22.21.1-alpine3.21 AS base
WORKDIR /app

# ---- Dependencies ----
# Install dependencies based on package-lock.json
FROM base AS deps
COPY package.json ./
COPY drizzle.config.ts ./
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && \
    # Add pnpm to the PATH environment variable
    export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:$PATH" && \
    pnpm install

# ---- Build ----
# Create a production build of the application
FROM deps AS build
# node_modules are already present from the 'deps' stage
COPY . .
# Set a build-time environment variable to prevent DB connection during build
ENV BUILD_ENV=true
RUN export PNPM_HOME="/root/.local/share/pnpm" && export PATH="$PNPM_HOME:$PATH" && pnpm run build
# ---- Production ----
# Prepare a lean production image
FROM base AS production

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Install production dependencies and copy build output
COPY package.json pnpm-lock.yaml ./
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && \
    export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:$PATH" && \
    pnpm install --prod

# Copy migrations and entrypoint script
COPY migrations ./migrations
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
COPY drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/build ./build

# Copy SvelteKit output
ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "node", "build/index.js" ]