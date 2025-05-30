// 管理员专用common.js
let adminCommonURL = "/api";
// 设置后台服务地址
const adminAxios = axios.create({
  baseURL: adminCommonURL,
  timeout: 2000
});

// request拦截器，将管理员token放入头中
adminAxios.interceptors.request.use(
  config => {
    let adminToken = sessionStorage.getItem("adminToken");
    if(adminToken) config.headers['admin-token'] = adminToken
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

adminAxios.interceptors.response.use(function (response) {
  // 判断执行结果
  if (!response.data.success) {
    return Promise.reject(response.data.errorMsg)
  }
  return response.data;
}, function (error) {
  // 一般是服务端异常或者网络异常
  console.log("请求错误详情:", error);
  
  // 如果有响应对象
  if(error.response) {
    console.log("错误状态码:", error.response.status);
    console.log("错误数据:", error.response.data);
    
    // 处理401未授权错误
    if(error.response.status == 401){
      // 管理员未登录，跳转到管理员登录页
      setTimeout(() => {
        location.href = "admin-login.html"
      }, 200);
      return Promise.reject("请先登录");
    }
    
    // 返回服务器的错误信息
    return Promise.reject(error.response.data?.errorMsg || "服务器异常");
  }
  
  // 处理请求错误（没有response对象）
  if(error.request) {
    console.log("请求发送失败:", error.request);
    return Promise.reject("网络请求失败，请检查网络连接");
  }
  
  // 其他错误
  return Promise.reject("请求错误: " + error.message);
});

adminAxios.defaults.paramsSerializer = function(params) {
  let p = "";
  Object.keys(params).forEach(k => {
    if(params[k]){
      p = p + "&" + k + "=" + params[k]
    }
  })
  return p;
}

const adminUtil = {
  adminCommonURL,
  getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return decodeURI(r[2]);
    }
    return "";
  }
} 