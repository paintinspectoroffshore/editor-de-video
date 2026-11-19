# Instalador do Editor de Vídeo (Windows). Rode no PowerShell, na pasta do projeto:  .\instalar.ps1
# Recria tudo que não vai no GitHub: dependências, FFmpeg, yt-dlp, cloudflared, pastas de trabalho e modelo Whisper.
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
function Tem($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Write-Host "== 1/6 Programas base ==" -ForegroundColor Cyan
if (-not (Tem node))   { winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements }
if (-not (Tem python)) { winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements }
if (-not (Tem ffmpeg)) { winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements }
if (-not (Tem git))    { winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements }
Write-Host "Se algum programa acabou de ser instalado, FECHE e ABRA o PowerShell e rode de novo este script." -ForegroundColor Yellow

Write-Host "== 2/6 Python (voz, legendas, imagens) ==" -ForegroundColor Cyan
python -m pip install --upgrade pip
python -m pip install faster-whisper numpy soundfile pillow opencv-python edge-tts yt-dlp

Write-Host "== 3/6 Remotion (motor de vídeo) ==" -ForegroundColor Cyan
Push-Location FERRAMENTAS\Remotion; npm install; Pop-Location

Write-Host "== 4/6 Captura de sites (puppeteer) ==" -ForegroundColor Cyan
Push-Location 00-SISTEMA\captura; npm install; Pop-Location

Write-Host "== 5/6 cloudflared (túnel do piloto automático) ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force 00-SISTEMA\ferramentas | Out-Null
if (-not (Test-Path 00-SISTEMA\ferramentas\cloudflared.exe)) {
  Invoke-WebRequest "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile 00-SISTEMA\ferramentas\cloudflared.exe
}

Write-Host "== 6/6 Pastas, chaves e modelo Whisper ==" -ForegroundColor Cyan
foreach ($d in "00-SISTEMA\cache","VIDEOS PRONTOS","VIDEOS PRONTOS\_publicados","VIDEO BRUTO\_inbox","PROJETOS","CARROSSEIS","PESQUISA") { New-Item -ItemType Directory -Force $d | Out-Null }
foreach ($par in @(@("elevenlabs.key.exemplo","elevenlabs.key"),@("instagram.json.exemplo","instagram.json"),@("telegram.key.exemplo","telegram.key"))) {
  $o = "00-SISTEMA\segredos\$($par[0])"; $n = "00-SISTEMA\segredos\$($par[1])"
  if (-not (Test-Path $n)) { Copy-Item $o $n; Write-Host "  criado $n  -> ABRA e cole sua chave (opcional)" }
}
python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8'); print('Whisper small ok')"
python 00-SISTEMA\bin\produzir.py cardapio traco
Push-Location FERRAMENTAS\Remotion; npx tsc --noEmit; Pop-Location
python 00-SISTEMA\bin\verificar.py
Write-Host "`nSe apareceu TUDO PRONTO acima, abra a pasta no Claude Code. Se algo ficou com X, feche e abra o PowerShell e rode este script de novo."
Write-Host "`nPronto. Abra a pasta no Claude Code e diga: faz um vídeo sobre X" -ForegroundColor Green
