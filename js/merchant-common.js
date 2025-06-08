// 商家专用common.js
let merchantCommonURL = "/api";
// 设置后台服务地址
const merchantAxios = axios.create({
  baseURL: merchantCommonURL,
  timeout: 2000
});

// 获取商家token
let merchantToken = sessionStorage.getItem("merchantToken");

// request拦截器，将商家token放入头中
merchantAxios.interceptors.request.use(
  config => {
    // 每次请求前重新获取最新token
    merchantToken = sessionStorage.getItem("merchantToken");
    if(merchantToken) {
      // 使用两种header确保兼容性
      config.headers['merchant-token'] = merchantToken;
      // 添加authorization头，与后端认证机制保持一致
      config.headers['authorization'] = merchantToken;
    }
    
    // 增加调试日志，查看发送的请求详情
    console.log("商家请求:", config.url, config);
    
    return config
  },
  error => {
    console.log("请求拦截器错误:", error)
    return Promise.reject(error)
  }
)

merchantAxios.interceptors.response.use(function (response) {
  // 增加调试日志，查看响应数据
  console.log("商家响应数据:", response.config.url, response.data);

  // 判断执行结果 - 兼容不同的响应格式
  const data = response.data;

  // 检查是否是成功响应（兼容success和code字段）
  const isSuccess = data.success === true || data.code === 200;

  if (!isSuccess) {
    // 不要自动跳转，让页面自己处理错误
    console.warn("API响应失败:", data);
    return Promise.reject(data.errorMsg || data.msg || "请求失败");
  }

  // 对于登录接口特殊处理
  if (data.data && (data.data.token || data.data.merchantInfo)) {
    console.log("检测到登录响应数据，返回特殊处理后的格式");
    return data.data; // 返回包含token和merchantInfo的data子对象
  }

  // 其他接口直接返回原始响应，保持success字段
  return data;
}, function (error) {
  // 一般是服务端异常或者网络异常
  console.log("请求错误详情:", error);

  // 如果有响应对象
  if(error.response) {
    console.log("错误状态码:", error.response.status);
    console.log("错误数据:", error.response.data);

    // 处理401未授权错误 - 但不自动跳转，让页面决定
    if(error.response.status == 401){
      console.warn("商家认证失败，需要重新登录");
      // 增加调试，但不自动跳转
      console.log("商家认证失败，请重新登录");
      // 清除无效的商家token
      sessionStorage.removeItem("merchantToken");
      sessionStorage.removeItem("merchantInfo");
      // 重定向到商家登录页
      setTimeout(() => {
        location.href = "/merchant-login.html?redirect=" + encodeURIComponent(location.href);
      }, 200);
      return Promise.reject("认证失败，请重新登录");
    }

    // 返回服务器的错误信息
    const errorData = error.response.data;
    return Promise.reject(errorData?.errorMsg || errorData?.msg || "服务器异常");
  }

  // 处理请求错误（没有response对象）
  if(error.request) {
    console.log("请求发送失败:", error.request);
    return Promise.reject("网络请求失败，请检查网络连接");
  }

  // 其他错误
  return Promise.reject("请求错误: " + error.message);
});

merchantAxios.defaults.paramsSerializer = function(params) {
  let p = "";
  Object.keys(params).forEach(k => {
    if(params[k]){
      p = p + "&" + k + "=" + params[k]
    }
  })
  return p;
}

const merchantUtil = {
  merchantCommonURL,
  getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return decodeURI(r[2]);
    }
    return "";
  }
} 