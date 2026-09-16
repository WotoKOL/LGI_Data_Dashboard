# LGI 运行数据与商业化看板

基于 React、TypeScript、Tailwind CSS 与 shadcn/ui 组件模式构建的纯前端数据后台。目前使用完整的 mock 数据，可直接部署到 Vercel，无需服务端渲染。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:5173`。

## 生产构建

```bash
npm run build
npm run preview
```

Vercel 部署时使用默认 Vite 配置即可：构建命令为 `npm run build`，输出目录为 `dist`。
