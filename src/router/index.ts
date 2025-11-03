import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginPage from '../views/LoginPage.vue'
import HomePage from '../views/HomePage.vue'
import FriendsPage from '../views/FriendsPage.vue'
import ArcsPage from '../views/ArcsPage.vue'
import RewardsPage from '../views/RewardsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/home',
      name: 'home-alt',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/arcs',
      name: 'arcs',
      component: ArcsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: RewardsPage,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  console.log('Router guard:', {
    path: to.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    token: authStore.token
  })
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirecting to login - not authenticated')
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    console.log('Redirecting to home - already authenticated')
    next('/')
  } else {
    console.log('Allowing navigation')
    next()
  }
})

export default router
