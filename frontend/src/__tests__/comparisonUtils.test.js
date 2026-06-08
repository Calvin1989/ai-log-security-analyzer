import { describe, it, expect } from 'vitest'
import { compareAnalyses } from '../utils/comparisonUtils'

describe('comparisonUtils', () => {
  const mockBase = {
    id: 'base',
    file_name: 'base.log',
    result: {
      summary: {
        risk_score: 20,
        overall_risk_level: 'Low',
        finding_severity_counts: { high: 1, medium: 2 },
        incident_severity_counts: { high: 0 },
        top_ips: [{ ip: '1.1.1.1', count: 10 }],
        top_paths: [{ path: '/login', count: 5 }]
      },
      executive_summary: {
        risk_score: 20,
        overall_risk_level: 'Low'
      },
      findings: [
        { rule_id: 'rule1', severity: 'high', title: 'Finding 1', evidence: ['ev1'] },
        { rule_id: 'rule2', severity: 'medium', title: 'Finding 2', evidence: ['ev2'] }
      ],
      incidents: [
        { incident_id: 'inc1', title: 'Incident 1', severity: 'medium', source_ip: '1.1.1.1' }
      ],
      parse_stats: { parse_rate: 0.95 },
      timeline_events: [{}, {}]
    }
  }

  const mockTarget = {
    id: 'target',
    file_name: 'target.log',
    result: {
      summary: {
        risk_score: 45,
        overall_risk_level: 'Medium',
        finding_severity_counts: { high: 2, medium: 1 },
        incident_severity_counts: { high: 1 },
        top_ips: [{ ip: '1.1.1.1', count: 20 }, { ip: '2.2.2.2', count: 5 }],
        top_paths: [{ path: '/login', count: 10 }]
      },
      executive_summary: {
        risk_score: 45,
        overall_risk_level: 'Medium',
        recommended_next_steps: ['Action 1']
      },
      findings: [
        { rule_id: 'rule1', severity: 'high', title: 'Finding 1', evidence: ['ev1'] }, // unchanged
        { rule_id: 'rule3', severity: 'high', title: 'Finding 3', evidence: ['ev3'] }  // added
      ],
      incidents: [
        { incident_id: 'inc1', title: 'Incident 1', severity: 'medium', source_ip: '1.1.1.1' }, // unchanged
        { incident_id: 'inc2', title: 'Incident 2', severity: 'high', source_ip: '2.2.2.2' }    // added
      ],
      parse_stats: { parse_rate: 0.98 },
      timeline_events: [{}, {}, {}]
    }
  }

  it('calculates risk score and metrics deltas correctly', () => {
    const comparison = compareAnalyses(mockBase, mockTarget)
    expect(comparison.summary.riskScoreDelta).toBe(25)
    expect(comparison.summary.totalFindingsDelta).toBe(0) // 2 -> 2
    expect(comparison.summary.totalIncidentsDelta).toBe(1) // 1 -> 2
    expect(comparison.summary.timelineEventsDelta).toBe(1) // 2 -> 3
    expect(comparison.summary.parseRateDelta).toBeCloseTo(0.03)
  })

  it('identifies added, removed and unchanged findings', () => {
    const comparison = compareAnalyses(mockBase, mockTarget)
    expect(comparison.findingChanges.added.length).toBe(1)
    expect(comparison.findingChanges.added[0].rule_id).toBe('rule3')
    expect(comparison.findingChanges.removed.length).toBe(1)
    expect(comparison.findingChanges.removed[0].rule_id).toBe('rule2')
    expect(comparison.findingChanges.unchanged.length).toBe(1)
    expect(comparison.findingChanges.unchanged[0].rule_id).toBe('rule1')
  })

  it('identifies added and unchanged incidents', () => {
    const comparison = compareAnalyses(mockBase, mockTarget)
    expect(comparison.incidentChanges.added.length).toBe(1)
    expect(comparison.incidentChanges.added[0].title).toBe('Incident 2')
    expect(comparison.incidentChanges.unchanged.length).toBe(1)
    expect(comparison.incidentChanges.unchanged[0].title).toBe('Incident 1')
  })

  it('calculates severity changes correctly', () => {
    const comparison = compareAnalyses(mockBase, mockTarget)
    const highChange = comparison.severityChanges.find(s => s.severity === 'high')
    // Base high: 1 finding + 0 incident = 1
    // Target high: 2 findings + 1 incident = 3
    expect(highChange.baseCount).toBe(1)
    expect(highChange.targetCount).toBe(3)
    expect(highChange.delta).toBe(2)
  })

  it('handles missing fields gracefully (compatibility with old records)', () => {
    const oldBase = { id: 'old', result: {} }
    const oldTarget = { id: 'new', result: { summary: { risk_score: 10 } } }

    expect(() => compareAnalyses(oldBase, oldTarget)).not.toThrow()
    const comparison = compareAnalyses(oldBase, oldTarget)
    expect(comparison.summary.riskScoreDelta).toBe(0) // executive_summary missing in both
    expect(comparison.summary.totalFindingsDelta).toBe(0)
    expect(comparison.narrative.headline).toBeDefined()
  })

  it('calculates top IP and path changes', () => {
    const comparison = compareAnalyses(mockBase, mockTarget)
    const ip1Change = comparison.topIpChanges.find(c => c.ip === '1.1.1.1')
    expect(ip1Change.delta).toBe(10)
    const ip2Change = comparison.topIpChanges.find(c => c.ip === '2.2.2.2')
    expect(ip2Change.delta).toBe(5)
  })
})
