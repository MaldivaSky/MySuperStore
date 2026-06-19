@echo off
chcp 65001 > nul
title MySuperStore — Setup Fase 1

echo.
echo ============================================================
echo   MySuperStore — Setup Fase 1
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/4] Fazendo build das imagens Docker...
docker compose build
if %ERRORLEVEL% NEQ 0 (
    echo ERRO no build. Verifique se o Docker Desktop esta rodando.
    pause
    exit /b 1
)

echo.
echo [2/4] Criando migrations...
docker compose run --rm api python manage.py makemigrations
if %ERRORLEVEL% NEQ 0 (
    echo ERRO em makemigrations.
    pause
    exit /b 1
)

echo.
echo [3/4] Aplicando migrations...
docker compose run --rm api python manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo ERRO em migrate.
    pause
    exit /b 1
)

echo.
echo [4/4] Rodando seed inicial (admin + seller padrao)...
docker compose run --rm api python manage.py seed_data
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: seed_data falhou, mas continuando...
)

echo.
echo ============================================================
echo   Setup concluido!
echo   Credenciais do admin:
echo     Email: admin@mysuperstore.com
echo     Senha: admin123
echo.
echo   Subindo todos os servicos com make dev...
echo   API estara em: http://localhost:8000
echo   Docs em:       http://localhost:8000/api/docs/
echo ============================================================
echo.

docker compose up

pause
