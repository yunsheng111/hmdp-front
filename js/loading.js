/**
 * 全局加载指示器组件
 * 提供页面跳转和AJAX请求的加载动画
 * @version 1.0.0
 * @author Claude 4.0 Sonnet
 */

(function(window) {
    'use strict';

    // 加载器配置
    var LoadingConfig = {
        // 默认延迟显示时间（毫秒）
        delay: 300,
        // 最小显示时间（毫秒）
        minDuration: 300,
        // 默认加载文本
        defaultText: '加载中...',
        // 调试模式
        debug: false,
        // CSS类名
        cssClass: {
            overlay: 'hmdp-loading-overlay',
            spinner: 'hmdp-loading-spinner',
            text: 'hmdp-loading-text',
            show: 'hmdp-loading-show',
            hide: 'hmdp-loading-hide'
        }
    };

    // 加载器状态管理
    var LoadingState = {
        isVisible: false,
        showTimer: null,
        hideTimer: null,
        startTime: null,
        requestCount: 0
    };

    // 创建加载器DOM元素
    function createLoadingElement() {
        var overlay = document.createElement('div');
        overlay.className = LoadingConfig.cssClass.overlay;
        overlay.innerHTML = 
            '<div class="' + LoadingConfig.cssClass.spinner + '">' +
                '<div class="spinner-border" role="status">' +
                    '<span class="sr-only">Loading...</span>' +
                '</div>' +
                '<div class="' + LoadingConfig.cssClass.text + '">' + LoadingConfig.defaultText + '</div>' +
            '</div>';
        
        return overlay;
    }

    // 获取或创建加载器元素
    function getLoadingElement() {
        var existingElement = document.getElementById('hmdp-global-loading');
        if (existingElement) {
            return existingElement;
        }

        var loadingElement = createLoadingElement();
        loadingElement.id = 'hmdp-global-loading';
        document.body.appendChild(loadingElement);
        return loadingElement;
    }

    // 显示加载器
    function showLoading(text, options) {
        options = options || {};
        var delay = options.delay !== undefined ? options.delay : LoadingConfig.delay;

        // 增加请求计数
        LoadingState.requestCount++;

        if (LoadingConfig.debug) {
            console.log('[HMDP Loading] Show loading:', text, 'Count:', LoadingState.requestCount);
        }

        // 如果已经显示，只更新文本
        if (LoadingState.isVisible) {
            updateLoadingText(text);
            return;
        }

        // 清除之前的隐藏定时器
        if (LoadingState.hideTimer) {
            clearTimeout(LoadingState.hideTimer);
            LoadingState.hideTimer = null;
        }

        // 延迟显示加载器
        LoadingState.showTimer = setTimeout(function() {
            var loadingElement = getLoadingElement();
            updateLoadingText(text);
            
            loadingElement.classList.remove(LoadingConfig.cssClass.hide);
            loadingElement.classList.add(LoadingConfig.cssClass.show);
            
            LoadingState.isVisible = true;
            LoadingState.startTime = Date.now();
            LoadingState.showTimer = null;
        }, delay);
    }

    // 隐藏加载器
    function hideLoading(force) {
        // 减少请求计数
        if (LoadingState.requestCount > 0) {
            LoadingState.requestCount--;
        }

        if (LoadingConfig.debug) {
            console.log('[HMDP Loading] Hide loading, force:', force, 'Count:', LoadingState.requestCount);
        }

        // 如果还有未完成的请求且不是强制隐藏，则不隐藏
        if (!force && LoadingState.requestCount > 0) {
            if (LoadingConfig.debug) {
                console.log('[HMDP Loading] Still has pending requests, not hiding');
            }
            return;
        }

        // 清除显示定时器
        if (LoadingState.showTimer) {
            clearTimeout(LoadingState.showTimer);
            LoadingState.showTimer = null;
            LoadingState.requestCount = 0;
            return;
        }

        // 如果没有显示，直接返回
        if (!LoadingState.isVisible) {
            LoadingState.requestCount = 0;
            return;
        }

        // 计算已显示时间
        var elapsedTime = Date.now() - LoadingState.startTime;
        var remainingTime = Math.max(0, LoadingConfig.minDuration - elapsedTime);

        // 延迟隐藏以确保最小显示时间
        LoadingState.hideTimer = setTimeout(function() {
            var loadingElement = document.getElementById('hmdp-global-loading');
            if (loadingElement) {
                loadingElement.classList.remove(LoadingConfig.cssClass.show);
                loadingElement.classList.add(LoadingConfig.cssClass.hide);
                
                // 动画结束后完全隐藏
                setTimeout(function() {
                    if (loadingElement.classList.contains(LoadingConfig.cssClass.hide)) {
                        loadingElement.style.display = 'none';
                    }
                }, 300);
            }
            
            LoadingState.isVisible = false;
            LoadingState.startTime = null;
            LoadingState.hideTimer = null;
            LoadingState.requestCount = 0;
        }, remainingTime);
    }

    // 更新加载文本
    function updateLoadingText(text) {
        var loadingElement = document.getElementById('hmdp-global-loading');
        if (loadingElement && text) {
            var textElement = loadingElement.querySelector('.' + LoadingConfig.cssClass.text);
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    // 页面跳转加载
    function showPageLoading(targetUrl) {
        showLoading('页面跳转中...', { delay: 0 });
        
        // 监听页面卸载事件
        var hideOnUnload = function() {
            hideLoading(true);
            window.removeEventListener('beforeunload', hideOnUnload);
        };
        window.addEventListener('beforeunload', hideOnUnload);
        
        // 超时保护
        setTimeout(function() {
            hideLoading(true);
        }, 10000);
    }

    // AJAX请求加载
    function showAjaxLoading(config) {
        var text = '请求处理中...';
        if (config && config.url) {
            if (config.url.includes('/login')) {
                text = '登录中...';
            } else if (config.url.includes('/upload')) {
                text = '上传中...';
            } else if (config.url.includes('/save') || config.url.includes('/update')) {
                text = '保存中...';
            } else if (config.url.includes('/delete')) {
                text = '删除中...';
            }
        }
        showLoading(text);
    }

    // 强制重置加载状态
    function resetLoading() {
        // 清除所有定时器
        if (LoadingState.showTimer) {
            clearTimeout(LoadingState.showTimer);
            LoadingState.showTimer = null;
        }
        if (LoadingState.hideTimer) {
            clearTimeout(LoadingState.hideTimer);
            LoadingState.hideTimer = null;
        }

        // 重置状态
        LoadingState.isVisible = false;
        LoadingState.startTime = null;
        LoadingState.requestCount = 0;

        // 隐藏加载器元素
        var loadingElement = document.getElementById('hmdp-global-loading');
        if (loadingElement) {
            loadingElement.classList.remove(LoadingConfig.cssClass.show);
            loadingElement.classList.add(LoadingConfig.cssClass.hide);
            loadingElement.style.display = 'none';
        }

        if (LoadingConfig.debug) {
            console.log('[HMDP Loading] Reset loading state');
        }
    }

    // 公共API
    var HmdpLoading = {
        // 显示加载器
        show: showLoading,

        // 隐藏加载器
        hide: hideLoading,

        // 页面跳转加载
        page: showPageLoading,

        // AJAX请求加载
        ajax: showAjaxLoading,

        // 更新文本
        updateText: updateLoadingText,

        // 强制重置
        reset: resetLoading,

        // 配置
        config: LoadingConfig,

        // 状态
        state: LoadingState
    };

    // 导出到全局
    window.HmdpLoading = HmdpLoading;

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // 预创建加载器元素
            getLoadingElement();

            // 页面加载完成后，确保加载状态正确
            setTimeout(function() {
                if (LoadingState.isVisible && LoadingState.requestCount === 0) {
                    if (LoadingConfig.debug) {
                        console.log('[HMDP Loading] Page loaded but loading still visible, resetting');
                    }
                    resetLoading();
                }
            }, 2000);
        });
    } else {
        // 预创建加载器元素
        getLoadingElement();

        // 页面加载完成后，确保加载状态正确
        setTimeout(function() {
            if (LoadingState.isVisible && LoadingState.requestCount === 0) {
                if (LoadingConfig.debug) {
                    console.log('[HMDP Loading] Page loaded but loading still visible, resetting');
                }
                resetLoading();
            }
        }, 2000);
    }

})(window);
