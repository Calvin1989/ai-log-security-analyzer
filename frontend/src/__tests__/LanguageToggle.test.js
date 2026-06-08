import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageToggle from '../components/LanguageToggle.vue'
import { currentLanguage, setLanguage } from '../i18n'

describe('LanguageToggle.vue', () => {
  beforeEach(() => {
    setLanguage('zh')
  })

  it('renders both buttons', () => {
    const wrapper = mount(LanguageToggle)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('中文')
    expect(buttons[1].text()).toBe('English')
  })

  it('highlights active language', async () => {
    const wrapper = mount(LanguageToggle)
    const buttons = wrapper.findAll('button')

    expect(buttons[0].classes()).toContain('active')
    expect(buttons[1].classes()).not.toContain('active')

    setLanguage('en')
    await wrapper.vm.$nextTick()

    expect(buttons[0].classes()).not.toContain('active')
    expect(buttons[1].classes()).toContain('active')
  })

  it('switches language when clicked', async () => {
    const wrapper = mount(LanguageToggle)
    const buttons = wrapper.findAll('button')

    await buttons[1].trigger('click')
    expect(currentLanguage.value).toBe('en')

    await buttons[0].trigger('click')
    expect(currentLanguage.value).toBe('zh')
  })
})
