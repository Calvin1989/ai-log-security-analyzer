from datetime import datetime
from .schemas import AnalysisResult

def generate_markdown_report(result: AnalysisResult) -> str:
    """
    Renders an AnalysisResult into a Markdown security report.

    Args:
        result: An instance of AnalysisResult.

    Returns:
        A formatted Markdown string.
    """
    summary = result.summary
    findings = result.findings
    incidents = result.incidents
    stats = result.parse_stats

    report = [
        "# AI Log Security Analysis Report",
        f"\nGenerated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "\n## 1. Overview Statistics",
        f"- **Total Requests:** {summary.total_requests}",
        f"- **Unique IPs:** {summary.unique_ips}",
        f"- **4xx Errors:** {summary.total_4xx}",
        f"- **5xx Errors:** {summary.total_5xx}",
        f"- **Security Incidents:** {len(incidents)}",
        f"- **Security Risks Found:** {len(findings)}",

        "\n## 2. Severity Distribution",
        "### Finding Severity Distribution",
        f"- **High:** {summary.finding_severity_counts.get('high', 0)}",
        f"- **Medium:** {summary.finding_severity_counts.get('medium', 0)}",
        f"- **Low:** {summary.finding_severity_counts.get('low', 0)}",
        "\n### Incident Severity Distribution",
        f"- **High:** {summary.incident_severity_counts.get('high', 0)}",
        f"- **Medium:** {summary.incident_severity_counts.get('medium', 0)}",
        f"- **Low:** {summary.incident_severity_counts.get('low', 0)}",
        
        "\n## 3. Parsing Quality",
        f"- **Total Lines (non-empty):** {stats.total_lines}",
        f"- **Successfully Parsed:** {stats.parsed_lines}",
        f"- **Skipped Lines:** {stats.skipped_lines}",
        f"- **Parse Rate:** {stats.parse_rate * 100:.2f}%",
        f"- **Log Format:** {stats.detected_format} (requested: {stats.requested_format})",
    ]
    
    if stats.skipped_lines > 0:
        report.append("\n> ⚠️ **Warning:** Some lines could not be parsed. Please verify the selected log format or check for custom log formats.")
        
        if stats.skipped_samples:
            report.append("\n### Skipped Line Samples")
            for sample in stats.skipped_samples:
                report.append(f"- **Line {sample.line_number}**: `{sample.content}`")
                report.append(f"  - *Reason*: {sample.reason}")

    report.extend([
        "\n## 4. Traffic Analysis",
        "\n### Top 5 IPs",
        "| IP Address | Request Count |",
        "| :--- | :--- |"
    ])
    for item in summary.top_ips:
        report.append(f"| {item['ip']} | {item['count']} |")

    report.extend([
        "\n### Top 5 Paths",
        "| Path | Request Count |",
        "| :--- | :--- |"
    ])
    for item in summary.top_paths:
        report.append(f"| {item['path']} | {item['count']} |")

    # Section 3: Security Incidents
    report.append("\n## 5. Security Incidents")
    if not incidents:
        report.append("\nNo significant security incidents aggregated.")
    else:
        for incident in incidents:
            severity_icon = {
                "low": "🔵 [Low]",
                "medium": "🟠 [Medium]",
                "high": "🔴 [High]"
            }.get(incident.severity.lower(), "[?]")
            
            report.append(f"\n### {severity_icon} {incident.title}")
            report.append(f"- **ID:** {incident.incident_id}")
            report.append(f"- **Source IP:** {incident.source_ip}")
            report.append(f"- **Confidence:** {incident.confidence}")
            report.append(f"- **Summary:** {incident.summary}")
            
            if incident.recommendations:
                report.append("\n**Recommendations:**")
                for rec in incident.recommendations:
                    report.append(f"- {rec}")

    # Section 4: Risk Findings
    report.append("\n## 6. Risk Findings")
    if not findings:
        report.append("\nNo specific risks detected.")
    else:
        for finding in findings:
            severity_icon = {
                "low": "🔵 [Low]",
                "medium": "🟠 [Medium]",
                "high": "🔴 [High]"
            }.get(finding.severity.lower(), "[?]")
            
            report.append(f"\n### {severity_icon} {finding.title}")
            report.append(f"- **Rule ID:** {finding.rule_id}")
            report.append(f"- **Description:** {finding.description}")
            
            report.append("\n**Matched Details:**")
            report.append(f"- **Matched Count:** {finding.matched_count}")
            report.append(f"- **Matched Fields:** {', '.join(finding.matched_fields)}")
            report.append(f"- **Matched Values:** {', '.join(finding.matched_values)}")
            
            if finding.evidence:
                report.append("\n**Evidence (Sample):**")
                for line in finding.evidence[:2]:
                    report.append(f"```\n{line}\n```")

    report.extend([
        "\n## 7. Remediation Suggestions",
        "- **Block High Risk IPs:** Consider blocking IPs that are scanning for sensitive paths or have excessive 404s.",
        "- **Rate Limiting:** Implement rate limiting for IPs showing high frequency behavior.",
        "- **Web Application Firewall (WAF):** Deploy a WAF to filter out suspicious User-Agents and known attack patterns.",
        "- **Hidden Paths:** Ensure sensitive files like `.env` and `.git` are not accessible from the web."
    ])

    return "\n".join(report)
