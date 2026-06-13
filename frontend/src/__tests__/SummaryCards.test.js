import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SummaryCards from '../components/SummaryCards.vue'
import { setLanguage } from '../i18n'

describe('SummaryCards', () => {
  beforeEach(() => {
    setLanguage('en')
  })

  const defaultSummary = {
    total_requests: 1500,
    unique_ips: 42,
    total_4xx: 23,
    total_5xx: 5
  }

  it('renders title and four stat labels/values from summary prop', () => {
    const wrapper = mount(SummaryCards, {
      props: { summary: defaultSummary }
    })

    expect(wrapper.text()).toContain('Overview Statistics')
    expect(wrapper.text()).toContain('Total Requests')
    expect(wrapper.text()).toContain('1500')
    expect(wrapper.text()).toContain('Unique IPs')
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('4xx Errors')
    expect(wrapper.text()).toContain('23')
    expect(wrapper.text()).toContain('5xx Errors')
    expect(wrapper.text()).toContain('5')
  })

  it('renders zero/default values gracefully when fields are missing', () => {
    const wrapper = mount(SummaryCards, {
      props: { summary: {} }
    })

    expect(wrapper.text()).toContain('Overview Statistics')
    expect(wrapper.text()).toContain('Total Requests')
    expect(wrapper.text()).toContain('Unique IPs')
    expect(wrapper.text()).toContain('4xx Errors')
    expect(wrapper.text()).toContain('5xx Errors')
  })

  it('has root data-testid="summary-cards"', () => {
    const wrapper = mount(SummaryCards, {
      props: { summary: defaultSummary }
    })

    expect(wrapper.find('[data-testid="summary-cards"]').exists()).toBe(true)
  })

  it('renders English i18n labels when language is en', () => {
    setLanguage('en')
    const wrapper = mount(SummaryCards, {
      props: { summary: defaultSummary }
    })

    expect(wrapper.text()).toContain('Overview Statistics')
    expect(wrapper.text()).toContain('Total Requests')
    expect(wrapper.text()).toContain('Unique IPs')
    expect(wrapper.text()).toContain('4xx Errors')
    expect(wrapper.text()).toContain('5xx Errors')
  })

  it('renders Chinese i18n labels when language is zh', () => {
    setLanguage('zh')
    const wrapper = mount(SummaryCards, {
      props: { summary: defaultSummary }
    })

    expect(wrapper.text()).toContain('概览统计')
    expect(wrapper.text()).toContain('总请求数')
    expect(wrapper.text()).toContain('唯一 IP 数')
    expect(wrapper.text()).toContain('4xx 错误')
    expect(wrapper.text()).toContain('5xx 错误')
  })
})
