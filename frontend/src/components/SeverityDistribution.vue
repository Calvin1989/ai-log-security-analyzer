<template>
  <div class="severity-distribution">
    <h2>Severity Distribution</h2>
    <div class="distribution-grid">
      <!-- Findings Distribution -->
      <div class="distribution-card">
        <h3>Finding Severity</h3>
        <div class="severity-bars">
          <div v-for="(count, severity) in findingCounts" :key="severity" class="severity-item">
            <div class="severity-label">
              <span class="dot" :class="severity"></span>
              {{ capitalize(severity) }}
            </div>
            <div class="bar-container">
              <div 
                class="bar" 
                :class="severity" 
                :style="{ width: getPercentage(count, totalFindings) + '%' }"
              ></div>
            </div>
            <div class="count">{{ count }}</div>
          </div>
        </div>
      </div>

      <!-- Incidents Distribution -->
      <div class="distribution-card">
        <h3>Incident Severity</h3>
        <div class="severity-bars">
          <div v-for="(count, severity) in incidentCounts" :key="severity" class="severity-item">
            <div class="severity-label">
              <span class="dot" :class="severity"></span>
              {{ capitalize(severity) }}
            </div>
            <div class="bar-container">
              <div 
                class="bar" 
                :class="severity" 
                :style="{ width: getPercentage(count, totalIncidents) + '%' }"
              ></div>
            </div>
            <div class="count">{{ count }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  findingSeverityCounts: {
    type: Object,
    default: () => ({ high: 0, medium: 0, low: 0 })
  },
  incidentSeverityCounts: {
    type: Object,
    default: () => ({ high: 0, medium: 0, low: 0 })
  }
})

const order = ['high', 'medium', 'low']

const findingCounts = computed(() => {
  const counts = { high: 0, medium: 0, low: 0, ...props.findingSeverityCounts }
  return Object.fromEntries(order.map(key => [key, counts[key] || 0]))
})

const incidentCounts = computed(() => {
  const counts = { high: 0, medium: 0, low: 0, ...props.incidentSeverityCounts }
  return Object.fromEntries(order.map(key => [key, counts[key] || 0]))
})

const totalFindings = computed(() => Object.values(findingCounts.value).reduce((a, b) => a + b, 0))
const totalIncidents = computed(() => Object.values(incidentCounts.value).reduce((a, b) => a + b, 0))

const getPercentage = (count, total) => {
  if (total === 0) return 0
  return (count / total) * 100
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
</script>

<style scoped>
.severity-distribution {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.distribution-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #eee;
}

h3 {
  font-size: 1rem;
  margin-bottom: 1.25rem;
  color: #666;
  font-weight: 500;
}

.severity-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.severity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.severity-label {
  width: 80px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.high { background-color: #e74c3c; }
.dot.medium { background-color: #f39c12; }
.dot.low { background-color: #3498db; }

.bar-container {
  flex-grow: 1;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bar.high { background-color: #e74c3c; }
.bar.medium { background-color: #f39c12; }
.bar.low { background-color: #3498db; }

.count {
  width: 30px;
  text-align: right;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}
</style>
