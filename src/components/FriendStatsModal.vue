<template>
  <div v-if="friend" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ displayName }}'s Stats</h3>
        <button @click="handleClose" class="close-button">✕</button>
      </div>
      <div class="modal-body">
        <div class="friend-avatar-large">
          <img :src="friend.avatar || defaultAvatar" :alt="displayName" class="friend-avatar-large-img" />
        </div>
        <StatsCard :username="displayName" :total-stats="normalizedTotal" :completed-stats="normalizedCompleted" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import StatsCard from './StatsCard.vue'
import defaultAvatar from '../assets/default.png'

interface Props {
  friend: any
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const handleClose = () => emit('close')

const displayName = computed(() => {
  const f = props.friend
  if (!f) return ''
  if (typeof f === 'string') return f
  return f.username || (f.name || '')
})

// Normalize stats shape similarly to Home/Friends pages
const normalizeStatsShape = (raw: any) => {
  const keys: Array<[string, string]> = [
    ['hp', 'HP'],
    ['stamina', 'Stamina'],
    ['strength', 'Strength'],
    ['agility', 'Agility'],
    ['intelligence', 'Intelligence']
  ]

  const totalStats: any = {}
  const completedStats: any = {}

  for (const [low, cap] of keys) {
    const entry = raw?.[low] ?? raw?.[cap]
    if (entry && typeof entry === 'object') {
      const completed = Number(entry.completed || 0)
      const incompleted = Number(entry.incompleted || 0)
      totalStats[cap] = completed + incompleted
      completedStats[cap] = completed
    } else if (typeof entry === 'number') {
      totalStats[cap] = entry
      completedStats[cap] = 0
    } else {
      totalStats[cap] = 0
      completedStats[cap] = 0
    }
  }

  return { totalStats, completedStats }
}

// The friend object should already have totalStats and completedStats set from viewFriend
// If not, try to normalize from the raw stats
const normalized = computed(() => {
  const friend = props.friend
  if (!friend) {
    return { totalStats: {}, completedStats: {} }
  }
  
  // If stats are already normalized (from viewFriend), use them directly
  if (friend.totalStats && friend.completedStats) {
    return {
      totalStats: friend.totalStats,
      completedStats: friend.completedStats
    }
  }
  
  // Otherwise, normalize from raw stats (backward compatibility)
  const raw = friend.totalStats ?? friend
  return normalizeStatsShape(raw)
})

const normalizedTotal = computed(() => normalized.value.totalStats)
const normalizedCompleted = computed(() => normalized.value.completedStats)

// Keep modal responsive to friend prop changes (no-op, but ensures reactivity)
watch(() => props.friend, () => {})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-bottom: 2px solid #cdb4db;
  background: #f5f5f5;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.friend-avatar-large {
  width: 100px;
  height: 100px;
}

.friend-avatar-large-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: color 0.15s ease;
  padding: 0;
  line-height: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #222;
}
</style>
