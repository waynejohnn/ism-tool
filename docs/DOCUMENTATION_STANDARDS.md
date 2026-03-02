# Documentation Standards

## Overview
This document outlines standards for creating and maintaining documentation in the Use Case Scoring App project.

---

## File Organization

### Location Rules
✅ **DO**: Create all documentation files in the `docs/` folder
❌ **DON'T**: Create documentation files in the root directory

### Folder Structure
```
docs/
├── Root documentation files
│   ├── api.md                      # API endpoint specifications
│   ├── database.md                 # Database schema and structure
│   ├── development-setup.md        # Developer environment guide
│   ├── frontend-components.md      # React component reference
│   ├── workflows.md                # User workflows and processes
│   ├── architecture.md             # System architecture
│   ├── security.md                 # Security guidelines
│   └── scoring.md                  # Scoring algorithm documentation
│
├── adr/                            # Architecture Decision Records
│   ├── 0001-tech-stack.md         # Technology stack decision
│   └── [new ADRs as needed]
│
└── Deployment guides
    ├── PRODUCTION_DEPLOYMENT.md    # Production deployment guide
  ├── CLOUD_RUN_SETUP.md          # Cloud Run setup and deployment
  ├── GITHUB_ACTIONS_CICD.md      # CI/CD workflow guide
  ├── LINUX_*.md                  # Linux deployment guides
    └── etc.
```

---

## Documentation Types

### Core Documentation (Required)
- **api.md** - REST API endpoint specifications with examples
- **database.md** - Database schema, relationships, and queries
- **architecture.md** - System design and data flow
- **workflows.md** - User workflows and business processes

### Developer Documentation
- **development-setup.md** - Local and Docker environment setup
- **frontend-components.md** - React component library reference
- **security.md** - Security best practices and guidelines

### Deployment Documentation
- **PRODUCTION_DEPLOYMENT.md** - Production readiness and deployment
- **CLOUD_RUN_SETUP.md** - Cloud Run deployment
- deployment-specific guides (Cloud Run, Linux, etc.)

### Architecture Decisions (ADR)
- Store in `docs/adr/` folder
- Use format: `NNNN-short-title.md`
- Document decisions that have long-term architectural impact

---

## File Naming Conventions

### Core Docs (Lowercase with hyphens)
```
api.md
database.md
development-setup.md
frontend-components.md
workflows.md
architecture.md
security.md
scoring.md
```

### Deployment Guides (UPPERCASE with underscores, for visibility)
```
PRODUCTION_DEPLOYMENT.md
CLOUD_RUN_SETUP.md
GITHUB_ACTIONS_CICD.md
```

### ADR (Numbered)
```
adr/0001-tech-stack.md
adr/0002-api-authentication.md
```

### Session/Temporary Docs (In docs/ folder)
```
docs/SESSION_SUMMARY.md
docs/QUICK_REFERENCE_SESSION.md
docs/CHANGELOG.md
```

---

## Writing Standards

### Markdown Format
- Use standard GitHub-flavored Markdown (GFM)
- Use H1 (`#`) for main title only
- Use H2 (`##`) for major sections
- Use H3 (`###`) for subsections
- Use H4+ for nested details

### Code Examples
```markdown
Include language specifier:

\`\`\`python
def example():
    pass
\`\`\`

\`\`\`bash
curl http://example.com
\`\`\`

\`\`\`javascript
const example = () => {}
\`\`\`
```

### Tables
Use GitHub-flavored tables:
```markdown
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| field  | TEXT | Yes      | Description |
```

### Cross-References
Link to other documentation:
```markdown
See [API Documentation](api.md) for endpoints
Check [Database Schema](database.md) for data structure
```

### Lists
- Use bullet lists for items without sequence
- Use numbered lists for steps/procedures
- Indent sub-items for hierarchy

---

## Content Guidelines

### Before Creating New Docs
1. ✅ Check if documentation already exists
2. ✅ Check if existing docs can be updated
3. ✅ Follow this location structure
4. ✅ Use appropriate naming convention

### When Updating Documentation
1. ✅ Update section headers with "Last Updated: [Date]" if major changes
2. ✅ Keep version information current
3. ✅ Update related cross-references
4. ✅ Review for consistency with other docs

### What Makes Good Documentation
- ✅ Clear purpose statement at the top
- ✅ Table of contents for long documents (5+ sections)
- ✅ Practical examples, not just theory
- ✅ Step-by-step guides for procedures
- ✅ Error scenarios and troubleshooting
- ✅ Links to related documentation
- ✅ Last updated date

### What to Avoid
- ❌ Creating docs in root directory
- ❌ Technical jargon without explanation
- ❌ Links to external sites (unless necessary)
- ❌ Outdated information without updates
- ❌ Inconsistent formatting

---

## Documentation Checklist

Before committing documentation:

- [ ] File is in `docs/` folder (not root)
- [ ] Filename follows naming convention
- [ ] Markdown is properly formatted
- [ ] Code examples include language specifier
- [ ] Links to other docs work and are relevant
- [ ] No external links unless necessary
- [ ] Last updated date is current
- [ ] Table of contents included (if 5+ sections)
- [ ] Technical terms are explained
- [ ] Examples are accurate and tested

---

## Common Mistakes (Avoid These)

### ❌ Creating docs in root
```bash
# WRONG
docs-root/
├── README.md
├── api.md                    # ← Wrong location
├── database-schema.md        # ← Wrong location
```

### ✅ Correct structure
```bash
# RIGHT
docs-root/
├── README.md                 # Top-level only
├── docs/
│   ├── api.md
│   ├── database.md
│   └── ...
```

### ❌ Inconsistent naming
```bash
# WRONG - Mixed naming styles
docs/
├── API.md
├── database_schema.md
├── Development Setup Guide.md
```

### ✅ Consistent naming
```bash
# RIGHT - Lowercase with hyphens
docs/
├── api.md
├── database.md
├── development-setup.md
```

### ❌ Missing examples
```markdown
# WRONG
The API accepts POST requests.
```

### ✅ With concrete examples
```markdown
# RIGHT
The API accepts POST requests:

\`\`\`bash
curl -X POST http://localhost:5001/usecases \
  -H "Content-Type: application/json" \
  -d '{"title":"Example"}'
\`\`\`
```

---

## Documentation Maintenance

### Keeping Docs Current
1. Update docs when:
   - Code behavior changes
   - New features are added
   - APIs are modified
   - Deployment process changes

2. Add version notes when:
   - Breaking changes occur
   - Deprecations are needed
   - Major rewrites happen

3. Archive old docs:
   - Move to `docs/archive/` if no longer relevant
   - Keep with version number for reference

### Documentation Review
- Have code reviewers check docs in PRs
- Ensure accuracy before merging
- Cross-reference updates (e.g., API change needs update in multiple docs)

---

## Tools & Validation

### Markdown Linting
The following tools can validate docs:
- [markdownlint](https://github.com/igorshevchenko/markdownlint-cli)
- VS Code Markdown extension
- GitHub's built-in markdown rendering

### Link Checking
```bash
# Check links in documentation
find docs -name "*.md" -exec grep -o '\[.*\](.*\.md)' {} \;
```

### Code Example Validation
Ensure code examples:
- Use correct syntax highlighting
- Are tested and working
- Include necessary context
- Show both input and output

---

## Templates

### API Endpoint Template
```markdown
## Endpoint Name
**METHOD** `/path`

Description of what it does.

**Request:**
\`\`\`json
{
  "field": "value"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "result": "success"
}
\`\`\`

**Error Responses:**
- `400` - Bad request
- `401` - Unauthorized
```

### Feature Documentation Template
```markdown
# Feature Name

## Overview
Brief explanation of the feature.

## Use Cases
- Use case 1
- Use case 2

## Implementation
Step-by-step how to use.

## Examples
Concrete working examples.

## Troubleshooting
Common issues and solutions.

## Related Documentation
- [Link to related doc](related.md)
```

### Workflow Template
```markdown
# Workflow: Name

## Actors
- Actor 1: Role description
- Actor 2: Role description

## Prerequisites
- Requirement 1
- Requirement 2

## Steps
1. First step
2. Second step
3. etc.

## Success Criteria
- User sees X
- Data is Y
- Status is Z
```

---

## Questions?

If you're unsure:
1. Check this file for guidance
2. Look at similar existing docs for examples
3. Follow the folder structure and naming convention
4. When in doubt, ask the team

---

**Last Updated:** February 22, 2026
**Standards Version:** 1.0

