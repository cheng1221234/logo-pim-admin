#!/bin/bash
# LOGOPIM 部署脚本（Ubuntu/CentOS）
# 使用方法: bash deploy.sh

set -e

echo "============================================"
echo "  LOGOPIM 后台管理系统 - 部署脚本"
echo "============================================"

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[1/6] 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    sudo apt-get install -y nodejs
else
    echo "[1/6] Node.js $(node -v) 已安装"
fi

# 2. 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "[2/6] 安装 PM2..."
    npm install -g pm2
else
    echo "[2/6] PM2 已安装"
fi

# 3. 安装项目依赖
echo "[3/6] 安装项目依赖..."
npm install --production

# 4. 创建日志目录
echo "[4/6] 创建日志目录..."
mkdir -p logs

# 5. 启动服务
echo "[5/6] 启动服务..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 6. 检查状态
echo "[6/6] 检查服务状态..."
sleep 2
curl -s -o /dev/null -w "服务状态: HTTP %{http_code}\n" http://localhost:3005/api/category/all || echo "服务启动中，请稍后检查"

echo ""
echo "============================================"
echo "  部署完成！"
echo "  后台管理: http://服务器IP:3005/"
echo "  前台门户: http://服务器IP:3005/portal"
echo "  账号: admin  密码: admin123"
echo "============================================"
echo ""
echo "提示：请配置 Nginx 反向代理以使用 80 端口和域名访问。"
echo "  Nginx 配置模板已生成: nginx.conf"
