# base image
FROM senzing/senzing-api-server:3.5.21@sha256:0da56013d7b34904f34ffa180f31267656576e9fe347885e4296dd1af4c6e22e

# set working directory
WORKDIR /app/senzing/e2e

# add g2 api to /app/senzing
COPY . /app/senzing/e2e

COPY docker-entrypoint.sh /usr/local/bin/
#COPY --from=senzing/senzing-api-server:latest /etc/nginx/nginx.conf /nginx.conf
#/app/senzing-api-server.jar

RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat

EXPOSE 8080

HEALTHCHECK CMD echo "healthcheck placeholder"

USER 1001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD [""]
