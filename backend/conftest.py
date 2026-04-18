"""
pytest configuration and shared fixtures for CrowdFlow AI backend tests.
This file is auto-discovered by pytest and runs before any test module.
"""
import os
import pytest


def pytest_configure(config):
    """Ensure the GEMINI_API_KEY env var is absent during tests
    so that the AI fallback logic is exercised (no real API calls)."""
    os.environ.pop("GEMINI_API_KEY", None)


@pytest.fixture(autouse=True)
def reset_db_state():
    """
    Reset the in-memory DataEngine to a known state before every test.
    This prevents test-order dependencies caused by trigger-event or
    set-location calls mutating shared state.
    """
    from main import db, DataEngine
    # Replace the live engine with a fresh one before each test
    fresh = DataEngine()
    db.stadiums = fresh.stadiums
    yield
    # Teardown: restore again (belt-and-suspenders)
    db.stadiums = fresh.stadiums
