FROM node:20-alpine

WORKDIR /app

# Instala as dependências do projeto
COPY package.json package-lock.json* ./
RUN npm ci

# Copia o restante do código
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Variável de ambiente garantindo que next dev escute em todas as interfaces
ENV HOSTNAME="0.0.0.0"

# Inicia o servidor de desenvolvimento do Next.js
CMD ["npm", "run", "dev"]
