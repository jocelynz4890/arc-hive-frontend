<template>
  <div id="app">
    <NavBar v-if="isAuthenticated" />
    <router-view />
    <DebugPanel />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'
import DebugPanel from './components/DebugPanel.vue'
import { dailyRefreshService } from './services/dailyRefresh'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Listen for authentication changes
const unsubscribe = authStore.$subscribe((mutation, state) => {
  if (state.isAuthenticated) {
    dailyRefreshService.start()
  } else {
    dailyRefreshService.stop()
  }
})

onMounted(() => {
  authStore.initializeAuth()
  
  // Start daily refresh service if authenticated
  if (authStore.isAuthenticated) {
    dailyRefreshService.start()
  }
})

onUnmounted(() => {
  dailyRefreshService.stop()
  unsubscribe()
})
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
</style>