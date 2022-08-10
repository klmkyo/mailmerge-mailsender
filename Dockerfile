# syntax=docker/dockerfile:1
FROM node:16
# Create app directory
WORKDIR /app

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json pnpm-lock.yaml tsconfig.json ./

RUN pnpm install --frozen-lockfile
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
RUN pnpm build

# postgres port
EXPOSE 5432
# port for https (telegram bot)
EXPOSE 443

ENV NODE_ENV=production
CMD [ "pnpm", "start" ]
