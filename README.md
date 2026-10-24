# RunbookAI — Enterprise Runbook & Incident Troubleshooting Copilot

An intelligent enterprise operations platform and automation engine designed to accelerate incident mitigation, automate technical documentation (Install Guides, Runbooks, and Application Recovery Guides), and coordinate Subject Matter Expert (SME) troubleshooting workflows.

[![Live Demo](https://img.shields.io/badge/Demo-Live_Deployment-indigo.svg)](https://runbook-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Engine](https://img.shields.io/badge/Python-3.10%2B-green.svg)](engine/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](tsconfig.json)

---

## 🌟 Key Features

1. **Automated Incident Triage & Root Cause Diagnostics**:
   - Ingests raw stack traces, system logs, and cluster telemetry.
   - Extracts error codes, severity levels (`CRITICAL`, `HIGH`, `MEDIUM`), and assigns priority bands (`P1` through `P4`).
   - Calculates target Mean Time to Resolve (MTTR) and flags cascading failure risks.

2. **NLP-Powered SME Playbook Matching**:
   - Implements TF-IDF vectorization and Cosine Similarity to compare incoming incident symptoms against curated Subject Matter Expert (SME) playbooks.
   - Ranks remediation solutions with real-time confidence scores.

3. **Install & Deployment Guide Generator**:
   - Automatically synthesizes production-ready installation guides customized by compute target (Kubernetes, AWS EKS, Docker Compose, AWS ECS).
   - Generates environment variable secrets scaffolding, port bindings, and automated health verification probes (`/healthz`, `/metrics`).

4. **Standard Operating Runbook (SOP) Synthesizer**:
   - Generates structured runbooks covering detection, triage, mitigation commands, and a multi-tiered escalation matrix (L1 NOC $\rightarrow$ L2 Product SME $\rightarrow$ L3 Engineering Lead).

5. **Disaster Recovery (DR) & Application Recovery Engine**:
   - Implements **Kahn's Topological Sort algorithm** on a Directed Acyclic Graph (DAG) of enterprise service dependencies to resolve the safe recovery sequence (e.g., DNS $\rightarrow$ Database Primary $\rightarrow$ Caches $\rightarrow$ Auth $\rightarrow$ APIs $\rightarrow$ Worker Queues).
   - Tracks Recovery Time Objective (RTO) and Recovery Point Objective (RPO) compliance.

6. **Executive Stakeholder Analytics & Reporting**:
   - Visualizes MTTR reductions, incident severity distribution, and BCP compliance metrics for leadership and stakeholder reporting.

---

## 🏗️ Architecture

```
                       +---------------------------+
                       |    Raw Telemetry / Logs   |
                       +-------------+-------------+
                                     |
                                     v
                       +---------------------------+
                       |   Incident Log Parser     |
                       | (Regex + Tokenizer Engine)|
                       +-------------+-------------+
                                     |
            +------------------------+------------------------+
            |                                                 |
            v                                                 v
+-----------------------+                         +-----------------------+
|  TF-IDF Vector Match  |                         | Recovery Dependency   |
|  against SME Playbooks|                         | Graph (Topological    |
+-----------+-----------+                         | Kahn DAG Algorithm)   |
            |                                     +-----------+-----------+
            |                                                 |
            +------------------------+------------------------+
                                     |
                                     v
                       +---------------------------+
                       | Document Synthesis Engine |
                       | - Install Guides          |
                       | - Runbooks & SOPs         |
                       | - App Recovery Guides     |
                       | - Executive Reports       |
                       +-------------+-------------+
                                     |
                                     v
                       +---------------------------+
                       |  Next.js 16 Web Cockpit   |
                       |  & Vercel Live Deployment |
                       +---------------------------+
```

---

## 💻 Tech Stack

- **Frontend & Web Platform**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Core Algorithmic Engine**: Python 3.10+
  - Kahn's Algorithm for Topological Ordering (DAG Dependency Resolution)
  - Term Frequency-Inverse Document Frequency (TF-IDF) & Cosine Similarity
  - Regular Expression Pattern Matching & Severity Heuristics
- **Testing & Verification**: Python `unittest`, Next.js build verification
- **Deployment**: Vercel Edge Platform

---

## 🚀 Getting Started

### 1. Web Application (Next.js)

```bash
# Clone the repository
git clone https://github.com/TejdeepKodati/runbook-ai.git
cd runbook-ai

# Install dependencies (respecting npm security settings)
npm install --ignore-scripts

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

To build for production:
```bash
npm run build
npm run start
```

### 2. Python Core Engine & Test Suite

The algorithmic core can be run and tested independently without external dependencies:

```bash
cd engine

# Run comprehensive unit test suite
python -m unittest test_runbook_engine.py -v
```

---

## 🧪 Verification & Test Results

```
test_database_connection_exhaustion (test_runbook_engine.TestIncidentLogParser) ... ok
test_generic_fallback (test_runbook_engine.TestIncidentLogParser) ... ok
test_oom_killed_detection (test_runbook_engine.TestIncidentLogParser) ... ok
test_cycle_detection (test_runbook_engine.TestRecoveryDependencyGraph) ... ok
test_topological_sort_recovery (test_runbook_engine.TestRecoveryDependencyGraph) ... ok
test_install_guide_generation (test_runbook_engine.TestRunbookGenerator) ... ok
test_recovery_guide_generation (test_runbook_engine.TestRunbookGenerator) ... ok
test_symptom_matching (test_runbook_engine.TestTFIDFMatcher) ... ok

----------------------------------------------------------------------
Ran 8 tests in 0.002s

OK
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="right">made with ♥ by <a href="https://github.com/TejdeepKodati">Tejdeep</a></p>
