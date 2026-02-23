# Scoring Model (ISM)

## Scale
- 1.0–3.0 with Low (1.0–1.3), Medium (1.4–2.3), High (2.4–3.0).

## Normalization
- BENEFIT uses raw score.
- COST uses `4.0 - raw`.

## Dimension Weights
- Value 35%
- Feasibility 25%
- Organizational Capability 25%
- Strategic Alignment & Risk 15%

## Composite
$$
S_{ISM} = 0.35 S_V + 0.25 S_F + 0.25 S_O + 0.15 S_S
$$

## Feasibility–Capability Axis
$$
S_{FC} = (S_F + S_O) / 2
$$

## Priority Bands
- $S_{ISM} \ge 2.4$: P1 – Critical
- $2.0 \le S_{ISM} < 2.4$: P2 – High
- $1.4 \le S_{ISM} < 2.0$: P3 – Medium
- $S_{ISM} < 1.4$: P4 – Low

## Quadrant Thresholds
- Value vs. $S_{FC}$ cutoff at 2.15.
- Quick Wins, Strategic Bets, Opportunistic, Re-evaluate.
