/**
 * HMDP 消息提示组件
 * 提供统一的成功、警告、错误消息提示
 * @version 1.0.0
 * @author Claude 4.0 Sonnet
 */

(function(window) {
    'use strict';

    // 消息配置
    var MessageConfig = {
        // 默认显示时间（毫秒）
        duration: 3000,
        // 最大同时显示消息数量
        maxCount: 5,
        // 消息间距
        offset: 20,
        // CSS类名
        cssClass: {
            container: 'hmdp-message-container',
            item: 'hmdp-message-item',
            success: 'hmdp-message-success',
            warning: 'hmdp-message-warning',
            error: 'hmdp-message-error',
            info: 'hmdp-message-info',
            icon: 'hmdp-message-icon',
            content: 'hmdp-message-content',
            close: 'hmdp-message-close',
            show: 'hmdp-message-show',
            hide: 'hmdp-message-hide'
        }
    };

    // 消息队列
    var messageQueue = [];
    var messageContainer = null;

    // 创建消息容器
    function createMessageContainer() {
        if (messageContainer) {
            return messageContainer;
        }

        messageContainer = document.createElement('div');
        messageContainer.className = MessageConfig.cssClass.container;
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(messageContainer);
        return messageContainer;
    }

    // 获取图标HTML
    function getIconHtml(type) {
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // 创建消息元素
    function createMessageElement(content, type, options) {
        options = options || {};
        
        var messageEl = document.createElement('div');
        messageEl.className = `${MessageConfig.cssClass.item} ${MessageConfig.cssClass[type]}`;
        
        var iconEl = document.createElement('span');
        iconEl.className = MessageConfig.cssClass.icon;
        iconEl.innerHTML = getIconHtml(type);
        
        var contentEl = document.createElement('span');
        contentEl.className = MessageConfig.cssClass.content;
        contentEl.textContent = content;
        
        var closeEl = document.createElement('span');
        closeEl.className = MessageConfig.cssClass.close;
        closeEl.innerHTML = '×';
        closeEl.onclick = function() {
            hideMessage(messageEl);
        };
        
        messageEl.appendChild(iconEl);
        messageEl.appendChild(contentEl);
        if (options.closable !== false) {
            messageEl.appendChild(closeEl);
        }
        
        // 设置样式
        messageEl.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            background: white;
            border-left: 4px solid;
            max-width: 400px;
            word-wrap: break-word;
            pointer-events: auto;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        // 设置类型特定样式
        switch (type) {
            case 'success':
                messageEl.style.borderLeftColor = '#52c41a';
                iconEl.style.color = '#52c41a';
                break;
            case 'warning':
                messageEl.style.borderLeftColor = '#faad14';
                iconEl.style.color = '#faad14';
                break;
            case 'error':
                messageEl.style.borderLeftColor = '#f5222d';
                iconEl.style.color = '#f5222d';
                break;
            case 'info':
                messageEl.style.borderLeftColor = '#1890ff';
                iconEl.style.color = '#1890ff';
                break;
        }
        
        // 设置图标样式
        iconEl.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            margin-right: 8px;
            flex-shrink: 0;
        `;
        
        // 设置内容样式
        contentEl.style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
        `;
        
        // 设置关闭按钮样式
        closeEl.style.cssText = `
            font-size: 18px;
            color: #999;
            cursor: pointer;
            margin-left: 8px;
            flex-shrink: 0;
            line-height: 1;
        `;
        
        closeEl.onmouseover = function() {
            this.style.color = '#666';
        };
        
        closeEl.onmouseout = function() {
            this.style.color = '#999';
        };
        
        return messageEl;
    }

    // 显示消息
    function showMessage(content, type, options) {
        options = options || {};
        
        // 限制消息数量
        if (messageQueue.length >= MessageConfig.maxCount) {
            hideMessage(messageQueue[0].element);
        }
        
        var container = createMessageContainer();
        var messageEl = createMessageElement(content, type, options);
        
        container.appendChild(messageEl);
        
        // 添加到队列
        var messageItem = {
            element: messageEl,
            timer: null,
            type: type,
            content: content
        };
        messageQueue.push(messageItem);
        
        // 显示动画
        setTimeout(function() {
            messageEl.style.transform = 'translateX(0)';
            messageEl.style.opacity = '1';
        }, 10);
        
        // 自动隐藏
        var duration = options.duration !== undefined ? options.duration : MessageConfig.duration;
        if (duration > 0) {
            messageItem.timer = setTimeout(function() {
                hideMessage(messageEl);
            }, duration);
        }
        
        return messageItem;
    }

    // 隐藏消息
    function hideMessage(messageEl) {
        if (!messageEl || !messageEl.parentNode) {
            return;
        }
        
        // 找到对应的消息项
        var messageItem = messageQueue.find(item => item.element === messageEl);
        if (messageItem && messageItem.timer) {
            clearTimeout(messageItem.timer);
        }
        
        // 隐藏动画
        messageEl.style.transform = 'translateX(100%)';
        messageEl.style.opacity = '0';
        
        setTimeout(function() {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
            
            // 从队列中移除
            var index = messageQueue.findIndex(item => item.element === messageEl);
            if (index > -1) {
                messageQueue.splice(index, 1);
            }
            
            // 如果没有消息了，移除容器
            if (messageQueue.length === 0 && messageContainer) {
                document.body.removeChild(messageContainer);
                messageContainer = null;
            }
        }, 300);
    }

    // 清除所有消息
    function clearAllMessages() {
        messageQueue.forEach(function(item) {
            hideMessage(item.element);
        });
    }

    // 公共API
    var HmdpMessage = {
        // 成功消息
        success: function(content, options) {
            return showMessage(content, 'success', options);
        },
        
        // 警告消息
        warning: function(content, options) {
            return showMessage(content, 'warning', options);
        },
        
        // 错误消息
        error: function(content, options) {
            return showMessage(content, 'error', options);
        },
        
        // 信息消息
        info: function(content, options) {
            return showMessage(content, 'info', options);
        },
        
        // 通用消息
        show: showMessage,
        
        // 隐藏消息
        hide: hideMessage,
        
        // 清除所有消息
        clear: clearAllMessages,
        
        // 配置
        config: MessageConfig,
        
        // 消息队列（只读）
        get queue() {
            return messageQueue.slice();
        }
    };

    // 导出到全局
    window.HmdpMessage = HmdpMessage;

})(window);
