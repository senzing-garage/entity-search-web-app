ARG BASE_CONTAINER=node:lts-stretch
FROM ${BASE_CONTAINER}

ENV REFRESHED_AT=2019-03-18

COPY . /app
WORKDIR /app

RUN npm init -y
# RUN npm install @angular/cli@1.7.1
RUN npm install
RUN npm audit fix

# production docker app build
RUN npm run build:docker

# cleanup files we no longer need
RUN rm -fR /app/src
RUN rm -fR /app/e2e
# RUN rm -f /app/proxy.conf.tmpl.json
RUN rm -f /app/README.md

CMD ["npm", "run", "start:docker"]
EXPOSE 8080
