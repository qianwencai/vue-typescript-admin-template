import Vue, { DirectiveOptions } from 'vue'

import 'normalize.css'
import ElementUI from 'element-ui'
import SvgIcon from 'vue-svgicon'

import '@/styles/element-variables.scss'
import '@/styles/index.scss'

import App from '@/App.vue'
import store from '@/store'
import { AppModule } from '@/store/modules/app'
import router from '@/router'
import i18n from '@/lang'
import '@/icons/components'
import '@/permission'
import '@/utils/error-log'
import '@/pwa/register-service-worker'
import * as directives from '@/directives'
import * as filters from '@/filters'
import ajax from './utils/request'
import Util from '@/lib/util'
import SignalRAspNetCoreHelper from './lib/SignalRAspNetCoreHelper'
 
Vue.use(ElementUI, {
  size: AppModule.size, // Set element-ui default size
  i18n: function (key: string, value: string) {
    key = key.replace('route.', '')
    let loc = i18n.t(key, value)
    // if (loc.toString().indexOf('route.') != -1) {
    //   return loc.toString().replace('route.', '')
    // }
    return loc
  }
})
Vue.use(SvgIcon, {
  tagName: 'svg-icon',
  defaultWidth: '1em',
  defaultHeight: '1em'
})

// Register global directives
Object.keys(directives).forEach(key => {
  Vue.directive(key, (directives as { [key: string]: DirectiveOptions })[key])
})

// Register global filter functions
Object.keys(filters).forEach(key => {
  Vue.filter(key, (filters as { [key: string]: Function })[key])
})

Vue.config.productionTip = false


ajax.get('/AbpUserConfiguration/GetAll').then(data => {
  Util.abp = Util.extend(true, Util.abp, data.data.result)
  new Vue({
    render: h => h(App),
    i18n,
    router,
    store
  }).$mount('#app')
})
