<template>
  <section class="dashboard-container">
    <div class="dashboard-header">
      <div class="header-main">
        <h3>{{ t('dashboard.title') }}</h3>
        <span class="local-badge">{{ t('workspace.localOnly') }}</span>
      </div>
      <div class="header-info" v-if="metrics.totalCases > 0">
        <span class="update-time">{{ t('dashboard.updated') }}: {{ lastUpdated }}</span>
      </div>
    </div>

    <div v-if="metrics.totalCases === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <p>{{ t('dashboard.empty') }}</p>
    </div>

    <div v-else class="dashboard-content">
      <!-- Top Metrics Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">{{ t('dashboard.totalCases') }}</span>
          <span class="stat-value">{{ metrics.totalCases }}</span>
          <div class="stat-sub">
            <span>{{ metrics.singleCases }} {{ t('workspace.singleCase') }}</span>
            <span class="separator">|</span>
            <span>{{ metrics.batchCases }} {{ t('workspace.batchCase') }}</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('dashboard.averageRiskScore') }}</span>
          <span class="stat-value">{{ metrics.averageRiskScore }}</span>
          <div class="stat-sub">
            <span>{{ metrics.totalFindings }} {{ t('workspace.findings') }}</span>
            <span class="separator">|</span>
            <span>{{ metrics.totalIncidents }} {{ t('workspace.incidents') }}</span>
          </div>
        </div>
      </div>

      <!-- Distributions -->
      <div class="distributions-grid">
        <div class="dist-card">
          <h4>{{ t('dashboard.riskDistribution') }}</h4>
          <div class="bar-list">
            <div v-for="(count, level) in metrics.riskLevelCounts" :key="level" class="bar-item">
              <div class="bar-info">
                <span class="bar-label">{{ translateRiskLevel(level) }}</span>
                <span class="bar-count">{{ count }}</span>
              </div>
              <div class="bar-bg">
                <div 
                  class="bar-fill" 
                  :class="'bg-' + level.toLowerCase()"
                  :style="{ width: (count / metrics.totalCases * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dist-card">
          <h4>{{ t('dashboard.triageDistribution') }}</h4>
          <div v-if="Object.keys(metrics.triageStatusCounts).length === 0" class="mini-empty">
            {{ t('triage.empty') }}
          </div>
          <div v-else class="bar-list">
            <div v-for="(count, status) in metrics.triageStatusCounts" :key="status" class="bar-item">
              <div class="bar-info">
                <span class="bar-label">{{ t('triage.' + status.toLowerCase(), status) }}</span>
                <span class="bar-count">{{ count }}</span>
              </div>
              <div class="bar-bg">
                <div 
                  class="bar-fill bg-status"
                  :style="{ width: (count / getTotalTriageItems() * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actionable Lists -->
      <div class="lists-grid">
        <!-- High Risk Open Cases -->
        <div class="list-card">
          <h4>{{ t('dashboard.highRiskOpenCases') }} ({{ metrics.highRiskOpenCases.length }})</h4>
          <div v-if="metrics.highRiskOpenCases.length === 0" class="mini-empty">
            ✅ {{ t('dashboard.openItems') }}
          </div>
          <ul v-else class="item-list">
            <li v-for="c in metrics.highRiskOpenCases" :key="c.id" @click="$emit('select', c)">
              <span class="item-title">{{ c.title }}</span>
              <span class="item-badge risk-critical">{{ c.risk_score }}</span>
            </li>
          </ul>
        </div>

        <!-- Cases with No Triage -->
        <div class="list-card">
          <h4>{{ t('dashboard.casesWithoutTriage') }} ({{ metrics.casesWithNoTriage.length }})</h4>
          <div v-if="metrics.casesWithNoTriage.length === 0" class="mini-empty">
            ✅ {{ t('dashboard.noCases') }}
          </div>
          <ul v-else class="item-list">
            <li v-for="c in metrics.casesWithNoTriage" :key="c.id" @click="$emit('select', c)">
              <span class="item-title">{{ c.title }}</span>
              <span class="item-date">{{ formatDate(c.created_at) }}</span>
            </li>
          </ul>
        </div>

        <!-- Recent Cases -->
        <div class="list-card">
          <h4>{{ t('dashboard.recentCases') }}</h4>
          <ul class="item-list">
            <li v-for="c in metrics.recentlySavedCases" :key="c.id" @click="$emit('select', c)">
              <span class="item-title">{{ c.title }}</span>
              <span class="item-date">{{ formatDate(c.created_at) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { t, translateRiskLevel } from '../i18n'
import { calculateDashboardMetrics } from '../utils/caseDashboardMetrics'
import { getTriageState } from '../utils/triageStorage'

const props = defineProps({
  cases: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const metrics = computed(() => {
  return calculateDashboardMetrics(props.cases, getTriageState)
})

const lastUpdated = computed(() => {
  return new Date().toLocaleTimeString()
})

const getTotalTriageItems = () => {
  return Object.values(metrics.value.triageStatusCounts).reduce((a, b) => a + b, 0) || 1
}

const formatDate = (isoString) => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.dashboard-container {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-main h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #212529;
}

.local-badge {
  font-size: 0.7rem;
  background: #f1f3f5;
  color: #6c757d;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.update-time {
  font-size: 0.75rem;
  color: #adb5bd;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #adb5bd;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #212529;
}

.stat-sub {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  display: flex;
  gap: 0.5rem;
}

.separator {
  color: #dee2e6;
}

.distributions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dist-card {
  border: 1px solid #f1f3f5;
  padding: 1rem;
  border-radius: 6px;
}

.dist-card h4 {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bar-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.bar-bg {
  height: 6px;
  background: #f1f3f5;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bg-critical { background-color: #721c24; }
.bg-high { background-color: #dc3545; }
.bg-medium { background-color: #fd7e14; }
.bg-low { background-color: #ffc107; }
.bg-safe { background-color: #28a745; }
.bg-status { background-color: #4dabf7; }

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.list-card {
  border: 1px solid #f1f3f5;
  padding: 1rem;
  border-radius: 6px;
}

.list-card h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.mini-empty {
  font-size: 0.8rem;
  color: #adb5bd;
  text-align: center;
  padding: 1rem;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-list li {
  font-size: 0.85rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.item-list li:hover {
  background: #e9ecef;
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 0.5rem;
}

.item-date {
  font-size: 0.7rem;
  color: #adb5bd;
  flex-shrink: 0;
}

.item-badge {
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 3px;
  color: white;
  font-weight: bold;
}

.risk-critical { background-color: #dc3545; }

@media (max-width: 600px) {
  .stats-grid, .distributions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
