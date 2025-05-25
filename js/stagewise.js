// Stagewise工具栏配置
(function() {
  // 检查是否为开发环境
  function isDevelopment() {
    // 通过响应头判断环境
    try {
      return document.querySelector('meta[name="environment"]')?.getAttribute('content') === 'development';
    } catch (e) {
      return false;
    }
  }

  // 动态加载Stagewise
  function loadStagewise() {
    if (!isDevelopment()) return;
    
    console.log('正在加载Stagewise开发工具...');
    
    // 动态加载Stagewise脚本
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@stagewise/toolbar@latest/dist/stagewise-toolbar.umd.js';
    script.onload = initStagewise;
    script.onerror = () => console.error('Stagewise加载失败');
    document.head.appendChild(script);
  }

  // 初始化Stagewise
  function initStagewise() {
    if (typeof window.StagewiseToolbar === 'undefined') {
      console.error('Stagewise未正确加载');
      return;
    }

    const config = {
      plugins: []
    };

    try {
      window.StagewiseToolbar.init(config);
      console.log('Stagewise开发工具已初始化');
    } catch (e) {
      console.error('Stagewise初始化失败:', e);
    }
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStagewise);
  } else {
    loadStagewise();
  }
})(); 