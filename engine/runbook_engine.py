"""
RunbookAI Core Engine
Intelligent Runbook, Install Guide & Incident Troubleshooting Engine.
Features:
- Algorithmic Log Parser & Diagnostic Triage
- Graph-based Topological Sort for Disaster Recovery Dependency Ordering (DAG)
- TF-IDF Vector Similarity for SME Troubleshooting Knowledge-Base Matching
- Automated Multi-Format Spec Synthesis: Runbook, Install Guide, App Recovery Guide
"""

import re
import math
import json
from collections import defaultdict, deque
from typing import List, Dict, Any, Optional, Tuple


class IncidentLogParser:
    """Parses raw server logs, stack traces, and alerts into structured diagnostic events."""
    
    PATTERNS = {
        "db_connection_exhausted": r"(FATAL:\s+remaining connection slots are reserved|too many connections|Connection pool exhausted)",
        "oom_killed": r"(Out of memory: Kill process|oom-killer|exit code 137)",
        "timeout_504": r"(504 Gateway Time-out|upstream request timeout|context deadline exceeded)",
        "redis_oom": r"(OOM command not allowed when used memory > 'maxmemory'|LOADING Redis is loading the dataset in memory)",
        "kafka_rebalance": r"(CommitFailedException|Consumer group.*rebalance|heartbeat timeout)",
        "ssl_cert_expired": r"(certificate has expired|CERT_HAS_EXPIRED|x509: certificate signed by unknown authority)",
        "deadlock": r"(deadlock detected|Lock wait timeout exceeded)",
        "dns_resolution": r"(dial tcp: lookup.*no such host|EAI_AGAIN|Temporary failure in name resolution)"
    }
    
    SEVERITY_MAP = {
        "db_connection_exhausted": ("CRITICAL", "P1", 15),
        "oom_killed": ("CRITICAL", "P1", 10),
        "timeout_504": ("HIGH", "P2", 25),
        "redis_oom": ("HIGH", "P2", 20),
        "kafka_rebalance": ("MEDIUM", "P3", 30),
        "ssl_cert_expired": ("HIGH", "P2", 15),
        "deadlock": ("MEDIUM", "P3", 20),
        "dns_resolution": ("CRITICAL", "P1", 10)
    }

    def parse(self, raw_log: str) -> Dict[str, Any]:
        """Identifies signatures, severity, priority, and extracted keywords."""
        detected_signatures = []
        highest_severity = "LOW"
        highest_priority = "P4"
        estimated_mttr = 45

        for key, pattern in self.PATTERNS.items():
            if re.search(pattern, raw_log, re.IGNORECASE):
                detected_signatures.append(key)
                sev, prio, mttr = self.SEVERITY_MAP[key]
                if prio == "P1" or (prio == "P2" and highest_priority in ["P3", "P4"]) or (prio == "P3" and highest_priority == "P4"):
                    highest_severity = sev
                    highest_priority = prio
                    estimated_mttr = mttr

        # Extract timestamps and error codes
        timestamps = re.findall(r"\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}", raw_log)
        error_codes = re.findall(r"(?:ERR|HTTP|STATUS|STATUS_CODE|CODE)[_\s:]+([0-9A-Z_-]+)", raw_log, re.IGNORECASE)

        return {
            "signatures": detected_signatures if detected_signatures else ["generic_system_failure"],
            "severity": highest_severity if detected_signatures else "MEDIUM",
            "priority": highest_priority if detected_signatures else "P3",
            "estimated_mttr_minutes": estimated_mttr,
            "timestamps": timestamps,
            "error_codes": list(set(error_codes)),
            "line_count": len(raw_log.strip().splitlines())
        }


class TFIDFMatcher:
    """Performs TF-IDF vectorization and cosine similarity to match incidents with SME playbooks."""
    
    def __init__(self, knowledge_base: List[Dict[str, Any]]):
        self.kb = knowledge_base
        self.doc_tokens = [self._tokenize(entry["symptoms"] + " " + entry["title"] + " " + entry["service"]) for entry in knowledge_base]
        self.df = defaultdict(int)
        for tokens in self.doc_tokens:
            for t in set(tokens):
                self.df[t] += 1
        self.N = len(knowledge_base)

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9_\-\s]", " ", text.lower())
        tokens = [w for w in cleaned.split() if len(w) > 2]
        return tokens

    def _compute_vector(self, tokens: List[str]) -> Dict[str, float]:
        tf = defaultdict(int)
        for t in tokens:
            tf[t] += 1
        vec = {}
        for t, count in tf.items():
            idf = math.log((self.N + 1) / (self.df[t] + 1)) + 1.0
            vec[t] = count * idf
        return vec

    def _cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        dot_product = sum(vec_a[t] * vec_b.get(t, 0.0) for t in vec_a)
        norm_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
        norm_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def match(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        q_vec = self._compute_vector(query_tokens)
        
        results = []
        for idx, entry in enumerate(self.kb):
            doc_vec = self._compute_vector(self.doc_tokens[idx])
            sim = self._cosine_similarity(q_vec, doc_vec)
            results.append({
                "playbook": entry,
                "confidence_score": round(sim, 4)
            })
            
        results.sort(key=lambda x: x["confidence_score"], reverse=True)
        return results[:top_k]


class RecoveryDependencyGraph:
    """
    Solves recovery dependency ordering using Kahn's Topological Sort algorithm.
    Ensures upstream foundational services (DB, Vault, Network) are fully recovered
    before downstream consumer applications (APIs, Webhooks, Dashboards).
    """
    
    def __init__(self):
        self.adj = defaultdict(list)
        self.in_degree = defaultdict(int)
        self.services = set()

    def add_dependency(self, prerequisite: str, dependent: str):
        """Specifies that `prerequisite` must be operational before `dependent` can start."""
        self.adj[prerequisite].append(dependent)
        self.in_degree[dependent] += 1
        self.services.add(prerequisite)
        self.services.add(dependent)
        if prerequisite not in self.in_degree:
            self.in_degree[prerequisite] = 0

    def compute_recovery_plan(self) -> Tuple[List[str], bool]:
        """
        Returns topological ordering of services for failover/recovery.
        Returns (ordered_services, has_cycle).
        """
        queue = deque([s for s in self.services if self.in_degree[s] == 0])
        ordered = []
        in_deg = dict(self.in_degree)

        while queue:
            node = queue.popleft()
            ordered.append(node)
            for neighbor in self.adj[node]:
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)

        has_cycle = len(ordered) != len(self.services)
        return ordered, has_cycle


class RunbookGenerator:
    """Synthesizes Install Guides, Runbooks, and Recovery Guides."""

    def generate_install_guide(self, service_name: str, env_vars: List[str], ports: List[int], prereqs: List[str]) -> str:
        md = []
        md.append(f"# Installation & Deployment Guide: {service_name}")
        md.append(f"**Version**: 1.4.0-GA | **Architecture**: Cloud-Native Enterprise")
        md.append("\n## 1. System Prerequisites")
        for p in prereqs:
            md.append(f"- [x] {p}")
            
        md.append("\n## 2. Environment Configuration")
        md.append("Create a `.env.production` file containing the following variables:")
        md.append("```bash")
        for v in env_vars:
            md.append(f"{v}=<ENTER_VALUE>")
        md.append("```")
        
        md.append("\n## 3. Installation Steps")
        md.append("```bash")
        md.append(f"# Clone application repository")
        md.append(f"git clone https://internal-enterprise.io/{service_name.lower().replace(' ', '-')}.git")
        md.append(f"cd {service_name.lower().replace(' ', '-')}")
        md.append("\n# Install verified dependencies and run containerized build")
        md.append("docker compose -f docker-compose.prod.yml build --no-cache")
        md.append("docker compose -f docker-compose.prod.yml up -d")
        md.append("```")

        md.append("\n## 4. Verification & Health Probes")
        for port in ports:
            md.append(f"- Verify HTTP Health Endpoint: `curl -f -s http://localhost:{port}/healthz | jq .`")
            md.append(f"- Verify Metrics Endpoint: `curl -s http://localhost:{port}/metrics | grep uptime`")

        return "\n".join(md)

    def generate_runbook(self, service_name: str, playbook: Dict[str, Any]) -> str:
        md = []
        md.append(f"# Standard Operating Procedure (Runbook): {service_name}")
        md.append(f"**Topic**: {playbook.get('title', 'Routine Operations & Maintenance')}")
        md.append(f"**Target SLA**: 99.95% | **Standard MTTR**: {playbook.get('target_mttr', '15 mins')}")
        
        md.append("\n## 1. Overview & Operational Scope")
        md.append(playbook.get("overview", "Maintains operational health and rapid incident mitigation for the production service."))

        md.append("\n## 2. Diagnostic Probes")
        for probe in playbook.get("probes", ["Check active pod status: kubectl get pods -l app=" + service_name.lower()]):
            md.append(f"```bash\n{probe}\n```")

        md.append("\n## 3. Triage & Mitigation Steps")
        for i, step in enumerate(playbook.get("steps", ["Inspect error logs", "Verify database connection pool", "Perform rolling restart"]), 1):
            md.append(f"**Step {i}**: {step}")

        md.append("\n## 4. Escalation Path")
        md.append("- Level 1: L1 Operations Monitoring (Slack `#ops-triage`)")
        md.append("- Level 2: Product SME On-Call Engineer")
        md.append("- Level 3: Platform Engineering Lead & Service Owner")

        return "\n".join(md)

    def generate_recovery_guide(self, service_name: str, recovery_sequence: List[str], rto_minutes: int, rpo_minutes: int) -> str:
        md = []
        md.append(f"# Application Disaster Recovery Guide: {service_name}")
        md.append(f"**Target RTO**: {rto_minutes} minutes | **Target RPO**: {rpo_minutes} minutes")
        
        md.append("\n## 1. Failover Assessment Criteria")
        md.append("- Declared primary datacenter outage exceeding 5 minutes.")
        md.append("- Data corruption or ransomware isolation trigger.")
        
        md.append("\n## 2. Dependency-Ordered Recovery Sequence (Topological Sort)")
        for rank, s in enumerate(recovery_sequence, 1):
            md.append(f"{rank}. **`{s}`** (Validate database consistency & upstream connectivity before proceeding)")
            
        md.append("\n## 3. Post-Recovery Validation Checklist")
        md.append("- [ ] Check end-to-end synthetic user transaction flow.")
        md.append("- [ ] Verify data synchronization offsets between secondary replica and active primary.")
        md.append("- [ ] Send executive resolution notice to business stakeholders.")

        return "\n".join(md)
