# Domain Sale

一个 Cloudflare Worker，为所有绑定域名自动展示独立的英文出售页。无需维护域名列表，无框架、数据库或外部字体。

## 本地预览

需要 Node.js 22 或更新版本。

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

打开 http://127.0.0.1:8787 。`.dev.vars` 中的 `PREVIEW_DOMAIN="example.com"` 用于模拟出售域名，可以改成其他域名（不含协议或路径）。仅 localhost、127.0.0.1 和 ::1 请求使用该覆盖；线上域名始终来自请求 URL。不要将 `.dev.vars` 提交到 Git。

```bash
npm run check
npm test
npm run build
```

`build` 执行 Wrangler 部署 dry-run，将产物输出到忽略的 `dist/`，不会部署。

## 修改联系邮箱

将 `wrangler.jsonc` 的 `vars.CONTACT_EMAIL` 从 `sales@example.com` 改成你的公开联系邮箱，再提交。邮箱是公开展示配置，无需设置为 secret。邮件主题自动带上当前出售域名。

## GitHub 仓库

本地仓库使用 `main` 分支。你需要在 GitHub 创建空仓库（不自动添加 README），然后填写 remote：

```bash
git remote add origin <YOUR_GITHUB_REMOTE>
git add .
git commit -m "Create domain sale Worker"
git push -u origin main
```

如果已经有初始提交，跳过 `git add` 和 `git commit`。

## Cloudflare 自动构建部署

在 Cloudflare Workers & Pages 中从 GitHub 导入此仓库，或为已有的 `domain-sale` Worker 连接 GitHub。选择以下配置：

| 配置项 | 值 |
| --- | --- |
| Worker 名称 | `domain-sale`（必须与 `wrangler.jsonc` 的 `name` 一致） |
| 生产分支 | `main` |
| 项目根目录 | 仓库根目录 |
| 构建命令 | `npm run check && npm test && npm run build` |
| 部署命令 | `npm run deploy` |

Cloudflare 自动安装依赖，仓库中的 `package-lock.json` 保证版本一致。生产分支推送触发构建部署。无需 GitHub Actions 或在 GitHub 配置 Cloudflare 密钥。首次连接及所需部署授权由 Cloudflare 控制台引导完成。

先在生成的 `workers.dev` 地址确认部署成功；该地址会展示自己的 hostname。真实出售域名绑定后，会显示对应域名。

参考：[Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

也可以手动部署：

```bash
npx wrangler login
npm run deploy
```

## 绑定多个出售域名

所有域名指向同一个 `domain-sale` Worker。域名必须处于相应 Cloudflare 账户可配置的 zone 中。路由在控制台管理，项目没有写死 `routes`；新增域名无需改代码或重新构建。

### 推荐：Custom Domains

在 Worker 的 Settings → Domains & Routes → Add → Custom Domain 中添加 `example.com`。Cloudflare 创建所需 DNS 记录并处理证书，不需要源站。每个新域名重复此操作。

如果还要支持 `www.example.com`，单独添加该 hostname；页面会展示 `example.com`。其他子域名（例如 `shop.example.com`）保持完整。Custom Domains 按 hostname 匹配，不支持通配符。如已有同名冲突 DNS 记录，先按控制台提示处理。

参考：[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

### 备选：Worker Routes

如果已使用代理 DNS，可在对应 zone 的 Workers Routes 中添加 `example.com/*`，Worker 选择 `domain-sale`。`www.example.com/*` 需单独绑定。需要覆盖子域名时可用 `*.example.com/*`，根域名仍需 `example.com/*`。

Routes 要求目标 hostname 存在开启橙云代理的 DNS 记录。如果该域名没有源站，优先使用上面的 Custom Domains。

参考：[Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)。

## 展示行为

- 从请求 URL 提取 hostname，忽略端口，转为小写，去掉开头的 `www.` 和末尾的点。
- 页面所有路径均显示同一出售页；支持 GET / HEAD，其他方法返回 405。
- banner 来自 `https://ascii.rest/banner/<DOMAIN>.svg?tagline=This%20domain%20is%20for%20sale`；CSS 灰度反色将其呈现为白字黑底。浏览器直接加载该服务的 SVG，无 Worker 代理。
- 页面默认提供文字标题；图片加载成功后替换标题，失败或禁用 JavaScript 时仍显示域名、出售标语及邮箱。
- 页面无域名共享 HTML 缓存，不使用查询参数或转发请求头覆盖域名。
- 上线后用至少两个真实绑定域名访问，核对 banner、浏览器标题和邮件主题，并在 Cloudflare Builds 查看推送对应的成功部署记录。
