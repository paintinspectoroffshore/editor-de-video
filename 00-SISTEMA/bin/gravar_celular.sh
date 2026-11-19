#!/bin/bash
export MSYS_NO_PATHCONV=1
ADB="/c/Program Files (x86)/Iriun Webcam/adb.exe"
PKG=com.paintinspector.paint_inspector_pro
DEST="$(cd "$(dirname "$0")/../.." && pwd)/PROJETOS/18-11-2026_paint-inspector-pro/assets/app"
FAIL=0

foco() { "$ADB" shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1; }
noapp() { foco | grep -q "$PKG"; }

# espera o app voltar; se estiver no launcher, reabre; se for outra coisa (ligação etc.), só espera
esperar_app() {
  local n=0
  while ! noapp; do
    f=$(foco)
    if echo "$f" | grep -q "launcher"; then
      "$ADB" shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 3
    else
      echo "PAUSA: outra tela em foco ($f). Aguardando..."; sleep 5
    fi
    n=$((n+1)); [ $n -gt 240 ] && { echo "DESISTI: app não voltou"; exit 2; }
  done
}

g() { noapp || { FAIL=1; return 1; }; }
t()  { g && "$ADB" shell input tap $1 $2; }
sw() { g && "$ADB" shell input swipe $1 $2 $3 $4 ${5:-1400}; }
w()  { sleep $1; }

inicio() { # volta ao topo do Início SEM usar "voltar"
  g && "$ADB" shell input tap 146 2898; sleep .8
  g && "$ADB" shell input swipe 720 900 720 2600 300; sleep .8
  g && "$ADB" shell input tap 146 2898; sleep .6
}

clip() { # nome duracao funcao
  local nome=$1 dur=$2 fn=$3 tent=0
  while [ $tent -lt 4 ]; do
    tent=$((tent+1)); FAIL=0
    esperar_app
    inicio; [ $FAIL = 1 ] && { echo "interrompido antes de $nome"; continue; }
    "$ADB" shell screenrecord --size 720x1560 --bit-rate 8000000 --time-limit $dur /sdcard/$nome.mp4 &
    sleep 1.2
    $fn
    sleep 1.2
    wait
    if [ $FAIL = 1 ] || ! noapp; then
      echo "clipe $nome descartado (app saiu de foco); tentativa $tent"
      "$ADB" shell rm /sdcard/$nome.mp4 2>/dev/null; continue
    fi
    "$ADB" pull /sdcard/$nome.mp4 "$DEST/$nome.mp4" >/dev/null 2>&1; "$ADB" shell rm /sdcard/$nome.mp4
    echo "ok $nome"; return 0
  done
  echo "FALHOU $nome"; return 1
}

c_inicio() { w .6; sw 720 2400 720 1500 1300; w 2.2; sw 720 1500 720 900 1300; w 2; }
c_ambiental() { w .5; t 720 1200; w 3.5; sw 720 2400 720 1500 1500; w 2.5; sw 720 2400 720 1500 1500; w 1.5; }
c_lista() { # x y
  w .5; t $1 $2; w 3; sw 720 2400 720 1400 1500; w 2.2; sw 720 2400 720 1400 1500; w .8; }
c_normas() { c_lista 250 1900; }
c_procedimentos() { c_lista 720 1900; }
c_criterios() { w .5; t 1190 1900; w 4; sw 720 2400 720 1400 1500; w 2.2; sw 720 2400 720 1400 1500; w .8; }
c_calculos() { c_lista 760 2400; }
c_tintas() { c_lista 240 2400; }
c_cores() { w .5; t 240 2400; w 2.5; t 640 2160; w 3.5; sw 720 2400 720 1400 1500; w 2; }
c_relatorios() { w .5; t 994 2898; w 2.5; t 384 952; w 3; sw 720 2400 720 1400 1500; w 2; }
c_simulado() { w .5; t 1280 256; w 3.5; sw 720 2300 720 1500 1500; w 2; sw 720 1500 720 2300 1300; w .8; }
c_ranking() { w .5; t 1280 256; w 3; t 1336 244; w 3; sw 720 2300 720 1500 1500; w 2; }

mkdir -p "$DEST"
clip inicio 8 c_inicio
clip ambiental 10 c_ambiental
clip normas 8 c_normas
clip procedimentos 8 c_procedimentos
clip criterios 9 c_criterios
clip calculos 9 c_calculos
clip tintas 8 c_tintas
clip cores 9 c_cores
clip relatorios 9 c_relatorios
clip simulado 8 c_simulado
clip ranking 8 c_ranking
echo FIM
