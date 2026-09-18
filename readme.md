# LGI 运行数据与商业化看板

基于 React、TypeScript、Tailwind CSS 与 shadcn/ui 组件模式构建的纯前端数据后台。目前使用完整的 mock 数据，可直接部署到 Vercel，无需服务端渲染。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:5173`。

## 环境构建

```bash
npm run build:pre
npm run build:prod
npm run preview
```

Vercel 部署使用 `npm run build`（默认 prod），输出目录为 `dist`。后台跳转时通过 `token` 和 `env=pre|prod` 传入登录信息与运行环境，Dashboard 会持久化这两项信息并立即从地址栏中移除参数。
