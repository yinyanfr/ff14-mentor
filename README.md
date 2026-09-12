# ff14-mentor

ff14 导随记录仪

用于记录《最终幻想 XIV》“随机任务：指导者”每次匹配到的副本。

## 本地开发

需要 Node.js 22.22.1 或更高版本。

```bash
npm install
npm run dev
```

## 常用命令

- `npm run build`：执行 TypeScript 检查并构建生产版本
- `npm run typecheck`：只执行 TypeScript 检查
- `npm run lint`：检查代码规范
- `npm run lint:fix`：自动修复可修复的 ESLint 问题
- `npm run format`：使用 Prettier 格式化项目
- `npm run format:check`：检查格式但不修改文件

提交代码时，Husky 会调用 lint-staged，对暂存区中的相关文件运行 ESLint 和 Prettier。
