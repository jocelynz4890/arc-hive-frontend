<template>
  <div class="stats-card" :class="{ flipped: isFlipped }" @click="flipCard">
    <div class="card-inner">
      <div class="card-front">
        <h3>{{ username || 'Stats' }}</h3>
  <RadarChart class="radar-chart" :stats="totalStats" :completed-stats="completedStats" />
        <p class="flip-hint">Click to see progress bars</p>
      </div>
      <div class="card-back">
        <h3>Progress Details</h3>
        <div class="progress-bars">
          <div v-for="(value, stat) in totalStats" :key="stat" class="progress-item">
            <div class="stat-label">{{ stat }}</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${getProgressPercentage(stat)}%` }"
              ></div>
            </div>
            <div class="progress-text">
              {{ completedStats[stat as keyof typeof completedStats] || 0 }} / {{ value }}
            </div>
          </div>
        </div>
        <p class="flip-hint">Click to see radar chart</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import RadarChart from './RadarChart.vue'
import type { StatData } from '../types'
import { useAuthStore } from '../stores/auth'

interface Props {
  totalStats: StatData
  completedStats: StatData
}

interface ExtendedProps extends Props {
  username?: string
}

const props = defineProps<ExtendedProps>()

const isFlipped = ref(false)

const authStore = useAuthStore()
// Prefer explicit prop username when provided (used to show a friend's name),
// otherwise fall back to the authenticated user's username.
const username = computed(() => props.username ?? (authStore.user as any)?.username ?? 'Stats')

const flipCard = () => {
  isFlipped.value = !isFlipped.value
}

const getProgressPercentage = (stat: string) => {
  const total = props.totalStats[stat as keyof StatData] || 0
  const completed = props.completedStats[stat as keyof StatData] || 0
  return total > 0 ? (completed / total) * 100 : 0
}
</script>

<style scoped>
.stats-card {
  width: 100%;
  height: 750px; 
  perspective: 1000px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.stats-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: #ffffff;
  border: 4px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card-back {
  transform: rotateY(180deg);
  /* Layout the back side starting from the top so progress bars can use full height */
  justify-content: flex-start;
  align-items: stretch;
}

.card-front h3, .card-back h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.progress-bars {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* more space between progress bars */
  /* Allow scrolling if there are many stats; leave space for the header and hints */
  max-height: calc(100% - 160px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radar-chart {
  width: min(80%, 560px);
  /* Allow the radar to grow and center vertically within the front face */
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
}

.stat-label {
  font-weight: 600;
  color: #333;
  text-align: left;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #bde0fe;
  border: 2px solid #a2d2ff;
  border-radius: 0;
  overflow: hidden;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: #ffc8dd;
  border-radius: 0;
  transition: width 0.3s ease;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.1);
  border-right: 2px solid #ffafcc;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
  text-align: left;
}

.flip-hint {
  margin-top: auto;
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}

.stats-card:hover .card-inner {
  transform: scale(1.02);
}

.stats-card.flipped:hover .card-inner {
  transform: rotateY(180deg) scale(1.02);
}

@media (max-width: 480px) {
  .stats-card {
    height: auto;
  }
}
</style>
