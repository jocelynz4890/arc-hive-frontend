<template>
  <div id="app">
    <NavBar v-if="isAuthenticated" />
    <router-view />
    <DebugPanel />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'
import DebugPanel from './components/DebugPanel.vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(() => {
  authStore.initializeAuth()
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