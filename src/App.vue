<template>
  <div id="app">
    <NavBar v-if="isAuthenticated" />
    <router-view />
    <!-- <DebugPanel /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'
// import DebugPanel from './components/DebugPanel.vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Listen for authentication changes
const unsubscribe = authStore.$subscribe((_mutation) => {
  // Backend handles daily refresh at midnight, no frontend action needed
})

onMounted(() => {
  authStore.initializeAuth()
})

onUnmounted(() => {
  unsubscribe()
})
</script>

<style>
#app {
  font-family: 'Pixelify Sans', sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  min-width: 100vw;
  background: #cdb4db;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
</style>