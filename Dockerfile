FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN npx prisma generate

RUN pnpm build

EXPOSE 4000

CMD npx prisma generate && npx prisma migrate deploy && pnpm start:prod