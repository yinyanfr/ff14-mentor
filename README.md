# ff14-mentor

ff14 导随记录仪

用于记录《最终幻想 XIV》“随机任务：指导者”每次匹配到的副本。

## 功能

- 输入一个字符即可按当前语言搜索并记录副本
- 支持简中、繁中、日、英、德、法、韩七种界面语言
- 访客记录保存在浏览器，Google 登录后自动合并至 Firestore
- 编辑、备注、删除与“未完成”标记；未完成记录保留在统计中但不计入 2,000 次进度
- 响应式布局和明暗主题

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
- `npm test`：运行 Vitest 单元与组件测试
- `npm run test:rules:emulator`：在 Firestore Emulator 中验证安全规则

提交代码时，Husky 会调用 lint-staged，对暂存区中的相关文件运行 ESLint 和 Prettier。

## Firebase

应用使用 Firebase 项目 `ff14-mentor`。登录用户的记录位于
`users/{uid}/records/{recordId}`，访客数据不会上传。部署安全规则与登录配置：

```bash
npx -y firebase-tools@latest deploy --only auth,firestore:rules
```
