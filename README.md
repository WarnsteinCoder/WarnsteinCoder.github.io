# Warnstein 技术档案

这是一个以 Markdown 为内容源、由 GitHub Pages 发布的静态技术博客。首页保持手工设计，文章、搜索索引、文章页、RSS 和 sitemap 都由构建脚本自动生成。

## 写一篇文章

在 `content/posts/` 新建一个 `.md` 文件。推荐从 `content/posts/markdown-writing.md` 复制 frontmatter：

~~~yaml
---
title: 我的文章标题
date: 2026-08-26
category: 系统设计
tags:
  - Rust
  - 数据库
description: 一句话摘要，会显示在首页。
draft: false
---
~~~

正文可以直接用 Typora 编辑，支持标题、粗体、斜体、链接、图片、引用、有序列表、无序列表、表格、任务列表、代码高亮、代码复制、行内公式、独立公式、脚注和 Obsidian 风格 Callout。

行内公式写成 `$E = mc^2$`，独立公式使用一对 `$$` 包围。`draft: true` 的文章不会发布。

图片可以放在 `content/assets/`，构建后会复制到 `/assets/`；例如在文章中写 `![架构图](/assets/architecture.png)`。

Callout 写法如下，类型支持 `note`、`abstract`、`info`、`todo`、`tip`、`success`、`question`、`warning`、`failure`、`danger`、`bug`、`example`、`quote`，也兼容 `summary`、`tldr`、`help`、`faq`、`attention`、`caution`、`fail`、`missing`、`error`、`cite` 等别名：

~~~markdown
> [!warning] 注意事项
> 这里写提示内容，可以继续使用 Markdown。

> [!tip]- 可折叠提示
> 在类型后加 `-` 默认折叠，加 `+` 默认展开。
~~~

## 本地构建和预览

~~~bash
npm install
npm run build
npm run preview
~~~

构建结果在 `dist/`，本地预览地址通常是 `http://localhost:8080`。编辑 Markdown 后重新执行 `npm run build` 即可看到变化。

## 发布

推送到 `main` 分支后，GitHub Actions 会执行 `npm ci`、`npm run build`，然后只发布 `dist/` 到 GitHub Pages。部署地址是 [warnsteincoder.github.io](https://warnsteincoder.github.io)。

项目已移除 VuePress 和 Theme Plume 默认模板，但保留了文档博客需要的核心能力，并把内容写作入口放回仓库本身。
