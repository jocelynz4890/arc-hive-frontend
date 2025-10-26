<template>
  <div class="radar-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  registerables
} from 'chart.js'
import type { StatData } from '../types'

Chart.register(...registerables)

interface Props {
  stats: StatData
  completedStats: StatData
}

const props = defineProps<Props>()
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Destroy existing chart
  if (chart) {
    chart.destroy()
  }

  const labels = ['HP', 'Stamina', 'Strength', 'Agility', 'Intelligence']
  const completedData = labels.map(label => props.completedStats[label as keyof StatData] || 0)
  const totalData = labels.map(label => props.stats[label as keyof StatData] || 0)

  chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: completedData,
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(102, 126, 234, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
        },
        {
          label: 'Total',
          data: totalData,
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          borderColor: 'rgba(118, 75, 162, 0.5)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(118, 75, 162, 0.5)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(118, 75, 162, 0.5)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: Math.max(...totalData, 10),
          // hide numeric tick labels (remove the numbers on the radial axis)
          ticks: {
            display: false
          },
          // keep the point labels (HP, Stamina, ...) visible and styled if needed
          pointLabels: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => [props.stats, props.completedStats], () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.radar-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
