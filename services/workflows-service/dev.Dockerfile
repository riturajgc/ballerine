#docker build -t gcsns/atemplate:1.0.0-dev -f dev.Dockerfile .
#docker push gcsns/atemplate:1.0.0-dev
#Run via compose

FROM node:18.17.1-bullseye-slim
LABEL maintainer="Gamechange"
LABEL trademark="Gamechange Solutions"

RUN apt-get update
RUN apt-get install dumb-init
# Install dumb-init and procps for both dev and prod
RUN apt-get update && apt-get install -y dumb-init procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

#We use yarn
COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .
#install packages
RUN npm run prisma:generate
RUN npm run build

CMD [ "dumb-init", "npm", "run", "start:watch", "" ]

EXPOSE 3000