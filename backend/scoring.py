from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Literal

Polarity = Literal["BENEFIT", "COST"]
Dimension = Literal["Value", "Feasibility", "Organizational", "Strategic"]


@dataclass(frozen=True)
class CriterionScore:
    dimension: Dimension
    polarity: Polarity
    raw_score: float


def normalize(raw: float, polarity: Polarity) -> float:
    return raw if polarity == "BENEFIT" else 4.0 - raw


WEIGHTS = {
    "Value": 0.35,
    "Feasibility": 0.25,
    "Organizational": 0.25,
    "Strategic": 0.15,
}


def renormalize_weights(applicable: set[str]) -> dict[str, float]:
    remaining = sum(WEIGHTS[d] for d in applicable)
    return {d: WEIGHTS[d] / remaining for d in applicable} if remaining else {}


def fc_axis(s_feasibility: float | None, s_org: float | None) -> float | None:
    if s_feasibility is None and s_org is None:
        return None
    if s_feasibility is None:
        return s_org
    if s_org is None:
        return s_feasibility
    return (s_feasibility + s_org) / 2.0


def priority_of(score: float) -> str:
    if score >= 2.4:
        return "P1 - Critical"
    if score >= 2.0:
        return "P2 - High"
    if score >= 1.4:
        return "P3 - Medium"
    return "P4 - Low"


def quadrant_of(s_value: float | None, s_fc: float | None) -> str | None:
    if s_value is None or s_fc is None:
        return None
    high = lambda v: v >= 2.15
    if high(s_value) and high(s_fc):
        return "Quick Wins"
    if high(s_value) and not high(s_fc):
        return "Strategic Bets"
    if not high(s_value) and high(s_fc):
        return "Opportunistic"
    return "Re-evaluate"


def compute_dimension_scores(
    scores: Iterable[CriterionScore],
    na_dimensions: set[str] | None = None,
) -> dict[str, float | None]:
    na_dimensions = na_dimensions or set()
    buckets: dict[str, list[float]] = {
        "Value": [],
        "Feasibility": [],
        "Organizational": [],
        "Strategic": [],
    }
    for score in scores:
        if score.dimension in na_dimensions:
            continue
        buckets[score.dimension].append(normalize(score.raw_score, score.polarity))

    def mean(values: list[float]) -> float | None:
        return sum(values) / len(values) if values else None

    return {
        "Value": None if "Value" in na_dimensions else mean(buckets["Value"]),
        "Feasibility": None if "Feasibility" in na_dimensions else mean(buckets["Feasibility"]),
        "Organizational": None if "Organizational" in na_dimensions else mean(buckets["Organizational"]),
        "Strategic": None if "Strategic" in na_dimensions else mean(buckets["Strategic"]),
    }


def compute_totals(
    scores: Iterable[CriterionScore],
    na_dimensions: set[str] | None = None,
) -> dict[str, float | str | None]:
    na_dimensions = na_dimensions or set()
    dims = compute_dimension_scores(scores, na_dimensions)
    s_value = dims["Value"]
    s_feasibility = dims["Feasibility"]
    s_org = dims["Organizational"]
    s_strategic = dims["Strategic"]

    applicable_dims = {k for k, v in dims.items() if v is not None}
    weights = renormalize_weights(applicable_dims)
    if not applicable_dims:
        s_composite = None
    else:
        s_composite = sum(weights[k] * dims[k] for k in applicable_dims)

    s_fc = fc_axis(s_feasibility, s_org)
    return {
        "s_value": s_value,
        "s_feasibility": s_feasibility,
        "s_org": s_org,
        "s_strategic": s_strategic,
        "s_composite": s_composite,
        "s_fc": s_fc,
        "priority": priority_of(s_composite) if s_composite is not None else None,
        "quadrant": quadrant_of(s_value, s_fc),
    }
