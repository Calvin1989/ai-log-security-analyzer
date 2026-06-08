<template>
  <div class="language-toggle">
    <button
      :class="{ active: currentLanguage === 'zh' }"
      @click="setLanguage('zh')"
      class="toggle-btn"
    >
      中文
    </button>
    <span class="divider">|</span>
    <button
      :class="{ active: currentLanguage === 'en' }"
      @click="setLanguage('en')"
      class="toggle-btn"
    >
      English
    </button>
  </div>
</template>

<script setup>
import { currentLanguage, setLanguage } from '../i18n'
</script>

<style scoped>
.language-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  font-weight: 500;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #2c3e50;
}

.toggle-btn.active {
  color: #007bff;
  font-weight: 700;
}

.divider {
  color: #dee2e6;
  user-select: none;
}
</style>
