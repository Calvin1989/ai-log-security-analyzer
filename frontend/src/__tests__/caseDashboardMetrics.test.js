import { describe, it, expect, vi } from 'vitest';
import { calculateDashboardMetrics } from '../utils/caseDashboardMetrics';

describe('caseDashboardMetrics', () => {
  it('should return default metrics for empty cases', () => {
    const metrics = calculateDashboardMetrics([]);
    expect(metrics.totalCases).toBe(0);
    expect(metrics.averageRiskScore).toBe(0);
    expect(metrics.riskLevelCounts).toEqual({});
  });

  it('should handle malformed data gracefully', () => {
    const metrics = calculateDashboardMetrics(null);
    expect(metrics.totalCases).toBe(0);
    
    const metrics2 = calculateDashboardMetrics([{}]);
    expect(metrics2.totalCases).toBe(1);
    expect(metrics2.averageRiskScore).toBe(0);
  });

  it('should calculate basic counts correctly', () => {
    const cases = [
      { id: '1', is_batch: false, risk_level: 'HIGH', risk_score: 8.5, finding_count: 10, incident_count: 2, created_at: '2024-01-01' },
      { id: '2', is_batch: true, risk_level: 'CRITICAL', risk_score: 10, finding_count: 20, incident_count: 5, created_at: '2024-01-02' }
    ];
    
    const metrics = calculateDashboardMetrics(cases);
    
    expect(metrics.totalCases).toBe(2);
    expect(metrics.singleCases).toBe(1);
    expect(metrics.batchCases).toBe(1);
    expect(metrics.totalFindings).toBe(30);
    expect(metrics.totalIncidents).toBe(7);
    expect(metrics.averageRiskScore).toBe(9.3); // (8.5 + 10) / 2 = 9.25 -> 9.3
    expect(metrics.riskLevelCounts).toEqual({ HIGH: 1, CRITICAL: 1 });
  });

  it('should handle triage state', () => {
    const cases = [
      { id: 'case1', risk_level: 'HIGH', risk_score: 8, created_at: '2024-01-01' }
    ];
    
    const mockGetTriageState = vi.fn().mockReturnValue({
      'finding:1': { status: 'OPEN', priority: 'HIGH' },
      'incident:1': { status: 'INVESTIGATING', priority: 'CRITICAL' }
    });
    
    const metrics = calculateDashboardMetrics(cases, mockGetTriageState);
    
    expect(metrics.triageStatusCounts).toEqual({ OPEN: 1, INVESTIGATING: 1 });
    expect(metrics.priorityCounts).toEqual({ HIGH: 1, CRITICAL: 1 });
    expect(metrics.highRiskOpenCases.length).toBe(1);
    expect(metrics.highRiskOpenCases[0].id).toBe('case1');
  });

  it('should identify cases with no triage', () => {
    const cases = [
      { id: 'case1', created_at: '2024-01-01' },
      { id: 'case2', created_at: '2024-01-02' }
    ];
    
    const mockGetTriageState = vi.fn((id) => {
      if (id === 'case1') return { 'f1': { status: 'MITIGATED' } };
      return {};
    });
    
    const metrics = calculateDashboardMetrics(cases, mockGetTriageState);
    
    expect(metrics.casesWithNoTriage.length).toBe(1);
    expect(metrics.casesWithNoTriage[0].id).toBe('case2');
  });

  it('should sort recent cases by date', () => {
    const cases = [
      { id: 'old', created_at: '2024-01-01' },
      { id: 'new', created_at: '2024-06-01' },
      { id: 'mid', created_at: '2024-03-01' }
    ];
    
    const metrics = calculateDashboardMetrics(cases);
    
    expect(metrics.recentlySavedCases[0].id).toBe('new');
    expect(metrics.recentlySavedCases[1].id).toBe('mid');
    expect(metrics.recentlySavedCases[2].id).toBe('old');
  });

  it('should sort top risk cases by score', () => {
    const cases = [
      { id: 'low', risk_score: 2 },
      { id: 'high', risk_score: 9 },
      { id: 'mid', risk_score: 5 }
    ];
    
    const metrics = calculateDashboardMetrics(cases);
    
    expect(metrics.topRiskCases[0].id).toBe('high');
    expect(metrics.topRiskCases[1].id).toBe('mid');
    expect(metrics.topRiskCases[2].id).toBe('low');
  });
});
