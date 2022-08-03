FROM node:16-alpine As development

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

FROM node:16-alpine As builder

WORKDIR /app

RUN apk --no-cache add curl
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

COPY --from=development /app/node_modules ./node_modules 

COPY . .

ENV NODE_ENV=production

RUN yarn build

RUN npm prune --production

RUN node-prune

FROM node:16-alpine As production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
# ENV NODE_TLS_REJECT_UNAUTHORIZED='0'

CMD ["node", "dist/main"]
