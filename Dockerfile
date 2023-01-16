FROM node:16 AS RUNTIME

WORKDIR /service

COPY . .

EXPOSE 4000

CMD ["node", "packages/service/dist/componentsMain.js"]