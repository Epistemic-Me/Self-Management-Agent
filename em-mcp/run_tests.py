#!/usr/bin/env python3
"""
Test runner script for em-mcp service.
"""
import subprocess
import sys
import argparse


def run_command(cmd, description):
    """Run a command and handle the result."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    result = subprocess.run(cmd, capture_output=False)
    
    if result.returncode != 0:
        print(f"\n❌ {description} failed with exit code {result.returncode}")
        return False
    else:
        print(f"\n✅ {description} passed")
        return True


def main():
    parser = argparse.ArgumentParser(description="Run em-mcp tests")
    parser.add_argument(
        "--suite", 
        choices=["unit", "integration", "all", "quick", "real-e2e"],
        default="all",
        help="Test suite to run"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--coverage",
        action="store_true", 
        help="Run with coverage reporting"
    )
    
    args = parser.parse_args()
    
    # Base pytest command
    base_cmd = ["pytest"]
    
    if args.verbose:
        base_cmd.append("-v")
    else:
        base_cmd.append("-q")
    
    if args.coverage:
        base_cmd.extend(["--cov=app", "--cov-report=term-missing"])
    
    success = True
    
    if args.suite == "unit":
        # Run only unit tests (exclude integration directory)
        cmd = base_cmd + ["app/tests", "--ignore=app/tests/integration"]
        success = run_command(cmd, "Unit Tests")
        
    elif args.suite == "integration":
        # Run only integration tests (exclude real E2E)
        cmd = base_cmd + ["app/tests/integration", "--ignore=app/tests/integration/test_real_e2e.py"]
        success = run_command(cmd, "Integration Tests")
        
    elif args.suite == "real-e2e":
        # Run only real end-to-end tests
        cmd = base_cmd + ["app/tests/integration/test_real_e2e.py"]
        success = run_command(cmd, "Real End-to-End Tests")
        
    elif args.suite == "quick":
        # Run unit tests only (faster)
        cmd = base_cmd + ["app/tests", "--ignore=app/tests/integration", "-x"]
        success = run_command(cmd, "Quick Unit Tests")
        
    elif args.suite == "all":
        # Run unit tests first
        cmd = base_cmd + ["app/tests", "--ignore=app/tests/integration"]
        success = run_command(cmd, "Unit Tests")
        
        if success:
            # Then run integration tests (exclude real E2E)
            cmd = base_cmd + ["app/tests/integration", "--ignore=app/tests/integration/test_real_e2e.py"]
            success = run_command(cmd, "Integration Tests")
    
    if success:
        print(f"\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main() 