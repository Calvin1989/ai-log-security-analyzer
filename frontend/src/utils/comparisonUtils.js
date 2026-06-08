/**
 * Utility functions for comparing two analysis results.
 */

/**
 * Compares two analysis results and generates a structured comparison report.
 *
 * @param {Object} base - The baseline analysis result.
 * @param {Object} target - The target analysis result to compare against the baseline.
 * @returns {Object} - The comparison report.
 */
export function compareAnalyses(base, target) {
  // Graceful handling of missing data
  const baseResult = base?.result || base || {};
  const targetResult = target?.result || target || {};

  const baseSummary = baseResult.summary || {};
  const targetSummary = targetResult.summary || {};
  const baseExec = baseResult.executive_summary || {};
  const targetExec = targetResult.executive_summary || {};
  const baseParse = baseResult.parse_stats || {};
  const targetParse = targetResult.parse_stats || {};

  const baseFindings = baseResult.findings || [];
  const targetFindings = targetResult.findings || [];
  const baseIncidents = baseResult.incidents || [];
  const targetIncidents = targetResult.incidents || [];
  const baseTimeline = baseResult.timeline_events || [];
  const targetTimeline = targetResult.timeline_events || [];

  // 1. Summary deltas
  const riskScoreDelta = (targetExec.risk_score || 0) - (baseExec.risk_score || 0);
  const totalFindingsDelta = targetFindings.length - baseFindings.length;
  const totalIncidentsDelta = targetIncidents.length - baseIncidents.length;
  const timelineEventsDelta = targetTimeline.length - baseTimeline.length;
  const parseRateDelta = (targetParse.parse_rate || 0) - (baseParse.parse_rate || 0);

  // 2. Severity changes (Findings + Incidents)
  const severities = ['critical', 'high', 'medium', 'low', 'info', 'informational'];
  const severityChanges = severities.map(sev => {
    const baseCount = (baseSummary.finding_severity_counts?.[sev] || 0) + (baseSummary.incident_severity_counts?.[sev] || 0);
    const targetCount = (targetSummary.finding_severity_counts?.[sev] || 0) + (targetSummary.incident_severity_counts?.[sev] || 0);
    return {
      severity: sev,
      baseCount,
      targetCount,
      delta: targetCount - baseCount
    };
  }).filter(s => s.baseCount > 0 || s.targetCount > 0);

  // 3. Finding Identity & Changes
  const getFindingId = (f) => {
    const primaryEvidence = f.evidence?.[0] || f.matched_values?.[0] || '';
    return `${f.rule_id}|${f.severity}|${f.title}|${primaryEvidence}`.toLowerCase();
  };

  const baseFindingIds = new Set(baseFindings.map(getFindingId));
  const targetFindingIds = new Set(targetFindings.map(getFindingId));

  const findingChanges = {
    added: targetFindings.filter(f => !baseFindingIds.has(getFindingId(f))),
    removed: baseFindings.filter(f => !targetFindingIds.has(getFindingId(f))),
    unchanged: targetFindings.filter(f => baseFindingIds.has(getFindingId(f)))
  };

  // 4. Incident Identity & Changes
  const getIncidentId = (inc) => {
    if (inc.incident_id && !inc.incident_id.startsWith('temp_')) {
      return inc.incident_id;
    }
    return `${inc.title}|${inc.severity}|${inc.source_ip}`.toLowerCase();
  };

  const baseIncidentIds = new Set(baseIncidents.map(getIncidentId));
  const targetIncidentIds = new Set(targetIncidents.map(getIncidentId));

  const incidentChanges = {
    added: targetIncidents.filter(inc => !baseIncidentIds.has(getIncidentId(inc))),
    removed: baseIncidents.filter(inc => !targetIncidentIds.has(getIncidentId(inc))),
    unchanged: targetIncidents.filter(inc => baseIncidentIds.has(getIncidentId(inc)))
  };

  // 5. Top IP / Path changes
  const baseTopIps = baseSummary.top_ips || [];
  const targetTopIps = targetSummary.top_ips || [];
  const ipMap = new Map();
  baseTopIps.forEach(item => ipMap.set(item.ip, { baseCount: item.count, targetCount: 0 }));
  targetTopIps.forEach(item => {
    if (ipMap.has(item.ip)) {
      ipMap.get(item.ip).targetCount = item.count;
    } else {
      ipMap.set(item.ip, { baseCount: 0, targetCount: item.count });
    }
  });
  const topIpChanges = Array.from(ipMap.entries()).map(([ip, counts]) => ({
    ip,
    ...counts,
    delta: counts.targetCount - counts.baseCount
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 10);

  const baseTopPaths = baseSummary.top_paths || [];
  const targetTopPaths = targetSummary.top_paths || [];
  const pathMap = new Map();
  baseTopPaths.forEach(item => pathMap.set(item.path, { baseCount: item.count, targetCount: 0 }));
  targetTopPaths.forEach(item => {
    if (pathMap.has(item.path)) {
      pathMap.get(item.path).targetCount = item.count;
    } else {
      pathMap.set(item.path, { baseCount: 0, targetCount: item.count });
    }
  });
  const topPathChanges = Array.from(pathMap.entries()).map(([path, counts]) => ({
    path,
    ...counts,
    delta: counts.targetCount - counts.baseCount
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 10);

  // 6. Narrative summary
  const headline = riskScoreDelta > 0 ? '安全风险显著上升' : (riskScoreDelta < 0 ? '安全风险有所下降' : '安全风险保持稳定');

  let riskLevelChange = 'unchanged';
  if (baseExec.overall_risk_level !== targetExec.overall_risk_level) {
    riskLevelChange = `从 ${baseExec.overall_risk_level || 'Unknown'} 变为 ${targetExec.overall_risk_level || 'Unknown'}`;
  }

  const keyChanges = [];
  if (riskScoreDelta !== 0) keyChanges.push(`风险评分变化了 ${riskScoreDelta} 分。`);
  if (findingChanges.added.length > 0) keyChanges.push(`新增了 ${findingChanges.added.length} 个风险点。`);
  if (incidentChanges.added.length > 0) keyChanges.push(`新增了 ${incidentChanges.added.length} 个安全事件。`);
  if (findingChanges.removed.length > 0) keyChanges.push(`减少了 ${findingChanges.removed.length} 个旧风险点。`);

  const recommendedActions = targetExec.recommended_next_steps || ['继续监控日志内容', '复核新增的风险点', '检查高频访问的 IP'];

  return {
    summary: {
      baseLabel: base.label || base.filename || 'Baseline',
      targetLabel: target.label || target.filename || 'Target',
      riskScoreDelta,
      riskLevelChange,
      totalFindingsDelta,
      totalIncidentsDelta,
      timelineEventsDelta,
      parseRateDelta
    },
    severityChanges,
    findingChanges: {
      added: findingChanges.added.map(f => ({ rule_id: f.rule_id, title: f.title, severity: f.severity })),
      removed: findingChanges.removed.map(f => ({ rule_id: f.rule_id, title: f.title, severity: f.severity })),
      unchanged: findingChanges.unchanged.map(f => ({ rule_id: f.rule_id, title: f.title, severity: f.severity }))
    },
    incidentChanges: {
      added: incidentChanges.added.map(inc => ({ title: inc.title, severity: inc.severity, source_ip: inc.source_ip })),
      removed: incidentChanges.removed.map(inc => ({ title: inc.title, severity: inc.severity, source_ip: inc.source_ip })),
      unchanged: incidentChanges.unchanged.map(inc => ({ title: inc.title, severity: inc.severity, source_ip: inc.source_ip }))
    },
    topIpChanges,
    topPathChanges,
    narrative: {
      headline,
      overview: `对比分析显示，目标报告相对于基准报告，风险评分${riskScoreDelta >= 0 ? '增加' : '减少'}了 ${Math.abs(riskScoreDelta)} 分。`,
      keyChanges: keyChanges.join(' '),
      recommendedActions
    }
  };
}

/**
 * Generates a Markdown report for the comparison.
 *
 * @param {Object} comparison - The comparison result from compareAnalyses.
 * @returns {string} - The Markdown content.
 */
export function generateComparisonMarkdown(comparison) {
  const { summary, severityChanges, findingChanges, incidentChanges, narrative } = comparison;

  let md = `# 安全分析对比报告\n\n`;
  md += `## 概览\n\n`;
  md += `- **基准报告**: ${summary.baseLabel}\n`;
  md += `- **目标报告**: ${summary.targetLabel}\n`;
  md += `- **风险变化**: ${narrative.headline}\n`;
  md += `- **风险等级**: ${summary.riskLevelChange}\n`;
  md += `- **风险评分变化**: ${summary.riskScoreDelta > 0 ? '+' : ''}${summary.riskScoreDelta}\n\n`;

  md += `## 核心指标变化\n\n`;
  md += `| 指标 | 基准 | 目标 | 变化 |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| 风险评分 | - | - | ${summary.riskScoreDelta} |\n`;
  md += `| 风险点数量 | - | - | ${summary.totalFindingsDelta} |\n`;
  md += `| 安全事件数量 | - | - | ${summary.totalIncidentsDelta} |\n`;
  md += `| 时间轴事件 | - | - | ${summary.timelineEventsDelta} |\n`;
  md += `| 解析成功率 | - | - | ${summary.parseRateDelta.toFixed(2)}% |\n\n`;

  md += `## 严重程度分布变化\n\n`;
  md += `| 严重程度 | 基准数量 | 目标数量 | 变化 |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  severityChanges.forEach(s => {
    md += `| ${s.severity.toUpperCase()} | ${s.baseCount} | ${s.targetCount} | ${s.delta > 0 ? '+' : ''}${s.delta} |\n`;
  });
  md += `\n`;

  md += `## 风险点变更 (Findings)\n\n`;
  if (findingChanges.added.length > 0) {
    md += `### 新增风险点\n`;
    findingChanges.added.forEach(f => md += `- [${f.severity.toUpperCase()}] ${f.title} (${f.rule_id})\n`);
    md += `\n`;
  }
  if (findingChanges.removed.length > 0) {
    md += `### 已消失风险点\n`;
    findingChanges.removed.forEach(f => md += `- [${f.severity.toUpperCase()}] ${f.title} (${f.rule_id})\n`);
    md += `\n`;
  }

  md += `## 安全事件变更 (Incidents)\n\n`;
  if (incidentChanges.added.length > 0) {
    md += `### 新增安全事件\n`;
    incidentChanges.added.forEach(inc => md += `- [${inc.severity.toUpperCase()}] ${inc.title} (IP: ${inc.source_ip})\n`);
    md += `\n`;
  }
  if (incidentChanges.removed.length > 0) {
    md += `### 已消失安全事件\n`;
    incidentChanges.removed.forEach(inc => md += `- [${inc.severity.toUpperCase()}] ${inc.title} (IP: ${inc.source_ip})\n`);
    md += `\n`;
  }

  md += `## 结论与建议\n\n`;
  md += `### 变化总结\n${narrative.keyChanges}\n\n`;
  md += `### 推荐后续行动\n`;
  narrative.recommendedActions.forEach(action => md += `- ${action}\n`);

  md += `\n\n---\n*报告生成于: ${new Date().toLocaleString()} (Local-first Analysis Comparison)*\n`;

  return md;
}
