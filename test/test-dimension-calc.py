#!/usr/bin/env python3
"""Simulate the dimension calculation that happens in Review.jsx"""

ISM_ITEMS = [
    # Value dimension (C01-C07)
    {'criterionId': 'C01', 'dimension': 'Value', 'name': 'Financial Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C02', 'dimension': 'Value', 'name': 'Health & Safety Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C03', 'dimension': 'Value', 'name': 'Risk Mitigation', 'polarity': 'BENEFIT'},
    {'criterionId': 'C04', 'dimension': 'Value', 'name': 'Customer Experience Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C05', 'dimension': 'Value', 'name': 'Employee Experience Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C06', 'dimension': 'Value', 'name': 'Environmental Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C07', 'dimension': 'Value', 'name': 'Regulatory/Compliance Value', 'polarity': 'BENEFIT'},
    # Feasibility dimension (C08-C12)
    {'criterionId': 'C08', 'dimension': 'Feasibility', 'name': 'Solution Complexity', 'polarity': 'COST'},
    {'criterionId': 'C09', 'dimension': 'Feasibility', 'name': 'Data Availability', 'polarity': 'BENEFIT'},
    {'criterionId': 'C10', 'dimension': 'Feasibility', 'name': 'Data Quality', 'polarity': 'BENEFIT'},
    {'criterionId': 'C11', 'dimension': 'Feasibility', 'name': 'Technical Maturity', 'polarity': 'BENEFIT'},
    {'criterionId': 'C12', 'dimension': 'Feasibility', 'name': 'Integration Complexity', 'polarity': 'COST'},
    # Organizational dimension (C13-C20)
    {'criterionId': 'C13', 'dimension': 'Organizational', 'name': 'Leadership Priority & Commitment', 'polarity': 'BENEFIT'},
    {'criterionId': 'C14', 'dimension': 'Organizational', 'name': 'Business Ownership & SME Availability', 'polarity': 'BENEFIT'},
    {'criterionId': 'C15', 'dimension': 'Organizational', 'name': 'Engineering/Technical Capacity', 'polarity': 'BENEFIT'},
    {'criterionId': 'C16', 'dimension': 'Organizational', 'name': 'Budget Availability', 'polarity': 'BENEFIT'},
    {'criterionId': 'C17', 'dimension': 'Organizational', 'name': 'Process Maturity', 'polarity': 'BENEFIT'},
    {'criterionId': 'C18', 'dimension': 'Organizational', 'name': 'Stakeholder Complexity & Adoption Risk', 'polarity': 'COST'},
    {'criterionId': 'C19', 'dimension': 'Organizational', 'name': 'Time to First Impact', 'polarity': 'BENEFIT'},
    {'criterionId': 'C20', 'dimension': 'Organizational', 'name': 'Year-One Value Capture', 'polarity': 'BENEFIT'},
    # Strategic dimension (C21-C28)
    {'criterionId': 'C21', 'dimension': 'Strategic', 'name': 'Strategic Theme Alignment', 'polarity': 'BENEFIT'},
    {'criterionId': 'C22', 'dimension': 'Strategic', 'name': 'Portfolio Balance Contribution', 'polarity': 'BENEFIT'},
    {'criterionId': 'C23', 'dimension': 'Strategic', 'name': 'Long-Term Roadmap Fit', 'polarity': 'BENEFIT'},
    {'criterionId': 'C24', 'dimension': 'Strategic', 'name': 'Cybersecurity Risk', 'polarity': 'COST'},
    {'criterionId': 'C25', 'dimension': 'Strategic', 'name': 'Privacy Risk', 'polarity': 'COST'},
    {'criterionId': 'C26', 'dimension': 'Strategic', 'name': 'Operational Risk', 'polarity': 'COST'},
    {'criterionId': 'C27', 'dimension': 'Strategic', 'name': 'Change Saturation Risk', 'polarity': 'COST'},
    {'criterionId': 'C28', 'dimension': 'Strategic', 'name': 'Strategic Opportunity Cost', 'polarity': 'BENEFIT'},
]

DIMENSIONS = [
    {'raw': 'Value', 'key': 'Value', 'label': 'Value', 'weight': '35%', 'color': '#1b5e20'},
    {'raw': 'Feasibility', 'key': 'Feasibility', 'label': 'Feasibility', 'weight': '25%', 'color': '#0d47a1'},
    {'raw': 'Organizational', 'key': 'Organizational Capability', 'label': 'Org Capability', 'weight': '25%', 'color': '#1565c0'},
    {'raw': 'Strategic', 'key': 'Strategic Alignment & Risk', 'label': 'Strategic & Risk', 'weight': '15%', 'color': '#e65100'}
]

dimension_map = {dim['raw']: dim['key'] for dim in DIMENSIONS}

# Sample scores from the API response
api_scores = [
    {'criterionId': 'C28', 'rawScore': 2.6},
    {'criterionId': 'C27', 'rawScore': 0.4},
    {'criterionId': 'C26', 'rawScore': 0.4},
    {'criterionId': 'C25', 'rawScore': 0.4},
    {'criterionId': 'C24', 'rawScore': 0.6},
    {'criterionId': 'C23', 'rawScore': 2.7},
    {'criterionId': 'C22', 'rawScore': 2.7},
    {'criterionId': 'C21', 'rawScore': 2.8},
    {'criterionId': 'C20', 'rawScore': 2.9},
    {'criterionId': 'C19', 'rawScore': 2.8},
    {'criterionId': 'C18', 'rawScore': 0.5},
    {'criterionId': 'C17', 'rawScore': 2.7},
    {'criterionId': 'C16', 'rawScore': 2.7},
    {'criterionId': 'C15', 'rawScore': 2.7},
    {'criterionId': 'C14', 'rawScore': 2.8},
    {'criterionId': 'C13', 'rawScore': 2.8},
    {'criterionId': 'C12', 'rawScore': 0.6},
    {'criterionId': 'C11', 'rawScore': 3.0},
    {'criterionId': 'C10', 'rawScore': 2.4},
    {'criterionId': 'C09', 'rawScore': 2.6},
    {'criterionId': 'C08', 'rawScore': 1.2},
    {'criterionId': 'C07', 'rawScore': 2.4},
    {'criterionId': 'C06', 'rawScore': 2.4},
    {'criterionId': 'C05', 'rawScore': 2.4},
    {'criterionId': 'C04', 'rawScore': 2.2},
    {'criterionId': 'C03', 'rawScore': 2.4},
    {'criterionId': 'C02', 'rawScore': 2.5},
    {'criterionId': 'C01', 'rawScore': 2.6},
]

# Create scores object as the frontend would
scores = {}
for score in api_scores:
    scores[score['criterionId']] = float(score['rawScore'])

# All criteria should be set, but add defaults for any missing
for criterion in ISM_ITEMS:
    if criterion['criterionId'] not in scores:
        scores[criterion['criterionId']] = 2.0

print("Scores object:")
for cid in sorted(scores.keys()):
    print(f"  {cid}: {scores[cid]}")

# Create groupedCriteria
grouped_criteria = {}
for criterion in ISM_ITEMS:
    mapped_key = dimension_map.get(criterion['dimension'], criterion['dimension'] or 'General')
    if mapped_key not in grouped_criteria:
        grouped_criteria[mapped_key] = []
    grouped_criteria[mapped_key].append(criterion)

print(f"\nGroupedCriteria keys: {list(grouped_criteria.keys())}")
print(f"Organizational Capability items ({len(grouped_criteria.get('Organizational Capability', []))}):")
for c in grouped_criteria.get('Organizational Capability', []):
    print(f"  {c['criterionId']}: {c['name']}")

# Calculate dimension scores
dimension_scores = {}
for dimension in DIMENSIONS:
    items = grouped_criteria.get(dimension['key'], [])
    print(f"\nDimension: {dimension['key']}")
    print(f"  Items count: {len(items)}")
    
    normalized_scores = []
    for item in items:
        raw_score = scores.get(item['criterionId'], 2.0)
        normalized = 4.0 - raw_score if item['polarity'] == 'COST' else raw_score
        normalized_scores.append(normalized)
        print(f"    {item['criterionId']} ({item['name']}): raw={raw_score}, normalized={normalized}")
    
    total = sum(normalized_scores)
    avg = round(total / len(items), 2) if items else '—'
    dimension_scores[dimension['key']] = avg
    print(f"  Total normalized: {total}, Average: {avg}")

print(f"\n\nFinal Dimension Scores: {dimension_scores}")

# Calculate composite score
v = float(dimension_scores['Value'])
f = float(dimension_scores['Feasibility'])
o = float(dimension_scores['Organizational Capability'])
s = float(dimension_scores['Strategic Alignment & Risk'])
composite = round(0.35 * v + 0.25 * f + 0.25 * o + 0.15 * s, 2)

print(f"\nComposite Score: {composite}")
print(f"  Value (35%): {v}")
print(f"  Feasibility (25%): {f}")
print(f"  Org Capability (25%): {o}")
print(f"  Strategic & Risk (15%): {s}")
