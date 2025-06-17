// let commonURL = "http://192.168.50.115:8081";
let commonURL = "/api";
// 设置后台服务地址
axios.defaults.baseURL = commonURL;
// 将超时时间从2000ms改为5000ms
axios.defaults.timeout = 5000;

// 请求重试配置
axios.defaults.retry = 2;
axios.defaults.retryDelay = 800;
// request拦截器，将用户token放入头中，并显示加载指示器
axios.interceptors.request.use(
  config => {
    // 记录请求开始时间
    config._requestStartTime = performance.now ? performance.now() : Date.now();

    // 显示加载指示器
    try {
      if (window.HmdpLoading && typeof window.HmdpLoading.ajax === 'function') {
        window.HmdpLoading.ajax(config);
      }
    } catch (error) {
      console.warn('加载指示器显示失败:', error);
    }

    // 每次请求时重新获取token，确保是最新的
    let token = sessionStorage.getItem("token");
    if(token) config.headers['authorization'] = token
    return config
  },
  error => {
    // 隐藏加载指示器
    try {
      if (window.HmdpLoading && typeof window.HmdpLoading.hide === 'function') {
        window.HmdpLoading.hide();
      }
    } catch (error) {
      console.warn('加载指示器隐藏失败:', error);
    }
    console.log(error)
    return Promise.reject(error)
  }
)
axios.interceptors.response.use(function (response) {
  // 记录请求性能
  try {
    if (response.config._requestStartTime && window.HmdpPerformance && typeof window.HmdpPerformance.recordAjax === 'function') {
      const endTime = performance.now ? performance.now() : Date.now();
      window.HmdpPerformance.recordAjax(
        response.config,
        response.config._requestStartTime,
        endTime,
        true,
        null
      );
    }
  } catch (error) {
    console.warn('性能记录失败:', error);
  }

  // 隐藏加载指示器
  try {
    if (window.HmdpLoading && typeof window.HmdpLoading.hide === 'function') {
      window.HmdpLoading.hide();
    }
  } catch (error) {
    console.warn('加载指示器隐藏失败:', error);
  }

  // 判断执行结果
  // 特殊处理 blog-comments 路径，因为它可能有不同的响应格式
  if (response.config && response.config.url && response.config.url.includes('/blog-comments')) {
    console.log('处理博客评论API响应:', response.data);
    return response.data;
  }

  // 常规API响应处理
  // 只有明确包含success: false的响应才认为是错误
  if (response.data && response.data.success === false) {
    console.warn('API响应未成功:', response.data);
    return Promise.reject(response.data.errorMsg || '操作未成功')
  }
  return response.data;
}, function (error) {
  // 记录请求性能（失败）
  try {
    if (error.config && error.config._requestStartTime && window.HmdpPerformance && typeof window.HmdpPerformance.recordAjax === 'function') {
      const endTime = performance.now ? performance.now() : Date.now();
      window.HmdpPerformance.recordAjax(
        error.config,
        error.config._requestStartTime,
        endTime,
        false,
        error.message || '请求失败'
      );
    }
  } catch (perfError) {
    console.warn('性能记录失败:', perfError);
  }

  // 隐藏加载指示器
  try {
    if (window.HmdpLoading && typeof window.HmdpLoading.hide === 'function') {
      window.HmdpLoading.hide();
    }
  } catch (loadingError) {
    console.warn('加载指示器隐藏失败:', loadingError);
  }

  // 请求重试逻辑
  const config = error.config;
  if (config && config.retry && config.__retryCount < config.retry) {
    // 网络错误或超时错误才重试
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') ||
        error.message.includes('Network Error') || !error.response) {

      config.__retryCount = config.__retryCount || 0;
      config.__retryCount++;

      console.log(`请求重试 ${config.__retryCount}/${config.retry}: ${config.url}`);

      // 显示重试提示
      try {
        if (window.HmdpMessage && typeof window.HmdpMessage.warning === 'function') {
          window.HmdpMessage.warning(`网络不稳定，正在重试... (${config.__retryCount}/${config.retry})`);
        }
      } catch (msgError) {
        console.warn('重试提示显示失败:', msgError);
      }

      // 延迟重试
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(axios(config));
        }, config.retryDelay || 1000);
      });
    }
  }

  // 一般是服务端异常或者网络异常
  console.log(error);

  // 处理不同类型的错误
  let errorMessage = "服务器异常";

  if (error.response) {
    // 服务器响应了错误状态码
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        // 检查当前页面是否是需要登录的操作
        const currentPath = window.location.pathname;
        const isLoginRequired = error.config && (
          error.config.url.includes('/cart') ||
          error.config.url.includes('/order') ||
          error.config.url.includes('/user/') ||
          error.config.url.includes('/voucher-order')
        );

        // 只有在执行需要登录的操作时才跳转到登录页
        if (isLoginRequired) {
          // 清除无效token
          sessionStorage.removeItem("token");
          try {
            if (window.HmdpMessage && typeof window.HmdpMessage.error === 'function') {
              window.HmdpMessage.error("登录已过期，请重新登录");
            }
          } catch (msgError) {
            console.warn('登录过期提示显示失败:', msgError);
          }
          setTimeout(() => {
            location.href = "/user-login.html?redirect=" + encodeURIComponent(location.href);
          }, 1500);
          return Promise.reject("请先登录");
        } else {
          // 对于不需要登录的操作，只是返回错误信息，不跳转
          errorMessage = "请先登录";
        }
        break;
      case 403:
        errorMessage = "没有权限访问";
        break;
      case 404:
        errorMessage = "请求的资源不存在";
        break;
      case 500:
        errorMessage = "服务器内部错误";
        break;
      case 502:
        errorMessage = "网关错误";
        break;
      case 503:
        errorMessage = "服务暂时不可用";
        break;
      default:
        errorMessage = (data && data.errorMsg) || (data && data.message) || "服务器错误 (" + status + ")";
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = "请求超时，请检查网络连接";
    } else {
      errorMessage = "网络连接失败，请检查网络";
    }
  } else {
    // 其他错误
    errorMessage = error.message || "请求失败";
  }

  // 显示错误消息
  try {
    if (window.HmdpMessage && typeof window.HmdpMessage.error === 'function') {
      window.HmdpMessage.error(errorMessage);
    }
  } catch (msgError) {
    console.warn('错误消息显示失败:', msgError);
    // 降级处理：使用原生alert
    if (typeof alert === 'function') {
      alert(errorMessage);
    }
  }

  return Promise.reject(errorMessage);
});
axios.defaults.paramsSerializer = function(params) {
  let p = "";
  Object.keys(params).forEach(k => {
    if(params[k]){
      p = p + "&" + k + "=" + params[k]
    }
  })
  return p;
}
const util = {
  commonURL,
  getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return decodeURI(r[2]);
    }
    return "";
  },
  // 页面跳转（带加载指示器）
  navigateTo(url) {
    try {
      if (window.HmdpLoading && typeof window.HmdpLoading.page === 'function') {
        window.HmdpLoading.page(url);
      }
    } catch (error) {
      console.warn('页面跳转加载指示器失败:', error);
    }
    setTimeout(() => {
      window.location.href = url;
    }, 100);
  },
  // 显示加载指示器
  showLoading(text) {
    try {
      if (window.HmdpLoading && typeof window.HmdpLoading.show === 'function') {
        window.HmdpLoading.show(text);
      }
    } catch (error) {
      console.warn('显示加载指示器失败:', error);
    }
  },
  // 隐藏加载指示器
  hideLoading() {
    try {
      if (window.HmdpLoading && typeof window.HmdpLoading.hide === 'function') {
        window.HmdpLoading.hide();
      }
    } catch (error) {
      console.warn('隐藏加载指示器失败:', error);
    }
  },
  formatPrice(val) {
    if (typeof val === 'string') {
      if (isNaN(val)) {
        return null;
      }
      // 价格转为整数
      const index = val.lastIndexOf(".");
      let p = "";
      if (index < 0) {
        // 无小数
        p = val + "00";
      } else if (index === p.length - 2) {
        // 1位小数
        p = val.replace("\.", "") + "0";
      } else {
        // 2位小数
        p = val.replace("\.", "")
      }
      return parseInt(p);
    } else if (typeof val === 'number') {
      if (!val) {
        return null;
      }
      const s = val + '';
      if (s.length === 0) {
        return "0.00";
      }
      if (s.length === 1) {
        return "0.0" + val;
      }
      if (s.length === 2) {
        return "0." + val;
      }
      const i = s.indexOf(".");
      if (i < 0) {
        return s.substring(0, s.length - 2) + "." + s.substring(s.length - 2)
      }
      const num = s.substring(0, i) + s.substring(i + 1);
      if (i === 1) {
        // 1位整数
        return "0.0" + num;
      }
      if (i === 2) {
        return "0." + num;
      }
      if (i > 2) {
        return num.substring(0, i - 2) + "." + num.substring(i - 2)
      }
    }
  }
}
