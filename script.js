const body = document.body;
const themeToggle = document.querySelector('#theme-toggle');
const menuToggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('.primary-nav');
const searchInput = document.querySelector('#search-input');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const noteItems = [...document.querySelectorAll('.note-item')];
const filterButtons = [...document.querySelectorAll('.filter-button')];

const savedTheme = localStorage.getItem('warnstein-theme-v2');
if (savedTheme === 'dark') body.classList.add('is-dark');

function updateThemeIcon() {
  const isDark = body.classList.contains('is-dark');
  themeToggle.querySelector('span').textContent = isDark ? '☾' : '☼';
  themeToggle.setAttribute('aria-label', isDark ? '切换为浅色主题' : '切换为深色主题');
  themeToggle.title = isDark ? '切换为浅色主题' : '切换为深色主题';
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('is-dark');
  localStorage.setItem('warnstein-theme-v2', body.classList.contains('is-dark') ? 'dark' : 'light');
  updateThemeIcon();
});
updateThemeIcon();

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
  return Promise.resolve();
}

document.querySelectorAll('.copy-code').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.closest('.code-block')?.querySelector('code');
    if (!code) return;
    try {
      await copyText(code.textContent || '');
      const originalLabel = button.textContent;
      button.textContent = '已复制';
      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.textContent = originalLabel;
        button.classList.remove('is-copied');
      }, 1400);
    } catch {
      button.textContent = '复制失败';
      window.setTimeout(() => { button.textContent = '复制'; }, 1400);
    }
  });
});

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '×' : '☰';
  });
}

if (nav && menuToggle) {
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }));
}

let activeTag = '全部';

function filterNotes() {
  const query = searchInput?.value.trim().toLowerCase() || '';
  let visible = 0;
  noteItems.forEach((item) => {
    const tags = (item.dataset.tags || '').split(/\s+/).filter(Boolean);
    const matchesTag = activeTag === '全部' || tags.includes(activeTag);
    const searchable = `${item.dataset.search || ''} ${item.dataset.title || ''} ${item.dataset.tags || ''} ${item.innerText}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const shouldShow = matchesTag && matchesQuery;
    item.hidden = !shouldShow;
    if (shouldShow) visible += 1;
  });
  if (resultCount) resultCount.textContent = `显示 ${String(visible).padStart(2, '0')} 篇`;
  if (emptyState) emptyState.hidden = visible !== 0;
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeTag = button.dataset.tag;
  filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
  filterNotes();
}));
if (searchInput) searchInput.addEventListener('input', filterNotes);
filterNotes();

document.querySelectorAll('[data-filter]').forEach((card) => card.addEventListener('click', () => {
  const tag = card.dataset.filter;
  const button = filterButtons.find((item) => item.dataset.tag === tag);
  if (button) button.click();
}));

const requestedTag = new URLSearchParams(window.location.search).get('tag');
if (requestedTag) {
  const requestedButton = filterButtons.find((button) => button.dataset.tag === requestedTag);
  if (requestedButton) requestedButton.click();
}
