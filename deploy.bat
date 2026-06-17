@echo off
echo ====================================
echo  1. Building Next.js static files...
echo ====================================
set PATH=C:\Program Files\nodejs\;%PATH%
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed. Exiting deployment.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================
echo  2. Packaging standalone artifact...
echo ====================================
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public

cd .next\standalone
tar -czf ..\..\deploy.tar.gz .
cd ..\..

echo.
echo ====================================
echo  3. Uploading to alabtnt.cn server...
echo ====================================
scp deploy.tar.gz root@alabtnt.cn:/opt/alabtnt-web/

echo.
echo ====================================
echo  4. Extracting and restarting service...
echo ====================================
ssh root@alabtnt.cn "cd /opt/alabtnt-web && rm -rf .next && tar -xzf deploy.tar.gz && systemctl restart alabtnt-web"

echo.
echo ====================================
echo  Deployment complete! Refresh browser!
echo ====================================
pause
