FROM node:22

RUN apt update && apt install -y \
  vim \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  lsb-release


RUN mkdir /services
WORKDIR /services

COPY services/package.json .
COPY services/package-lock.json .
RUN npm install

CMD ["bash", "-c", "tail -f /dev/null"]
