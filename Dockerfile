FROM node:18 as base

WORKDIR /usr/src/RecipeSite

COPY package.json .
COPY package-lock.json package-lock.json

FROM base as test
RUN npm ci
COPY . .
RUN npm test

FROM base as production
RUN npm ci --production
COPY . .
EXPOSE 8080
ENV PORT=8080

CMD [ "npm", "start"]
