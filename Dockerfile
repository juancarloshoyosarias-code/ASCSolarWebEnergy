# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build del frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar el servidor
COPY server ./server

# Copiar el build del frontend
COPY --from=builder /app/dist ./dist

# Puerto
ENV PORT=3001
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
