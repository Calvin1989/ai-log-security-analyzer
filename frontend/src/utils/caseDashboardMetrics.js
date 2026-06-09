/**
 * Utilities for calculating dashboard metrics from saved cases and triage state.
 */

/**
 * Calculates dashboard metrics.
 * @param {Array} cases - Array of saved cases from caseWorkspaceStorage.listCases()
 * @param {Function} getTriageState - Function to get triage state for a caseId
 * @returns {Object} Dashboard metrics
 */
export function calculateDashboardMetrics(cases = [], getTriageState = () => ({})) {
  if (!Array.isArray(cases)) {
    return getDefaultMetrics();
  }

  const metrics = getDefaultMetrics();
  metrics.totalCases = cases.length;

  let totalRiskScore = 0;
  const sortedCases = [...cases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Recently saved cases (up to 5)
  metrics.recentlySavedCases = sortedCases.slice(0, 5);

  cases.forEach(c => {
    // Single vs Batch
    if (c.is_batch) {
      metrics.batchCases++;
    } else {
      metrics.singleCases++;
    }

    // Risk Level Distribution
    const riskLevel = c.risk_level || 'UNKNOWN';
    metrics.riskLevelCounts[riskLevel] = (metrics.riskLevelCounts[riskLevel] || 0) + 1;

    // Totals
    totalRiskScore += (c.risk_score || 0);
    metrics.totalFindings += (c.finding_count || 0);
    metrics.totalIncidents += (c.incident_count || 0);

    // Triage Metrics
    const triageState = getTriageState(c.id);
    const triageItems = Object.values(triageState);

    if (triageItems.length === 0) {
      metrics.casesWithNoTriage.push(c);
    } else {
      triageItems.forEach(item => {
        const status = item.status || 'OPEN';
        const priority = item.priority || 'MEDIUM';
        metrics.triageStatusCounts[status] = (metrics.triageStatusCounts[status] || 0) + 1;
        metrics.priorityCounts[priority] = (metrics.priorityCounts[priority] || 0) + 1;

        // High Risk Open Cases
        // If an item is high/critical priority and still open/investigating
        const isHighPriority = ['HIGH', 'CRITICAL'].includes(priority);
        const isOpen = ['OPEN', 'INVESTIGATING'].includes(status);
        if (isHighPriority && isOpen) {
          // Avoid duplicates if multiple items in same case match
          if (!metrics.highRiskOpenCases.find(h => h.id === c.id)) {
            metrics.highRiskOpenCases.push(c);
          }
        }
      });
    }
  });

  // Average Risk Score
  metrics.averageRiskScore = metrics.totalCases > 0 
    ? Math.round((totalRiskScore / metrics.totalCases) * 10) / 10 
    : 0;

  // Top Risk Cases (top 5 by risk score)
  metrics.topRiskCases = [...cases]
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5);

  return metrics;
}

function getDefaultMetrics() {
  return {
    totalCases: 0,
    batchCases: 0,
    singleCases: 0,
    riskLevelCounts: {},
    averageRiskScore: 0,
    totalFindings: 0,
    totalIncidents: 0,
    triageStatusCounts: {},
    priorityCounts: {},
    highRiskOpenCases: [],
    recentlySavedCases: [],
    casesWithNoTriage: [],
    topRiskCases: []
  };
}
