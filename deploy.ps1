$ErrorActionPreference = "Stop"

Write-Host "===================================="
Write-Host " 1. 正在构建 Next.js 静态文件..."
Write-Host "===================================="
# 确保 npm 在环境变量中（防万一）
$env:Path += ";C:\Program Files\nodejs\"
& "C:\Program Files\nodejs\npm.cmd" run build

Write-Host "`n===================================="
Write-Host " 2. 正在打包 standalone 产物..."
Write-Host "===================================="
Copy-Item -Recurse -Force .next\static .next\standalone\.next\
Copy-Item -Recurse -Force public .next\standalone\

Set-Location .next\standalone
# 打包为 deploy.tar.gz
tar -czf ..\..\deploy.tar.gz .
Set-Location ..\..

Write-Host "`n===================================="
Write-Host " 3. 正在上传至 alabtnt.cn 服务器..."
Write-Host "===================================="
scp deploy.tar.gz root@alabtnt.cn:/opt/alabtnt-web/

Write-Host "`n===================================="
Write-Host " 4. 正在解压并重启服务..."
Write-Host "===================================="
ssh root@alabtnt.cn "cd /opt/alabtnt-web && tar -xzf deploy.tar.gz && systemctl restart alabtnt-web"

Write-Host "`n===================================="
Write-Host " 部署完成！可以刷新浏览器查看啦！"
Write-Host "===================================="
