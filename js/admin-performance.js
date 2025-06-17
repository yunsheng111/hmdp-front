/**
 * 管理员后台性能监控 - 性能优化监控工具
 * 监控页面跳转时间、接口响应时间、用户行为等性能指标
 * 
 * @author yate
 * @date 2025-06-18
 */

class AdminPerformanceMonitor {
    constructor() {
        // 性能数据存储
        this.metrics = {
            pageNavigation: [],
            apiResponse: [],
            resourceLoad: [],
            userInteraction: []
        };
        
        // 配置选项
        this.config = {
            maxRecords: 100, // 最大记录数
            reportInterval: 30000, // 报告间隔(30秒)
            enableConsoleLog: true, // 启用控制台日志
            enableLocalStorage: true, // 启用本地存储
            apiEndpoint: '/api/admin/performance', // 性能数据上报接口
            enableAutoReport: false // 启用自动上报
        };
        
        // 当前页面信息
        this.currentPage = {
            url: location.pathname,
            title: document.title,
            loadTime: Date.now()
        };
        
        // 性能观察器
        this.observers = {
            navigation: null,
            resource: null,
            paint: null
        };
        
        this.init();
    }

    /**
     * 初始化性能监控
     */
    init() {
        console.log('[AdminPerformance] 初始化管理员后台性能监控');
        
        // 监控页面导航性能
        this.initNavigationObserver();
        
        // 监控资源加载性能
        this.initResourceObserver();
        
        // 监控绘制性能
        this.initPaintObserver();
        
        // 监控用户交互
        this.initUserInteractionTracking();
        
        // 监控API请求
        this.initApiTracking();
        
        // 启动定期报告
        if (this.config.enableAutoReport) {
            this.startPeriodicReporting();
        }
        
        // 页面卸载时保存数据
        window.addEventListener('beforeunload', () => {
            this.saveMetricsToStorage();
        });
    }

    /**
     * 初始化导航性能观察器
     */
    initNavigationObserver() {
        if ('PerformanceObserver' in window) {
            try {
                this.observers.navigation = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            this.recordNavigationMetric(entry);
                        }
                    });
                });
                this.observers.navigation.observe({ entryTypes: ['navigation'] });
            } catch (error) {
                console.warn('[AdminPerformance] Navigation observer not supported', error);
            }
        }
    }

    /**
     * 初始化资源性能观察器
     */
    initResourceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                this.observers.resource = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'resource') {
                            this.recordResourceMetric(entry);
                        }
                    });
                });
                this.observers.resource.observe({ entryTypes: ['resource'] });
            } catch (error) {
                console.warn('[AdminPerformance] Resource observer not supported', error);
            }
        }
    }

    /**
     * 初始化绘制性能观察器
     */
    initPaintObserver() {
        if ('PerformanceObserver' in window) {
            try {
                this.observers.paint = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'paint') {
                            this.recordPaintMetric(entry);
                        }
                    });
                });
                this.observers.paint.observe({ entryTypes: ['paint'] });
            } catch (error) {
                console.warn('[AdminPerformance] Paint observer not supported', error);
            }
        }
    }

    /**
     * 初始化用户交互跟踪
     */
    initUserInteractionTracking() {
        // 跟踪点击事件
        document.addEventListener('click', (event) => {
            this.trackUserInteraction('click', event);
        });
        
        // 跟踪表单提交
        document.addEventListener('submit', (event) => {
            this.trackUserInteraction('submit', event);
        });
        
        // 跟踪页面滚动
        let scrollTimer = null;
        document.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.trackUserInteraction('scroll', { scrollY: window.scrollY });
            }, 100);
        });
    }

    /**
     * 初始化API请求跟踪
     */
    initApiTracking() {
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                this.recordApiMetric({
                    url: url,
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: endTime - startTime,
                    success: response.ok,
                    timestamp: Date.now()
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                this.recordApiMetric({
                    url: url,
                    method: args[1]?.method || 'GET',
                    status: 0,
                    duration: endTime - startTime,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                
                throw error;
            }
        };
        
        // 拦截XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const startTime = performance.now();
            
            xhr.addEventListener('loadend', () => {
                const endTime = performance.now();
                
                this.recordApiMetric({
                    url: xhr.responseURL,
                    method: xhr.method || 'GET',
                    status: xhr.status,
                    duration: endTime - startTime,
                    success: xhr.status >= 200 && xhr.status < 300,
                    timestamp: Date.now()
                });
            });
            
            return xhr;
        }.bind(this);
    }

    /**
     * 记录导航性能指标
     */
    recordNavigationMetric(entry) {
        const metric = {
            type: 'navigation',
            url: entry.name,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstPaint: entry.responseEnd - entry.requestStart,
            timestamp: Date.now()
        };
        
        this.addMetric('pageNavigation', metric);
        
        if (this.config.enableConsoleLog) {
            console.log('[AdminPerformance] Navigation:', metric);
        }
    }

    /**
     * 记录资源加载性能指标
     */
    recordResourceMetric(entry) {
        // 只记录管理员相关资源
        if (!entry.name.includes('admin') && !entry.name.includes('/js/') && !entry.name.includes('/css/')) {
            return;
        }
        
        const metric = {
            type: 'resource',
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now()
        };
        
        this.addMetric('resourceLoad', metric);
    }

    /**
     * 记录绘制性能指标
     */
    recordPaintMetric(entry) {
        const metric = {
            type: 'paint',
            name: entry.name,
            startTime: entry.startTime,
            timestamp: Date.now()
        };
        
        this.addMetric('resourceLoad', metric);
    }

    /**
     * 记录API性能指标
     */
    recordApiMetric(data) {
        // 只记录管理员API
        if (!data.url.includes('/admin/')) {
            return;
        }
        
        this.addMetric('apiResponse', data);
        
        if (this.config.enableConsoleLog && data.duration > 1000) {
            console.warn('[AdminPerformance] Slow API:', data);
        }
    }

    /**
     * 跟踪用户交互
     */
    trackUserInteraction(type, event) {
        const metric = {
            type: type,
            target: event.target?.tagName || 'unknown',
            timestamp: Date.now()
        };
        
        if (type === 'click' && event.target) {
            metric.element = {
                id: event.target.id,
                className: event.target.className,
                text: event.target.textContent?.substring(0, 50)
            };
        }
        
        this.addMetric('userInteraction', metric);
    }

    /**
     * 手动跟踪页面导航
     */
    trackPageNavigation(fromPage, toPage) {
        const startTime = performance.now();
        
        return {
            complete: (success = true) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                const metric = {
                    type: 'manual_navigation',
                    from: fromPage,
                    to: toPage,
                    duration: duration,
                    success: success,
                    timestamp: Date.now()
                };
                
                this.addMetric('pageNavigation', metric);
                
                if (this.config.enableConsoleLog) {
                    console.log(`[AdminPerformance] Page navigation: ${fromPage} -> ${toPage} (${duration.toFixed(2)}ms)`);
                }
            }
        };
    }

    /**
     * 添加性能指标
     */
    addMetric(category, metric) {
        if (!this.metrics[category]) {
            this.metrics[category] = [];
        }
        
        this.metrics[category].push(metric);
        
        // 限制记录数量
        if (this.metrics[category].length > this.config.maxRecords) {
            this.metrics[category].shift();
        }
    }

    /**
     * 获取性能统计
     */
    getPerformanceStats() {
        const stats = {};
        
        Object.keys(this.metrics).forEach(category => {
            const metrics = this.metrics[category];
            if (metrics.length === 0) return;
            
            stats[category] = {
                count: metrics.length,
                latest: metrics[metrics.length - 1],
                average: this.calculateAverage(metrics),
                slowest: this.findSlowest(metrics)
            };
        });
        
        return stats;
    }

    /**
     * 计算平均值
     */
    calculateAverage(metrics) {
        if (metrics.length === 0) return 0;
        
        const durations = metrics
            .filter(m => m.duration !== undefined)
            .map(m => m.duration);
            
        if (durations.length === 0) return 0;
        
        return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }

    /**
     * 找到最慢的记录
     */
    findSlowest(metrics) {
        return metrics
            .filter(m => m.duration !== undefined)
            .reduce((slowest, current) => 
                current.duration > (slowest?.duration || 0) ? current : slowest, null);
    }

    /**
     * 保存指标到本地存储
     */
    saveMetricsToStorage() {
        if (!this.config.enableLocalStorage) return;
        
        try {
            const data = {
                metrics: this.metrics,
                timestamp: Date.now(),
                page: this.currentPage
            };
            
            localStorage.setItem('admin_performance_metrics', JSON.stringify(data));
        } catch (error) {
            console.warn('[AdminPerformance] Failed to save metrics to storage', error);
        }
    }

    /**
     * 从本地存储加载指标
     */
    loadMetricsFromStorage() {
        if (!this.config.enableLocalStorage) return;
        
        try {
            const data = localStorage.getItem('admin_performance_metrics');
            if (data) {
                const parsed = JSON.parse(data);
                this.metrics = parsed.metrics || {};
                console.log('[AdminPerformance] Loaded metrics from storage');
            }
        } catch (error) {
            console.warn('[AdminPerformance] Failed to load metrics from storage', error);
        }
    }

    /**
     * 启动定期报告
     */
    startPeriodicReporting() {
        setInterval(() => {
            this.generateReport();
        }, this.config.reportInterval);
    }

    /**
     * 生成性能报告
     */
    generateReport() {
        const stats = this.getPerformanceStats();
        const report = {
            timestamp: Date.now(),
            page: this.currentPage,
            stats: stats,
            summary: this.generateSummary(stats)
        };
        
        if (this.config.enableConsoleLog) {
            console.group('[AdminPerformance] Performance Report');
            console.table(report.summary);
            console.groupEnd();
        }
        
        return report;
    }

    /**
     * 生成性能摘要
     */
    generateSummary(stats) {
        const summary = {};
        
        Object.keys(stats).forEach(category => {
            const stat = stats[category];
            summary[category] = {
                count: stat.count,
                avgDuration: Math.round(stat.average || 0),
                maxDuration: Math.round(stat.slowest?.duration || 0)
            };
        });
        
        return summary;
    }

    /**
     * 清理性能数据
     */
    clearMetrics() {
        this.metrics = {
            pageNavigation: [],
            apiResponse: [],
            resourceLoad: [],
            userInteraction: []
        };
        
        if (this.config.enableLocalStorage) {
            localStorage.removeItem('admin_performance_metrics');
        }
        
        console.log('[AdminPerformance] Metrics cleared');
    }

    /**
     * 销毁监控器
     */
    destroy() {
        // 停止所有观察器
        Object.values(this.observers).forEach(observer => {
            if (observer) {
                observer.disconnect();
            }
        });
        
        // 保存最终数据
        this.saveMetricsToStorage();
        
        console.log('[AdminPerformance] Performance monitor destroyed');
    }
}

// 全局性能监控实例
let globalPerformanceMonitor = null;

/**
 * 获取性能监控实例
 */
function getPerformanceMonitor() {
    if (!globalPerformanceMonitor) {
        globalPerformanceMonitor = new AdminPerformanceMonitor();
    }
    return globalPerformanceMonitor;
}

/**
 * 便捷方法：跟踪页面导航
 */
function trackPageNavigation(fromPage, toPage) {
    return getPerformanceMonitor().trackPageNavigation(fromPage, toPage);
}

/**
 * 便捷方法：获取性能统计
 */
function getPerformanceStats() {
    return getPerformanceMonitor().getPerformanceStats();
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        getPerformanceMonitor();
    });
} else {
    getPerformanceMonitor();
}
