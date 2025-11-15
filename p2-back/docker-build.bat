@echo off
REM Script para build e push da imagem Docker (Windows)

set IMAGE_NAME=leonardorennerdev/p2cloud
set VERSION=latest

echo 🔨 Building Docker image...
docker build -t %IMAGE_NAME%:%VERSION% .

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    echo.
    echo 📦 To push to Docker Hub, run:
    echo    docker login
    echo    docker push %IMAGE_NAME%:%VERSION%
    echo.
    echo 🚀 To run locally:
    echo    docker run -p 8080:8080 %IMAGE_NAME%:%VERSION%
) else (
    echo ❌ Build failed!
    exit /b 1
)


