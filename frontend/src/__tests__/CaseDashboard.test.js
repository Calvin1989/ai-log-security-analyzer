import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CaseDashboard from '../components/CaseDashboard.vue';

// Mock i18n
vi.mock('../i18n', () => ({
  t: (key) => key,
  translateRiskLevel: (level) => level,
  currentLanguage: { value: 'en' }
}));

// Mock triageStorage
vi.mock('../utils/triageStorage', () => ({
  getTriageState: vi.fn(() => ({}))
}));

describe('CaseDashboard.vue', () => {
  const mockCases = [
    {
      id: '1',
      title: 'Critical Case',
      risk_level: 'CRITICAL',
      risk_score: 9.5,
      finding_count: 5,
      incident_count: 1,
      created_at: '2024-01-01T10:00:00Z',
      is_batch: false
    },
    {
      id: '2',
      title: 'Batch Case',
      risk_level: 'HIGH',
      risk_score: 8.0,
      finding_count: 10,
      incident_count: 2,
      created_at: '2024-01-02T10:00:00Z',
      is_batch: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no cases', () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: [] }
    });
    expect(wrapper.text()).toContain('dashboard.empty');
  });

  it('renders total cases count', () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: mockCases }
    });
    expect(wrapper.find('.stat-value').text()).toBe('2');
    expect(wrapper.text()).toContain('dashboard.totalCases');
  });

  it('renders average risk score', () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: mockCases }
    });
    // (9.5 + 8.0) / 2 = 8.75 -> 8.8
    expect(wrapper.findAll('.stat-value')[1].text()).toBe('8.8');
  });

  it('renders risk distribution', () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: mockCases }
    });
    expect(wrapper.text()).toContain('dashboard.riskDistribution');
    expect(wrapper.text()).toContain('CRITICAL');
    expect(wrapper.text()).toContain('HIGH');
  });

  it('renders recent cases list', () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: mockCases }
    });
    expect(wrapper.text()).toContain('dashboard.recentCases');
    expect(wrapper.text()).toContain('Critical Case');
    expect(wrapper.text()).toContain('Batch Case');
  });

  it('emits select event when a case is clicked', async () => {
    const wrapper = mount(CaseDashboard, {
      props: { cases: mockCases }
    });
    await wrapper.find('.item-list li').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
  });
});
