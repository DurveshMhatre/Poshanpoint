# Contributing to PoshanPoint

Thank you for contributing.

## Ground Rules

- Keep secrets out of Git (`.env`, tokens, API keys).
- Do not commit `node_modules`, build output, or local IDE files.
- Keep pull requests focused and small when possible.

## Development Setup

1. Clone repository.
2. Install dependencies:

```bash
cd client && npm ci
cd ../server && npm ci
```

3. Create env files from examples:
- `client/.env` from `client/.env.example`
- `server/.env` from `server/.env.example`

4. Run backend:

```bash
cd server
npm run dev
```

5. Run frontend:

```bash
cd client
npm run dev
```

## Branch and Commit Style

- Branch naming:
  - `feature/<short-name>`
  - `fix/<short-name>`
  - `docs/<short-name>`
- Commit examples:
  - `feat(menu): add category filter`
  - `fix(auth): handle expired token`
  - `docs(readme): add deploy steps`

## Before Opening a PR

- Run backend tests:

```bash
cd server
npm test
```

- Build frontend:

```bash
cd client
npm run build
```

- Confirm no secrets are staged:

```bash
git diff --cached --name-only
```

## Pull Request Checklist

- Explain what changed and why.
- Include screenshots for UI changes.
- Mention any environment variable changes.
- Mention migration or data-impact notes (if any).

## Code Review Expectations

Reviewers focus on:
- correctness and security
- regressions in ordering/payment flow
- API compatibility between `client` and `server`
- test and deployment impact
