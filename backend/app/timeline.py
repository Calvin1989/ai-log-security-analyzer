import uuid
from typing import List, Optional
from .schemas import LogEntry, Finding, Incident, TimelineEvent

def build_timeline_events(
    logs: List[LogEntry], 
    findings: List[Finding], 
    incidents: List[Incident]
) -> List[TimelineEvent]:
    """
    Builds a chronological list of key security events from logs, findings, and incidents.
    
    Args:
        logs: List of parsed LogEntry objects.
        findings: List of detected Finding objects.
        incidents: List of aggregated Incident objects.
        
    Returns:
        A list of TimelineEvent objects sorted by timestamp.
    """
    events: List[TimelineEvent] = []
    
    # Map finding metadata for easier lookup
    finding_map = {f.rule_id: f for f in findings}
    
    # Map incidents by related rule IDs for correlation
    rule_to_incident = {}
    for inc in incidents:
        for rid in inc.related_rule_ids:
            rule_to_incident[rid] = inc.incident_id

    for finding in findings:
        rid = finding.rule_id
        incident_id = rule_to_incident.get(rid)
        
        if rid == "sensitive_path_probe":
            # For sensitive path probes, we create an event for each unique path hit
            # We try to find the earliest timestamp for each path from this IP
            ip = finding.metadata.get("ip")
            paths = finding.metadata.get("paths", [])
            
            for path in paths:
                # Find matching log entries to get timestamp
                matching_logs = [l for l in logs if l.ip == ip and l.path.split('?')[0] == path]
                timestamp = matching_logs[0].timestamp if matching_logs else "unknown"
                evidence = matching_logs[0].raw.strip() if matching_logs else finding.evidence[0] if finding.evidence else None
                
                events.append(TimelineEvent(
                    event_id=str(uuid.uuid4())[:8],
                    timestamp=timestamp,
                    source_ip=ip,
                    event_type="path_probe",
                    severity=finding.severity,
                    title=f"Sensitive Path Probe: {path}",
                    description=f"IP {ip} attempted to access sensitive path {path}.",
                    related_rule_id=rid,
                    related_incident_id=incident_id,
                    evidence=evidence
                ))
                
        elif rid == "suspicious_user_agent":
            # For suspicious UA, create an event for each unique suspicious UA
            ip = finding.metadata.get("ip")
            uas = finding.metadata.get("user_agents", [])
            
            for ua in uas:
                matching_logs = [l for l in logs if l.ip == ip and l.user_agent == ua]
                timestamp = matching_logs[0].timestamp if matching_logs else "unknown"
                evidence = matching_logs[0].raw.strip() if matching_logs else finding.evidence[0] if finding.evidence else None
                
                events.append(TimelineEvent(
                    event_id=str(uuid.uuid4())[:8],
                    timestamp=timestamp,
                    source_ip=ip,
                    event_type="suspicious_ua",
                    severity=finding.severity,
                    title=f"Suspicious UA: {ua[:30]}...",
                    description=f"IP {ip} used an automated or suspicious User-Agent.",
                    related_rule_id=rid,
                    related_incident_id=incident_id,
                    evidence=evidence
                ))
                
        elif rid == "path_scanning":
            # For path scanning, create a single aggregated event
            ip = finding.metadata.get("ip")
            count = finding.metadata.get("count", 0)
            
            # Find earliest 404 for this IP
            matching_logs = [l for l in logs if l.ip == ip and l.status == 404]
            timestamp = matching_logs[0].timestamp if matching_logs else "unknown"
            evidence = f"Total 404 errors: {count}. Example: {matching_logs[0].raw.strip()}" if matching_logs else finding.evidence[0] if finding.evidence else None
            
            events.append(TimelineEvent(
                event_id=str(uuid.uuid4())[:8],
                timestamp=timestamp,
                source_ip=ip,
                event_type="path_scanning",
                severity=finding.severity,
                title="Directory Scanning Started",
                description=f"IP {ip} started scanning for non-existent paths ({count} errors).",
                related_rule_id=rid,
                related_incident_id=incident_id,
                evidence=evidence
            ))
            
        elif rid == "high_frequency_ip":
            # For high frequency, create a single aggregated event
            ip = finding.metadata.get("ip")
            count = finding.metadata.get("count", 0)
            
            # Find first request from this IP
            matching_logs = [l for l in logs if l.ip == ip]
            timestamp = matching_logs[0].timestamp if matching_logs else "unknown"
            evidence = f"Total requests: {count}. First request: {matching_logs[0].raw.strip()}" if matching_logs else finding.evidence[0] if finding.evidence else None
            
            events.append(TimelineEvent(
                event_id=str(uuid.uuid4())[:8],
                timestamp=timestamp,
                source_ip=ip,
                event_type="high_frequency",
                severity=finding.severity,
                title="High Frequency Activity",
                description=f"IP {ip} exceeded request threshold with {count} requests.",
                related_rule_id=rid,
                related_incident_id=incident_id,
                evidence=evidence
            ))

    # Sort events by timestamp
    # "unknown" timestamps are placed at the end
    def sort_key(e: TimelineEvent):
        if e.timestamp == "unknown":
            return "ZZZZZZZZZZZZZZZZ" # Place at end
        return e.timestamp
        
    events.sort(key=sort_key)
    
    # Limit to 50 events
    return events[:50]
