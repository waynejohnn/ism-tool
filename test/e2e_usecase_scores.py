from __future__ import annotations

import json
import os
from pathlib import Path
from urllib import error, parse, request

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.dev.gcp.local"


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def http_json(method: str, url: str, body: dict | None = None) -> tuple[int, dict | list | str]:
    data = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")

    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=60) as resp:
            status = resp.getcode()
            text = resp.read().decode("utf-8")
            if not text:
                return status, ""
            try:
                return status, json.loads(text)
            except json.JSONDecodeError:
                return status, text
    except error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        try:
            return exc.code, json.loads(payload)
        except json.JSONDecodeError:
            return exc.code, payload


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def find_usecases(base_url: str) -> list[dict]:
    status, payload = http_json("GET", f"{base_url}/dashboard/portfolio")
    require(status == 200 and isinstance(payload, list), f"Failed to fetch use cases: {status} {payload}")
    needed = [uc for uc in payload if uc.get("useCaseNumber") in (1, 2)]
    needed = sorted(needed, key=lambda item: item.get("useCaseNumber"))
    require(len(needed) == 2, f"Could not locate use cases #1 and #2. Found {[x.get('useCaseNumber') for x in payload]}")
    return needed


def criteria_list(base_url: str) -> list[dict]:
    status, payload = http_json("GET", f"{base_url}/criteria")
    require(status == 200 and isinstance(payload, list), f"Failed to fetch criteria: {status} {payload}")
    require(len(payload) > 0, "Criteria list is empty")
    return sorted(payload, key=lambda item: item.get("displayOrder", 0))


def review_token(base_url: str, use_case_id: str) -> str:
    status, payload = http_json("POST", f"{base_url}/reviewsessions", {"useCaseId": use_case_id, "assignedCoEId": "E2E"})
    require(status in (200, 201) and isinstance(payload, dict), f"Failed creating review session: {status} {payload}")
    session_id = payload.get("sessionId")
    require(bool(session_id), f"No sessionId in response: {payload}")

    status, payload = http_json("POST", f"{base_url}/reviewinvites", {"sessionId": session_id, "canEdit": True, "roleHint": "Reviewer"})
    require(status in (200, 201) and isinstance(payload, dict), f"Failed creating review invite: {status} {payload}")
    token = payload.get("token")
    require(bool(token), f"No token in invite response: {payload}")
    return str(token)


def submit_scores(base_url: str, token: str, use_case_number: int, criteria: list[dict], phase: int) -> None:
    # Phase 1 cycles 1,2,3 ; phase 2 cycles 3,2,1 to simulate edits
    values = [1.0, 2.0, 3.0] if phase == 1 else [3.0, 2.0, 1.0]
    for idx, criterion in enumerate(criteria):
        criterion_id = criterion["criterionId"]
        score_val = values[(idx + use_case_number) % 3]
        status, payload = http_json(
            "POST",
            f"{base_url}/scores?{parse.urlencode({'token': token})}",
            {
                "criterionId": criterion_id,
                "rawScore": score_val,
                "isNA": False,
                "notes": f"E2E phase {phase} score for {criterion_id}",
                "raterUserId": "e2e-automation",
            },
        )
        require(status in (200, 201), f"Score submit failed ({criterion_id}, phase {phase}): {status} {payload}")


def compute_and_get_totals(base_url: str, use_case_id: str) -> dict:
    status, payload = http_json("POST", f"{base_url}/compute/{use_case_id}")
    require(status == 200 and isinstance(payload, dict), f"Compute failed: {status} {payload}")

    detail_status, detail_payload = http_json("GET", f"{base_url}/usecases/{use_case_id}/detail")
    require(detail_status == 200 and isinstance(detail_payload, dict), f"Detail failed: {detail_status} {detail_payload}")
    totals = detail_payload.get("totals")
    require(isinstance(totals, dict), f"Totals missing after compute: {detail_payload}")

    for key in ("sValue", "sFeasibility", "sOrgCapability", "sStrategic", "sComposite", "sFC"):
        require(totals.get(key) is not None, f"Totals field {key} is missing: {totals}")

    return totals


def update_use_case_fields(base_url: str, use_case: dict) -> None:
    use_case_id = use_case["useCaseId"]
    title = use_case.get("title") or f"Use Case {use_case.get('useCaseNumber')}"
    status, payload = http_json(
        "PATCH",
        f"{base_url}/usecases/{use_case_id}",
        {
            "title": f"{title} [E2E]",
            "description": "E2E verification update",
            "status": "In Review",
            "assignedCoEId": "E2E-Team",
        },
    )
    require(status == 200 and isinstance(payload, dict), f"Use case update failed: {status} {payload}")


def run() -> dict:
    env = load_env(ENV_PATH)
    base_url = os.getenv("E2E_BASE_URL") or env.get("VITE_API_URL")
    require(bool(base_url), "Base URL not found. Set E2E_BASE_URL or VITE_API_URL in .env.dev.gcp.local")

    # Health check
    status, payload = http_json("GET", f"{base_url}/health")
    require(status == 200, f"Health check failed: {status} {payload}")

    usecases = find_usecases(base_url)
    criteria = criteria_list(base_url)

    report: dict[str, dict] = {}

    for uc in usecases:
        number = uc["useCaseNumber"]
        use_case_id = uc["useCaseId"]

        update_use_case_fields(base_url, uc)

        token = review_token(base_url, use_case_id)
        status, payload = http_json("GET", f"{base_url}/review?{parse.urlencode({'token': token})}")
        require(status == 200 and isinstance(payload, dict), f"Review context failed for use case {number}: {status} {payload}")

        submit_scores(base_url, token, number, criteria, phase=1)
        first_totals = compute_and_get_totals(base_url, use_case_id)

        submit_scores(base_url, token, number, criteria, phase=2)
        second_totals = compute_and_get_totals(base_url, use_case_id)

        require(first_totals.get("sComposite") != second_totals.get("sComposite"),
                f"Composite score did not change after score edits for use case {number}")

        report[f"use_case_{number}"] = {
            "useCaseId": use_case_id,
            "firstComposite": first_totals.get("sComposite"),
            "secondComposite": second_totals.get("sComposite"),
            "firstFC": first_totals.get("sFC"),
            "secondFC": second_totals.get("sFC"),
        }

    return {
        "baseUrl": base_url,
        "criteriaCount": len(criteria),
        "result": "PASS",
        "details": report,
    }


if __name__ == "__main__":
    output = run()
    print(json.dumps(output, indent=2))
