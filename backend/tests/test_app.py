from fastapi.testclient import TestClient

from halo_backend.core.config import Settings
from halo_backend.main import create_app


def test_health_starts_without_external_credentials(monkeypatch):
    monkeypatch.delenv("AI_API_KEY", raising=False)
    with TestClient(create_app()) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0", "stage": "scaffold"}


def test_settings_and_cors_allowlist(monkeypatch):
    monkeypatch.setenv("HALO_APP_NAME", "HALO test")
    monkeypatch.setenv("HALO_ALLOWED_ORIGINS", "http://localhost:5173, https://crew.example")
    settings = Settings.from_env()
    assert settings.app_name == "HALO test"
    assert settings.allowed_origins == ("http://localhost:5173", "https://crew.example")
    with TestClient(create_app(settings)) as client:
        allowed = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        blocked = client.options(
            "/health",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in blocked.headers
