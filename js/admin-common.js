// {{CHENGQI:
// Action: Added
// Timestamp: [2024-07-31 19:00:00 +08:00]
// Reason: P-MOD-001 Frontend Integration - Centralized Axios configuration for Admin APIs.
// Principle_Applied: DRY, SRP, High Cohesion
// Architectural_Note (AR): This file encapsulates admin API communication logic.
// Documentation_Note (DW): Created admin-common.js for Sa-Token integration.
// }}
// {{START MODIFICATIONS}}
// 创建一个 Axios 实例专门用于管理员后台接口
const adminAxios = axios.create({
  baseURL: '/api', // 使用nginx代理，避免跨域问题
  timeout: 5000 // 请求超时时间
});

// 请求拦截器
adminAxios.interceptors.request.use(
  config => {
    // 从 sessionStorage 获取 token
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      // 如果存在 token，则添加到请求头
      // 使用Sa-Token配置的token名称
      config.headers['satoken'] = token;
      // 同时设置Authorization头，确保兼容性
      config.headers['authorization'] = token;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
adminAxios.interceptors.response.use(
  response => {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    if (response.data && response.data.success === false) {
      // 后端业务逻辑判定为失败 (Result.fail)
      console.error('API Error:', response.data.errorMsg || 'Unknown error');
      return Promise.reject(response.data.errorMsg || '操作失败');
    }
    // 直接返回 data 部分，简化调用层级
    return response.data;
  },
  error => {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    console.error('Response Error:', error.response || error.message);
    
    // 401错误表示未登录或token失效
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token和用户信息
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminInfo');
      
      // 检查是否是获取统计数据的请求
      const isStatsRequest = error.config && error.config.url && error.config.url.includes('/admin/stats/');
      
      // 如果不是统计数据请求且不是登录页面，则跳转到登录页
      if (!isStatsRequest && location.pathname !== '/admin-login.html') {
        location.href = '/admin-login.html';
      }
    }
    
    return Promise.reject(error.response ? error.response.data.errorMsg || error.message : error.message || '请求失败');
  }
);
// {{END MODIFICATIONS}}

// {{CHENGQI:
// Action: Added
// Timestamp: [2025-06-18 07:30:00 +08:00]
// Reason: P-OPT-001 Performance Optimization - Integrated page preloader, resource loader and performance monitoring.
// Principle_Applied: Performance First, User Experience
// Architectural_Note (AR): Enhanced admin common with performance optimization features.
// Documentation_Note (DW): Added performance optimization integration for admin pages.
// }}

/**
 * 管理员后台性能优化集成
 * 集成页面预加载、资源懒加载、性能监控等功能
 */

// 性能优化管理器
class AdminPerformanceManager {
    constructor() {
        this.preloader = null;
        this.resourceLoader = null;
        this.performanceMonitor = null;
        this.initialized = false;

        // 配置选项
        this.config = {
            enablePreloader: true,
            enableResourceLoader: true,
            enablePerformanceMonitor: true,
            enableTransitions: true
        };
    }

    /**
     * 初始化性能优化
     */
    async init() {
        if (this.initialized) return;

        console.log('[AdminPerformance] 初始化管理员后台性能优化');

        try {
            // 加载性能优化脚本
            await this.loadOptimizationScripts();

            // 初始化各个组件
            this.initializeComponents();

            // 设置页面切换优化
            this.setupPageTransitions();

            // 绑定全局事件
            this.bindGlobalEvents();

            this.initialized = true;
            console.log('[AdminPerformance] 性能优化初始化完成');

        } catch (error) {
            console.error('[AdminPerformance] 性能优化初始化失败:', error);
        }
    }

    /**
     * 加载优化脚本
     */
    async loadOptimizationScripts() {
        const scripts = [
            '/js/preloader.js',
            '/js/resource-loader.js',
            '/js/admin-performance.js'
        ];

        // 检查脚本是否已加载
        const loadPromises = scripts.map(script => {
            return new Promise((resolve, reject) => {
                // 检查是否已存在
                if (document.querySelector(`script[src="${script}"]`)) {
                    resolve();
                    return;
                }

                const scriptElement = document.createElement('script');
                scriptElement.src = script;
                scriptElement.onload = resolve;
                scriptElement.onerror = reject;
                document.head.appendChild(scriptElement);
            });
        });

        await Promise.all(loadPromises);
    }

    /**
     * 初始化组件
     */
    initializeComponents() {
        // 初始化页面预加载器
        if (this.config.enablePreloader && typeof initPagePreloader === 'function') {
            this.preloader = initPagePreloader();
        }

        // 初始化资源加载器
        if (this.config.enableResourceLoader && typeof getResourceLoader === 'function') {
            this.resourceLoader = getResourceLoader();
        }

        // 初始化性能监控
        if (this.config.enablePerformanceMonitor && typeof getPerformanceMonitor === 'function') {
            this.performanceMonitor = getPerformanceMonitor();
        }
    }

    /**
     * 设置页面切换优化
     */
    setupPageTransitions() {
        if (!this.config.enableTransitions) return;

        // 加载过渡动画CSS
        this.loadTransitionCSS();

        // 设置页面切换动画
        this.setupPageSwitchAnimation();

        // 设置加载状态指示
        this.setupLoadingIndicators();
    }

    /**
     * 加载过渡动画CSS
     */
    loadTransitionCSS() {
        if (document.querySelector('link[href="/css/transitions.css"]')) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/transitions.css';
        document.head.appendChild(link);
    }

    /**
     * 设置页面切换动画
     */
    setupPageSwitchAnimation() {
        // 为页面容器添加过渡类
        const pageContainer = document.body;
        if (pageContainer) {
            pageContainer.classList.add('page-container');

            // 页面加载完成后添加激活类并移除切换状态
            setTimeout(() => {
                pageContainer.classList.add('page-transition', 'active');
                pageContainer.classList.remove('transitioning');
            }, 100);
        }
    }

    /**
     * 设置加载指示器
     */
    setupLoadingIndicators() {
        // 创建全局加载遮罩
        this.createLoadingOverlay();

        // 创建进度条
        this.createProgressBar();
    }

    /**
     * 创建加载遮罩
     */
    createLoadingOverlay() {
        if (document.getElementById('admin-loading-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'admin-loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * 创建进度条
     */
    createProgressBar() {
        if (document.getElementById('admin-progress-bar')) return;

        const progressBar = document.createElement('div');
        progressBar.id = 'admin-progress-bar';
        progressBar.className = 'progress-bar';
        document.body.appendChild(progressBar);
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 监听页面跳转
        this.bindNavigationEvents();

        // 监听AJAX请求
        this.bindAjaxEvents();

        // 监听表单提交
        this.bindFormEvents();
    }

    /**
     * 绑定导航事件
     */
    bindNavigationEvents() {
        // 拦截所有管理员页面链接点击
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href*="admin-"]');
            if (link && link.href.endsWith('.html')) {
                event.preventDefault();
                this.handlePageNavigation(link.href, link.textContent);
            }
        });
    }

    /**
     * 处理页面导航
     */
    async handlePageNavigation(targetUrl, linkText) {
        const currentPage = location.pathname;

        // 添加切换状态类（临时隐藏溢出）
        document.body.classList.add('transitioning');

        // 显示加载状态
        this.showLoading(`正在跳转到 ${linkText || '页面'}...`);

        // 开始性能跟踪
        let navigationTracker = null;
        if (this.performanceMonitor) {
            navigationTracker = this.performanceMonitor.trackPageNavigation(currentPage, targetUrl);
        }

        try {
            // 检查预加载缓存
            let cachedContent = null;
            if (this.preloader) {
                cachedContent = this.preloader.getCachedPage(targetUrl);
            }

            if (cachedContent) {
                console.log('[AdminPerformance] 使用预加载缓存');
                // 使用缓存内容（这里简化处理，实际应该替换页面内容）
                setTimeout(() => {
                    location.href = targetUrl;
                }, 100);
            } else {
                // 正常跳转
                location.href = targetUrl;
            }

            // 标记导航成功
            if (navigationTracker) {
                navigationTracker.complete(true);
            }

        } catch (error) {
            console.error('[AdminPerformance] 页面导航失败:', error);

            // 标记导航失败
            if (navigationTracker) {
                navigationTracker.complete(false);
            }

            // 隐藏加载状态
            this.hideLoading();

            // 移除切换状态类
            document.body.classList.remove('transitioning');

            // 降级到普通跳转
            location.href = targetUrl;
        }
    }

    /**
     * 绑定AJAX事件
     */
    bindAjaxEvents() {
        // 拦截adminAxios请求，添加加载状态
        if (typeof adminAxios !== 'undefined') {
            adminAxios.interceptors.request.use(
                config => {
                    // 显示进度条
                    this.showProgressBar();
                    return config;
                },
                error => {
                    this.hideProgressBar();
                    return Promise.reject(error);
                }
            );

            adminAxios.interceptors.response.use(
                response => {
                    // 隐藏进度条
                    this.hideProgressBar();
                    return response;
                },
                error => {
                    this.hideProgressBar();
                    return Promise.reject(error);
                }
            );
        }
    }

    /**
     * 绑定表单事件
     */
    bindFormEvents() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                // 为表单提交添加加载状态
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.add('btn-loading');
                    submitBtn.disabled = true;

                    // 设置超时恢复
                    setTimeout(() => {
                        submitBtn.classList.remove('btn-loading');
                        submitBtn.disabled = false;
                    }, 10000);
                }
            }
        });
    }

    /**
     * 显示加载状态
     */
    showLoading(text = '加载中...') {
        const overlay = document.getElementById('admin-loading-overlay');
        if (overlay) {
            const textElement = overlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = text;
            }
            overlay.classList.add('show');
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const overlay = document.getElementById('admin-loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    /**
     * 显示进度条
     */
    showProgressBar() {
        const progressBar = document.getElementById('admin-progress-bar');
        if (progressBar) {
            progressBar.classList.add('show');
            progressBar.style.width = '30%';

            // 模拟进度
            setTimeout(() => {
                progressBar.style.width = '60%';
            }, 200);
        }
    }

    /**
     * 隐藏进度条
     */
    hideProgressBar() {
        const progressBar = document.getElementById('admin-progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.classList.add('complete');

            setTimeout(() => {
                progressBar.classList.remove('show', 'complete');
                progressBar.style.width = '0%';
            }, 500);
        }
    }

    /**
     * 获取性能统计
     */
    getPerformanceStats() {
        if (this.performanceMonitor) {
            return this.performanceMonitor.getPerformanceStats();
        }
        return null;
    }
}

// 全局性能管理器实例
let globalAdminPerformanceManager = null;

/**
 * 获取性能管理器实例
 */
function getAdminPerformanceManager() {
    if (!globalAdminPerformanceManager) {
        globalAdminPerformanceManager = new AdminPerformanceManager();
    }
    return globalAdminPerformanceManager;
}

/**
 * 初始化管理员后台性能优化
 */
function initAdminPerformanceOptimization() {
    const manager = getAdminPerformanceManager();
    return manager.init();
}

// 页面加载完成后自动初始化性能优化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAdminPerformanceOptimization, 100);
    });
} else {
    setTimeout(initAdminPerformanceOptimization, 100);
}