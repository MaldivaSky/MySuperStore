@echo off
chcp 65001 > nul
title MySuperStore — Abrindo VSCode e subindo Docker

cd /d "%~dp0"

echo.
echo [1/2] Abrindo projeto no VSCode...
start "" code .

echo.
echo [2/2] Subindo servicos Docker em background...
docker compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Docker nao subiu. Verifique se o Docker Desktop esta aberto.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Tudo no ar!
echo.
echo   API Swagger:   http://localhost:8000/api/docs/
echo   Django Admin:  http://localhost:8000/admin/
echo   Frontend:      http://localhost:3000  (se rodar npm run dev)
echo.
echo   Admin: admin@mysuperstore.com / admin123
echo ============================================================
echo.

echo Abrindo Swagger no browser...
start "" http://localhost:8000/api/docs/

pause
