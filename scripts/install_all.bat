@echo off
:: Script'in bulundugu klasorun bir ust klasorunu ROOT olarak al (cunku scripts altindayiz)
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%SCRIPT_DIR%") do set "ROOT=%%~dpI"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"
echo =======================================================
echo AI Mulakat Sistemi Kurulum ve Baglanti Scripti
echo =======================================================
echo.

set /p userearly=Docker ile tek tıkla kurup baslatmak ister misiniz? (Onerilen) (E/H): 
if /I "%userearly%"=="E" goto docker_install

echo [1/3] Frontend bagimliliklari kuruluyor (React, Vitest, Chart.js)...
cd frontend
call npm install
cd ..

echo.
echo [2/3] Backend (Node.js) bagimliliklari kuruluyor...
cd services\auth-service
call npm install
cd ..\..
cd services\exam-service
call npm install
cd ..\..
cd services\reporting-service
call npm install
cd ..\..
cd services\proctoring-service
call npm install
cd ..\..

echo.
echo [3/3] AI Servisleri (Python) bagimliliklari kuruluyor...
cd ai-services\audio-analysis-service
pip install -r requirements.txt || goto python_error
cd ..\..
cd ai-services\eye-tracking-service
pip install -r requirements.txt || goto python_error
cd ..\..
cd ai-services\face-detection-service
pip install -r requirements.txt || goto python_error
cd ..\..
cd ai-services\risk-scoring-service
pip install -r requirements.txt || goto python_error
cd ..\..

echo.
echo Kurulum Tamamlandi! Testleri calistirmak icin:
echo frontend klasorune gidip 'npm run test' yapabilirsiniz.
pause
exit /b

:python_error
echo.
echo [HATA] Python paketleri kurulurken (büyük ihtimalle pydantic-core ve C++ derleyici eksikligi yuzunden) bir hata olustu.
echo Docker kullanarak devam etmek ister misiniz? (E/H)
set /p userchoice=
if /I "%userchoice%"=="E" goto docker_install
echo islem iptal edildi.
pause
exit /b

:docker_install
echo.
echo Docker ile kurulum ve baslatma islemi basliyor...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Docker bilgisayarinizda yuklu degil veya calismiyor! Lutfen Docker Desktop'i baslatin.
    pause
    exit /b
)
docker-compose up --build
pause
