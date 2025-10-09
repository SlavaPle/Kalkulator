# Скрипт запуска проекта в режиме разработки

Write-Host "🍕 Запуск PizzaCalk в режиме разработки..." -ForegroundColor Green

# Проверка наличия .env файла в backend
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️ Создание .env файла для backend..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" "backend\.env"
    Write-Host "📝 Не забудьте настроить переменные в backend\.env" -ForegroundColor Cyan
}

# Запуск проекта
Write-Host "🚀 Запуск проекта..." -ForegroundColor Green
npm run dev





