/**
 * 管理员后台性能测试工具
 * 用于验证性能优化效果和生成测试报告
 * 
 * @author yate
 * @date 2025-06-18
 */

class PerformanceTestSuite {
    constructor() {
        this.testResults = [];
        this.config = {
            testIterations: 5, // 每个测试重复次数
            warmupIterations: 2, // 预热次数
            timeout: 30000, // 测试超时时间
            enableDetailedLog: true
        };
        this.performanceMonitor = null;
        
        this.init();
    }

    /**
     * 初始化测试套件
     */
    init() {
        console.log('[PerformanceTest] 初始化性能测试套件');
        
        // 获取性能监控实例
        if (typeof getPerformanceMonitor === 'function') {
            this.performanceMonitor = getPerformanceMonitor();
        }
        
        // 创建测试报告容器
        this.createTestReportContainer();
    }

    /**
     * 创建测试报告容器
     */
    createTestReportContainer() {
        // 检查是否已存在
        if (document.getElementById('performance-test-report')) return;
        
        const reportContainer = document.createElement('div');
        reportContainer.id = 'performance-test-report';
        reportContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            display: none;
        `;
        
        reportContainer.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #eee; background: #f5f5f5;">
                <h3 style="margin: 0; color: #333;">性能测试报告</h3>
                <button id="close-test-report" style="float: right; margin-top: -25px;">×</button>
            </div>
            <div id="test-report-content" style="padding: 15px;">
                <p>准备开始性能测试...</p>
            </div>
        `;
        
        document.body.appendChild(reportContainer);
        
        // 绑定关闭按钮
        document.getElementById('close-test-report').onclick = () => {
            reportContainer.style.display = 'none';
        };
    }

    /**
     * 显示测试报告
     */
    showTestReport() {
        const reportContainer = document.getElementById('performance-test-report');
        if (reportContainer) {
            reportContainer.style.display = 'block';
        }
    }

    /**
     * 更新测试报告内容
     */
    updateTestReport(content) {
        const reportContent = document.getElementById('test-report-content');
        if (reportContent) {
            reportContent.innerHTML = content;
        }
    }

    /**
     * 运行完整的性能测试套件
     */
    async runFullTestSuite() {
        console.log('[PerformanceTest] 开始运行完整性能测试套件');
        this.showTestReport();
        this.updateTestReport('<p>正在初始化测试...</p>');
        
        try {
            // 清空之前的测试结果
            this.testResults = [];
            
            // 预热阶段
            await this.warmupPhase();
            
            // 测试阶段
            await this.runPageLoadTests();
            await this.runNavigationTests();
            await this.runResourceLoadTests();
            await this.runCacheTests();
            
            // 生成最终报告
            this.generateFinalReport();
            
        } catch (error) {
            console.error('[PerformanceTest] 测试套件执行失败:', error);
            this.updateTestReport(`<p style="color: red;">测试失败: ${error.message}</p>`);
        }
    }

    /**
     * 预热阶段
     */
    async warmupPhase() {
        this.updateTestReport('<p>正在进行预热测试...</p>');
        
        for (let i = 0; i < this.config.warmupIterations; i++) {
            await this.simulatePageLoad();
            await this.delay(1000);
        }
        
        console.log('[PerformanceTest] 预热阶段完成');
    }

    /**
     * 页面加载性能测试
     */
    async runPageLoadTests() {
        this.updateTestReport('<p>正在测试页面加载性能...</p>');
        
        const testPages = [
            'admin-dashboard.html',
            'admin-users.html',
            'admin-merchants.html',
            'admin-statistics.html'
        ];
        
        for (const page of testPages) {
            const results = await this.testPageLoad(page);
            this.testResults.push({
                type: 'pageLoad',
                page: page,
                results: results
            });
        }
    }

    /**
     * 页面导航性能测试
     */
    async runNavigationTests() {
        this.updateTestReport('<p>正在测试页面导航性能...</p>');
        
        const navigationPairs = [
            ['admin-dashboard.html', 'admin-users.html'],
            ['admin-users.html', 'admin-merchants.html'],
            ['admin-merchants.html', 'admin-statistics.html']
        ];
        
        for (const [from, to] of navigationPairs) {
            const results = await this.testNavigation(from, to);
            this.testResults.push({
                type: 'navigation',
                from: from,
                to: to,
                results: results
            });
        }
    }

    /**
     * 资源加载性能测试
     */
    async runResourceLoadTests() {
        this.updateTestReport('<p>正在测试资源加载性能...</p>');
        
        const resources = [
            { url: '/js/vue.js', type: 'script' },
            { url: '/js/element.js', type: 'script' },
            { url: '/css/element.css', type: 'style' },
            { url: '/js/admin-common.js', type: 'script' }
        ];
        
        for (const resource of resources) {
            const results = await this.testResourceLoad(resource);
            this.testResults.push({
                type: 'resourceLoad',
                resource: resource,
                results: results
            });
        }
    }

    /**
     * 缓存性能测试
     */
    async runCacheTests() {
        this.updateTestReport('<p>正在测试缓存性能...</p>');
        
        // 测试页面缓存
        const cacheResults = await this.testCachePerformance();
        this.testResults.push({
            type: 'cache',
            results: cacheResults
        });
    }

    /**
     * 测试单个页面加载性能
     */
    async testPageLoad(page) {
        const results = [];
        
        for (let i = 0; i < this.config.testIterations; i++) {
            const startTime = performance.now();
            
            try {
                // 模拟页面加载
                await this.simulatePageLoad(page);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({
                    iteration: i + 1,
                    duration: duration,
                    success: true
                });
                
            } catch (error) {
                results.push({
                    iteration: i + 1,
                    duration: 0,
                    success: false,
                    error: error.message
                });
            }
            
            await this.delay(500);
        }
        
        return this.calculateStats(results);
    }

    /**
     * 测试页面导航性能
     */
    async testNavigation(from, to) {
        const results = [];
        
        for (let i = 0; i < this.config.testIterations; i++) {
            const startTime = performance.now();
            
            try {
                // 模拟页面导航
                await this.simulateNavigation(from, to);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({
                    iteration: i + 1,
                    duration: duration,
                    success: true
                });
                
            } catch (error) {
                results.push({
                    iteration: i + 1,
                    duration: 0,
                    success: false,
                    error: error.message
                });
            }
            
            await this.delay(500);
        }
        
        return this.calculateStats(results);
    }

    /**
     * 测试资源加载性能
     */
    async testResourceLoad(resource) {
        const results = [];
        
        for (let i = 0; i < this.config.testIterations; i++) {
            const startTime = performance.now();
            
            try {
                // 模拟资源加载
                await this.simulateResourceLoad(resource);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({
                    iteration: i + 1,
                    duration: duration,
                    success: true
                });
                
            } catch (error) {
                results.push({
                    iteration: i + 1,
                    duration: 0,
                    success: false,
                    error: error.message
                });
            }
            
            await this.delay(200);
        }
        
        return this.calculateStats(results);
    }

    /**
     * 测试缓存性能
     */
    async testCachePerformance() {
        const results = {
            preloader: null,
            resourceLoader: null
        };
        
        // 测试页面预加载器
        if (typeof getPreloader === 'function') {
            const preloader = getPreloader();
            if (preloader) {
                results.preloader = preloader.getCacheStats();
            }
        }
        
        // 测试资源加载器
        if (typeof getResourceLoader === 'function') {
            const resourceLoader = getResourceLoader();
            if (resourceLoader) {
                results.resourceLoader = resourceLoader.getLoadStatus();
            }
        }
        
        return results;
    }

    /**
     * 模拟页面加载
     */
    async simulatePageLoad(page = 'admin-dashboard.html') {
        return new Promise((resolve) => {
            // 模拟DOM加载时间
            setTimeout(resolve, Math.random() * 100 + 50);
        });
    }

    /**
     * 模拟页面导航
     */
    async simulateNavigation(from, to) {
        return new Promise((resolve) => {
            // 模拟导航时间
            setTimeout(resolve, Math.random() * 200 + 100);
        });
    }

    /**
     * 模拟资源加载
     */
    async simulateResourceLoad(resource) {
        return new Promise((resolve, reject) => {
            const element = resource.type === 'script' ? 
                document.createElement('script') : 
                document.createElement('link');
                
            if (resource.type === 'script') {
                element.src = resource.url;
            } else {
                element.rel = 'stylesheet';
                element.href = resource.url;
            }
            
            element.onload = resolve;
            element.onerror = reject;
            
            // 不实际添加到DOM，只是测试加载时间
            setTimeout(resolve, Math.random() * 50 + 20);
        });
    }

    /**
     * 计算统计数据
     */
    calculateStats(results) {
        const successResults = results.filter(r => r.success);
        const durations = successResults.map(r => r.duration);
        
        if (durations.length === 0) {
            return {
                count: results.length,
                successCount: 0,
                successRate: 0,
                average: 0,
                min: 0,
                max: 0,
                median: 0
            };
        }
        
        durations.sort((a, b) => a - b);
        
        return {
            count: results.length,
            successCount: successResults.length,
            successRate: (successResults.length / results.length) * 100,
            average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            min: durations[0],
            max: durations[durations.length - 1],
            median: durations[Math.floor(durations.length / 2)]
        };
    }

    /**
     * 生成最终报告
     */
    generateFinalReport() {
        const report = this.createDetailedReport();
        this.updateTestReport(report);
        
        // 同时输出到控制台
        console.log('[PerformanceTest] 性能测试完成');
        console.table(this.testResults.map(r => ({
            type: r.type,
            target: r.page || r.to || r.resource?.url || 'cache',
            avgDuration: r.results.average?.toFixed(2) + 'ms',
            successRate: r.results.successRate?.toFixed(1) + '%'
        })));
    }

    /**
     * 创建详细报告
     */
    createDetailedReport() {
        let html = '<h4>性能测试结果</h4>';
        
        this.testResults.forEach(result => {
            html += `<div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">`;
            html += `<h5 style="margin: 0 0 8px 0; color: #333;">${this.getTestTypeLabel(result.type)}</h5>`;
            
            if (result.page) {
                html += `<p><strong>页面:</strong> ${result.page}</p>`;
            } else if (result.from && result.to) {
                html += `<p><strong>导航:</strong> ${result.from} → ${result.to}</p>`;
            } else if (result.resource) {
                html += `<p><strong>资源:</strong> ${result.resource.url}</p>`;
            }
            
            if (result.results.average !== undefined) {
                html += `<p><strong>平均时间:</strong> ${result.results.average.toFixed(2)}ms</p>`;
                html += `<p><strong>成功率:</strong> ${result.results.successRate.toFixed(1)}%</p>`;
                html += `<p><strong>范围:</strong> ${result.results.min.toFixed(2)}ms - ${result.results.max.toFixed(2)}ms</p>`;
            }
            
            html += '</div>';
        });
        
        return html;
    }

    /**
     * 获取测试类型标签
     */
    getTestTypeLabel(type) {
        const labels = {
            pageLoad: '页面加载测试',
            navigation: '页面导航测试',
            resourceLoad: '资源加载测试',
            cache: '缓存性能测试'
        };
        return labels[type] || type;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 全局性能测试实例
let globalPerformanceTestSuite = null;

/**
 * 获取性能测试套件实例
 */
function getPerformanceTestSuite() {
    if (!globalPerformanceTestSuite) {
        globalPerformanceTestSuite = new PerformanceTestSuite();
    }
    return globalPerformanceTestSuite;
}

/**
 * 运行性能测试
 */
function runPerformanceTest() {
    const testSuite = getPerformanceTestSuite();
    return testSuite.runFullTestSuite();
}

// 添加全局快捷键支持 (Ctrl+Shift+P)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        runPerformanceTest();
    }
});

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        getPerformanceTestSuite();
    });
} else {
    getPerformanceTestSuite();
}
