"""
TRUSTTRACE Unified Test & Benchmark Runner
Executes unit tests, integration tests, and synthetic tampering benchmarks.
Compatible with standard Python unittest or pytest.
"""

from __future__ import annotations

import sys
import unittest
import time

def run_all():
    print("=" * 72)
    print(" TRUSTTRACE FORENSIC ENGINE — AUTOMATED VERIFICATION SUITE")
    print("=" * 72)
    
    loader = unittest.TestLoader()
    suite = loader.discover("tests", pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)
    
    print("\n" + "=" * 72)
    print(" RUNNING SYNTHETIC FORENSIC BENCHMARK")
    print("=" * 72)
    
    from tests.benchmark_synthetic_tampering import SyntheticTamperingBenchmark
    bench = SyntheticTamperingBenchmark()
    start_t = time.time()
    b_res = bench.run_benchmark()
    elapsed = time.time() - start_t
    
    for tc in b_res["test_cases"]:
        tag = "[OK]  " if tc["passed"] else "[FAIL]"
        print(f"{tag} {tc['name']:<50} Score: {tc['actual_trust_score']}% ({tc['actual_risk']})")
    
    print("-" * 72)
    print(f"Benchmark Accuracy: {b_res['benchmark_accuracy']}% ({b_res['passed_validations']}/{b_res['total_samples']} assertions verified in {elapsed:.3f}s)")
    print("=" * 72)
    
    if not test_result.wasSuccessful() or b_res["benchmark_accuracy"] < 100.0:
        sys.exit(1)
    else:
        print("\nALL FORENSIC AUDITS & BENCHMARKS PASSED SUCCESSFULLY.")
        sys.exit(0)

if __name__ == "__main__":
    run_all()
