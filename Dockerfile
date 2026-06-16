# LOGOPIM - Docker 部署
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install --production

# 复制项目文件
COPY . .

# 创建必要目录
RUN mkdir -p uploads/logos uploads/zips data logs

EXPOSE 3005

CMD ["node", "server.js"]
