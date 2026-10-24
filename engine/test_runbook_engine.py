"""
Unit Tests for RunbookAI Core Engine
Verifies parser accuracy, topological sort DAG resolution, TF-IDF cosine similarity,
and markdown document generation.
"""

import unittest
from runbook_engine import (
    IncidentLogParser,
    TFIDFMatcher,
    RecoveryDependencyGraph,
    RunbookGenerator
)


class TestIncidentLogParser(unittest.TestCase):
    def setUp(self):
        self.parser = IncidentLogParser()

    def test_database_connection_exhaustion(self):
        log_sample = """
        2026-10-24 08:30:15 [ERROR] [api-gateway] org.postgresql.util.PSQLException:
        FATAL: remaining connection slots are reserved for non-replication superuser connections
        CODE: ERR_PG_POOL_EXHAUSTED
        """
        result = self.parser.parse(log_sample)
        self.assertIn("db_connection_exhausted", result["signatures"])
        self.assertEqual(result["severity"], "CRITICAL")
        self.assertEqual(result["priority"], "P1")
        self.assertEqual(result["estimated_mttr_minutes"], 15)
        self.assertIn("ERR_PG_POOL_EXHAUSTED", result["error_codes"])

    def test_oom_killed_detection(self):
        log_sample = "2026-10-24 09:12:00 kernel: Out of memory: Kill process 4128 (worker) score 950 or sacrifice child"
        result = self.parser.parse(log_sample)
        self.assertIn("oom_killed", result["signatures"])
        self.assertEqual(result["severity"], "CRITICAL")

    def test_generic_fallback(self):
        log_sample = "2026-10-24 10:00:00 [INFO] System heartbeat healthy."
        result = self.parser.parse(log_sample)
        self.assertIn("generic_system_failure", result["signatures"])
        self.assertEqual(result["priority"], "P3")


class TestRecoveryDependencyGraph(unittest.TestCase):
    def setUp(self):
        self.graph = RecoveryDependencyGraph()

    def test_topological_sort_recovery(self):
        # Database -> Redis -> Auth Service -> Core API -> Webhook Dispatcher
        self.graph.add_dependency("PostgreSQL-Primary", "Auth-Service")
        self.graph.add_dependency("PostgreSQL-Primary", "Core-API")
        self.graph.add_dependency("Redis-Cluster", "Core-API")
        self.graph.add_dependency("Auth-Service", "Core-API")
        self.graph.add_dependency("Core-API", "Webhook-Dispatcher")

        plan, has_cycle = self.graph.compute_recovery_plan()
        self.assertFalse(has_cycle)
        self.assertEqual(len(plan), 5)
        
        # Verify ordering constraints: DB and Redis must appear before Core-API
        pg_idx = plan.index("PostgreSQL-Primary")
        redis_idx = plan.index("Redis-Cluster")
        auth_idx = plan.index("Auth-Service")
        api_idx = plan.index("Core-API")
        webhook_idx = plan.index("Webhook-Dispatcher")

        self.assertLess(pg_idx, auth_idx)
        self.assertLess(pg_idx, api_idx)
        self.assertLess(redis_idx, api_idx)
        self.assertLess(auth_idx, api_idx)
        self.assertLess(api_idx, webhook_idx)

    def test_cycle_detection(self):
        cyclic_graph = RecoveryDependencyGraph()
        cyclic_graph.add_dependency("Service-A", "Service-B")
        cyclic_graph.add_dependency("Service-B", "Service-C")
        cyclic_graph.add_dependency("Service-C", "Service-A")

        plan, has_cycle = cyclic_graph.compute_recovery_plan()
        self.assertTrue(has_cycle)


class TestTFIDFMatcher(unittest.TestCase):
    def setUp(self):
        self.kb = [
            {
                "id": "KB-001",
                "service": "PostgreSQL",
                "title": "Database Connection Pool Exhaustion Remediation",
                "symptoms": "remaining connection slots are reserved max_connections reached pgbouncer queueing timeout"
            },
            {
                "id": "KB-002",
                "service": "Redis",
                "title": "Redis Memory Eviction and OOM Failure Recovery",
                "symptoms": "OOM command not allowed when used memory maxmemory policy volatile-lru keyspace eviction"
            },
            {
                "id": "KB-003",
                "service": "NGINX Gateway",
                "title": "504 Gateway Timeout and Upstream Keep-Alive Exhaustion",
                "symptoms": "504 Gateway Time-out upstream timed out while reading response header proxy_read_timeout"
            }
        ]
        self.matcher = TFIDFMatcher(self.kb)

    def test_symptom_matching(self):
        query = "Alert: Application reporting 504 gateway time-out on reverse proxy upstream"
        matches = self.matcher.match(query, top_k=2)
        self.assertGreater(len(matches), 0)
        top_match = matches[0]
        self.assertEqual(top_match["playbook"]["id"], "KB-003")
        self.assertGreater(top_match["confidence_score"], 0.3)


class TestRunbookGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = RunbookGenerator()

    def test_install_guide_generation(self):
        guide = self.generator.generate_install_guide(
            service_name="Payment-Gateway",
            env_vars=["DATABASE_URL", "JWT_SECRET", "STRIPE_KEY"],
            ports=[8080, 9090],
            prereqs=["Docker Engine 24.0+", "Kubernetes 1.28+", "Node.js 20+"]
        )
        self.assertIn("# Installation & Deployment Guide: Payment-Gateway", guide)
        self.assertIn("DATABASE_URL=<ENTER_VALUE>", guide)
        self.assertIn("curl -f -s http://localhost:8080/healthz", guide)

    def test_recovery_guide_generation(self):
        recovery = self.generator.generate_recovery_guide(
            service_name="Analytics-Engine",
            recovery_sequence=["Storage-Volume-Mount", "PostgreSQL-Leader", "Kafka-Broker", "Analytics-Worker"],
            rto_minutes=30,
            rpo_minutes=5
        )
        self.assertIn("**Target RTO**: 30 minutes", recovery)
        self.assertIn("Storage-Volume-Mount", recovery)
        self.assertIn("Kafka-Broker", recovery)


if __name__ == "__main__":
    unittest.main()
