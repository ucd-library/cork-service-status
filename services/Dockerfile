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

# Create directories
RUN mkdir -p /services /services/data-seeder /services/lib

# Set working directory
WORKDIR /services

COPY package.json .
COPY package-lock.json .
COPY data-seeder ./data-seeder
COPY lib ./lib

RUN npm install

CMD ["bash", "-c", "tail -f /dev/null"]
