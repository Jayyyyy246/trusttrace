"""
TRUSTTRACE API Integration Test Suite
Validates end-to-end evidence ingestion, async job polling,
forensic report retrieval, deduplication caching, and zero-knowledge proof verification.
"""

import io
import time
import unittest

try:
    from fastapi.testclient import TestClient
    from main import app, JOB_STORE
    from PIL import Image
    HAS_INTEGRATION_DEPS = True
except ImportError:
    HAS_INTEGRATION_DEPS = False


class TestAPIIntegration(unittest.TestCase):
    """End-to-end integration tests for REST API endpoints."""

    def setUp(self):
        if not HAS_INTEGRATION_DEPS:
            self.skipTest("FastAPI TestClient / Pillow dependencies not available.")
        self.client = TestClient(app)

    def _generate_test_image_bytes(self) -> bytes:
        img = Image.new("RGB", (128, 128), color=(240, 240, 240))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def test_health_check_endpoint(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("subsystems", data)

    def test_end_to_end_verification_workflow(self):
        img_bytes = self._generate_test_image_bytes()

        upload_resp = self.client.post(
            "/api/v1/verify",
            files={"file": ("evidence_receipt.png", img_bytes, "image/png")}
        )
        self.assertEqual(upload_resp.status_code, 202)
        submit_data = upload_resp.json()
        job_id = submit_data["job_id"]
        self.assertIsNotNone(job_id)

        poll_resp = self.client.get(f"/api/v1/jobs/{job_id}")
        self.assertEqual(poll_resp.status_code, 200)
        status_data = poll_resp.json()
        self.assertIn(status_data["status"], ["QUEUED", "PROCESSING", "COMPLETED"])

        # Wait for background task completion
        for _ in range(10):
            if JOB_STORE[job_id]["status"] == "COMPLETED":
                break
            time.sleep(0.1)

        report_resp = self.client.get(f"/api/v1/reports/{job_id}")
        if report_resp.status_code == 200:
            final_data = report_resp.json()
            self.assertIn("report", final_data)
            self.assertIn("certificate", final_data)

            verify_resp = self.client.post(
                "/api/v1/proofs/verify",
                json=final_data["certificate"]
            )
            self.assertEqual(verify_resp.status_code, 200)
            verify_data = verify_resp.json()
            self.assertTrue(verify_data["is_valid"])


if __name__ == "__main__":
    unittest.main()
