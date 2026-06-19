# MySuperStore — Git init + push para novo repositório GitHub
# Uso: clique direito → "Executar com PowerShell"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MySuperStore — Publicar no GitHub" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Git init ──────────────────────────────────────────────────────────────
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Inicializando repositório git..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "[1/5] Repositório git já existe." -ForegroundColor Green
}

# ── 2. Primeiro commit ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Adicionando arquivos e fazendo primeiro commit..." -ForegroundColor Yellow
git add .
git status --short

$commitMsg = "feat: Fase 1 — auth JWT, migrations, seed, catalog e sellers API"
git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-Host "Nenhuma mudança para commitar ou erro no commit." -ForegroundColor Red
}

# ── 3. Criar repo no GitHub (via gh CLI se disponível) ──────────────────────
Write-Host ""
Write-Host "[3/5] Verificando GitHub CLI (gh)..." -ForegroundColor Yellow

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue

if ($ghAvailable) {
    Write-Host "  gh encontrado! Criando repositório privado 'MySuperStore'..." -ForegroundColor Green
    gh repo create MySuperStore --private --source=. --remote=origin --push
    Write-Host ""
    Write-Host "  Repositório criado e código enviado!" -ForegroundColor Green
    gh repo view --web
} else {
    Write-Host "  gh CLI não encontrado. Crie o repositório manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Acesse https://github.com/new" -ForegroundColor White
    Write-Host "  2. Nome: MySuperStore" -ForegroundColor White
    Write-Host "  3. Deixe vazio (sem README) e clique em 'Create repository'" -ForegroundColor White
    Write-Host "  4. Copie a URL do repositório e cole abaixo:" -ForegroundColor White
    Write-Host ""

    $repoUrl = Read-Host "  Cole a URL do repositório (ex: https://github.com/rafaelmaldivas/MySuperStore.git)"

    if ($repoUrl -ne "") {
        Write-Host ""
        Write-Host "[4/5] Adicionando remote e fazendo push..." -ForegroundColor Yellow
        git remote add origin $repoUrl
        git push -u origin main
        Write-Host ""
        Write-Host "  Push realizado!" -ForegroundColor Green
        Start-Process $repoUrl.Replace(".git", "")
    } else {
        Write-Host "  Nenhuma URL fornecida. Rode manualmente:" -ForegroundColor Red
        Write-Host "    git remote add origin <URL>" -ForegroundColor White
        Write-Host "    git push -u origin main" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Pronto! Repositório publicado." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para fechar"
