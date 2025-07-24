FROM node:22

# Install packages
RUN apt update && apt install -y \
  vim \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  lsb-release \
  postgresql-client

COPY tools /tools

# Set working directory
RUN mkdir /services
WORKDIR /services

COPY services/package.json .
COPY services/package-lock.json .
COPY services/data-seeder ./data-seeder
COPY services/lib ./lib
COPY services/client ./client
COPY services/uptime-webhook ./uptime-webhook

# client build
RUN cd /services/client/dev && \
  npm install && \
  npm run build-dev

RUN npm install

CMD ["bash", "-c", "tail -f /dev/null"]
