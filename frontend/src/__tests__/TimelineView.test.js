import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineView from '../components/TimelineView.vue'
import { setLanguage } from '../i18n'

describe('TimelineView.vue', () => {
  beforeEach(() => {
    setLanguage('en')
  })

  const mockEvents = [
    {
      event_id: 'ev1',
      timestamp: '01/Jun/2026:10:00:01',
      source_ip: '1.1.1.1',
      event_type: 'path_probe',
      severity: 'high',
      title: 'Sensitive Path Probe',
      description: 'IP 1.1.1.1 accessed /.env',
      evidence: 'GET /.env'
    },
    {
      event_id: 'ev2',
      timestamp: '01/Jun/2026:10:05:00',
      source_ip: '2.2.2.2',
      event_type: 'suspicious_ua',
      severity: 'medium',
      title: 'Suspicious UA',
      description: 'IP 2.2.2.2 used sqlmap',
      evidence: 'UA: sqlmap'
    }
  ]

  it('renders timeline events correctly', () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: mockEvents }
    })

    expect(wrapper.text()).toContain('Attack Timeline (2)')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('1.1.1.1')
    expect(wrapper.text()).toContain('Sensitive Path Probe')
    expect(wrapper.text()).toContain('High')
  })

  it('filters by severity', async () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: mockEvents }
    })

    await wrapper.find('.filter-select').setValue('medium')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('2.2.2.2')
    expect(wrapper.text()).not.toContain('1.1.1.1')
  })

  it('filters by IP search', async () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: mockEvents }
    })

    await wrapper.find('.filter-input').setValue('1.1.1.1')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Sensitive Path Probe')
  })

  it('shows empty state when no events', () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: [] }
    })

    expect(wrapper.text()).toContain('No security events recorded')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(0)
  })

  it('handles undefined or missing timeline_events gracefully', () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: undefined }
    })

    expect(wrapper.text()).toContain('Attack Timeline (0)')
    expect(wrapper.text()).toContain('No security events recorded')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(0)
  })

  it('handles null timeline_events gracefully', () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: null }
    })

    expect(wrapper.text()).toContain('Attack Timeline (0)')
    expect(wrapper.text()).toContain('No security events recorded')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(0)
  })

  it('clears filters', async () => {
    const wrapper = mount(TimelineView, {
      props: { timelineEvents: mockEvents }
    })

    await wrapper.find('.filter-select').setValue('high')
    await wrapper.find('.filter-input').setValue('9.9.9.9')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(0)

    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.findAll('.timeline-item')).toHaveLength(2)
  })
})
