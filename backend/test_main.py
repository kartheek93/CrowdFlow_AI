from fastapi.testclient import TestClient
import pytest
from main import app, haversine, _compute_level, db, VALID_STADIUM_IDS, ALLOWED_EVENTS

client = TestClient(app)


# ─── Unit Tests: haversine ────────────────────────────────────────────────────

class TestHaversine:
    def test_same_point_returns_zero(self):
        assert haversine(0, 0, 0, 0) == 0.0

    def test_known_distance_wankhede_narendra(self):
        # Approx 462 km between Ahmedabad and Mumbai
        dist = haversine(23.0917, 72.5975, 18.9388, 72.8258)
        assert 400 < dist < 550

    def test_symmetry(self):
        d1 = haversine(23.0, 72.5, 18.9, 72.8)
        d2 = haversine(18.9, 72.8, 23.0, 72.5)
        assert abs(d1 - d2) < 0.01

    def test_north_south_poles(self):
        # Full-earth diameter is ~ 6371 * pi ≈ 20015 km
        dist = haversine(90.0, 0.0, -90.0, 0.0)
        assert 19000 < dist < 21000

    def test_very_close_points(self):
        # Two points 0.0001 degrees apart should be < 0.02 km
        dist = haversine(23.0, 72.5, 23.0001, 72.5)
        assert 0 < dist < 0.02

    def test_crossing_prime_meridian(self):
        dist = haversine(0.0, -1.0, 0.0, 1.0)
        assert 100 < dist < 300


# ─── Unit Tests: _compute_level ──────────────────────────────────────────────

class TestComputeLevel:
    def test_high_level(self):
        assert _compute_level(20) == "High"

    def test_medium_level(self):
        assert _compute_level(10) == "Medium"

    def test_low_level(self):
        assert _compute_level(3) == "Low"

    def test_boundary_medium_lower(self):
        # 6 > 5 → Medium
        assert _compute_level(6) == "Medium"

    def test_boundary_high_lower(self):
        # 16 > 15 → High
        assert _compute_level(16) == "High"

    def test_boundary_exactly_5(self):
        # 5 is not > 5, so Low
        assert _compute_level(5) == "Low"

    def test_boundary_exactly_15(self):
        # 15 is not > 15, so Medium
        assert _compute_level(15) == "Medium"

    def test_zero_is_low(self):
        assert _compute_level(0) == "Low"

    def test_large_value_is_high(self):
        assert _compute_level(9999) == "High"


# ─── Integration Tests: Stadium Data ─────────────────────────────────────────

class TestStadiumData:
    def test_known_stadium(self):
        res = client.get("/api/stadium-data?stadium_id=narendra_modi")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Narendra Modi Stadium"
        assert "wait_times" in data
        assert "coords" in data

    def test_known_stadium_has_required_fields(self):
        res = client.get("/api/stadium-data?stadium_id=wankhede")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Wankhede Stadium"
        assert "active_event" in data
        assert "user_location" in data

    def test_fallback_for_unknown_stadium(self):
        # Invalid IDs should fall back to narendra_modi
        res = client.get("/api/stadium-data?stadium_id=nonexistent_xyz_999")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Narendra Modi Stadium"

    def test_sql_injection_attempt_falls_back(self):
        res = client.get("/api/stadium-data?stadium_id='; DROP TABLE stadiums; --")
        assert res.status_code == 200
        data = res.json()
        assert "name" in data

    def test_extremely_long_stadium_id_falls_back(self):
        long_id = "a" * 500
        res = client.get(f"/api/stadium-data?stadium_id={long_id}")
        assert res.status_code == 200

    def test_eden_gardens_stadium(self):
        res = client.get("/api/stadium-data?stadium_id=eden_gardens")
        assert res.status_code == 200
        assert res.json()["name"] == "Eden Gardens"

    def test_wait_times_structure(self):
        res = client.get("/api/stadium-data?stadium_id=narendra_modi")
        wt = res.json()["wait_times"]
        for key, val in wt.items():
            assert "time" in val
            assert "level" in val
            assert "trend" in val
            assert val["level"] in ("High", "Medium", "Low")
            assert val["trend"] in ("up", "down", "stable")
    def test_etag_support(self):
        res1 = client.get("/api/stadium-data?stadium_id=narendra_modi")
        etag = res1.headers.get("etag")
        assert etag is not None
        
        res2 = client.get("/api/stadium-data?stadium_id=narendra_modi", headers={"If-None-Match": etag})
        assert res2.status_code == 304

    def test_cache_control_headers(self):
        res = client.get("/api/stadium-data?stadium_id=narendra_modi")
        assert "no-cache" in res.headers.get("cache-control", "")


# ─── Integration Tests: Find Nearest ─────────────────────────────────────────

class TestFindNearest:
    def test_near_ahmedabad_finds_narendra_modi(self):
        res = client.post("/api/find-nearest", json={"lat": 23.0, "lng": 72.5})
        assert res.status_code == 200
        data = res.json()
        assert data["stadium_id"] == "narendra_modi"
        assert "distance_km" in data

    def test_near_mumbai_finds_wankhede_or_brabourne(self):
        res = client.post("/api/find-nearest", json={"lat": 18.94, "lng": 72.83})
        assert res.status_code == 200
        data = res.json()
        assert data["stadium_id"] in ["wankhede", "brabourne"]

    def test_near_kolkata_finds_eden_gardens(self):
        res = client.post("/api/find-nearest", json={"lat": 22.56, "lng": 88.34})
        assert res.status_code == 200
        assert res.json()["stadium_id"] == "eden_gardens"

    def test_valid_response_has_name_and_distance(self):
        res = client.post("/api/find-nearest", json={"lat": 23.0, "lng": 72.5})
        assert res.status_code == 200
        data = res.json()
        assert "name" in data
        assert isinstance(data["distance_km"], float)

    def test_invalid_lat_too_high_rejected(self):
        res = client.post("/api/find-nearest", json={"lat": 200.0, "lng": 72.5})
        assert res.status_code == 422

    def test_invalid_lat_too_low_rejected(self):
        res = client.post("/api/find-nearest", json={"lat": -200.0, "lng": 72.5})
        assert res.status_code == 422

    def test_invalid_lng_rejected(self):
        res = client.post("/api/find-nearest", json={"lat": 23.0, "lng": 200.0})
        assert res.status_code == 422

    def test_missing_fields_rejected(self):
        res = client.post("/api/find-nearest", json={"lat": 23.0})
        assert res.status_code == 422

    def test_string_coordinates_rejected(self):
        res = client.post("/api/find-nearest", json={"lat": "not_a_number", "lng": 72.5})
        assert res.status_code == 422

    def test_extreme_valid_coordinates_accepted(self):
        # South pole — valid but far from all Indian stadiums
        res = client.post("/api/find-nearest", json={"lat": -89.9, "lng": 0.0})
        assert res.status_code == 200
        assert "stadium_id" in res.json()


# ─── Integration Tests: Set Location ──────────────────────────────────────────

class TestSetLocation:
    def test_valid_set_location(self):
        res = client.post("/api/set-location", json={"stadium_id": "narendra_modi", "location": "Gate 2"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_invalid_stadium_returns_422(self):
        # Validator rejects unknown stadium_id
        res = client.post("/api/set-location", json={"stadium_id": "fake_stadium_xyz", "location": "Gate 2"})
        assert res.status_code == 422

    def test_location_with_special_chars_rejected(self):
        res = client.post("/api/set-location", json={"stadium_id": "narendra_modi", "location": "<script>hack()</script>"})
        assert res.status_code == 422

    def test_empty_location_rejected(self):
        res = client.post("/api/set-location", json={"stadium_id": "narendra_modi", "location": ""})
        assert res.status_code == 422

    def test_location_too_long_rejected(self):
        res = client.post("/api/set-location", json={"stadium_id": "narendra_modi", "location": "A" * 200})
        assert res.status_code == 422

    def test_location_with_parens_and_numbers_accepted(self):
        res = client.post("/api/set-location", json={"stadium_id": "narendra_modi", "location": "Gate 1 (North)"})
        assert res.status_code == 200


# ─── Integration Tests: Trigger Event ────────────────────────────────────────

class TestTriggerEvent:
    def test_valid_halftime_event(self):
        res = client.post(
            "/api/trigger-event", 
            json={"stadium_id": "narendra_modi", "event_name": "Halftime"},
            headers={"Authorization": "Bearer dev-admin-secret"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_valid_clear_event(self):
        res = client.post(
            "/api/trigger-event", 
            json={"stadium_id": "wankhede", "event_name": "Clear"},
            headers={"Authorization": "Bearer dev-admin-secret"}
        )
        assert res.status_code == 200

    def test_invalid_stadium_returns_422(self):
        res = client.post("/api/trigger-event", json={"stadium_id": "fake_stadium_xyz", "event_name": "Clear"})
        assert res.status_code == 422

    def test_invalid_event_name_rejected(self):
        # Only allowlisted events are accepted
        res = client.post("/api/trigger-event", json={"stadium_id": "narendra_modi", "event_name": "Open Gates"})
        assert res.status_code == 422

    def test_sql_injection_in_event_name_rejected(self):
        res = client.post("/api/trigger-event", json={"stadium_id": "narendra_modi", "event_name": "'; DROP TABLE--"})
        assert res.status_code == 422

    def test_all_allowed_events_accepted(self):
        for event in ALLOWED_EVENTS:
            res = client.post(
                "/api/trigger-event", 
                json={"stadium_id": "narendra_modi", "event_name": event},
                headers={"Authorization": "Bearer dev-admin-secret"}
            )
            assert res.status_code == 200, f"Expected 200 for event: {event}"

# ─── Integration Tests: Security & Auth ───────────────────────────────────────

class TestSecurityAuth:
    def test_trigger_event_unauthorized(self):
        # By default in tests ENV isn't 'development' or we can force it
        import os
        os.environ["ENV"] = "production"
        res = client.post("/api/trigger-event", json={"stadium_id": "narendra_modi", "event_name": "Halftime"})
        assert res.status_code == 401
        os.environ["ENV"] = "development" # Reset

    def test_trigger_event_authorized(self):
        import os
        os.environ["ENV"] = "production"
        os.environ["ADMIN_AUTH_KEY"] = "test-secret"
        res = client.post(
            "/api/trigger-event", 
            json={"stadium_id": "narendra_modi", "event_name": "Halftime"},
            headers={"Authorization": "Bearer test-secret"}
        )
        assert res.status_code == 200
        os.environ["ENV"] = "development" # Reset

    def test_large_payload_rejected(self):
        # 1MB + 1 byte
        large_data = "x" * (1024 * 1024 + 1)
        res = client.post("/api/set-location", content=large_data, headers={"Content-Type": "application/json"})
        assert res.status_code == 413

# ─── Integration Tests: Ask AI ───────────────────────────────────────────────

class TestAskAI:
    def test_gate_query_fallback(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": "Which gate should I use?"})
        assert res.status_code == 200
        data = res.json()
        assert "response" in data or "error" in data

    def test_food_query_fallback(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": "Best food stall?"})
        assert res.status_code == 200

    def test_exit_query_returns_response(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": "Fastest exit right now?"})
        assert res.status_code == 200

    def test_query_too_long_rejected(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": "A" * 600})
        assert res.status_code == 422

    def test_empty_query_rejected(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": ""})
        assert res.status_code == 422

    def test_control_chars_in_query_sanitized(self):
        # Query with control chars should be sanitized, not cause a 500
        res = client.post("/api/ask-ai", json={"stadium_id": "narendra_modi", "query": "gate\x00\x1f?"})
        assert res.status_code in (200, 422)

    def test_unknown_stadium_falls_back_gracefully(self):
        res = client.post("/api/ask-ai", json={"stadium_id": "totally_unknown_zzz", "query": "help"})
        assert res.status_code == 200


# ─── Integration Tests: Security Headers ────────────────────────────────────

class TestSecurityHeaders:
    def test_x_content_type_options_present(self):
        res = client.get("/health")
        assert res.headers.get("x-content-type-options") == "nosniff"

    def test_x_frame_options_present(self):
        res = client.get("/health")
        assert res.headers.get("x-frame-options") == "DENY"

    def test_x_xss_protection_present(self):
        res = client.get("/health")
        assert res.headers.get("x-xss-protection") == "1; mode=block"

    def test_referrer_policy_present(self):
        res = client.get("/health")
        assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_hsts_header_present(self):
        res = client.get("/health")
        hsts = res.headers.get("strict-transport-security", "")
        assert "max-age" in hsts

    def test_csp_header_present(self):
        res = client.get("/health")
        assert "content-security-policy" in res.headers

    def test_permissions_policy_present(self):
        res = client.get("/health")
        assert "permissions-policy" in res.headers


# ─── Integration Tests: Health Check ─────────────────────────────────────────

class TestHealthCheck:
    def test_health_endpoint(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_health_returns_stadiums_count(self):
        res = client.get("/health")
        data = res.json()
        assert "stadiums_loaded" in data
        assert isinstance(data["stadiums_loaded"], int)
        assert data["stadiums_loaded"] >= 4  # At least pre-seeded stadiums


# ─── Integration Flow Tests ───────────────────────────────────────────────────

class TestIntegrationFlows:
    """
    Full end-to-end user-journey tests that exercise multiple API calls in sequence,
    simulating realistic usage patterns.
    """

    def test_select_stadium_set_location_then_ask_ai(self):
        """User selects a stadium, sets their location, then asks the AI."""
        # Step 1: Get stadium data
        r1 = client.get("/api/stadium-data?stadium_id=wankhede")
        assert r1.status_code == 200

        # Step 2: Set user location
        r2 = client.post("/api/set-location", json={
            "stadium_id": "wankhede",
            "location": "Garware Pavilion Gate"
        })
        assert r2.status_code == 200

        # Step 3: Ask AI for guidance
        r3 = client.post("/api/ask-ai", json={
            "stadium_id": "wankhede",
            "query": "Which exit should I use?"
        })
        assert r3.status_code == 200
        assert "response" in r3.json() or "error" in r3.json()

    def test_trigger_halftime_then_query_crowd(self):
        """Organizer triggers halftime event, then AI reflects updated state."""
        # Trigger halftime
        r1 = client.post("/api/trigger-event", json={
            "stadium_id": "eden_gardens",
            "event_name": "Halftime"
        })
        assert r1.status_code == 200

        # Verify data reflects event
        r2 = client.get("/api/stadium-data?stadium_id=eden_gardens")
        assert r2.status_code == 200
        assert r2.json()["active_event"] == "Halftime"

    def test_clear_event_after_halftime(self):
        """After halftime, clearing the event returns stadium to normal mode."""
        # Set halftime
        client.post("/api/trigger-event", json={
            "stadium_id": "narendra_modi",
            "event_name": "Halftime"
        })
        # Clear it
        r2 = client.post("/api/trigger-event", json={
            "stadium_id": "narendra_modi",
            "event_name": "Clear"
        })
        assert r2.status_code == 200
        assert r2.json()["status"] == "success"

    def test_auto_locate_then_get_stadium_data(self):
        """GPS auto-locate finds a stadium; follow-up get returns valid data."""
        r1 = client.post("/api/find-nearest", json={"lat": 22.56, "lng": 88.34})
        assert r1.status_code == 200
        stadium_id = r1.json()["stadium_id"]

        r2 = client.get(f"/api/stadium-data?stadium_id={stadium_id}")
        assert r2.status_code == 200
        assert "wait_times" in r2.json()
