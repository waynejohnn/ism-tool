# Test Files

This folder contains test and validation scripts for the Use Case Scoring Application.

## Files

### test-dimension-calc.py
**Purpose:** Test the dimension calculation algorithm used in the scoring system

**Usage:**
```bash
python test-dimension-calc.py
```

**What it tests:**
- ISM (Innovation Scoring Matrix) dimension calculations
- Criterion score aggregation  
- Dimension average calculations
- Score weighting and normalization

**Requirements:**
- Python 3.8+
- Backend package dependencies (run `pip install -r ../backend/requirements.txt`)

### test-dimension-calc.js
**Purpose:** JavaScript version of dimension calculation tests

**Usage:**
```bash
node test-dimension-calc.js
```

Or with npm:
```bash
npm test test-dimension-calc.js
```

**What it tests:**
- Same dimension calculation tests as Python version
- Can be used in CI/CD pipelines with Node.js agents
- Validates calculation algorithm consistency across languages

**Requirements:**
- Node.js 14+

## Running Tests

### All Tests
```bash
# From project root
python test/test-dimension-calc.py
node test/test-dimension-calc.js
```

### In Docker
```bash
# Run Python tests in backend container
docker-compose -f ./deploy/dev/docker-compose.yml exec backend python /app/test-dimension-calc.py

# Run Node tests in frontend container
docker-compose -f ./deploy/dev/docker-compose.yml exec frontend node /app/test-dimension-calc.js
```

## Test Results

Tests print validation results showing:
- ✓ Passed cases
- ✗ Failed cases  
- Performance metrics
- Calculation accuracy

## CI/CD Integration

These tests can be integrated into deployment pipelines:

1. **GitHub Actions** - Trigger on pull requests and branch pushes
2. **Local testing** - Before committing changes

## Extending Tests

To add new tests:

1. **Python:** Add test functions to `test-dimension-calc.py`
   - Follow naming convention `test_*`
   - Use assertions for validation
   - Include descriptive output

2. **JavaScript:** Add test functions to `test-dimension-calc.js`
   - Follow naming convention `test*`
   - Use console.assert for validation
   - Include descriptive output

## Test Coverage

Current tests cover:

- ✓ Dimension calculation accuracy
- ✓ Criterion weighting
- ✓ Score aggregation logic
- ✓ Edge cases (zero scores, maximum scores, etc.)
- ✓ Cross-language consistency (Python vs JavaScript)

## Troubleshooting

### Python test fails
```bash
# Ensure dependencies are installed
pip install -r ../backend/requirements.txt

# Run with verbose output
python -v test/test-dimension-calc.py
```

### JavaScript test fails
```bash
# Ensure Node.js is installed
node --version

# Run with debugging
node --inspect test/test-dimension-calc.js
```

### Tests fail after code changes
1. Check that calculation functions weren't modified
2. Verify algorithm matches ISM specification
3. Review recent commits for breaking changes

---

**Last Updated:** February 22, 2026
