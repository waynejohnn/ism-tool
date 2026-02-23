from app import app


def test_health_endpoint_returns_200() -> None:
    with app.test_client() as client:
        response = client.get("/health")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["status"] == "healthy"
