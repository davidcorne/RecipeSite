FROM node:10

WORKDIR /usr/src/RecipeSite

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "run"]
