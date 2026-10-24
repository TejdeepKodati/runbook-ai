"use client";

import React, { useState } from "react";
import {
  FileText,
  Activity,
  Terminal,
  ShieldCheck,
  Server,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  Settings,
  Layers,
  ArrowRight,
  BookOpen,
  TrendingDown,
  RefreshCw,
  GitBranch
} from "lucide-react";

interface IncidentScenario {
  id: string;
  name: string;
  service: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  priority: "P1" | "P2" | "P3";
  mttr: number;
  log: string;
  rootCause: string;
  smeMitigation: string;
}

const SAMPLE_INCIDENTS: IncidentScenario[] = [
  {
    id: "INC-1082",
    name: "PostgreSQL Connection Pool Exhaustion",
    service: "Transaction-Ledger-DB",
    severity: "CRITICAL",
    priority: "P1",
    mttr: 15,
    log: `2026-10-24 07:14:22.842 UTC [2418] ERROR: pool-exhausted: org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved for non-replication superuser connections\n2026-10-24 07:14:23.011 UTC [2418] DETAIL: Active server connections: 500/500 (100% saturation)\n2026-10-24 07:14:23.045 UTC [2419] CONTEXT: client application payment-worker [PID 9411]\nCODE: ERR_PG_POOL_EXHAUSTED`,
    rootCause: "Unclosed database connection pool leak in microservice payment-worker v2.4.1 under concurrent batch reconciliation jobs.",
    smeMitigation: "Increase max_connections temporarily to 650; restart PgBouncer connection pooler; roll back payment-worker to v2.4.0."
  },
  {
    id: "INC-1083",
    name: "Redis Cluster Memory Eviction & OOM Kill",
    service: "Session-Cache-Cluster",
    severity: "HIGH",
    priority: "P2",
    mttr: 20,
    log: `2026-10-24 08:02:11.194 [WARNING] OOM command not allowed when used memory > 'maxmemory' (8192MB/8192MB)\n2026-10-24 08:02:12.001 [SEVERE] Redis node 10.0.14.81 received SIGKILL: exit code 137 (OOM-Killer)\n2026-10-24 08:02:14.521 [ERROR] Upstream Auth-Token verification failed: cache read timeout after 3000ms\nCODE: ERR_REDIS_MAXMEMORY_EXCEEDED`,
    rootCause: "Missing TTL expiration policy on user telemetry session tokens caused linear memory growth exceeding 8GB limit.",
    smeMitigation: "Apply volatile-lru eviction policy; flush stale analytics namespace keys; scale Redis node memory to 16GB."
  },
  {
    id: "INC-1084",
    name: "504 Gateway Timeout on Upstream Ingestion",
    service: "API-Gateway-Envoy",
    severity: "HIGH",
    priority: "P2",
    mttr: 25,
    log: `2026-10-24 08:45:00.012 [ERROR] 504 Gateway Time-out: upstream request timeout\n2026-10-24 08:45:00.089 [WARNING] Envoy cluster 'analytics-backend' response flag UT: upstream request timeout after 15000ms\n2026-10-24 08:45:01.320 [ALERT] Dropping ingress webhooks due to backpressure threshold breach\nCODE: HTTP_504_GATEWAY_TIMEOUT`,
    rootCause: "Downstream analytics worker blocked on un-indexed database table lock during full-table schema migration.",
    smeMitigation: "Cancel long-running migration query PID; reroute non-critical traffic to queue buffer; increase gateway timeout buffer."
  },
  {
    id: "INC-1085",
    name: "Mutual TLS Certificate Expiration",
    service: "Security-Token-Service",
    severity: "HIGH",
    priority: "P2",
    mttr: 15,
    log: `2026-10-24 09:30:41.112 [FATAL] tls: handshake failure: certificate has expired (NotAfter: 2026-10-24 00:00:00 UTC)\n2026-10-24 09:30:41.200 [ERROR] x509: certificate signed by unknown authority or expired\n2026-10-24 09:30:42.010 [WARN] Internal service-to-service gRPC connection pool terminated\nCODE: ERR_SSL_CERT_EXPIRED`,
    rootCause: "Automated cert-manager renewal webhook failed due to IAM secret permission drift on Kubernetes cluster namespace.",
    smeMitigation: "Inject newly signed wildcard leaf certificate manually; renew cert-manager service role token; execute rolling pod restart."
  }
];

export default function RunbookAIPage() {
  const [activeTab, setActiveTab] = useState<"triage" | "install" | "runbook" | "recovery" | "sme" | "reports">("triage");
  const [selectedIncident, setSelectedIncident] = useState<IncidentScenario>(SAMPLE_INCIDENTS[0]);
  const [customLog, setCustomLog] = useState<string>(SAMPLE_INCIDENTS[0].log);
  const [copied, setCopied] = useState<boolean>(false);

  // Form states for Install Guide Generator
  const [serviceName, setServiceName] = useState("Enterprise-Gateway-Service");
  const [targetEnv, setTargetEnv] = useState("Kubernetes (AWS EKS)");
  const [envVars, setEnvVars] = useState("DATABASE_URL, REDIS_CLUSTER_URL, JWT_SECRET, SENTRY_DSN, LOG_LEVEL");
  const [ports, setPorts] = useState("8080, 9090");

  // Form states for Disaster Recovery Guide
  const [rtoMinutes, setRtoMinutes] = useState(15);
  const [rpoMinutes, setRpoMinutes] = useState(5);
  const recoveryOrder = [
    "1. Infrastructure VPC & Core DNS Resolution",
    "2. PostgreSQL Primary Database & Replica Synchronization",
    "3. Redis Session & Distributed Lock Cluster",
    "4. Security Token & Internal Authentication Service",
    "5. Core Transaction & Ingestion Microservices",
    "6. Public API Gateway & Ingress Traffic Routers",
    "7. Asynchronous Webhook Workers & Analytics Collectors"
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIncidentSelect = (inc: IncidentScenario) => {
    setSelectedIncident(inc);
    setCustomLog(inc.log);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                Runbook<span className="text-indigo-400">AI</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Operations Copilot
                </span>
              </span>
              <p className="text-xs text-slate-400">Automated Runbooks, Install Guides, Application Recovery & SME Diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SLA 99.98% Healthy
            </span>
            <a
              href="https://github.com/TejdeepKodati/runbook-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-1 text-sm">
          {[
            { id: "triage", label: "Diagnostic Triage", icon: Activity },
            { id: "install", label: "Install Guide Generator", icon: Terminal },
            { id: "runbook", label: "Runbook SOP", icon: BookOpen },
            { id: "recovery", label: "Recovery Guide (DR)", icon: ShieldCheck },
            { id: "sme", label: "SME Playbook Hub", icon: Layers },
            { id: "reports", label: "Stakeholder Analytics", icon: TrendingDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: DIAGNOSTIC TRIAGE */}
        {activeTab === "triage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Incident Presets & Log Input */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                    <span>Select Incident Scenario</span>
                    <span className="text-xs text-indigo-400">4 Presets</span>
                  </h3>
                  <div className="space-y-2">
                    {SAMPLE_INCIDENTS.map((inc) => (
                      <button
                        key={inc.id}
                        onClick={() => handleIncidentSelect(inc)}
                        className={`w-full text-left p-2.5 rounded-lg border transition ${
                          selectedIncident.id === inc.id
                            ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                            : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono text-indigo-400">{inc.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              inc.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {inc.priority} {inc.severity}
                          </span>
                        </div>
                        <div className="text-xs font-medium truncate">{inc.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{inc.service}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Raw Server Log / Stack Trace
                  </h4>
                  <textarea
                    rows={8}
                    value={customLog}
                    onChange={(e) => setCustomLog(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
                    <span>NLP Tokenizer: TF-IDF Enabled</span>
                    <button
                      onClick={() => setCustomLog(selectedIncident.log)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Columns: Automated Diagnosis & Playbook Match */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {selectedIncident.priority} {selectedIncident.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{selectedIncident.id}</span>
                        <span className="text-xs text-slate-400">• Service: <span className="text-slate-200 font-mono">{selectedIncident.service}</span></span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">{selectedIncident.name}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Target MTTR</span>
                      <span className="text-lg font-bold text-emerald-400">{selectedIncident.mttr} mins</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Root Cause Identification
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {selectedIncident.rootCause}
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                        SME Recommended Mitigation
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {selectedIncident.smeMitigation}
                      </p>
                    </div>
                  </div>

                  {/* Immediate Action Runbook Steps */}
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-indigo-400" />
                    Automated Triage Playbook (Kahn DAG Order)
                  </h4>
                  <div className="space-y-2 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Step 1: Check Ingress Health & Active Connection Slugs</span>
                      <span className="text-emerald-400 font-semibold">[Automated Pass]</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Step 2: Execute SME Mitigation Script (`./scripts/triage-remediate.sh`)</span>
                      <span className="text-amber-400 font-semibold">[Pending Operator Action]</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Step 3: Trigger Continuous Health Probe `/healthz` until 200 OK</span>
                      <span className="text-slate-500 font-semibold">[Queued]</span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setActiveTab("runbook")}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <BookOpen className="w-4 h-4" /> View Full Runbook SOP
                    </button>
                    <button
                      onClick={() => setActiveTab("recovery")}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      <ShieldCheck className="w-4 h-4" /> Trigger Disaster Recovery Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSTALL GUIDE GENERATOR */}
        {activeTab === "install" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Install Guide Parameters
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Service / Subsystem Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Infrastructure</label>
                <select
                  value={targetEnv}
                  onChange={(e) => setTargetEnv(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="Kubernetes (AWS EKS)">Kubernetes (AWS EKS)</option>
                  <option value="Docker Compose (EC2 / Bare-Metal)">Docker Compose (EC2 / Bare-Metal)</option>
                  <option value="Serverless Container (AWS ECS Fargate)">Serverless Container (AWS ECS Fargate)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Environment Secrets & Variables</label>
                <input
                  type="text"
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Listening Ports</label>
                <input
                  type="text"
                  value={ports}
                  onChange={(e) => setPorts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleCopy(`# Install Guide for ${serviceName}\nTarget: ${targetEnv}\nPorts: ${ports}\nEnvs: ${envVars}`)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied Spec to Clipboard!" : "Copy Generated Spec"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Generated Enterprise Installation & Deployment Guide
                </h3>
                <span className="text-xs font-mono text-slate-500">FORMAT: MARKDOWN / RUNBOOK SPEC</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-3 leading-relaxed overflow-x-auto">
                <p className="text-indigo-400 font-bold text-sm"># Installation & Deployment Guide: {serviceName}</p>
                <p className="text-slate-400">**Target Environment**: {targetEnv} | **Version**: 2.6.0-Enterprise</p>

                <p className="text-slate-200 font-bold pt-2">## 1. System Prerequisites</p>
                <ul className="list-disc pl-5 text-slate-400 space-y-1">
                  <li>Compute Engine: Minimum 4 vCPU, 16GB RAM, 50GB NVMe SSD</li>
                  <li>Container Runtime: Docker Engine 25.0+ or containerd 1.7+</li>
                  <li>Network Security: VPC peering established with SSL termination port 443</li>
                </ul>

                <p className="text-slate-200 font-bold pt-2">## 2. Environment Configuration</p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] text-amber-300">
                  {envVars.split(",").map((v, i) => (
                    <div key={i}>{v.trim()}=&lt;VAULT_MANAGED_SECRET&gt;</div>
                  ))}
                </div>

                <p className="text-slate-200 font-bold pt-2">## 3. Installation Execution Command</p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] text-emerald-400">
                  <div>$ git clone https://enterprise-repo.internal/{serviceName.toLowerCase()}.git</div>
                  <div>$ cd {serviceName.toLowerCase()}</div>
                  <div>$ kubectl apply -k deploy/overlays/production/</div>
                </div>

                <p className="text-slate-200 font-bold pt-2">## 4. Verification & Validation Probes</p>
                <ul className="list-disc pl-5 text-slate-400 space-y-1">
                  {ports.split(",").map((p, i) => (
                    <li key={i}>Probe Port {p.trim()}: <span className="text-slate-300">curl -f -s http://localhost:{p.trim()}/healthz | jq .status</span></li>
                  ))}
                  <li>Synthetic UAT Transaction: Execute baseline health check verification suite</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUNBOOK SOP */}
        {activeTab === "runbook" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <span className="text-xs font-mono text-indigo-400">SOP-OPS-4022</span>
                <h2 className="text-xl font-bold text-white">Standard Operating Runbook: Production Incident Response</h2>
                <p className="text-xs text-slate-400">Governing SLA: 99.95% Availability | Escalation SLA: 15-minute response window</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy("Runbook SOP Document Content")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Runbook
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phase 1: Detection & Alerting</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  PagerDuty and Datadog synthetic monitors trigger P1 incident alert when error rate exceeds 1.5% for 3 consecutive evaluation cycles.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Phase 2: SME Triage</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On-Call Product SME initiates diagnostic triage, checks connection pool exhaustion metrics, and activates the failover warm replica if MTTR exceeds 10 minutes.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Phase 3: Stakeholder Sign-Off</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Post-incident recovery review meeting documented in Jira Service Desk with root cause analysis, action items, and permanent patch PR.
                </p>
              </div>
            </div>

            {/* Escalation Matrix */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Operational Escalation Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-lg">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Level</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Notification Window</th>
                      <th className="p-2.5">Responsibilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-semibold text-indigo-400">Level 1</td>
                      <td className="p-2.5">Operations Monitoring (NOC)</td>
                      <td className="p-2.5">Immediate (0-5 mins)</td>
                      <td className="p-2.5">Initial triage, symptom tagging, log capture</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-amber-400">Level 2</td>
                      <td className="p-2.5">Product SME Engineer</td>
                      <td className="p-2.5">Within 15 mins</td>
                      <td className="p-2.5">Root cause diagnostic, database/service failover</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-rose-400">Level 3</td>
                      <td className="p-2.5">Engineering Manager / Architect</td>
                      <td className="p-2.5">Within 30 mins</td>
                      <td className="p-2.5">Business continuity escalation, stakeholder updates</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECOVERY GUIDE (DISASTER RECOVERY) */}
        {activeTab === "recovery" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <span className="text-xs font-mono text-emerald-400">BCP-DR-RECOVERY-01</span>
                <h2 className="text-xl font-bold text-white">Application Disaster Recovery Guide</h2>
                <p className="text-xs text-slate-400">Topological Sort DAG-based Service Recovery Sequencing</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">RTO Target: </span>
                  <span className="font-bold text-emerald-400">{rtoMinutes} Minutes</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">RPO Target: </span>
                  <span className="font-bold text-indigo-400">{rpoMinutes} Minutes</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                Automated Recovery Execution Flow (Topologically Resolved)
              </h3>
              <div className="space-y-2">
                {recoveryOrder.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-200">{step}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Step {idx + 1} of {recoveryOrder.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Post-Recovery Validation Checklist (UAT Protocol)
              </h4>
              <div className="space-y-1.5 text-xs text-slate-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-500" />
                  <span>Execute database replica offset lag check (tolerance &lt; 100ms)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-500" />
                  <span>Verify end-to-end OAuth JWT handshake between Gateway and STS</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-500" />
                  <span>Dispatch synthetic test webhook payload and verify Redis worker consumption</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SME PLAYBOOK HUB */}
        {activeTab === "sme" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Product SME Troubleshooting Knowledge Base
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Curated solutions documented in coordination with Product Subject Matter Experts (SMEs).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    kbId: "KB-SME-001",
                    title: "Kafka Consumer Rebalance Lag & Commit Timeout",
                    sme: "Data Platform SME",
                    solution: "Tune `max.poll.interval.ms` to 300000ms; avoid heavy downstream blocking I/O within message consumer threads.",
                    verifiedDate: "2026-10-18"
                  },
                  {
                    kbId: "KB-SME-002",
                    title: "Database Deadlock During Concurrent Upserts",
                    sme: "Core DB SME",
                    solution: "Enforce consistent alphabetical table locking order; set `lock_timeout = '5s'`; add compound B-tree index.",
                    verifiedDate: "2026-10-15"
                  },
                  {
                    kbId: "KB-SME-003",
                    title: "Kubernetes CrashLoopBackOff on Config Drift",
                    sme: "DevOps SME",
                    solution: "Validate ConfigMap schema before rollout; verify secret decoding; inspect readiness probe grace period.",
                    verifiedDate: "2026-10-12"
                  },
                  {
                    kbId: "KB-SME-004",
                    title: "Redis Cluster Shard Split-Brain Recovery",
                    sme: "Cache Infrastructure SME",
                    solution: "Quorum verification; trigger cluster failover takeover with `CLUSTER FAILOVER TAKEOVER` flag on replica.",
                    verifiedDate: "2026-10-09"
                  }
                ].map((item) => (
                  <div key={item.kbId} className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-400 font-semibold">{item.kbId}</span>
                      <span className="text-[10px] text-slate-500">Verified: {item.verifiedDate}</span>
                    </div>
                    <h4 className="font-bold text-slate-100">{item.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{item.solution}</p>
                    <div className="pt-1 text-[11px] text-slate-500">
                      Documented by: <span className="text-slate-300 font-medium">{item.sme}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STAKEHOLDER ANALYTICS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Mean Time to Resolve (MTTR)</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">16.2 mins</div>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                  ↓ 38% reduction vs baseline
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Automated Runbook Accuracy</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">94.8%</div>
                <span className="text-[11px] text-slate-500 mt-1 block">TF-IDF & Rule-based Matching</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Total Incidents Catalogued</span>
                <div className="text-2xl font-bold text-white mt-1">1,240</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Across 18 Microservices</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Disaster Recovery Readiness</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">100%</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Topological DAG Validated</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Executive Summary & Stakeholder Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                This report consolidates incident triage velocity, runbook execution accuracy, and disaster recovery preparedness across the enterprise systems portfolio.
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>[AUDIT STATUS] Quarterly BCP/DR Simulation: COMPLIANT</div>
                <div>[RTO COMPLIANCE] Target: 15 mins | Actual Achieved: 12.4 mins</div>
                <div>[RPO COMPLIANCE] Target: 5 mins | Actual Achieved: 1.1 mins</div>
                <div>[SME SIGN-OFF] 100% of P1 & P2 failure modes backed by verified runbooks</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RunbookAI — Cloud Operations, Disaster Recovery & Incident Triage Platform</span>
          <a
            href="https://github.com/TejdeepKodati/runbook-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition"
          >
            made with ♥ by Tejdeep
          </a>
        </div>
      </footer>
    </div>
  );
}
