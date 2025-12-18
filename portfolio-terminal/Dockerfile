# --- ETAPA BASE (Común) ---
FROM node:20-alpine AS base
WORKDIR /app
# Copiamos los package para instalar dependencias primero (cache layer)
COPY package*.json ./

# --- ETAPA DE DESARROLLO (Target: dev) ---
FROM base AS dev

# Instalamos todas las deps (incluyendo devDependencies como eslint)

RUN npm install

# Copiamos el resto del codigo
COPY . .

# Exponemos el puerto estándar de Next.js
EXPOSE 3000

# Comando para desarrollo con hot-reload
CMD ["npm", "run", "dev"]

# --- ETAPA DE BUILD Para Produccio) ---
FROM base AS builder
# Instalamos dependencias limpias (ci)
RUN npm ci
COPY . .
# Construimos la app (genera la carpeta .next)
RUN npm run build

# --- ETAPA DE PRODUCCIO) ---
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV production

# Copiamos solo lo necesario desde el builder para que la imagen pese poco
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
