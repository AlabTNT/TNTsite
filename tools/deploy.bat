@echo off
echo ====================================
echo  1. Packaging tools project...
echo ====================================
tar -czf deploy-tools.tar.gz --exclude=deploy-tools.tar.gz .

echo.
echo ====================================
echo  2. Uploading to alabtnt.cn server...
echo ====================================
ssh root@alabtnt.cn "mkdir -p /opt/alabtnt-tools"
scp deploy-tools.tar.gz root@alabtnt.cn:/opt/alabtnt-tools/

echo.
echo ====================================
echo  3. Extracting and installing on server...
echo ====================================
ssh root@alabtnt.cn "cd /opt/alabtnt-tools && tar -xzf deploy-tools.tar.gz && npm install && bash install_tools.sh"

echo.
echo ====================================
echo  Deployment complete!
echo ====================================
pause
