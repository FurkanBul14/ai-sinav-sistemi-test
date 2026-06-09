@echo off
echo ========================================================
echo AI SINAV SISTEMI - OTOMATIK KURULUM VE BASLATMA SCRIPTI
echo ========================================================
echo.

echo 1. Root dizindeki npm bagimliliklari kuruluyor (concurrently vb.)...
call npm install
if %errorlevel% neq 0 (
    echo Root dizin npm install basarisiz oldu. Lutfen Node.js'in kurulu oldugundan emin olun.
    pause
    exit /b
)
echo Root npm install basarili.
echo.

echo 1.5 Olası dosya dizini hatasi düzeltiliyor (auth-service icinde auth-service varsa disari cikarilir)...
if exist "services\auth-service\auth-service\src" (
    echo Hatali ic ice klasor tespit edildi, xcopy ile duzeltiliyor...
    xcopy /E /I /Y "services\auth-service\auth-service\*" "services\auth-service\" >nul 2>&1
    rd /S /Q "services\auth-service\auth-service" >nul 2>&1
)
echo.

echo 2. Frontend ve Backend servisleri icin node_modules klasorleri olusturuluyor...
call npm run install:all
if %errorlevel% neq 0 (
    echo Servislerin kurulumu sirasinda bir hata olustu.
    pause
    exit /b
)
echo Tum Node.js modulleri basariyla kuruldu!
echo.

echo 3. AI Servisleri (Python) icin gereksinimler kuruluyor (Istege Bagli)...
if exist "ai-services\face-detection-service\requirements.txt" (
    echo Face Detection Service gereksinimleri kuruluyor...
    pip install -r ai-services\face-detection-service\requirements.txt
)
if exist "ai-services\eye-tracking-service\requirements.txt" (
    echo Eye Tracking Service gereksinimleri kuruluyor...
    pip install -r ai-services\eye-tracking-service\requirements.txt
)
if exist "ai-services\audio-analysis-service\requirements.txt" (
    echo Audio Analysis Service gereksinimleri kuruluyor...
    pip install -r ai-services\audio-analysis-service\requirements.txt
)
if exist "ai-services\risk-scoring-service\requirements.txt" (
    echo Risk Scoring Service gereksinimleri kuruluyor...
    pip install -r ai-services\risk-scoring-service\requirements.txt
)
echo AI servisleri icin kurulum denemesi tamamlandi.
echo.

echo ========================================================
echo KURULUM TAMAMLANDI! SISTEM BASLATILIYOR...
echo ========================================================
echo.
echo NOT: Tum servisler ayni pencerede veya alt pencerelerde calisacaktir.
echo Sistemi durdurmak icin CTRL+C tuslarina basabilirsiniz.
echo.

echo Arka planda takili kalan eski servisler temizleniyor...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo.

call npm run start:all

pause
