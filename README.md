# Activity Refund Manager

基于 Vue 3、Express 和 MySQL 的活动报名与退款流程演示项目，包含用户报名门户与管理后台。

> 当前定位：本地学习与流程演示。退款和短信仅写入模拟记录，不会实际转账或发送短信；评论由管理员手动录入，没有电商平台抓取接口。不要接入真实支付、客户资料或直接暴露到公网。详见 [功能边界](docs/LIMITATIONS.md)。

## 功能与技术栈

- 用户门户：浏览活动、选择店铺、报名、补充订单资料、查询报名状态。
- 管理后台：活动与店铺管理、报名管理、评论规则评估、模拟退款与短信记录。
- 后端：Express、Sequelize、MySQL 8、JWT；管理员由环境变量配置。
- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router。

## 目录

```text
backend/             API、配置、模型、初始化和验证脚本
vue-redound/         Vue 前端（保留原目录名，包名已统一）
database/schema.sql  建表结构，不含业务数据
docs/                功能边界及整理验证报告
```

本地父目录 `vue` 保留原名，避免破坏现有路径；计划使用的公开仓库名为 `activity-refund-manager`。

## 本地启动

需要 Node.js 22.12+（或 24+）、npm、MySQL 8。以下命令在项目根目录执行。

### 1. 安装依赖

```sh
npm ci --prefix backend
npm ci --prefix vue-redound
```

### 2. 创建配置

PowerShell：

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item vue-redound/.env.example vue-redound/.env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

macOS/Linux 可使用 `cp` 替代 `Copy-Item`。将随机输出填入 `JWT_SECRET`，另行设置至少 12 字符的独立 `ADMIN_PASSWORD` 与数据库密码。示例中的占位值不能直接启动应用。

`backend/.env` 由 Node 的 `--env-file` 自动加载；前端使用 Vite 的 `.env.local`。`VITE_*` 会暴露到浏览器，不能存放密钥。

### 3. 准备独立数据库

通过本机 MySQL 管理工具执行以下 SQL，替换密码占位值，并与 `backend/.env` 保持一致：

```sql
CREATE DATABASE activity_refund_manager CHARACTER SET utf8mb4;
CREATE USER 'activity_refund_app'@'127.0.0.1' IDENTIFIED BY '<your-database-password>';
GRANT ALL PRIVILEGES ON activity_refund_manager.* TO 'activity_refund_app'@'127.0.0.1';
```

账号来源地址需与实际连接方式匹配；这里是同机 TCP 开发示例。应用不会创建数据库或数据库用户。

```sh
npm run db:init --prefix backend
npm run demo:seed --prefix backend
```

`db:init` 只创建缺失的表，不清空已有数据，也不迁移旧结构。`demo:seed` 要求业务表为空，添加虚构店铺、活动和一个报名用户；示例手机号为 `00000000000`。不要对已有业务库执行演示初始化。

默认 `DB_SYNC=false`，避免启动时自动改变数据库结构。旧数据库升级需要另行设计迁移。

### 4. 启动前后端

分别在两个终端执行：

```sh
npm run dev --prefix backend
```

```sh
npm run dev --prefix vue-redound -- --host 127.0.0.1 --port 5173 --strictPort
```

- 门户：`http://localhost:5173/`
- 后台：`http://localhost:5173/admin/login`
- API 健康接口：`http://127.0.0.1:3000/health`
- 登录账号来自 `ADMIN_USERNAME`，密码来自 `ADMIN_PASSWORD`；无需创建管理员数据库记录。

使用 localhost 访问前端以匹配默认 CORS。若修改地址或端口，同时调整 `CORS_ORIGINS` 与 `VITE_API_BASE_URL`。

## 验证与构建

```sh
npm run lint --prefix backend
npm test --prefix backend
npm run lint --prefix vue-redound
npm test --prefix vue-redound
npm run build --prefix vue-redound
```

后端单元测试使用临时随机凭据，不需要数据库。前端 build 包含 TypeScript 检查。

集成冒烟测试会写入测试记录：准备名字以 `_test` 结尾的独立数据库，配置 `backend/.env` 并执行 `db:init` 后运行：

```sh
npm run test:smoke --prefix backend
```

测试覆盖登录与未授权访问、店铺与活动创建、报名及重复报名、订单补充、评论规则评估、模拟退款与短信、状态查询。它保留虚构记录供排查，不会删除数据库。不要将测试配置指向业务库。

前端产物在 `vue-redound/dist/`；静态服务器需要将前端路由回退到 `index.html`。`npm start --prefix backend` 启动 API，但这不表示项目已经具备生产上线条件。

## 配置与授权

- 默认 API 仅监听 `127.0.0.1`；CORS 默认仅允许 `http://localhost:5173`。
- 配置示例、源码、SQL 结构与锁文件可提交；真实环境文件、依赖目录、构建产物和验证数据由根 `.gitignore` 排除。
- 本仓库提供演示源码，验证范围及未完成事项见 `docs/PRE_UPLOAD_REVIEW.md`。
- 本项目采用 **GNU GPL 第 3 版（GPL-3.0-only）**，完整条款见 [LICENSE](LICENSE)，版权、第三方依赖与修改说明见 [NOTICE.md](NOTICE.md)。
- 再分发或修改发布时须遵守 GPL 的署名、许可保留及对应源码提供要求；软件不提供担保，功能限制见 [LIMITATIONS.md](docs/LIMITATIONS.md)。
