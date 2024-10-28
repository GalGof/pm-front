ARG npmRegistry=
FROM node:20.9.0-bullseye as buildImage

COPY src /projectSrc

RUN npm set registry ${npmRegistry} && \
  cd /projectSrc && \
  npm ci && \
  npm run build

FROM nginx:stable-alpine3.17

COPY src/Jenkins/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=buildImage /projectSrc/build /usr/share/nginx/html
