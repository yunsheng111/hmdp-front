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