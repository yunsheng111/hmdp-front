/**
 * HMDP 性能监控模块
 * 监控页面加载时间、AJAX请求响应时间、资源加载时间等
 * @version 1.0.0
 * @author Claude 4.0 Sonnet
 */

(function(window) {
    'use strict';

    // 性能监控配置
    var PerformanceConfig = {
        // 是否启用监控
        enabled: true,
        // 是否在控制台输出日志
        debug: false,
        // 数据上报间隔（毫秒）
        reportInterval: 30000,
        // 最大存储的性能数据条数
        maxDataCount: 100,
        // 上报URL（可选）
        reportUrl: null
    };

    // 性能数据存储
    var performanceData = {
        pageLoad: [],
        ajaxRequests: [],
        resourceLoad: [],
        userInteraction: [],
        errors: []
    };

    // 工具函数
    var utils = {
        // 获取当前时间戳
        now: function() {
            return performance.now ? performance.now() : Date.now();
        },
        
        // 格式化时间
        formatTime: function(time) {
            return Math.round(time * 100) / 100;
        },
        
        // 获取页面URL
        getPageUrl: function() {
            return window.location.href;
        },
        
        // 获取用户代理
        getUserAgent: function() {
            return navigator.userAgent;
        },
        
        // 日志输出
        log: function(message, data) {
            if (PerformanceConfig.debug) {
                console.log('[HMDP Performance]', message, data);
            }
        }
    };

    // 页面加载性能监控
    var pageLoadMonitor = {
        // 记录页面加载性能
        recordPageLoad: function() {
            if (!window.performance || !window.performance.timing) {
                return;
            }

            var timing = window.performance.timing;
            var navigation = window.performance.navigation;
            
            var loadData = {
                timestamp: Date.now(),
                url: utils.getPageUrl(),
                userAgent: utils.getUserAgent(),
                // 页面加载各阶段时间
                navigationStart: timing.navigationStart,
                domainLookupStart: timing.domainLookupStart,
                domainLookupEnd: timing.domainLookupEnd,
                connectStart: timing.connectStart,
                connectEnd: timing.connectEnd,
                requestStart: timing.requestStart,
                responseStart: timing.responseStart,
                responseEnd: timing.responseEnd,
                domLoading: timing.domLoading,
                domInteractive: timing.domInteractive,
                domContentLoadedEventStart: timing.domContentLoadedEventStart,
                domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
                loadEventStart: timing.loadEventStart,
                loadEventEnd: timing.loadEventEnd,
                // 计算的性能指标
                dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                tcpTime: timing.connectEnd - timing.connectStart,
                requestTime: timing.responseStart - timing.requestStart,
                responseTime: timing.responseEnd - timing.responseStart,
                domParseTime: timing.domInteractive - timing.domLoading,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadCompleteTime: timing.loadEventEnd - timing.navigationStart,
                // 导航类型
                navigationType: navigation.type,
                redirectCount: navigation.redirectCount
            };

            performanceData.pageLoad.push(loadData);
            this.limitDataCount('pageLoad');
            
            utils.log('Page load recorded', loadData);
        },

        // 限制数据条数
        limitDataCount: function(type) {
            if (performanceData[type].length > PerformanceConfig.maxDataCount) {
                performanceData[type] = performanceData[type].slice(-PerformanceConfig.maxDataCount);
            }
        }
    };

    // AJAX请求性能监控
    var ajaxMonitor = {
        // 记录AJAX请求
        recordAjaxRequest: function(config, startTime, endTime, success, error) {
            var requestData = {
                timestamp: Date.now(),
                url: config.url || '',
                method: config.method || 'GET',
                startTime: startTime,
                endTime: endTime,
                duration: utils.formatTime(endTime - startTime),
                success: success,
                error: error,
                status: null,
                responseSize: 0
            };

            performanceData.ajaxRequests.push(requestData);
            pageLoadMonitor.limitDataCount('ajaxRequests');
            
            utils.log('AJAX request recorded', requestData);
        }
    };

    // 资源加载性能监控
    var resourceMonitor = {
        // 记录资源加载性能
        recordResourceLoad: function() {
            if (!window.performance || !window.performance.getEntriesByType) {
                return;
            }

            var resources = window.performance.getEntriesByType('resource');
            
            resources.forEach(function(resource) {
                // 避免重复记录
                var exists = performanceData.resourceLoad.some(function(item) {
                    return item.name === resource.name && item.startTime === resource.startTime;
                });
                
                if (!exists) {
                    var resourceData = {
                        timestamp: Date.now(),
                        name: resource.name,
                        type: resource.initiatorType,
                        startTime: utils.formatTime(resource.startTime),
                        duration: utils.formatTime(resource.duration),
                        size: resource.transferSize || 0,
                        domainLookupTime: utils.formatTime(resource.domainLookupEnd - resource.domainLookupStart),
                        connectTime: utils.formatTime(resource.connectEnd - resource.connectStart),
                        requestTime: utils.formatTime(resource.responseStart - resource.requestStart),
                        responseTime: utils.formatTime(resource.responseEnd - resource.responseStart)
                    };

                    performanceData.resourceLoad.push(resourceData);
                }
            });
            
            pageLoadMonitor.limitDataCount('resourceLoad');
            utils.log('Resource load recorded', performanceData.resourceLoad.length + ' resources');
        }
    };

    // 用户交互性能监控
    var interactionMonitor = {
        // 记录用户交互
        recordInteraction: function(type, target, startTime) {
            var endTime = utils.now();
            
            var interactionData = {
                timestamp: Date.now(),
                type: type,
                target: target,
                startTime: startTime,
                endTime: endTime,
                duration: utils.formatTime(endTime - startTime)
            };

            performanceData.userInteraction.push(interactionData);
            pageLoadMonitor.limitDataCount('userInteraction');
            
            utils.log('User interaction recorded', interactionData);
        },

        // 初始化交互监听
        initInteractionListeners: function() {
            var startTime = null;
            
            // 点击事件
            document.addEventListener('click', function(e) {
                startTime = utils.now();
                setTimeout(function() {
                    interactionMonitor.recordInteraction('click', e.target.tagName, startTime);
                }, 0);
            });
            
            // 表单提交事件
            document.addEventListener('submit', function(e) {
                startTime = utils.now();
                setTimeout(function() {
                    interactionMonitor.recordInteraction('submit', e.target.tagName, startTime);
                }, 0);
            });
        }
    };

    // 错误监控
    var errorMonitor = {
        // 记录JavaScript错误
        recordError: function(error, source, line, column) {
            var errorData = {
                timestamp: Date.now(),
                message: error,
                source: source,
                line: line,
                column: column,
                userAgent: utils.getUserAgent(),
                url: utils.getPageUrl()
            };

            performanceData.errors.push(errorData);
            pageLoadMonitor.limitDataCount('errors');
            
            utils.log('Error recorded', errorData);
        },

        // 初始化错误监听
        initErrorListeners: function() {
            window.addEventListener('error', function(e) {
                errorMonitor.recordError(e.message, e.filename, e.lineno, e.colno);
            });
            
            window.addEventListener('unhandledrejection', function(e) {
                errorMonitor.recordError('Unhandled Promise Rejection: ' + e.reason, '', 0, 0);
            });
        }
    };

    // 数据上报
    var reporter = {
        // 上报性能数据
        reportData: function() {
            if (!PerformanceConfig.reportUrl) {
                return;
            }

            var data = {
                timestamp: Date.now(),
                url: utils.getPageUrl(),
                userAgent: utils.getUserAgent(),
                performance: performanceData
            };

            // 使用sendBeacon或fetch发送数据
            if (navigator.sendBeacon) {
                navigator.sendBeacon(PerformanceConfig.reportUrl, JSON.stringify(data));
            } else if (window.fetch) {
                fetch(PerformanceConfig.reportUrl, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).catch(function(error) {
                    utils.log('Report failed', error);
                });
            }
            
            utils.log('Performance data reported', data);
        },

        // 开始定期上报
        startReporting: function() {
            if (PerformanceConfig.reportInterval > 0) {
                setInterval(this.reportData, PerformanceConfig.reportInterval);
            }
        }
    };

    // 公共API
    var HmdpPerformance = {
        // 配置
        config: PerformanceConfig,
        
        // 性能数据
        data: performanceData,
        
        // 记录AJAX请求
        recordAjax: ajaxMonitor.recordAjaxRequest,
        
        // 记录用户交互
        recordInteraction: interactionMonitor.recordInteraction,
        
        // 记录错误
        recordError: errorMonitor.recordError,
        
        // 获取性能摘要
        getSummary: function() {
            return {
                pageLoadCount: performanceData.pageLoad.length,
                ajaxRequestCount: performanceData.ajaxRequests.length,
                resourceLoadCount: performanceData.resourceLoad.length,
                userInteractionCount: performanceData.userInteraction.length,
                errorCount: performanceData.errors.length
            };
        },
        
        // 清除数据
        clearData: function() {
            Object.keys(performanceData).forEach(function(key) {
                performanceData[key] = [];
            });
        },
        
        // 手动上报数据
        report: reporter.reportData
    };

    // 初始化
    function init() {
        if (!PerformanceConfig.enabled) {
            return;
        }

        // 页面加载完成后记录性能数据
        if (document.readyState === 'complete') {
            pageLoadMonitor.recordPageLoad();
            resourceMonitor.recordResourceLoad();
        } else {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    pageLoadMonitor.recordPageLoad();
                    resourceMonitor.recordResourceLoad();
                }, 0);
            });
        }

        // 初始化交互和错误监听
        interactionMonitor.initInteractionListeners();
        errorMonitor.initErrorListeners();
        
        // 开始定期上报
        reporter.startReporting();
        
        utils.log('Performance monitor initialized');
    }

    // 导出到全局
    window.HmdpPerformance = HmdpPerformance;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
