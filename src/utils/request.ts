import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import { UserModule } from '@/store/modules/user'
import Vue from 'vue'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  timeout: 5000
  // withCredentials: true // send cookies when cross-domain requests
})

service.interceptors.request.use(function (config) {
  if (window.abp.auth.getToken()) {
    config.headers.common['Authorization'] = 'Bearer ' + window.abp.auth.getToken()
  }
  config.headers.common['.AspNetCore.Culture'] = window.abp.utils.getCookieValue('Abp.Localization.CultureName')
  config.headers.common['Abp.TenantId'] = window.abp.multiTenancy.getTenantIdCookie()
  return config
}, function (error) {
  return Promise.reject(error)
})

let vm = new Vue()
// Response interceptors
service.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (!!error.response && !!error.response.data.error && !!error.response.data.error.message && error.response.data.error.details) {
      vm.$notify.error({ title: error.response.data.error.message, message: error.response.data.error.details })
    } else if (!!error.response && !!error.response.data.error && !!error.response.data.error.message) {
      vm.$message.error(error.response.data.error.message)
    } else if (!error.response) {
      console.log(error)
      vm.$message.error('未知错误')
    }
    // setTimeout(()=>{
    //    vm.$message.destroy();
    // },1000);
    return Promise.reject(error)
  }
)

export default service
