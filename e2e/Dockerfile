# base image
FROM senzing/senzing-api-server:latest

# set working directory
WORKDIR /app/senzing/e2e

# add g2 api to /app/senzing
COPY . /app/senzing/e2e

COPY docker-entrypoint.sh /usr/local/bin/
#COPY --from=senzing/senzing-api-server:latest /etc/nginx/nginx.conf /nginx.conf
#/app/senzing-api-server.jar

RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
CMD [""]
