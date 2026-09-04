# Eclipse Agents

## Do - Don't

### DON'T
1. **NEVER READ / EDIT / DELETE / COMMIT** .env and their variants, only .env.example access
2. **NEVER** commit, let to the developer make the decision.
3. **NEVER** implement not required code or features.
4. **NEVER** Install not required packages.

### DO
1. **ASK WHEN YOU NEED**, not make supositions about the task.
2. **ALWAYS FOLLOW** this pattern: i plan -> i build -> i verify


## Design
./DESIGN.md

## Project
Next basic **strucure**:
- Components: /ui, /layout
- Utils
- Types
- Lib
- App: /dashboard, /auth, /api

Simple **tech stack**
- Next.js
- TailwindCSS
- Tabler icons
- React
