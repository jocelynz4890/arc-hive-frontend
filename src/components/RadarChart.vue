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
          backgroundColor: 'rgba(255, 200, 221, 0.3)',
          borderColor: '#ffc8dd',
          borderWidth: 2,
          pointBackgroundColor: '#ffc8dd',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ffc8dd'
        },
        {
          label: 'Total',
          data: totalData,
          backgroundColor: 'rgba(189, 224, 254, 0.2)',
          borderColor: 'rgba(162, 210, 255, 0.6)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(162, 210, 255, 0.6)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(162, 210, 255, 0.6)'
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
