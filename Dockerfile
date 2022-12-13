FROM node
WORKDIR /opt/proxy
COPY package.json package.json
COPY app.js app.js
COPY run.js run.js
COPY error.pug error.pug
RUN npm install
CMD [ "npm", "start" ]
EXPOSE 1996:2023
