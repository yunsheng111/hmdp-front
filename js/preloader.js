/**
 * 页面预加载器 - 管理员后台性能优化
 * 实现鼠标悬停预加载、智能缓存管理、资源预缓存等功能
 * 
 * @author yate
 * @date 2025-06-18
 */

class PagePreloader {
    constructor() {
        // 页面缓存存储
        this.pageCache = new Map();
        // 资源缓存存储
        this.resourceCache = new Map();
        // 预加载队列
        this.preloadQueue = [];
        // 正在预加载的URL集合
        this.preloading = new Set();
        // 预加载配置
        this.config = {
            maxCacheSize: 10, // 最大缓存页面数
            preloadDelay: 300, // 鼠标悬停延迟时间(ms)
            cacheExpiry: 5 * 60 * 1000, // 缓存过期时间(5分钟)
            enableResourcePreload: true, // 是否启用资源预加载
            enablePagePreload: true // 是否启用页面预加载
        };
        // 悬停定时器
        this.hoverTimer = null;
        
        this.init();
    }

    /**
     * 初始化预加载器
     */
    init() {
        console.log('[PagePreloader] 初始化页面预加载器');
        
        // 绑定菜单悬停事件
        this.bindMenuHoverEvents();
        
        // 预加载关键资源
        this.preloadCriticalResources();
        
        // 定期清理过期缓存
        this.startCacheCleanup();
        
        // 监听页面卸载，清理资源
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * 绑定菜单悬停事件
     */
    bindMenuHoverEvents() {
        // 查找所有管理员菜单链接
        const menuLinks = document.querySelectorAll('a[href*="admin-"]');
        
        menuLinks.forEach(link => {
            const targetUrl = link.getAttribute('href');
            if (targetUrl && this.isAdminPage(targetUrl)) {
                // 鼠标进入时开始预加载倒计时
                link.addEventListener('mouseenter', () => {
                    this.onMenuHover(targetUrl);
                });
                
                // 鼠标离开时取消预加载
                link.addEventListener('mouseleave', () => {
                    this.cancelPreload();
                });
            }
        });
    }

    /**
     * 判断是否为管理员页面
     */
    isAdminPage(url) {
        return url.includes('admin-') && url.endsWith('.html');
    }

    /**
     * 菜单悬停处理
     */
    onMenuHover(targetUrl) {
        if (!this.config.enablePagePreload) return;
        
        // 清除之前的定时器
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
        }
        
        // 设置延迟预加载
        this.hoverTimer = setTimeout(() => {
            this.preloadPage(targetUrl);
        }, this.config.preloadDelay);
    }

    /**
     * 取消预加载
     */
    cancelPreload() {
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = null;
        }
    }

    /**
     * 预加载页面
     */
    async preloadPage(url) {
        // 检查是否已经缓存或正在预加载
        if (this.pageCache.has(url) || this.preloading.has(url)) {
            return;
        }

        console.log(`[PagePreloader] 开始预加载页面: ${url}`);
        this.preloading.add(url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const html = await response.text();
                
                // 缓存页面内容
                this.cachePageContent(url, html);
                
                // 预加载页面中的关键资源
                this.preloadPageResources(html);
                
                console.log(`[PagePreloader] 页面预加载完成: ${url}`);
            }
        } catch (error) {
            console.warn(`[PagePreloader] 页面预加载失败: ${url}`, error);
        } finally {
            this.preloading.delete(url);
        }
    }

    /**
     * 缓存页面内容
     */
    cachePageContent(url, html) {
        // 检查缓存大小限制
        if (this.pageCache.size >= this.config.maxCacheSize) {
            // 删除最旧的缓存项
            const firstKey = this.pageCache.keys().next().value;
            this.pageCache.delete(firstKey);
        }

        // 添加到缓存
        this.pageCache.set(url, {
            content: html,
            timestamp: Date.now(),
            hits: 0
        });
    }

    /**
     * 预加载页面中的关键资源
     */
    preloadPageResources(html) {
        if (!this.config.enableResourcePreload) return;

        // 解析HTML中的关键资源
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 预加载CSS文件
        const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]');
        cssLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !this.resourceCache.has(href)) {
                this.preloadResource(href, 'style');
            }
        });
        
        // 预加载JavaScript文件
        const scriptTags = doc.querySelectorAll('script[src]');
        scriptTags.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !this.resourceCache.has(src)) {
                this.preloadResource(src, 'script');
            }
        });
    }

    /**
     * 预加载资源
     */
    preloadResource(url, type) {
        if (this.resourceCache.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        if (type === 'style') {
            link.as = 'style';
        } else if (type === 'script') {
            link.as = 'script';
        }
        
        link.onload = () => {
            this.resourceCache.set(url, {
                timestamp: Date.now(),
                type: type
            });
            console.log(`[PagePreloader] 资源预加载完成: ${url}`);
        };
        
        link.onerror = () => {
            console.warn(`[PagePreloader] 资源预加载失败: ${url}`);
        };
        
        document.head.appendChild(link);
    }

    /**
     * 预加载关键资源
     */
    preloadCriticalResources() {
        const criticalResources = [
            '/js/vue.js',
            '/js/element.js',
            '/js/axios.min.js',
            '/css/element.css'
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource, resource.endsWith('.js') ? 'script' : 'style');
        });
    }

    /**
     * 获取缓存的页面内容
     */
    getCachedPage(url) {
        const cached = this.pageCache.get(url);
        if (cached) {
            // 检查是否过期
            if (Date.now() - cached.timestamp > this.config.cacheExpiry) {
                this.pageCache.delete(url);
                return null;
            }
            
            // 增加命中次数
            cached.hits++;
            return cached.content;
        }
        return null;
    }

    /**
     * 启动缓存清理
     */
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // 每分钟清理一次
    }

    /**
     * 清理过期缓存
     */
    cleanupExpiredCache() {
        const now = Date.now();
        
        // 清理过期页面缓存
        for (const [url, data] of this.pageCache.entries()) {
            if (now - data.timestamp > this.config.cacheExpiry) {
                this.pageCache.delete(url);
                console.log(`[PagePreloader] 清理过期页面缓存: ${url}`);
            }
        }
        
        // 清理过期资源缓存
        for (const [url, data] of this.resourceCache.entries()) {
            if (now - data.timestamp > this.config.cacheExpiry) {
                this.resourceCache.delete(url);
                console.log(`[PagePreloader] 清理过期资源缓存: ${url}`);
            }
        }
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats() {
        return {
            pageCache: {
                size: this.pageCache.size,
                maxSize: this.config.maxCacheSize,
                items: Array.from(this.pageCache.entries()).map(([url, data]) => ({
                    url,
                    hits: data.hits,
                    age: Date.now() - data.timestamp
                }))
            },
            resourceCache: {
                size: this.resourceCache.size,
                items: Array.from(this.resourceCache.keys())
            },
            preloading: Array.from(this.preloading)
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
        }
        this.pageCache.clear();
        this.resourceCache.clear();
        this.preloading.clear();
    }
}

// 全局预加载器实例
let globalPreloader = null;

/**
 * 初始化页面预加载器
 */
function initPagePreloader() {
    if (!globalPreloader) {
        globalPreloader = new PagePreloader();
    }
    return globalPreloader;
}

/**
 * 获取预加载器实例
 */
function getPreloader() {
    return globalPreloader || initPagePreloader();
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPagePreloader);
} else {
    initPagePreloader();
}
