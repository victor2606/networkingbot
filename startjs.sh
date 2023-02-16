#!/bin/bash
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -eq 0 ]
then
    printf "${RED}Введите имя JS файла (Можно с .js и без)!\n${NC}"
else
    NAME="${PWD##*/}_${1%.*}" 
    screen -SX $NAME quit
    screen -L -Logfile ${1%.*}.js.log -m -d -S $NAME "node" "$1"
    printf "${GREEN}JS файл \"${YELLOW}$1${GREEN}\" запущен.\nВойти в screeen: \"${YELLOW}screen -x $NAME${GREEN}\"\nЛоги сохраняются в \"${YELLOW}${1%.*}.js.log${GREEN}\"\n${NC}"
fi