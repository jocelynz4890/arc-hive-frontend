<template>
  <div class="debug-panel" v-if="showDebug">
    <h4>Debug Panel</h4>
    <p>Authenticated: {{ authStore.isAuthenticated }}</p>
    <p>User: {{ authStore.user ? JSON.stringify(authStore.user) : 'null' }}</p>
    <p>Token: {{ authStore.token }}</p>
    <button @click="clearAuth">Clear Auth</button>
    <button @click="showDebug = false">Hide</button>
  </div>
  <button v-else @click="showDebug = true" class="debug-toggle">Debug</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const showDebug = ref(false)

const clearAuth = () => {
  authStore.logout()
  showDebug.value = false
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  z-index: 9999;
  font-size: 0.8rem;
}

.debug-panel h4 {
  margin: 0 0 0.5rem 0;
}

.debug-panel p {
  margin: 0.25rem 0;
}

.debug-panel button {
  margin: 0.25rem 0.5rem 0.25rem 0;
  padding: 0.25rem 0.5rem;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.debug-toggle {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 9999;
}
</style>
