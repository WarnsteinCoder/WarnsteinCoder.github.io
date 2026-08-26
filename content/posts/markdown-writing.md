---
title: 用 Markdown 写一篇真正可读的技术文档
date: 2026-08-26
category: 写作系统
tags:
  - Markdown
  - 写作系统
  - KaTeX
description: 从 frontmatter 到公式、代码和脚注，这个博客的 Markdown 写作约定。
excerpt: 以后只需要维护 Markdown 源文件，构建器会负责文章页、首页索引和站点订阅。
---

这篇文章也是博客的写作示例。你可以在 content/posts/ 中编辑 Markdown，保存后运行 npm run build，文章就会出现在首页。

## 一篇文章需要什么

文件顶部的 YAML frontmatter 用来描述文章：

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

正文支持常见 Markdown 语法，包括列表、表格、引用、任务列表和代码块。

| 能力 | 写法 | 构建结果 |
| --- | --- | --- |
| 行内公式 | $E = mc^2$ | KaTeX |
| 代码高亮 | fenced code | highlight.js |
| 任务列表 | - [x] | 可读的清单 |

## 公式渲染

行内公式可以写成 $E = mc^2$。独立公式使用一对美元符号：

$$
\mathcal{L}(\theta) = -\sum_{i=1}^{n} y_i \log p_\theta(y_i \mid x_i)
$$

公式在构建阶段由 KaTeX 渲染，因此文章在 GitHub Pages 上打开时不需要运行 Node 服务。

## 代码与任务列表

~~~rust
fn main() {
    let answer = 6 * 7;
    println!("the answer is {answer}");
}
~~~

- [x] 用 Typora 编辑 Markdown
- [x] 提交到 GitHub
- [ ] 持续补充自己的推导

脚注也可以使用[^note]，适合放置不打断正文的补充说明。

[^note]: 这是 markdown-it-footnote 提供的脚注语法。
