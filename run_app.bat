@echo off
title StarMeet Launcher
echo Launching StarMeet Video Conferencing Platform...
start http://localhost:8000
python -m http.server 8000
pause
