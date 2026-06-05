FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM node:24-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev


FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
