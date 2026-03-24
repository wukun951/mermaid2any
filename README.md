# Mermaid Renderer MVP

一个面向桌面优先场景的 Mermaid 渲染与导出工具原型。

## 当前能力

- Mermaid 源码编辑区
- 400ms 防抖的实时渲染
- 渲染失败时保留上一次成功预览
- 内置流程图、时序图、状态图、类图模板
- 图表主题切换
- `SVG` / `PNG` 导出
- 本地草稿自动恢复

## 技术栈

- React 19
- TypeScript
- Vite
- mermaid

## 本地启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

代码检查：

```bash
npm run lint
```

## 目录结构

```text
src/
  data/
    templates.ts      # 模板与主题配置
  lib/
    download.ts       # SVG / PNG 导出与复制
    mermaid.ts        # Mermaid 渲染封装
  App.tsx             # 主界面与交互编排
  App.css             # 页面布局与组件样式
  index.css           # 全局主题与基础样式
```

## 下一步建议

1. 把纯 `textarea` 升级成 Monaco 编辑器，补语法高亮和更强的错误定位。
2. 增加样例库与视觉回归测试，保护导出一致性。
3. 按需补上 `PDF` 导出、分享链接、服务端批量渲染。
