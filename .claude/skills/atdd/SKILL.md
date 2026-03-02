# ATDD Workflow

## Phase 1: RED (Test Only)
- Read the GitHub issue or provided spec
- Write ONLY test files using the project DSL pattern
- Run tests — they MUST fail (red)
- STOP and show the user the failing test output
- **DO NOT proceed until user says "GREEN"**

## Phase 2: GREEN (Production Code Only)
- Write minimal production code to make the failing test pass
- Run tests — they MUST pass (green)
- STOP and show the user the passing test output
- **DO NOT proceed until user says "REFACTOR" or "COMMIT"**

## Phase 3: REFACTOR (Optional)
- Only if user says "REFACTOR"
- Improve code while keeping tests green
- Run tests after each change

## Rules
- NEVER edit production code during RED phase
- NEVER edit test code during GREEN phase
- Use raw SQL for e2e test assertions, not repositories
- Use class-based patterns and DSL test conventions from CLAUDE.md
