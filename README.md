# LOGOPIM 产品标识管理平台

用户体验处产品标识管理后台系统（LOGO PIM）

## 快速启动（本地开发）

```bash
npm install
node server.js
```

访问:
- 后台管理: http://localhost:3005/ （账号 admin / 密码 admin123）
- 前台门户: http://localhost:3005/portal

## 技术栈

- **后端**: Node.js + Express
- **前台**: 原生 HTML/CSS/JS（Figma 设计稿实现）
- **后台**: Vue 3 + Element Plus（若依风格）
- **存储**: JSON 文件（data/ 目录）
- **文件**: 本地文件系统（uploads/ 目录）

## 功能模块

### 后台管理
| 模块 | 功能 |
|------|------|
| 登录 | 账号密码 + 图形验证码，单管理员模式 |
| 产品分类管理 | 增删改查，排序，强关联删除校验 |
| 产品LOGO素材管理 | 核心模块，含文件上传、分类筛选、时间筛选 |
| 下载日志 | 记录前台下载行为，支持导出 CSV |
| 操作日志 | 管理员操作全记录 |
| 系统配置 | 文件上传限制、存储配置等 |

### 前台门户
- 产品卡片展示（动态加载自 API）
- 分类筛选标签
- 毛玻璃搜索框
- Download 下载弹窗（入场/出场动画）
- 自动记录下载日志

## API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/category/all` | 全部分类（前台用） |
| `GET /api/product/public/list` | 产品列表（前台用，可选 ?categoryId=） |
| `GET /api/product/public/download/:id` | 下载压缩包（自动记日志） |
| `POST /api/auth/login` | 管理员登录 |
| `GET /api/auth/captcha` | 获取验证码 |

## 部署到服务器

### 方式一：直接部署（推荐）

```bash
# 1. 服务器安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs git

# 2. 克隆项目
git clone https://github.com/cheng1221234/logo-pim-admin.git
cd logo-pim-admin

# 3. 一键部署
bash deploy.sh
```

### 方式二：Docker 部署

```bash
docker-compose up -d
```

### 方式三：PM2 手动部署

```bash
npm install --production
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx 反代（配置域名）

详见项目中的 `nginx.conf` 文件，配置后可通过域名访问。

## 目录结构

```
logo-pim-admin/
├── server.js             # Express 服务入口
├── database.js           # 数据存储层
├── ecosystem.config.js   # PM2 配置
├── nginx.conf            # Nginx 反代模板
├── deploy.sh             # 一键部署脚本
├── Dockerfile            # Docker 构建
├── docker-compose.yml    # Docker Compose
├── routes/               # API 路由
│   ├── auth.js           # 登录/验证码
│   ├── category.js       # 分类管理
│   ├── product.js        # 产品管理
│   ├── download.js       # 下载日志
│   ├── operation.js      # 操作日志
│   └── config.js         # 系统配置
├── middleware/           # 中间件
│   └── auth.js           # JWT 鉴权
├── public/
│   ├── admin/            # 后台管理前端（Vue3 SPA）
│   └── portal/           # 前台门户（原生页面）
├── data/                 # 数据存储（被 .gitignore）
├── uploads/              # 文件上传（被 .gitignore）
│   ├── logos/            # LOGO 预览图
│   └── zips/             # 压缩包
└── package.json
```
