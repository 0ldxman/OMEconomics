@echo off
cd frontend/omeweb
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
echo === ЗАПУСК ФРОНТЕНДА ===
echo Дашборд будет доступен на http://localhost:3000
npm run dev
pause
