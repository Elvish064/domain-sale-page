# Domain Sale Page

为所有绑定域名自动展示独立的出售页，基于 Cloudflare Worker，仅需 Fork 即可部署。


## 快速开始

1. Fork 此仓库
2. 在 Workers 中连接到此仓库部署
3. 在 Variables and Secrets → Add 中添加 Text 类型的运行时变量:"CONTACT_EMAIL"= "sales@youremail.com"
4. 将需要展示的域名路由到此 Worker

## 本地预览

需要 Node.js 22 或更新版本。

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

打开 http://127.0.0.1:8787 。`.dev.vars` 中的 `PREVIEW_DOMAIN="example.com"` 用于模拟出售域名，可以改成其他域名（不含协议或路径）。

```bash
npm run check
npm test
npm run build
```

`build` 执行 Wrangler 部署 dry-run，将产物输出到忽略的 `dist/`，不会部署。
