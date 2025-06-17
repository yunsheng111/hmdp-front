/**
 * 资源懒加载管理器 - 管理员后台性能优化
 * 实现JavaScript资源懒加载、版本管理、错误处理等功能
 * 
 * @author yate
 * @date 2025-06-18
 */

class ResourceLoader {
    constructor() {
        // 已加载的脚本集合
        this.loadedScripts = new Set();
        // 已加载的样式集合
        this.loadedStyles = new Set();
        // 加载中的资源
        this.loading = new Map();
        // 加载失败的资源
        this.failed = new Set();
        // 资源版本管理
        this.versions = new Map();
        // 加载配置
        this.config = {
            timeout: 10000, // 加载超时时间
            retryCount: 2, // 重试次数
            retryDelay: 1000, // 重试延迟
            enableVersionControl: true, // 启用版本控制
            enableCache: true // 启用缓存
        };
        
        this.init();
    }

    /**
     * 初始化资源加载器
     */
    init() {
        console.log('[ResourceLoader] 初始化资源懒加载管理器');
        
        // 扫描已加载的资源
        this.scanExistingResources();
        
        // 设置全局错误处理
        this.setupGlobalErrorHandling();
    }

    /**
     * 扫描页面中已存在的资源
     */
    scanExistingResources() {
        // 扫描已加载的脚本
        document.querySelectorAll('script[src]').forEach(script => {
            const src = this.normalizeUrl(script.src);
            this.loadedScripts.add(src);
        });
        
        // 扫描已加载的样式
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = this.normalizeUrl(link.href);
            this.loadedStyles.add(href);
        });
        
        console.log(`[ResourceLoader] 扫描到 ${this.loadedScripts.size} 个脚本, ${this.loadedStyles.size} 个样式`);
    }

    /**
     * 标准化URL
     */
    normalizeUrl(url) {
        if (url.startsWith('/')) {
            return url;
        }
        if (url.startsWith('./')) {
            return url.substring(1);
        }
        if (url.includes('://')) {
            return url;
        }
        return '/' + url;
    }

    /**
     * 懒加载JavaScript脚本
     */
    async loadScript(src, options = {}) {
        const normalizedSrc = this.normalizeUrl(src);
        
        // 检查是否已加载
        if (this.loadedScripts.has(normalizedSrc)) {
            console.log(`[ResourceLoader] 脚本已加载: ${normalizedSrc}`);
            return Promise.resolve();
        }
        
        // 检查是否正在加载
        if (this.loading.has(normalizedSrc)) {
            console.log(`[ResourceLoader] 脚本加载中: ${normalizedSrc}`);
            return this.loading.get(normalizedSrc);
        }
        
        // 检查是否加载失败过
        if (this.failed.has(normalizedSrc) && !options.forceReload) {
            return Promise.reject(new Error(`脚本加载失败: ${normalizedSrc}`));
        }
        
        console.log(`[ResourceLoader] 开始加载脚本: ${normalizedSrc}`);
        
        const loadPromise = this.createScriptLoadPromise(normalizedSrc, options);
        this.loading.set(normalizedSrc, loadPromise);
        
        try {
            await loadPromise;
            this.loadedScripts.add(normalizedSrc);
            this.failed.delete(normalizedSrc);
            console.log(`[ResourceLoader] 脚本加载成功: ${normalizedSrc}`);
        } catch (error) {
            this.failed.add(normalizedSrc);
            console.error(`[ResourceLoader] 脚本加载失败: ${normalizedSrc}`, error);
            throw error;
        } finally {
            this.loading.delete(normalizedSrc);
        }
    }

    /**
     * 创建脚本加载Promise
     */
    createScriptLoadPromise(src, options) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false;
            script.defer = options.defer === true;
            
            // 设置属性
            if (options.type) {
                script.type = options.type;
            }
            if (options.crossorigin) {
                script.crossOrigin = options.crossorigin;
            }
            
            // 超时处理
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`脚本加载超时: ${src}`));
            }, this.config.timeout);
            
            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error(`脚本加载错误: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 懒加载CSS样式
     */
    async loadStyle(href, options = {}) {
        const normalizedHref = this.normalizeUrl(href);
        
        // 检查是否已加载
        if (this.loadedStyles.has(normalizedHref)) {
            console.log(`[ResourceLoader] 样式已加载: ${normalizedHref}`);
            return Promise.resolve();
        }
        
        // 检查是否正在加载
        if (this.loading.has(normalizedHref)) {
            console.log(`[ResourceLoader] 样式加载中: ${normalizedHref}`);
            return this.loading.get(normalizedHref);
        }
        
        console.log(`[ResourceLoader] 开始加载样式: ${normalizedHref}`);
        
        const loadPromise = this.createStyleLoadPromise(normalizedHref, options);
        this.loading.set(normalizedHref, loadPromise);
        
        try {
            await loadPromise;
            this.loadedStyles.add(normalizedHref);
            console.log(`[ResourceLoader] 样式加载成功: ${normalizedHref}`);
        } catch (error) {
            console.error(`[ResourceLoader] 样式加载失败: ${normalizedHref}`, error);
            throw error;
        } finally {
            this.loading.delete(normalizedHref);
        }
    }

    /**
     * 创建样式加载Promise
     */
    createStyleLoadPromise(href, options) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            // 设置属性
            if (options.media) {
                link.media = options.media;
            }
            if (options.crossorigin) {
                link.crossOrigin = options.crossorigin;
            }
            
            // 超时处理
            const timeout = setTimeout(() => {
                link.remove();
                reject(new Error(`样式加载超时: ${href}`));
            }, this.config.timeout);
            
            link.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            
            link.onerror = () => {
                clearTimeout(timeout);
                link.remove();
                reject(new Error(`样式加载错误: ${href}`));
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * 批量加载资源
     */
    async loadResources(resources) {
        const promises = resources.map(resource => {
            if (typeof resource === 'string') {
                // 根据扩展名判断资源类型
                return resource.endsWith('.css') ? 
                    this.loadStyle(resource) : 
                    this.loadScript(resource);
            } else {
                // 对象形式的资源配置
                return resource.type === 'style' ? 
                    this.loadStyle(resource.src, resource.options) : 
                    this.loadScript(resource.src, resource.options);
            }
        });
        
        return Promise.all(promises);
    }

    /**
     * 按需加载资源组
     */
    async loadResourceGroup(groupName) {
        const groups = {
            // 基础组件
            'base': [
                '/js/vue.js',
                '/js/element.js',
                '/css/element.css'
            ],
            // 图表组件
            'charts': [
                '/js/echarts.min.js'
            ],
            // 表格组件
            'tables': [
                '/js/table-utils.js'
            ],
            // 表单组件
            'forms': [
                '/js/form-validator.js'
            ]
        };
        
        const resources = groups[groupName];
        if (!resources) {
            throw new Error(`未知的资源组: ${groupName}`);
        }
        
        console.log(`[ResourceLoader] 加载资源组: ${groupName}`);
        return this.loadResources(resources);
    }

    /**
     * 预加载资源
     */
    preloadResource(src, type = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = this.normalizeUrl(src);
        link.as = type === 'style' ? 'style' : 'script';
        
        link.onload = () => {
            console.log(`[ResourceLoader] 资源预加载完成: ${src}`);
        };
        
        document.head.appendChild(link);
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 监听脚本加载错误
        window.addEventListener('error', (event) => {
            if (event.target.tagName === 'SCRIPT') {
                const src = this.normalizeUrl(event.target.src);
                this.failed.add(src);
                console.error(`[ResourceLoader] 全局脚本错误: ${src}`, event.error);
            }
        });
        
        // 监听样式加载错误
        window.addEventListener('error', (event) => {
            if (event.target.tagName === 'LINK') {
                const href = this.normalizeUrl(event.target.href);
                this.failed.add(href);
                console.error(`[ResourceLoader] 全局样式错误: ${href}`, event.error);
            }
        });
    }

    /**
     * 获取加载状态
     */
    getLoadStatus() {
        return {
            loadedScripts: Array.from(this.loadedScripts),
            loadedStyles: Array.from(this.loadedStyles),
            loading: Array.from(this.loading.keys()),
            failed: Array.from(this.failed)
        };
    }

    /**
     * 清理失败记录
     */
    clearFailedRecords() {
        this.failed.clear();
        console.log('[ResourceLoader] 已清理失败记录');
    }

    /**
     * 重置加载器
     */
    reset() {
        this.loadedScripts.clear();
        this.loadedStyles.clear();
        this.loading.clear();
        this.failed.clear();
        this.scanExistingResources();
        console.log('[ResourceLoader] 资源加载器已重置');
    }
}

// 全局资源加载器实例
let globalResourceLoader = null;

/**
 * 获取资源加载器实例
 */
function getResourceLoader() {
    if (!globalResourceLoader) {
        globalResourceLoader = new ResourceLoader();
    }
    return globalResourceLoader;
}

/**
 * 便捷方法：加载脚本
 */
function loadScript(src, options) {
    return getResourceLoader().loadScript(src, options);
}

/**
 * 便捷方法：加载样式
 */
function loadStyle(href, options) {
    return getResourceLoader().loadStyle(href, options);
}

/**
 * 便捷方法：加载资源组
 */
function loadResourceGroup(groupName) {
    return getResourceLoader().loadResourceGroup(groupName);
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        getResourceLoader();
    });
} else {
    getResourceLoader();
}
