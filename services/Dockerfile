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

# Set working directory
RUN mkdir /services
WORKDIR /services

COPY services/package.json .
COPY services/package-lock.json .
COPY services/data-seeder ./data-seeder
COPY services/lib ./lib

RUN npm install

CMD ["bash", "-c", "tail -f /dev/null"]
