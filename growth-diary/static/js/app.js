// 十一的成长日记 - JavaScript

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔟 十一的成长日记已加载');
    
    // 配置 marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false
        });
    }
    
    // 渲染所有 Markdown 内容
    renderMarkdownContent();
    
    // 添加动画效果
    animateTimelineItems();
    
    // 初始化搜索自动聚焦
    initSearchFocus();
    
    // 加载 API 数据（可选）
    // loadEntriesFromAPI();
});

// 渲染 Markdown 内容
function renderMarkdownContent() {
    const elements = document.querySelectorAll('.markdown-rendered');
    elements.forEach(el => {
        const markdown = el.getAttribute('data-markdown');
        if (markdown && typeof marked !== 'undefined') {
            const isExpanded = el.classList.contains('expanded');
            const html = marked.parse(markdown);
            el.innerHTML = html;
            if (!isExpanded) {
                // 收起状态：限制高度
                el.style.maxHeight = '150px';
                el.style.overflow = 'hidden';
                el.style.position = 'relative';
            }
        }
    });
}

// 展开/收起全文
function toggleFullContent(btn) {
    const content = btn.previousElementSibling;
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
        // 收起
        content.style.maxHeight = '150px';
        content.style.overflow = 'hidden';
        btn.textContent = '展开阅读全文 ↓';
        content.classList.remove('expanded');
    } else {
        // 展开
        content.style.maxHeight = 'none';
        content.style.overflow = 'visible';
        btn.textContent = '收起 ↑';
        content.classList.add('expanded');
    }
}

// 时间线项目动画
function animateTimelineItems() {
    const items = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    items.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(item);
    });
}

// 搜索页面自动聚焦
function initSearchFocus() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput && !searchInput.value) {
        searchInput.focus();
    }
}

// 从 API 加载条目（可选功能）
async function loadEntriesFromAPI() {
    try {
        const response = await fetch('/api/entries');
        const entries = await response.json();
        console.log('加载了', entries.length, '条日记');
        return entries;
    } catch (error) {
        console.error('加载失败:', error);
        return [];
    }
}

// 刷新数据
async function refreshData() {
    try {
        const response = await fetch('/api/refresh', {
            method: 'POST'
        });
        const result = await response.json();
        console.log(result.message);
        location.reload();
    } catch (error) {
        console.error('刷新失败:', error);
    }
}

// 标签过滤
function filterByTag(tag) {
    const url = new URL(window.location);
    url.searchParams.set('tag', tag);
    window.location.href = url.toString();
}

// 搜索高亮
function highlightSearchTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
    }
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--primary);
        color: var(--text);
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 添加动画关键帧
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
