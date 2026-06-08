import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SeverityDistribution from '../components/SeverityDistribution.vue'
import { setLanguage } from '../i18n'

describe('SeverityDistribution.vue', () => {
  beforeEach(() => {
    setLanguage('en')
  })

  it('renders correctly with given counts', () => {
    const findingSeverityCounts = { high: 2, medium: 1, low: 0 }
    const incidentSeverityCounts = { high: 1, medium: 0, low: 0 }

    const wrapper = mount(SeverityDistribution, {
      props: { findingSeverityCounts, incidentSeverityCounts }
    })

    // Check titles
    expect(wrapper.text()).toContain('Severity Distribution')
    expect(wrapper.text()).toContain('Finding Severity')
    expect(wrapper.text()).toContain('Incident Severity')

    // Check Finding counts
    const findingCard = wrapper.findAll('.distribution-card')[0]
    const findingItems = findingCard.findAll('.severity-item')
    
    // High
    expect(findingItems[0].find('.severity-label').text()).toBe('High')
    expect(findingItems[0].find('.count').text()).toBe('2')
    
    // Medium
    expect(findingItems[1].find('.severity-label').text()).toBe('Medium')
    expect(findingItems[1].find('.count').text()).toBe('1')
    
    // Low
    expect(findingItems[2].find('.severity-label').text()).toBe('Low')
    expect(findingItems[2].find('.count').text()).toBe('0')

    // Check Incident counts
    const incidentCard = wrapper.findAll('.distribution-card')[1]
    const incidentItems = incidentCard.findAll('.severity-item')
    
    // High
    expect(incidentItems[0].find('.severity-label').text()).toBe('High')
    expect(incidentItems[0].find('.count').text()).toBe('1')
  })

  it('renders default counts when props are missing', () => {
    const wrapper = mount(SeverityDistribution)

    const counts = wrapper.findAll('.count')
    counts.forEach(count => {
      expect(count.text()).toBe('0')
    })
  })

  it('calculates bar widths correctly', () => {
    const findingSeverityCounts = { high: 2, medium: 2, low: 0 } // Total 4
    const wrapper = mount(SeverityDistribution, {
      props: { findingSeverityCounts }
    })

    const bars = wrapper.findAll('.bar')
    // High: 2/4 = 50%
    expect(bars[0].attributes('style')).toContain('width: 50%')
    // Medium: 2/4 = 50%
    expect(bars[1].attributes('style')).toContain('width: 50%')
    // Low: 0/4 = 0%
    expect(bars[2].attributes('style')).toContain('width: 0%')
  })
})
