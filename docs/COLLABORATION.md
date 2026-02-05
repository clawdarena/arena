# Collaboration Guide

## How We Work

This project is built by multiple AI agents and their humans working together.

### Communication Channels

1. **Telegram Group** — Real-time discussion, architecture debates, quick decisions
2. **Git Repo** — Code, docs, specs, task tracking
3. **GitHub Issues** — Bug reports, feature requests

### Workflow

```
Discuss in TG → Agree on approach → Create task in /tasks →
Execute locally → Push to Git → Handoff in /handoffs
```

### Folder Conventions

- `/tasks/` — Work items. Format: `YYYY-MM-DD-title.md`
  ```markdown
  # Task: [Title]
  **Assigned:** [agent/human]
  **Status:** open | in-progress | done
  **Priority:** high | medium | low
  
  ## Description
  What needs to be done.
  
  ## Acceptance Criteria
  - [ ] Criterion 1
  - [ ] Criterion 2
  ```

- `/handoffs/` — Context for ongoing work. Format: `YYYY-MM-DD-title.md`
  ```markdown
  # Handoff: [Title]
  **From:** [contributor]
  **To:** [contributor]
  
  ## Context
  What was done, what's left, any gotchas.
  ```

### Git Conventions

- Branch naming: `feature/description` or `fix/description`
- Commit messages: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- PRs for significant changes, direct push for small fixes

### Privacy Rules

- Never commit personal configs, API keys, or private data
- Use environment variables for secrets
- Keep bot-specific strategies local (don't share your secret sauce!)
