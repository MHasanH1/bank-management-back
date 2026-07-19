FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
COPY database ./database

RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database

ENV NODE_ENV=production

EXPOSE 6000

CMD ["sh", "-c", "node dist/db/init.js && node dist/server.js"]