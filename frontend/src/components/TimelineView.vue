<template>
  <section class="result-card">
    <div class="timeline-intro">
      <h2>{{ t('timeline.title') }} ({{ (timelineEvents || []).length }})</h2>
      <p class="intro-text">
        {{ t('timeline.intro') }}
      </p>
    </div>

    <!-- Filter Controls -->
    <div class="filter-controls">
      <div class="filter-group">
        <label>{{ t('common.severity') }}:</label>
        <select v-model="severityFilter" class="filter-select">
          <option value="all">{{ t('common.all') }}</option>
          <option value="high">{{ translateSeverity('high') }}</option>
          <option value="medium">{{ translateSeverity('medium') }}</option>
          <option value="low">{{ translateSeverity('low') }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>{{ t('common.sourceIp') }}:</label>
        <input
          v-model="ipSearch"
          type="text"
          :placeholder="t('common.searchPlaceholder')"
          class="filter-input"
        />
      </div>

      <button 
        v-if="isFiltered" 
        @click="clearFilters" 
        class="clear-btn"
      >
        {{ t('actions.clear') }}
      </button>

      <div v-if="isFiltered" class="filter-stats">
        {{ t('timeline.showingEvents', 'Showing {filtered} of {total} events').replace('{filtered}', filteredEvents.length).replace('{total}', (timelineEvents || []).length) }}
      </div>
    </div>

    <div v-if="filteredEvents.length === 0" class="empty-state">
      {{ (timelineEvents || []).length === 0 ? t('timeline.emptyState') : t('timeline.noMatch') }}
    </div>

    <div v-else class="timeline-container">
      <div v-for="event in filteredEvents" :key="event.event_id" class="timeline-item">
        <div class="timeline-marker">
          <div class="marker-dot" :class="event.severity.toLowerCase()"></div>
          <div class="marker-line"></div>
        </div>
        
        <div class="timeline-content">
          <div class="event-header">
            <span class="event-time">{{ event.timestamp }}</span>
            <span class="severity-badge" :data-severity="event.severity.toLowerCase()">
              {{ translateSeverity(event.severity).toUpperCase() }}
            </span>
            <span class="event-type-badge">{{ formatEventType(event.event_type) }}</span>
            <span class="ip-badge">{{ event.source_ip }}</span>
          </div>
          
          <div class="event-body">
            <h4 class="event-title">{{ event.title }}</h4>
            <p class="event-desc">{{ event.description }}</p>
            
            <div v-if="event.evidence" class="event-evidence">
              <strong>{{ t('common.evidence') }}:</strong>
              <pre><code>{{ event.evidence }}</code></pre>
            </div>
            
            <div class="event-meta" v-if="event.related_rule_id">
              <span class="meta-tag">{{ t('common.rule') }}: {{ event.related_rule_id }}</span>
              <span class="meta-tag" v-if="event.related_incident_id">ID: {{ event.related_incident_id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { t, translateSeverity } from '../i18n'

const props = defineProps({
  timelineEvents: {
    type: Array,
    default: () => []
  }
})

const severityFilter = ref('all')
const ipSearch = ref('')

const isFiltered = computed(() => {
  return severityFilter.value !== 'all' || ipSearch.value !== ''
})

const filteredEvents = computed(() => {
  return (props.timelineEvents || []).filter(event => {
    const matchesSeverity = severityFilter.value === 'all' || event.severity.toLowerCase() === severityFilter.value
    const matchesIp = event.source_ip.toLowerCase().includes(ipSearch.value.toLowerCase())
    return matchesSeverity && matchesIp
  })
})

const clearFilters = () => {
  severityFilter.value = 'all'
  ipSearch.value = ''
}

const formatEventType = (type) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
</script>

<style scoped>
.result-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.timeline-intro {
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f1f3f5;
  padding-bottom: 1rem;
}

.timeline-intro h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  color: #2c3e50;
}

.intro-text {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.filter-select, .filter-input {
  padding: 0.35rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  outline: none;
}

.clear-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.filter-stats {
  font-size: 0.85rem;
  color: #6c757d;
  margin-left: auto;
}

.timeline-container {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ced4da;
  margin-top: 0.5rem;
  z-index: 1;
}

.marker-dot.high { background-color: #e74c3c; }
.marker-dot.medium { background-color: #f39c12; }
.marker-dot.low { background-color: #3498db; }

.marker-line {
  flex-grow: 1;
  width: 2px;
  background: #e9ecef;
}

.timeline-item:last-child .marker-line {
  display: none;
}

.timeline-content {
  flex-grow: 1;
  padding-bottom: 2rem;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.event-time {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  font-family: monospace;
}

.severity-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
  color: white;
}

.severity-badge[data-severity="high"] { background-color: #e74c3c; }
.severity-badge[data-severity="medium"] { background-color: #f39c12; }
.severity-badge[data-severity="low"] { background-color: #3498db; }

.event-type-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 12px;
  font-weight: 500;
}

.ip-badge {
  font-size: 0.85rem;
  color: #6c757d;
  font-family: monospace;
}

.event-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #212529;
}

.event-desc {
  font-size: 0.9rem;
  color: #495057;
  margin: 0 0 0.75rem 0;
}

.event-evidence {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  border: 1px solid #e9ecef;
}

.event-evidence strong {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  color: #6c757d;
}

.event-evidence pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.8rem;
  color: #333;
}

.event-meta {
  display: flex;
  gap: 1rem;
}

.meta-tag {
  font-size: 0.75rem;
  color: #adb5bd;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
