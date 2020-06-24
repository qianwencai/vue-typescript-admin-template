import { RouteConfig } from 'vue-router'
import Layout from '@/layout/index.vue'

const settingsRouter: RouteConfig = {

  path: '/settings',
  component: Layout,
  meta: {
    title: '设置',
    icon: 'settings',
    roles: ['admin']
  },
  children: [
    {
      path: 'usermgr',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/setting/user/user.vue'),
      name: 'usermgr',
      meta: { title: '用户管理', affix: false }
    },
    {
      path: 'rolemgr',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/setting/role/role.vue'),
      name: 'rolemgr',
      meta: { title: '角色管理', affix: false }
    },
    {
      path: 'tenant',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/setting/tenant/tenant.vue'),
      name: 'tenant',
      meta: { title: '租户', affix: false }
    }
  ]
}

export default settingsRouter
