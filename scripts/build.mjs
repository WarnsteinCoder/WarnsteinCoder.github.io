import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import katex from 'katex';

const root = process.cwd();
const contentDir = path.join(root, 'content', 'posts');
const distDir = path.join(root, 'dist');
const siteUrl = 'https://warnsteincoder.github.io';
const assetVersion = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(root, 'styles.css')))
  .update(fs.readFileSync(path.join(root, 'script.js')))
  .digest('hex')
  .slice(0, 8);

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const slugify = (value) => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'post';

const formatDate = (value) => {
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10);
  return raw.replaceAll('-', '.') || '未设置日期';
};
const readingTime = (text) => Math.max(1, Math.ceil(text.replace(/\s/g, '').length / 360));

const calloutTypes = {
  note: { label: '提示', icon: 'N' },
  abstract: { label: '摘要', icon: 'A' },
  info: { label: '信息', icon: 'i' },
  todo: { label: '待办', icon: 'T' },
  tip: { label: '技巧', icon: '•' },
  success: { label: '成功', icon: '+' },
  question: { label: '问题', icon: '?' },
  warning: { label: '警告', icon: '!' },
  failure: { label: '失败', icon: '×' },
  danger: { label: '危险', icon: '!' },
  bug: { label: 'Bug', icon: 'B' },
  example: { label: '示例', icon: 'E' },
  quote: { label: '引用', icon: '“' },
};

const calloutAliases = {
  summary: 'abstract',
  tldr: 'abstract',
  help: 'question',
  faq: 'question',
  attention: 'warning',
  caution: 'warning',
  fail: 'failure',
  missing: 'failure',
  error: 'danger',
  cite: 'quote',
};

function normalizeCalloutType(value) {
  const key = String(value || '').toLowerCase();
  return calloutTypes[key] ? key : calloutAliases[key] || 'note';
}

function calloutBlock(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const firstLine = state.src.slice(start, state.eMarks[startLine]).trim();
  const match = firstLine.match(/^>\s*\[!([\w-]+)\]\s*([+-]?)(?:\s+(.*))?$/);
  if (!match) return false;
  let nextLine = startLine + 1;
  const bodyLines = [];
  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const rawLine = state.src.slice(lineStart, state.eMarks[nextLine]);
    if (!/^>\s?/.test(rawLine)) break;
    bodyLines.push(rawLine.replace(/^>\s?/, ''));
    nextLine += 1;
  }
  if (silent) return true;
  const token = state.push('callout', 'div', 0);
  token.block = true;
  token.content = bodyLines.join('\n');
  token.meta = {
    type: normalizeCalloutType(match[1]),
    title: match[3] || '',
    collapsible: Boolean(match[2]),
    collapsed: match[2] === '-',
  };
  token.map = [startLine, nextLine];
  state.line = nextLine;
  return true;
}

function mathBlock(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  if (state.src.slice(start, state.eMarks[startLine]).trim() !== '$$') return false;
  let nextLine = startLine + 1;
  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
    if (state.src.slice(lineStart, state.eMarks[nextLine]).trim() === '$$') break;
    nextLine += 1;
  }
  if (nextLine >= endLine) return false;
  if (silent) return true;
  const token = state.push('math_block', 'div', 0);
  token.block = true;
  token.content = state.src.slice(state.bMarks[startLine] + state.tShift[startLine] + 2, state.bMarks[nextLine]).trim();
  token.map = [startLine, nextLine + 1];
  state.line = nextLine + 1;
  return true;
}

function mathInline(state, silent) {
  const start = state.pos;
  if (state.src[start] !== '$' || state.src[start + 1] === '$') return false;
  const end = state.src.indexOf('$', start + 1);
  if (end < 0 || end === start + 1 || state.src[end - 1] === '\\') return false;
  if (silent) return true;
  const token = state.push('math_inline', 'math', 0);
  token.content = state.src.slice(start + 1, end);
  token.markup = '$';
  state.pos = end + 1;
  return true;
}

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
    return escapeHtml(code);
  },
})
  .use(anchor, { slugify })
  .use(footnote)
  .use(taskLists, { enabled: true, label: true, labelAfter: true });

markdown.block.ruler.before('fence', 'math_block', mathBlock, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
markdown.block.ruler.before('blockquote', 'callout', calloutBlock, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
markdown.inline.ruler.before('escape', 'math_inline', mathInline);
markdown.renderer.rules.math_block = (tokens, index) => `<div class="math-block">${katex.renderToString(tokens[index].content, { displayMode: true, throwOnError: false })}</div>`;
markdown.renderer.rules.math_inline = (tokens, index) => katex.renderToString(tokens[index].content, { throwOnError: false });
markdown.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index];
  const language = (token.info || '').trim().split(/\s+/)[0].toLowerCase();
  const label = language || 'text';
  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(token.content, { language, ignoreIllegals: true }).value
    : escapeHtml(token.content);
  return `<div class="code-block" data-language="${escapeHtml(label)}"><div class="code-toolbar"><span class="code-language">${escapeHtml(label)}</span><button class="copy-code" type="button">复制</button></div><pre class="hljs"><code>${highlighted}</code></pre></div>`;
};
markdown.renderer.rules.callout = (tokens, index) => {
  const token = tokens[index];
  const meta = token.meta;
  const config = calloutTypes[meta.type];
  const title = meta.title || config.label;
  const content = markdown.render(token.content);
  const titleBar = `<span class="callout-icon" aria-hidden="true">${config.icon}</span><strong>${escapeHtml(title)}</strong>`;
  if (meta.collapsible) {
    return `<details class="callout" data-callout="${meta.type}"${meta.collapsed ? '' : ' open'}><summary class="callout-title">${titleBar}</summary><div class="callout-content">${content}</div></details>`;
  }
  return `<aside class="callout" data-callout="${meta.type}"><div class="callout-title">${titleBar}</div><div class="callout-content">${content}</div></aside>`;
};

function readPosts() {
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir).filter((file) => file.endsWith('.md')).map((file) => {
    const sourcePath = path.join(contentDir, file);
    const parsed = matter(fs.readFileSync(sourcePath, 'utf8'));
    const data = parsed.data;
    const tags = Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    const title = String(data.title || path.basename(file, '.md'));
    return {
      ...data,
      title,
      slug: slugify(data.slug || path.basename(file, '.md')),
      tags,
      category: String(data.category || tags[0] || '未分类'),
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || '1970-01-01'),
      description: String(data.description || ''),
      draft: data.draft === true,
      sourcePath,
      raw: parsed.content,
      html: markdown.render(parsed.content),
      minutes: readingTime(parsed.content),
    };
  }).filter((post) => !post.draft).sort((a, b) => b.date.localeCompare(a.date));
}

function replaceSection(source, startMarker, endMarker, content) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < start) throw new Error(`Missing template markers: ${startMarker}`);
  return `${source.slice(0, start + startMarker.length)}\n${content}\n${source.slice(end)}`;
}

function renderNote(post) {
  const searchData = [post.title, post.description, post.category, ...post.tags].join(' ');
  return `<article class="note-item" data-tags="${escapeHtml([post.category, ...post.tags].join(' '))}" data-title="${escapeHtml(post.title)}" data-search="${escapeHtml(searchData)}">
  <div class="note-date">${escapeHtml(formatDate(post.date))}</div><div class="note-main"><h3><a href="/articles/${post.slug}/">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.description)}</p></div><div class="note-tag">${escapeHtml(post.category)}</div><span class="note-arrow" aria-hidden="true">↗</span>
</article>`;
}

function renderFilters(posts) {
  const categories = [...new Set(posts.map((post) => post.category))];
  return ['全部', ...categories].map((category, index) => `<button class="filter-button${index === 0 ? ' is-active' : ''}" type="button" data-tag="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('\n');
}

function renderLatest(post) {
  if (!post) return `<div class="article-label"><span class="section-index">03 / latest deep dive</span><span>还没有文章</span></div><div class="article-layout"><div><p class="article-kicker">START WRITING</p><h2 id="article-title">把第一篇技术笔记写下来</h2></div><div class="article-content"><p>在 content/posts/ 中创建一个 Markdown 文件，填写标题、日期和标签，构建后它会自动出现在这里。</p><a class="text-link" href="#notes">查看写作入口 <span aria-hidden="true">↓</span></a></div></div>`;
  return `<div class="article-label"><span class="section-index">03 / latest deep dive</span><span>阅读时间 · ${post.minutes} min</span></div><div class="article-layout"><div><p class="article-kicker">${escapeHtml(post.category)} / ${escapeHtml(post.tags.join(' · '))}</p><h2 id="article-title">${escapeHtml(post.title)}</h2></div><div class="article-content"><p>${escapeHtml(post.description)}</p><p>${escapeHtml(post.excerpt || '打开文章，查看完整的技术记录与推导过程。')}</p><a class="text-link" href="/articles/${post.slug}/">阅读全文 <span aria-hidden="true">↗</span></a></div></div>`;
}

function pageShell({ title, description, body, article = false }) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(description)}" /><meta name="theme-color" content="#f1f3ec" /><title>${escapeHtml(title)} · WARNSTEIN</title><link rel="stylesheet" href="/styles.css?v=${assetVersion}" />${article ? '<link rel="stylesheet" href="/vendor/katex/katex.min.css" />' : ''}</head><body${article ? ' class="article-page"' : ''}><div class="site-shell" id="top"><header class="site-header"><a class="brand" href="/" aria-label="回到首页"><span class="brand-mark">W</span><span class="brand-copy"><strong>WARNSTEIN</strong><small>build, learn, share</small></span></a><nav class="primary-nav" aria-label="主导航"><a href="/#projects">项目库</a><a href="/#notes">技术笔记</a><a href="/#about">关于我</a></nav><div class="header-actions"><button class="icon-button" id="theme-toggle" type="button" aria-label="切换主题" title="切换主题"><span aria-hidden="true">☼</span></button><a class="github-link" href="https://github.com/warnsteincoder" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a><button class="menu-button" id="menu-toggle" type="button" aria-label="打开菜单" aria-expanded="false" title="打开菜单">☰</button></div></header><main>${body}</main><footer class="site-footer"><span>© 2026 Warnstein</span><span>built with markdown, curiosity, and time.</span><a href="#top">回到顶部 ↑</a></footer></div><script src="/script.js?v=${assetVersion}"></script></body></html>`;
}

function renderArticle(post) {
  const tags = post.tags.map((tag) => `<a href="/?tag=${encodeURIComponent(tag)}#notes">${escapeHtml(tag)}</a>`).join('');
  return pageShell({ title: post.title, description: post.description, article: true, body: `<article class="article-shell"><a class="back-link" href="/#notes">← 返回技术笔记</a><header class="article-header"><p class="section-index">${escapeHtml(post.category)} / ${escapeHtml(formatDate(post.date))}</p><h1>${escapeHtml(post.title)}</h1><p class="article-description">${escapeHtml(post.description)}</p><div class="article-meta"><span>阅读时间 · ${post.minutes} min</span><span class="article-tags">${tags}</span></div></header><div class="article-body">${post.html}</div><footer class="article-end"><a class="text-link" href="/#notes">← 更多技术笔记</a><a class="text-link" href="#top">回到顶部 ↑</a></footer></article>` });
}

function writeFeed(posts) {
  const items = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>${siteUrl}/articles/${post.slug}/</link><guid>${siteUrl}/articles/${post.slug}/</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escapeHtml(post.description)}</description></item>`).join('');
  fs.writeFileSync(path.join(distDir, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>WARNSTEIN 技术档案</title><link>${siteUrl}</link><description>Warnstein 的技术笔记</description>${items}</channel></rss>`);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[`${siteUrl}/`, ...posts.map((post) => `${siteUrl}/articles/${post.slug}/`)].map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
}

function build() {
  const posts = readPosts();
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(root, 'styles.css'), path.join(distDir, 'styles.css'));
  fs.copyFileSync(path.join(root, 'script.js'), path.join(distDir, 'script.js'));
  fs.cpSync(path.join(root, 'node_modules', 'katex', 'dist'), path.join(distDir, 'vendor', 'katex'), { recursive: true });
  const assetsDir = path.join(root, 'content', 'assets');
  if (fs.existsSync(assetsDir)) fs.cpSync(assetsDir, path.join(distDir, 'assets'), { recursive: true });
  let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  home = home.replace('href="styles.css"', `href="styles.css?v=${assetVersion}"`).replace('src="script.js"', `src="script.js?v=${assetVersion}"`);
  home = home.replace('data-post-count>00', `data-post-count>${String(posts.length).padStart(2, '0')}`).replace('显示 00 篇', `显示 ${String(posts.length).padStart(2, '0')} 篇`);
  home = replaceSection(home, '<!-- POSTS_START -->', '<!-- POSTS_END -->', posts.length ? posts.map(renderNote).join('\n') : '<p class="empty-state">还没有发布文章。在 content/posts/ 中添加 Markdown 文件。</p>');
  home = replaceSection(home, '<!-- FILTERS_START -->', '<!-- FILTERS_END -->', renderFilters(posts));
  home = replaceSection(home, '<!-- LATEST_POST_START -->', '<!-- LATEST_POST_END -->', renderLatest(posts[0]));
  fs.writeFileSync(path.join(distDir, 'index.html'), home);
  for (const post of posts) {
    const outputDir = path.join(distDir, 'articles', post.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderArticle(post));
  }
  writeFeed(posts);
  console.log(`Built ${posts.length} post(s) into dist/`);
}

build();
