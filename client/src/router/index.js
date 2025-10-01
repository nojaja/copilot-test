import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

// Views
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ProjectView from '../views/ProjectView.vue'
import StateEdit from '../views/StateEdit.vue'
import DeliverablesView from '../views/DeliverablesView.vue'
import ProcessMatrix from '../views/ProcessMatrix.vue'
import StateTransitionDiagram from '../views/StateTransitionDiagram.vue'
import IOTermEdit from '../views/IOTermEdit.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/project/:id',
    redirect: to => {
      return `/project/${to.params.id}/states`
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/states',
    name: 'ProjectView',
    component: ProjectView,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/deliverables',
    name: 'DeliverablesView',
    component: DeliverablesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:projectId/state/:id?',
    name: 'StateEdit',
    component: StateEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/io-term/:ioTermId?',
    name: 'IOTermEdit',
    component: IOTermEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/matrix',
    name: 'ProcessMatrix',
    component: ProcessMatrix,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id/diagram',
    name: 'StateTransitionDiagram',
    component: StateTransitionDiagram,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } else {
    if (isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
      next('/')
    } else {
      next()
    }
  }
})

export default router