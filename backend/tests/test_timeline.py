import pytest
from app.schemas import LogEntry, Finding, Incident
from app.timeline import build_timeline_events

def test_build_timeline_events_basic():
    logs = [
        LogEntry(ip="1.1.1.1", timestamp="01/Jun/2026:10:00:01", method="GET", path="/index.html", protocol="HTTP/1.1", status=200, bytes_sent=1024, referer="-", user_agent="Mozilla", raw="raw1"),
        LogEntry(ip="1.1.1.1", timestamp="01/Jun/2026:10:00:05", method="GET", path="/.env", protocol="HTTP/1.1", status=404, bytes_sent=200, referer="-", user_agent="Mozilla", raw="raw2"),
    ]
    findings = [
        Finding(
            rule_id="sensitive_path_probe",
            title="Sensitive Path Probe",
            severity="high",
            description="Probe",
            recommendation="Block IP",
            evidence=["raw2"],
            matched_count=1,
            matched_fields=["path"],
            matched_values=["/.env"],
            metadata={"ip": "1.1.1.1", "paths": ["/.env"]}
        )
    ]
    incidents = []
    
    events = build_timeline_events(logs, findings, incidents)
    
    assert len(events) == 1
    assert events[0].event_type == "path_probe"
    assert events[0].timestamp == "01/Jun/2026:10:00:05"
    assert events[0].source_ip == "1.1.1.1"
    assert events[0].severity == "high"
    assert events[0].related_rule_id == "sensitive_path_probe"

def test_timeline_sorting_unknown_at_end():
    logs = [
        LogEntry(ip="1.1.1.1", timestamp="01/Jun/2026:10:00:01", method="GET", path="/a", protocol="HTTP/1.1", status=404, bytes_sent=0, referer="-", user_agent="UA", raw="raw1"),
    ]
    findings = [
        Finding(
            rule_id="path_scanning",
            title="Scan",
            severity="medium",
            description="Scan",
            recommendation="Rec",
            evidence=["raw1"],
            matched_count=10,
            matched_fields=["ip"],
            matched_values=["1.1.1.1"],
            metadata={"ip": "1.1.1.1", "count": 10}
        ),
        Finding(
            rule_id="high_frequency_ip",
            title="HF",
            severity="low",
            description="HF",
            recommendation="Rec",
            evidence=["raw1"],
            matched_count=100,
            matched_fields=["ip"],
            matched_values=["2.2.2.2"],
            metadata={"ip": "2.2.2.2", "count": 100} # No logs for this IP -> unknown timestamp
        )
    ]
    
    events = build_timeline_events(logs, findings, [])
    
    assert len(events) == 2
    # path_scanning should find timestamp from logs
    # high_frequency_ip for 2.2.2.2 should be unknown
    assert events[0].timestamp != "unknown"
    assert events[1].timestamp == "unknown"

def test_timeline_limit_50():
    logs = [LogEntry(ip="1.1.1.1", timestamp=f"01/Jun/2026:10:00:{i:02d}", method="GET", path=f"/{i}", protocol="HTTP/1.1", status=404, bytes_sent=0, referer="-", user_agent="UA", raw="raw") for i in range(60)]
    findings = [
        Finding(
            rule_id="sensitive_path_probe",
            title="Probe",
            severity="high",
            description="Probe",
            recommendation="Rec",
            evidence=["raw"],
            matched_count=60,
            matched_fields=["path"],
            matched_values=[f"/{i}" for i in range(60)],
            metadata={"ip": "1.1.1.1", "paths": [f"/{i}" for i in range(60)]}
        )
    ]
    
    events = build_timeline_events(logs, findings, [])
    assert len(events) == 50
