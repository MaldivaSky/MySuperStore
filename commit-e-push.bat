@echo off
chcp 65001 > nul
title MySuperStore — Git init + commit + push

cd /d "%~dp0"

echo.
echo ============================================================
echo   MySuperStore — Git init + commit + push
echo ============================================================
echo.

REM ── 1. Limpar .git corrompido ─────────────────────────────────────────────
if exist ".git" (
    echo [1/6] Removendo .git corrompido...
    rmdir /s /q .git
    echo   OK.
) else (
    echo [1/6] Sem .git anterior.
)

REM ── 2. Inicializar repositório ────────────────────────────────────────────
echo.
echo [2/6] Inicializando repositorio git (branch: main)...
git init -b main
git config user.email "rafaelmaldivas@gmail.com"
git config user.name "Rafael Paiva"

REM ── 3. Adicionar arquivos ─────────────────────────────────────────────────
echo.
echo [3/6] Adicionando arquivos (.env ignorado pelo .gitignore)...
git add .
echo   Arquivos staged:
git status --short

REM ── 4. Commit inicial ────────────────────────────────────────────────────
echo.
echo [4/6] Fazendo primeiro commit...
git commit -m "feat: Fase 1 — auth JWT, migrations, seed, catalog e sellers API"

REM ── 5. Conectar ao GitHub e fazer push ────────────────────────────────────
echo.
echo [5/6] Conectando ao GitHub (MaldivaSky/MySuperStore)...
git remote add origin https://github.com/MaldivaSky/MySuperStore.git
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo AVISO: push falhou. Pode ser autenticacao. Tente:
    echo   git push -u origin main
    echo   (o VS Code vai pedir login no GitHub)
)

REM ── 6. Abrir VSCode com o projeto ─────────────────────────────────────────
echo.
echo [6/6] Abrindo projeto no VSCode...
start "" code .

echo.
echo ============================================================
echo   Pronto!
echo   Repositorio: https://github.com/MaldivaSky/MySuperStore
echo ============================================================
echo.
pause
