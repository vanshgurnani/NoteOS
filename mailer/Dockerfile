FROM node:24.22.1-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund     && npm cache clean --force

COPY src ./src
USER node

EXPOSE 10000
CMD ["node", "src/server.js"]
