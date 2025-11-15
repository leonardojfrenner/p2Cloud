#!/bin/bash

# Script para build e push da imagem Docker

IMAGE_NAME="leonardorennerdev/p2cloud"
VERSION="latest"

echo "🔨 Building Docker image..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 To push to Docker Hub, run:"
    echo "   docker login"
    echo "   docker push ${IMAGE_NAME}:${VERSION}"
    echo ""
    echo "🚀 To run locally:"
    echo "   docker run -p 8080:8080 ${IMAGE_NAME}:${VERSION}"
else
    echo "❌ Build failed!"
    exit 1
fi


