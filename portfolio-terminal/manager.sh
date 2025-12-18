#!/bin/bash

APP_NAME="portfolio-ceni"
PORT=3000

# Funcion para limpiar contenedores
cleanup() {
    echo " Buscando contenedores viejos..."
    if [ "$(docker ps -aq -f name=$APP_NAME)" ]; then
        docker rm -f $APP_NAME
        echo "✅ Contenedor anterior eliminado."
    fi
}

# Logica principal
if [ "$1" == "dev" ]; then
    echo "🚀 Iniciando entorno de DESARROLLO..."
    cleanup
    
    # Explicacion del comando:
    # --target dev: Usa solo la parte 'dev' del Dockerfile
    # -v $(pwd):/app: Monta tu carpeta actual para que veas cambios en tiempo real
    # -v /app/node_modules: Evita que se pisen los módulos
    
    echo "📦 Construyendo imagen dev..."
    docker build --target dev -t $APP_NAME:dev .
    
    echo "🔥 Corriendo en http://localhost:$PORT"
    docker run -it \
        -p $PORT:3000 \
        --name $APP_NAME \
        -v "$(pwd)":/app \
        -v /app/node_modules \
        $APP_NAME:dev

elif [ "$1" == "prod" ]; then
    echo "🏭 Iniciando entorno de PRODUCCION..."
    cleanup
    
    echo "📦 Compilando y optimizando imagen prod..."
    docker build --target prod -t $APP_NAME:prod .
    
    echo "✨ Desplegando en http://localhost:$PORT"
    docker run -d \
        -p $PORT:3000 \
        --name $APP_NAME \
        --restart unless-stopped \
        $APP_NAME:prod
    
    echo "✅ Servidor corriendo en segundo plano (daemon)."

else
    echo "❌ Opcion no invalida."
    echo "Uso: ./manager.sh [dev | prod]"
fi
