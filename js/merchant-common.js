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
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

merchantAxios.interceptors.response.use(function (response) {
  // 判断执行结果 - 兼容不同的响应格式
  const data = response.data;

  // 检查是否是成功响应（兼容success和code字段）
  const isSuccess = data.success === true || data.code === 200;

  if (!isSuccess) {
    // 不要自动跳转，让页面自己处理错误
    console.warn("API响应失败:", data);
    return Promise.reject(data.errorMsg || data.msg || "请求失败");
  }

  // 统一格式转换：将后端的 {success: true, data: {...}} 转换为前端期望的 {code: 200, data: {...}}
  let normalizedResponse;

  if (data.success === true) {
    // 后端返回格式：{success: true, data: {...}}
    normalizedResponse = {
      code: 200,
      data: data.data,
      msg: data.msg || "操作成功"
    };
  } else {
    // 已经是前端期望格式：{code: 200, data: {...}}
    normalizedResponse = data;
  }

  // 对于登录接口特殊处理
  if (normalizedResponse.data && (normalizedResponse.data.token || normalizedResponse.data.merchantInfo)) {
    console.log("检测到登录响应数据，返回特殊处理后的格式");
    return normalizedResponse.data; // 返回包含token和merchantInfo的data子对象
  }

  // 其他接口返回统一格式的响应对象
  return normalizedResponse;
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