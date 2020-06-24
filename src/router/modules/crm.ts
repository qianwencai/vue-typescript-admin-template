import { RouteConfig } from 'vue-router'
import Layout from '@/layout/index.vue'

const crmRoutes: RouteConfig = {

  path: '/crm',
  component: Layout,
  meta: {
    title: 'CRM',
    icon: 'crm',
    roles: ['admin', 'editor']
  },
  children: [
    {
      path: 'orders',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/crm/orders.vue'),
      name: 'orders',
      meta: { title: '订单', affix: false }
    },
    {
      path: 'custpolist',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/crm/custPoList.vue'),
      name: 'custpolist',
      meta: { title: '客户方订单', affix: false }
    },
    {
      path: 'customers',
      component: () => import(/* webpackChunkName: "documentation" */ '@/views/crm/customers.vue'),
      name: 'customers',
      meta: { title: '客户', affix: false }
    }
  ]
}

export default crmRoutes
